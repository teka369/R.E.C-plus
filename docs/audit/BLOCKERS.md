# Bloqueos externos

Los advisories vigentes están en [dependencias](../quality/dependencias.md), no en la lista antigua de este archivo.

La lista operativa de rotación y purga también está en [docs/security/controles.md](../security/controles.md).

No se imprimen valores de secretos.

## Rotación pendiente (credenciales históricas comprometidas)

El árbol actual no trackea `.env` ni uploads. El historial de `main` sí llegó a contener secretos. Hay que tratarlos como comprometidos. La rotación no está hecha: no hay evidencia de revocación en los proveedores.

| Tipo | Dónde apareció | Acción externa |
| --- | --- | --- |
| `DATABASE_URL` / `DATABASE_DIRECT_URL` | `r.e.c-backend/.env` histórico | Rotar password del rol en Neon/Postgres y actualizar Render |
| `JWT_SECRET` | backend `.env` y frontend `.env.local` | Generar uno nuevo e inyectarlo igual en Render y Vercel |
| `JWT_REFRESH_SECRET` | backend `.env` | Generar otro distinto y actualizar solo Render |
| `INTERNAL_API_KEY` | backend `.env` | Generar uno nuevo y actualizar Render |
| `RESEND_API_KEY` | backend `.env` | Revocar la clave en Resend y crear otra |
| Firebase Admin | si el JSON estuvo en el árbol | Rotar la cuenta de servicio en Firebase |

## Purga de historial

No ejecutada. Requiere `git filter-repo` (o equivalente), backup verificable y autorización explícita de force push. No se reescribe el remoto sin esa autorización.

## Integración

CI levanta PostgreSQL 15 y Redis 7. La aprobación es por SHA: el job de integración del CI #52 terminó en `success` para `600e4f2`. Un commit posterior no hereda esa aprobación hasta que su propio job termine en `success`.

## npm restante (no aplicado a propósito)

Frontend, después de subir `next` a 16.4.6 y `axios` a 1.21.1:

- `exceljs` / `uuid`: fix exige downgrade major a exceljs 3.4.0. No aplicado.
- `@sentry/*`, `glob`, `minimatch`, `brace-expansion`: transitivos; `npm audit fix` no los resolvió sin `--force`.

Backend:

- `prisma` / `@prisma/config` / `effect` / `deepmerge-ts`: fix exige Prisma 7. No aplicado.
- `jest`, `firebase-admin`, `@nestjs/cli`: fixes de major. No aplicados.

## Otros

- Despliegue real: credenciales Neon/Render/Vercel y autorización.
- Almacenamiento persistente en producción: credenciales S3/R2 o equivalente gratuito.
