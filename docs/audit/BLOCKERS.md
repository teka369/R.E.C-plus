# Bloqueos externos

1. Purga histórica de secretos: requiere git-filter-repo/python (no instalados) y force push autorizado.
2. Rotación de credenciales: requiere acceso a proveedores (DB, Resend, Firebase).
3. Integration tests/migraciones: requiere Postgres local o CI.
4. E2E: requiere servicios corriendo.
5. Despliegue real: requiere credenciales Neon/Render/Vercel y autorización.
6. Almacenamiento persistente en producción: requiere credenciales S3/R2.