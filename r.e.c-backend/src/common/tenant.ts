import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/dto/user-role.enum';

/**
 * Representa al actor autenticado extraído del JWT.
 * Fuente canónica: usar este tipo en todos los servicios tenant-scoped.
 */
export type Actor = {
  userId: number;
  role: UserRole;
  institutionId?: number | null;
};

/**
 * Extrae y valida el institutionId del actor para operaciones tenant-scoped.
 *
 * - Lanza ForbiddenException si el actor es SUPER_ADMIN (sin contexto de institución).
 * - Lanza ForbiddenException si el actor no tiene institutionId asociado.
 *
 * @returns El institutionId garantizado como número no nulo.
 */
export function resolveInstitutionId(actor: Actor): number {
  if (actor.role === UserRole.SUPER_ADMIN) {
    throw new ForbiddenException(
      'Operacion no valida para SUPER_ADMIN sin contexto de institucion',
    );
  }
  if (!actor.institutionId) {
    throw new ForbiddenException('Usuario sin institucion asociada');
  }
  return actor.institutionId;
}
