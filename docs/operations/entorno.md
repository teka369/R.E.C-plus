# Variables de entorno

Los ejemplos están en `r.e.c-backend/.env.example` y `r.e.c-frontend/.env.example`. No contienen secretos utilizables.

## Backend

| Variable | Obligatoria | Notas |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión de la aplicación. |
| `DATABASE_DIRECT_URL` | Sí | Conexión que Prisma usa para migrar. En un Postgres local puede ser igual a `DATABASE_URL`. |
| `JWT_SECRET` | Sí | Mínimo 32 caracteres. El mismo valor en el frontend. |
| `JWT_REFRESH_SECRET` | Sí | Distinto del anterior. Mínimo 32 caracteres. |
| `JWT_ISSUER` | Sí | El token de acceso lo incluye y la estrategia lo exige. |
| `JWT_AUDIENCE` | Sí | Igual que el issuer: debe coincidir al firmar y al verificar. |
| `INTERNAL_API_KEY` | Sí en producción | Protege `GET /health/metrics`. |
| `CORS_ORIGIN` | Sí | Orígenes del frontend. |
| `RESEND_API_KEY` | Para correo | Sin ella no sale el restablecimiento. |
| `RESEND_FROM` | Para correo | Remitente aceptado por Resend. |
| `REDIS_URL` | No | Ver [servicios](../integrations/servicios.md). |
| `SENTRY_DSN` | No | |
| `TRUST_PROXY` | Si hay proxy | `1` significa un salto de confianza. |
| `FRONTEND_URL` | Para enlaces | Base de los enlaces de correo. |

## Frontend

| Variable | Obligatoria | Notas |
| --- | --- | --- |
| `INTERNAL_API_URL` | Sí | Nest visto desde el servidor Next. |
| `NEXT_PUBLIC_API_BASE_URL` | Sí | Nest visto desde el navegador, sobre todo Socket.IO. |
| `JWT_SECRET` | Sí | Igual que el backend. No lo publiques con prefijo `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | Sí | Origen público del frontend. |
| `TRUST_PROXY_HEADERS` | No | Solo detrás de un proxy de confianza. |

Genera secretos nuevos en el servidor:

```bash
node scripts/generate-secrets.mjs
```

No reutilices valores que hayan estado en el historial de git. Esa rotación la hace el propietario en cada proveedor. El procedimiento y la lista de clases están en [controles](../security/controles.md).
