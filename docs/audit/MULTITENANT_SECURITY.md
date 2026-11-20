# Seguridad multi-tenant

- TenantBoundaryGuard global verifica institutionId explícito y estado activo de institución.
- SUPER_ADMIN bypass.
- Limitación conocida: no verifica propiedad de recursos por ID (IDOR) en todos los servicios; requiere revisión por módulo.
- Tests cross-tenant existentes en integration specs.