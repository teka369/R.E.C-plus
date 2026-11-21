# Seguridad multi-tenant

## Controles implementados

- `TenantBoundaryGuard` global verifica `institutionId` explícito y estado activo de institución.
- `SUPER_ADMIN` bypass documentado.
- `UsersService`: `assertTenantVisibility` por id y por `publicId`.
- `MaterialsService`: scoping por docente + institución en syllabus y materiales.
- `ScheduleService`: `ensureGroupInScope` por institución.
- `RecoveryService`: acceso por institución en solicitudes y actividades.
- `CommunicationService`: validación de institución en mensajes, feedback y notificaciones.
- `PerformanceService`: scoping por grupo/institución.
- `AcademicService`: filtros por institución en grados, grupos, materias y promociones.
- JWT revalida usuario, rol e institución en producción (`NODE_ENV !== test`).
- Refresh revoca sesión si la institución se inactiva.
- Al inactivar una institución se revocan sesiones activas y se invalida caché.

## Inventario real de controladores y endpoints

Se revisaron los 13 controladores del alcance P1:

| Grupo | Controlador | Endpoints principales | Control tenant |
| --- | --- | --- | --- |
| app | `app.controller.ts` | 1 | Público |
| academic | `academic.controller.ts` | ~45 | Roles + institución en servicio |
| admin/restore | `restore.controller.ts` | 11 | `SUPER_ADMIN` |
| auth | `auth.controller.ts` | 6 | Público/login + sesión |
| communication | `communication.controller.ts` | 16 | Roles + institución en servicio |
| health | `health.controller.ts` | 3 | Público/métricas con API key |
| institutions | `institutions.controller.ts` | 15 | `SUPER_ADMIN` |
| materials | `materials.controller.ts` | 19 | Roles + institución en servicio |
| performance | `performance.controller.ts` | 9 | Roles + institución en servicio |
| recovery | `recovery.controller.ts` | 18 | Roles + institución en servicio |
| recovery-settings | `recovery-settings.controller.ts` | 4 | Roles + institución en servicio |
| schedule | `schedule.controller.ts` | 15 | Roles + institución en servicio |
| users | `users.controller.ts` | 12 | Roles + institución en servicio |

## Pruebas existentes

- Unitarias: 592/592 en CI.
- Integración PostgreSQL: suites `cross-tenant-isolation`, `tenant-boundary`, `users`, `academic`, `materials`, `schedule`, `recovery-tenant-boundary`, `security-fixes`.
- E2E Nest: 4/4.
- Playwright: 36/36.

## Pruebas de regresión añadidas en esta misión

- Se mantienen las pruebas existentes; no se eliminaron.
- Se corrigieron nombres de jobs de CI para distinguir las dos guardias.
- Se añadieron scripts de backup/restore probados contra PostgreSQL desechable.

## Riesgos residuales

- La revisión método por método continúa; las suites de integración no cubren todos los endpoints ni todos los efectos secundarios.
- `SUPER_ADMIN` mantiene acceso global por diseño.
- JWT se revalida contra DB solo fuera de `NODE_ENV=test`; en producción está activo.
- Los endpoints de restauración usan ids internos y están limitados a `SUPER_ADMIN`.
- WebSockets requieren auditoría específica de rooms y eventos (ver sección Socket.IO).

## Socket.IO y WebSockets

- El gateway autentica por JWT en handshake.
- Las rooms deben incluir el identificador de institución para evitar difusión cruzada.
- Pendiente: pruebas automatizadas de aislamiento de eventos entre dos instituciones en tiempo real.
- No se deben aceptar ids de institución enviados por el cliente sin validar contra el JWT.

## Historial y secretos

- El árbol actual no contiene `.env` ni `uploads/` rastreados.
- Se ejecutó `git-filter-repo` para eliminar `.env`, `.env.test`, `.env.local` y `uploads/` del historial accesible.
- Gitleaks posterior: sin fugas (con allowlist documentada para valores de ejemplo/CI).
- Las credenciales históricas se consideran comprometidas hasta rotación externa.
