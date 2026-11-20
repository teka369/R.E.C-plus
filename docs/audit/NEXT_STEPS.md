# Próximos pasos priorizados — Recedu

## P0 (bloqueante para producción)

1. Rotar secretos que alguna vez estuvieron en `main` (JWT, refresh, DB, Resend, INTERNAL_API_KEY) — fuera de git.
2. Cerrar `/auth/recover-by-code` (no devolver token; no usar `codigo` como secreto).
3. Verificar que no queden `.env` ni uploads trackeados (ya OK en rama fix; confirmar en main tras merge).
4. Apuntar integration tests a la base del job y prohibir truncate contra prod (CI ya lo hace en la rama fix; verificar).
5. Branch protection en `main`.

## P1 (preparación de despliegue)

6. Configurar Neon (pooled + direct) y Render env vars.
7. Desplegar backend en Render; verificar `/health` 200.
8. Desplegar frontend en Vercel; verificar login.
9. Actualizar CORS/FRONTEND_URL en Render con URL real de Vercel.
10. Ejecutar migraciones (`prisma migrate deploy`) contra Neon direct.

## P2 (calidad)

11. Ejecutar integration tests con Postgres (local o CI).
12. Ejecutar `npm audit` y remediar críticos/altos.
13. Añadir unit tests frontend o al menos smoke e2e en CI.
14. Reducir god services (performance, academic) incrementalmente.

## P3 (mejoras)

15. Migrar uploads a object storage.
16. Revalidación de JWT contra DB o acortar expiración.
17. Móvil: sincronizar con backend actual.
18. Purgar historial git de secretos.