# Fase 0 — Baseline de implementación

Plan de referencia: `Plan_Implementacion_RECu_PLUS_limpio.md`.
Esta fase no cambia lógica de negocio. Congela el punto de partida.

| Campo | Valor |
| --- | --- |
| Fecha | 2026-10-06 America/Bogota |
| Repo | `teka369/R.E.C-plus` |
| Rama inspeccionada | `main` |
| HEAD | `c5a44456c7b0c2fe06923c7dc3c0a171dca0ec80` |
| Working tree | limpio, alineado con `origin/main` |
| Commit de código auditado | `2795c65feff765d42b21e0476c7f7e5f49705ca9` |
| Commit de auditoría | `c5a44456c7b0c2fe06923c7dc3c0a171dca0ec80` |
| Node | v20.20.2 |
| npm | 10.8.2 |
| Engines en package.json | no declarados |

## Stack y scripts detectados

Backend `r.e.c-backend`: NestJS `^11.0.1`, Prisma client `^6.18.0`. Scripts: `lint`, `test:unit`, `test:integration`, `test:e2e`, `test:cov`, `build` (`prisma generate && nest build`). No hay script `typecheck` dedicado.

Frontend `r.e.c-frontend`: Next `16.2.3`. Scripts: `lint`, `build`, `test:e2e` (Playwright). No hay `typecheck` dedicado.

No hay workspace npm real en la raíz. Scripts de raíz solo despliegan vía `scripts/deploy.sh`.

## Hechos que siguen abiertos (reconfirmados en este HEAD)

- `git ls-files` sigue listando `r.e.c-backend/.env`, `r.e.c-backend/.env.test` y `r.e.c-frontend/.env.local`.
- 9 rutas bajo `r.e.c-backend/uploads/study-materials/` siguen trackeadas (PDF e imagen). No se abrieron.
- `POST /auth/recover-by-code` sigue en `auth.controller.ts`.
- Integration job sigue exportando `DATABASE_URL` y `DATABASE_URL_TEST` desde `secrets.DATABASE_URL` (`.github/workflows/ci.yml` líneas 134-136). El unit job sí usa `postgresql://localhost:5432/dummy`.
- No hay rama de hardening previa. Solo `main`.

## Comandos seguros (no ejecutados en esta pasada)

Seguros si no cargan el `.env` trackeado y no apuntan a una base real:

- `npm ci` en cada app.
- `npm run lint` en backend y frontend.
- `npx tsc --noEmit` en cada app.
- `npm run test:unit` en backend con `DATABASE_URL` dummy y sin leer `.env` de producción.
- `npm run build` de backend solo con `prisma generate` local, sin `migrate deploy`.

No seguros todavía:

- `npm run test:integration` mientras el helper haga TRUNCATE y pueda heredar `DATABASE_URL` del `.env` trackeado.
- `npm run deploy`, `db:deploy`, `prisma migrate deploy`, seeds, bootstrap de super-admin.
- `k6` contra cualquier URL pública.

Resultado de lint/test/build en esta fase: NO VERIFICADO. No se instaló `node_modules` para no mezclar la baseline con una corrida que pudiera leer el `.env` commiteado.

## No tocar

- Producción (`recedu.co`, `api.recedu.co`) y cualquier base apuntada por el `.env` trackeado.
- Valores de secretos: no se imprimen, no se pegan en docs.
- Historial git: purga y force-push quedan fuera hasta autorización explícita.
- Migraciones ya aplicadas en un entorno real.
- Repo móvil `teka369/recedu-mobile`: fase 10, no esta.

## Archivos que la Fase 1 puede tocar (aún no tocados)

- `.gitignore`
- `.github/workflows/ci.yml` (solo el guard de secretos; el aislamiento de DB es Fase 3)
- `r.e.c-backend/.env`, `r.e.c-backend/.env.test`, `r.e.c-frontend/.env.local` (sacar del índice, no reescribir secretos en el chat)
- `r.e.c-backend/uploads/study-materials/**` (sacar del índice)
- ejemplos `.env*.example` si hace falta un placeholder
- docs de operación de rotación, sin valores

## Riesgos antes de implementar

- Rotar secretos sin purgar historial deja los valores viejos clonables.
- Purgar historial en `main` público reescribe SHAs y exige force-push. Quien ya clonó sigue teniendo los blobs hasta que rote.
- Borrar uploads del índice no borra el blob del historial.
- `git rm --cached` del `.env` no rota la clave. Hay que rotar en Postgres, Resend y el proceso que firma JWT, fuera de este repo.
- Esta sesión no tiene acceso al panel de la base ni a Resend. La rotación real la tienes que hacer tú en esos servicios.

## Plan de commits propuesto

1. `chore: baseline de hardening fase 0` — este documento, en rama `hardening/fase-0-baseline`. No va directo a `main` si ya existe ruleset; hoy no hay ruleset, igual se usa rama.
2. Fase 1, después de tu OK de rotación y de purga: `security: untrack secrets and user uploads` (índice + gitignore + CI de detección). Purga de historial en un paso aparte, con backup del repo y force-push explícito.
3. Fase 2: `auth: stop returning reset tokens from recover-by-code`.
4. Fase 3: `ci: isolate integration database`.

## Siguiente paso

Fase 1 no arranca sola. Falta tu confirmación de dos cosas irreversibles o externas: rotar credenciales en los servicios, y autorizar la purga de historial (force-push). Lo que sí se puede hacer en la rama sin force-push es sacar los archivos del índice y añadir el chequeo de CI.
