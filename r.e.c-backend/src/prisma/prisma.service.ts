import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { AuditContextService } from '../common/audit-context.service';

/**
 * Mapeo: clave = nombre del delegate en PrismaClient (camelCase),
 *        valor = nombre del modelo Prisma (PascalCase) para AuditLog.tableName.
 */
const AUDITED_DELEGATES: ReadonlyArray<[string, string]> = [
  ['evaluationGrade', 'EvaluationGrade'],
  ['attendance', 'Attendance'],
  ['studentAcademicRecord', 'StudentAcademicRecord'],
  ['recoveryRequest', 'RecoveryRequest'],
  ['studentGroup', 'StudentGroup'],
];

/** Operaciones de escritura que disparan auditoría. */
const AUDITED_OPS = ['create', 'update', 'delete'] as const;

// ── Soft-delete configuration ────────────────────────────────────

/** Delegates que soportan soft-delete (camelCase → coincide con PrismaClient). */
const SOFT_DELETE_DELEGATES = new Set([
  'user',
  'institution',
  'studentGroup',
  'academicOffering',
  'subject',
  'weeklyScheduleEntry',
  'scheduleNote',
  'scheduleEvent',
  'studyMaterial',
  'recoveryRequest',
  'notification',
]);

/** Operaciones de lectura que reciben inyección automática de { deletedAt: null }. */
const SOFT_DELETE_READ_OPS = [
  'findUnique',
  'findFirst',
  'findMany',
  'findFirstOrThrow',
  'findUniqueOrThrow',
  'count',
  'aggregate',
] as const;

/** Operaciones de borrado que se convierten en soft-delete (update con deletedAt). */
const SOFT_DELETE_WRITE_OPS = ['delete', 'deleteMany'] as const;

/**
 * Comprueba si el argumento `where` ya contiene un filtro explícito sobre
 * `deletedAt` (a cualquier profundidad de AND/OR/NOT), lo que indica una
 * query de recuperación o auditoría que NO debe modificarse.
 */
function hasExplicitDeletedAt(where: unknown): boolean {
  if (!where || typeof where !== 'object') return false;
  const obj = where as Record<string, unknown>;
  if ('deletedAt' in obj) return true;
  for (const key of ['AND', 'OR', 'NOT'] as const) {
    const nested = obj[key];
    if (Array.isArray(nested)) {
      if (nested.some((item) => hasExplicitDeletedAt(item))) return true;
    } else if (nested && typeof nested === 'object') {
      if (hasExplicitDeletedAt(nested)) return true;
    }
  }
  return false;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly auditContext: AuditContextService) {
    super();
  }

  async onModuleInit() {
    this.installSoftDeleteInterceptors();
    this.installAuditInterceptors();
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // ── Soft-delete interceptors (delegate wrapping) ───────────────

  private installSoftDeleteInterceptors() {
    for (const delegateKey of SOFT_DELETE_DELEGATES) {
      const delegate = (this as Record<string, any>)[delegateKey];
      if (!delegate) continue;

      // ── Read operations: inject { deletedAt: null } ──────────
      for (const op of SOFT_DELETE_READ_OPS) {
        const originalFn = delegate[op];
        if (typeof originalFn !== 'function') continue;

        delegate[op] = function softDeleteReadWrapper(
          args?: Record<string, any>,
        ) {
          args = args ?? {};
          args.where = args.where ?? {};

          if (!hasExplicitDeletedAt(args.where)) {
            args.where.deletedAt = null;
          }

          return originalFn.call(delegate, args);
        };
      }

      // ── Delete operations: convert to soft-delete ────────────
      for (const op of SOFT_DELETE_WRITE_OPS) {
        const originalFn = delegate[op];
        if (typeof originalFn !== 'function') continue;

        if (op === 'delete') {
          // delete → update with deletedAt = now()
          const updateFn = delegate.update;
          delegate[op] = function softDeleteWrapper(
            args: Record<string, any>,
          ) {
            return updateFn.call(delegate, {
              where: args.where,
              data: { deletedAt: new Date() },
            });
          };
        } else {
          // deleteMany → updateMany with deletedAt = now()
          const updateManyFn = delegate.updateMany;
          delegate[op] = function softDeleteManyWrapper(
            args?: Record<string, any>,
          ) {
            args = args ?? {};
            return updateManyFn.call(delegate, {
              where: args.where ?? {},
              data: { deletedAt: new Date() },
            });
          };
        }
      }
    }
  }

  // ── Audit interceptors (Prisma v6 — wrapping de delegates) ────

  private installAuditInterceptors() {
    for (const [delegateKey, tableName] of AUDITED_DELEGATES) {
      const delegate = (this as Record<string, any>)[delegateKey];
      if (!delegate) continue; // modelo aún no existe (e.g. Attendance)

      for (const op of AUDITED_OPS) {
        const originalFn = delegate[op];
        if (typeof originalFn !== 'function') continue;

        const self = this;

        delegate[op] = async function auditWrapper(
          args: Record<string, any>,
        ) {
          // ── 1. Snapshot previo (update / delete) ──────────
          let oldValues: unknown = null;
          if ((op === 'update' || op === 'delete') && args?.where) {
            try {
              oldValues = await delegate.findUnique({ where: args.where });
            } catch {
              /* lectura previa falló — continuamos sin oldValues */
            }
          }

          // ── 2. Ejecutar operación original ────────────────
          const result = await originalFn.call(delegate, args);

          // ── 3. Escribir AuditLog de forma asíncrona ───────
          try {
            const ctx = self.auditContext.get();
            const recordId = String(
              (result as any)?.id ?? args?.where?.id ?? '',
            );

            self.auditLog
              .create({
                data: {
                  userId: ctx?.userId ?? null,
                  institutionId: ctx?.institutionId ?? null,
                  action: op.toUpperCase(),
                  tableName,
                  recordId,
                  oldValues: (oldValues as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                  newValues: (result as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                  ipAddress: ctx?.ipAddress ?? null,
                  userAgent: ctx?.userAgent ?? null,
                },
              })
              .catch(() => {
                /* fallo silencioso: operación principal ya exitosa */
              });
          } catch {
            /* nunca lanzar — protege la operación principal */
          }

          return result;
        };
      }
    }
  }

  // Bloqueo defensivo: evita consultas raw inseguras en toda la aplicacion.
  override $queryRawUnsafe<T = unknown>(
    _query: string,
    ..._values: any[]
  ): Prisma.PrismaPromise<T> {
    void _query;
    void _values;
    throw new Error(
      'Uso bloqueado: $queryRawUnsafe no esta permitido en Recedu',
    );
  }

  // Bloqueo defensivo: evita ejecucion raw insegura con interpolacion manual.
  override $executeRawUnsafe(
    _query: string,
    ..._values: any[]
  ): Prisma.PrismaPromise<number> {
    void _query;
    void _values;
    throw new Error(
      'Uso bloqueado: $executeRawUnsafe no esta permitido en Recedu',
    );
  }
}
