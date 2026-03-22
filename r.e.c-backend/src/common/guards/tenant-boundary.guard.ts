import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '../../users/dto/user-role.enum';

type RequestWithActor = {
  user?: {
    userId: number;
    role: UserRole;
    institutionId?: number | null;
  };
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers?: Record<string, unknown>;
};

@Injectable()
export class TenantBoundaryGuard implements CanActivate {
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

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const actor = request.user;

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

    const requestedInstitutionIds = this.collectRequestedInstitutionIds(request);
    const hasCrossTenantTarget = requestedInstitutionIds.some(
      (requestedInstitutionId) => requestedInstitutionId !== actor.institutionId,
    );

    if (hasCrossTenantTarget) {
      throw new ForbiddenException('Cross-institution access denied');
    }

    return true;
  }
}
