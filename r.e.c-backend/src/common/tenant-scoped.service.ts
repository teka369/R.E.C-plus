import { UserRole } from '../users/dto/user-role.enum';
import { Actor, resolveInstitutionId } from './tenant';

/**
 * Clase base para servicios que operan dentro de un tenant (institución).
 *
 * Proporciona helpers estándar reutilizables para filtrado por institución.
 * Extiéndela en lugar de copiar los helpers manualmente en cada servicio.
 *
 * Uso:
 *   @Injectable()
 *   export class MyService extends TenantScopedService {
 *     constructor(private readonly prisma: PrismaService) { super(); }
 *   }
 *
 * No registrar en ningún módulo — no es un provider, es solo herencia de clase.
 */
export abstract class TenantScopedService {
  /**
   * Retorna el institutionId del actor validado.
   * Lanza ForbiddenException si es SUPER_ADMIN o no tiene institución.
   */
  protected getActorInstitutionId(actor: Actor): number {
    return resolveInstitutionId(actor);
  }

  /**
   * Objeto parcial de filtro Prisma para consultas sobre el modelo Group.
   * SUPER_ADMIN recibe {} (sin filtro) para acceso total.
   * Cualquier otro rol recibe { institutionId: <valor del JWT> }.
   *
   * Uso típico:
   *   prisma.group.findMany({ where: { ...this.scopeToInstitution(actor) } })
   */
  protected scopeToInstitution(actor: Actor): { institutionId?: number } {
    if (actor.role === UserRole.SUPER_ADMIN) return {};
    return { institutionId: resolveInstitutionId(actor) };
  }

  /**
   * Verifica si el actor tiene acceso de SUPER_ADMIN o rol directivo
   * (SECRETARIA o SUPER_ADMIN). Útil para guards de solo-lectura administrativos.
   */
  protected isAdminActor(actor: Actor): boolean {
    return (
      actor.role === UserRole.SUPER_ADMIN || actor.role === UserRole.SECRETARIA
    );
  }
}
