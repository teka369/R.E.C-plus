import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../users/dto/user-role.enum';
import { AppLoggerService } from '../../logger/logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../cache/cache.service';

type Actor = {
  userId: number;
  role: UserRole;
  institutionId?: number | null;
};

type RequestWithActor = {
  user?: Actor;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  url?: string;
  method?: string;
};

/** TTL de la caché de estado activo de institución (segundos). */
const INSTITUTION_ACTIVE_CACHE_TTL = 30;

@Injectable()
export class TenantBoundaryGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: AppLoggerService,
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}
  private parseInstitutionId(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private collectRequestedInstitutionIds(request: RequestWithActor): number[] {
    const candidates = [
      request.params?.institutionId,
      request.query?.institutionId,
      request.body?.institutionId,
      request.headers?.['x-institution-id'],
    ];

    return candidates
      .map((value) => this.parseInstitutionId(value))
      .filter((value): value is number => value !== null);
  }

  private resolveActor(request: RequestWithActor): Actor | undefined {
    if (request.user) return request.user;

    // El guard global se ejecuta ANTES que JwtAuthGuard (route-level),
    // por lo que request.user aún no está poblado. Extraemos el actor
    // directamente del JWT para que el guard funcione como APP_GUARD.
    try {
      const auth = request.headers?.authorization;
      if (typeof auth !== 'string') return undefined;
      const [scheme, token] = auth.split(' ');
      if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined;
      const payload = this.jwtService.verify<{
        sub: number;
        role: UserRole;
        institutionId?: number | null;
      }>(token);
      return {
        userId: payload.sub,
        role: payload.role,
        institutionId: payload.institutionId ?? null,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Verifica si la institución sigue activa, con caché breve
   * para no golpear la DB en cada request.
   */
  private async isInstitutionActive(institutionId: number): Promise<boolean> {
    const cacheKey = `inst_active:${institutionId}`;
    const cached = await this.cache.get<boolean>(cacheKey);
    if (cached !== null) return cached;

    const inst = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { activa: true },
    });
    const active = inst?.activa ?? false;
    await this.cache.set(cacheKey, active, INSTITUTION_ACTIVE_CACHE_TTL);
    return active;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const actor = this.resolveActor(request);

    // Endpoints publicos o sin autenticacion no se bloquean aqui
    if (!actor) {
      return true;
    }

    if (actor.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (!actor.institutionId) {
      throw new ForbiddenException(
        'Contexto de tenant invalido: institutionId es obligatorio',
      );
    }

    // Verificar que la institución siga activa en CADA request
    const active = await this.isInstitutionActive(actor.institutionId);
    if (!active) {
      throw new UnauthorizedException(
        'La institución ha sido desactivada. Tu sesión ha finalizado.',
      );
    }

    const requestedInstitutionIds =
      this.collectRequestedInstitutionIds(request);
    const hasCrossTenantTarget = requestedInstitutionIds.some(
      (requestedInstitutionId) =>
        requestedInstitutionId !== actor.institutionId,
    );

    if (hasCrossTenantTarget) {
      // Logging de seguridad: registrar intentos de acceso cross-tenant
      this.logger.logTenantViolation({
        event: 'CROSS_TENANT_ACCESS_ATTEMPT',
        actorUserId: actor.userId,
        actorInstitutionId: actor.institutionId,
        requestedInstitutionIds,
        endpoint: request.url || 'unknown',
        method: request.method || 'unknown',
      });
      throw new ForbiddenException('Cross-institution access denied');
    }

    return true;
  }
}
