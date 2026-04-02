import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../users/dto/user-role.enum';

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
};

@Injectable()
export class TenantBoundaryGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
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

  canActivate(context: ExecutionContext): boolean {
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

    const requestedInstitutionIds =
      this.collectRequestedInstitutionIds(request);
    const hasCrossTenantTarget = requestedInstitutionIds.some(
      (requestedInstitutionId) =>
        requestedInstitutionId !== actor.institutionId,
    );

    if (hasCrossTenantTarget) {
      throw new ForbiddenException('Cross-institution access denied');
    }

    return true;
  }
}
