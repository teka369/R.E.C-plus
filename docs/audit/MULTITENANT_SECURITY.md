# Seguridad multi-tenant

- TenantBoundaryGuard global verifica institutionId explícito y estado activo de institución.
- SUPER_ADMIN bypass.
- Users service: assertTenantVisibility por id/publicId.
- Materials service: scoping por teacherId + institución en syllabus (update/delete).
- Schedule service: ensureGroupInScope por institución.
- Limitación: IDOR por ID en otros módulos requiere revisión continua; integration tests no ejecutados (sin Postgres).