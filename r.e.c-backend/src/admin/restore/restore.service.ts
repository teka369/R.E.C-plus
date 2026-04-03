import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditContextService } from '../../common/audit-context.service';

/** Modelos con soft-delete y su delegate en PrismaClient. */
const RESTORABLE_MODELS = {
  user: 'User',
  institution: 'Institution',
  studentGroup: 'StudentGroup',
  academicOffering: 'AcademicOffering',
  subject: 'Subject',
  weeklyScheduleEntry: 'WeeklyScheduleEntry',
  scheduleNote: 'ScheduleNote',
  scheduleEvent: 'ScheduleEvent',
  studyMaterial: 'StudyMaterial',
  recoveryRequest: 'RecoveryRequest',
  notification: 'Notification',
} as const;

type RestorableModel = keyof typeof RESTORABLE_MODELS;

/** Minimal delegate shape for restore operations. */
interface RestoreDelegate {
  findUnique: (
    args: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | null>;
  update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

@Injectable()
export class RestoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditContext: AuditContextService,
  ) {}

  async restore(model: RestorableModel, id: number) {
    const delegate = (this.prisma as unknown as Record<string, unknown>)[
      model
    ] as RestoreDelegate | undefined;
    if (!delegate) {
      throw new NotFoundException(`Modelo ${model} no encontrado`);
    }

    // Buscar incluyendo deletedAt explícito para que el middleware no filtre
    const record = await delegate.findUnique({
      where: { id, deletedAt: { not: null } },
    });

    if (!record) {
      throw new NotFoundException(
        `Registro ${RESTORABLE_MODELS[model]}#${id} no encontrado o no está eliminado`,
      );
    }

    // Restaurar: setear deletedAt = null
    const restored = await delegate.update({
      where: { id },
      data: { deletedAt: null },
    });

    // Registrar en AuditLog
    const ctx = this.auditContext.get();
    await this.prisma.auditLog.create({
      data: {
        userId: ctx?.userId ?? null,
        institutionId: ctx?.institutionId ?? null,
        action: 'RESTORE',
        tableName: RESTORABLE_MODELS[model],
        recordId: String(id),
        oldValues: {
          deletedAt: record.deletedAt as Prisma.InputJsonValue,
        },
        newValues: { deletedAt: null },
        ipAddress: ctx?.ipAddress ?? null,
        userAgent: ctx?.userAgent ?? null,
      },
    });

    return restored;
  }
}
