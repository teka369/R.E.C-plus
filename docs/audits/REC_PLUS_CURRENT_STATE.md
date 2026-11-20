# R.E.C-plus — snapshot de estado

Actualización 2026-10-06, rama `hardening/fase-0-baseline` (no está en `main`): el índice de esa rama ya no trackea `.env` reales ni uploads. El historial de `main` sigue teniéndolos. No hay hosting activo; no se rotó ningún servicio. Detalle en `docs/implementation/FASE_1_INDICE.md` y `docs/implementation/PURGA_HISTORIAL_GIT.md`.

Documento de comparación para auditorías futuras. No sustituye el informe largo.

## Identidad de la auditoría

| Campo | Valor |
| --- | --- |
| Repositorio auditado | `teka369/R.E.C-plus` (público) |
| Rama | `main` |
| Commit | `2795c65feff765d42b21e0476c7f7e5f49705ca9` |
| Mensaje | `fix: tests unitarios 554/554 pasan, ignorar .claude/ y captura.png` |
| Autor del commit | teka369 |
| Fecha del commit | 2026-07-01 23:41:01 +0200 |
| Fecha de esta auditoría | 2026-10-06 (America/Bogota, UTC-5) |
| Método | Lectura del árbol en ese commit. Sin deploy, sin pegarle a producción, sin migrar la base real. |
| Móvil | Repo aparte `teka369/recedu-mobile` (privado), árbol `main` @ `1903bdbfa902d20ee9a052c72a713114212e2686`. No está dentro de R.E.C-plus. |
| Historial git profundo | NO VERIFICADO (clone shallow de 1 commit) |

## ¿Qué es R.E.C-plus?

Plataforma B2B de refuerzo académico para colegios (notas, recuperaciones, materiales, horarios, comunicación, roles de secretaría / docente / estudiante / super-admin). Monorepo de dos apps, no un workspace npm real:

- `r.e.c-frontend`: Next.js App Router + TypeScript + Tailwind.
- `r.e.c-backend`: NestJS 11 + Prisma 6 + PostgreSQL + Redis opcional + Socket.IO.
- Despliegue descrito: Docker Compose para Coolify, PM2 (`ecosystem.config.cjs`), Nginx de ejemplo, cron de backup.
- Dominio citado en env de ejemplo y frontend: `recedu.co` / `api.recedu.co`.

No hay README en la raíz. Los README están en cada app.

## Stack real (verificado en manifiestos)

Backend (`r.e.c-backend/package.json`): NestJS 11, Prisma client 6.18, PostgreSQL vía Prisma, JWT + Passport, bcryptjs, class-validator, Throttler + storage Redis opcional, cache-manager, Socket.IO + Redis adapter, Swagger (solo si `NODE_ENV !== production`), Sentry, Firebase Admin, Helmet, compression, Resend (correo), k6 para carga (script presente, no ejecutado aquí).

Frontend: Next.js (App Router), TypeScript, Tailwind, Axios, Sentry, Playwright (e2e en repo, no en CI).

Móvil: Expo ~54, expo-router, axios, expo-secure-store, TanStack Query, zustand, socket.io-client. Sin tests en `package.json`.

No hay aplicación Expo dentro de `R.E.C-plus`.

## ¿Qué funciona? (por código, no por runtime)

CONFIRMADO en código, no ejecutado contra un servidor vivo:

- Login con email/password, bcrypt, rate limit de login (5 / 15 min) y tracker de intentos.
- Access JWT HS256 con issuer/audience, refresh con `jti`, hash bcrypt del refresh, rotación y revocación en `AuthSession`.
- Cookies de sesión httpOnly, SameSite=Lax, Secure fuera de dev (`session-cookie-opts.ts`).
- ValidationPipe global: `whitelist`, `forbidNonWhitelisted`, `transform`.
- Helmet, CORS por lista, body limit 1 MB, Swagger apagado en production.
- RBAC por endpoint con `RolesGuard`. `SUPER_ADMIN` bypass.
- `TenantBoundaryGuard` global: bloquea `institutionId` de params/query/body/header distinto al del JWT; cachea `activa` 30 s.
- Servicios académicos usan `scopeToInstitution` / `getAcademicPeriod` antes de update en varios flujos.
- Triggers SQL de integridad tenant (migración `20260401000000_tenant_integrity_triggers`) en modelos hoja.
- `publicId` UUID en User e Institution; índices compuestos (migración `20260401060000`).
- Soft delete (migración `20260403020750`) y restore solo `SUPER_ADMIN`.
- Health `/health` y `/health/metrics` (este último con `INTERNAL_API_KEY` en comparación constant-time).
- Backup diario documentado en `docker-compose.coolify.yml` + `scripts/backup.sh`.
- CI: lint front/back, unit tests backend con umbral de líneas 50 % (se salta si falta el summary), integration tests.

## ¿Qué no funciona / está mal, con evidencia?

- Secretos reales trackeados en un repo público: `r.e.c-backend/.env` (DATABASE_URL, JWT, refresh, Resend, INTERNAL_API_KEY) y `r.e.c-frontend/.env.local` (JWT_SECRET de 128 caracteres). `.gitignore` los ignora, pero ya están en el índice.
- `POST /auth/recover-by-code` es público y devuelve el token de reset. El frontend lo guarda en `sessionStorage` y abre `/reset-password`. El `codigo` también es la contraseña inicial si no se envía password (`users.service.ts`).
- Archivos de usuario commiteados: PDFs e imagen WhatsApp en `r.e.c-backend/uploads/study-materials/`.
- CI de integración hace `TRUNCATE ... "User", "Institution" ... CASCADE` y usa `secrets.DATABASE_URL`, no el Postgres del job.
- No hay rulesets de branch protection en el repo.
- Tests de este snapshot no se ejecutaron en esta auditoría (NO VERIFICADO el “554/554”).

## ¿Qué está incompleto?

- Móvil fuera del monorepo; última actividad del repo móvil anterior a este commit (árbol mayo 2026 vs backend julio 2026).
- `publicId` existe, pero las APIs siguen en ids enteros autoincrement.
- God services: `performance.service.ts` ~60 KB, `academic.service.ts` ~55 KB.
- Un solo TODO relevante: umbrales de calificación aún no viven solo en `InstitutionGradingPolicy` (`performance.service.ts:1368`).
- Playwright e2e no corre en CI. Frontend no tiene unit tests encontrados.
- Dual deploy PM2 + Docker/Coolify. Rollback no automatizado más allá de git/redeploy.
- Observabilidad: Sentry opcional; DSN vacío en el `.env` trackeado. Sin alerting verificado.

## 10 mayores riesgos

1. Secretos de producción (o de un entorno real) en git público.
2. Toma de cuenta con `codigo` vía `/auth/recover-by-code`.
3. Material académico real dentro del repo público.
4. Integration CI puede truncar la base apuntada por `DATABASE_URL`.
5. IDs enteros predecibles; el guard de tenant no cubre el id del recurso, solo `institutionId` explícito.
6. JWT no se revalida contra DB (rol e institución viven en el token hasta expirar).
7. Uploads en disco local: no escala a más de una réplica y se perdieron en la imagen si no hay volumen.
8. Sin branch protection: push directo a `main`.
9. Cookie de refresh fija a 7 días en Next aunque el refresh JWT sea más largo; inconsistencia de sesión.
10. Móvil desacoplado y sin batería de tests visible.

## Vulnerabilidades críticas

- SEC-01 secretos en repo público.
- SEC-02 account takeover por código.
- SEC-03 archivos académicos en git.
- OPS-01 truncate de integración contra la URL del secret (impacto de producción NO VERIFICADO; el cableado sí está confirmado).

## ¿Listo para producción?

No. Hay controles buenos (refresh rotado, whitelist, tenant guard, triggers), pero un repo público con secretos, reset por código y archivos de usuarios no puede considerarse listo.

## Escalabilidad

Primer cuello probable: disco local de uploads + un solo proceso Node (PM2/Coolify de una réplica). Segundo: Postgres sin pooler externo visible (Prisma por defecto) y servicios enormes con includes. Tercero: rate limit en memoria si Redis no responde, y Socket.IO sin adapter Redis activo en todas las réplicas.

100 usuarios: viable en un VPS. 1.000: viable si hay índices y una sola instancia. 10.000: uploads, conexiones y jobs se vuelven el límite. 100.000 / 1.000.000: la arquitectura actual no está preparada (sin workers, sin object storage, sin partición por tenant, ids globales).

## Seguridad de la arquitectura

Multi-tenant por columna `institutionId` + filtros en servicio + triggers en modelos hoja. No es schema-por-tenant. Defensa razonable si todos los servicios filtran. No es uniforme: materiales autorizan por asignación/grupo, no por `institutionId` directo.

## Deuda técnica

Servicios gigantes, ids enteros vs `publicId`, secretos y uploads en git, CI que no construye ni corre e2e, móvil en otro repo, PM2 y Docker a la vez, reportes Playwright y `tsconfig.tsbuildinfo` trackeados.

## Qué corregir primero

1. Rotar JWT, refresh, DB, Resend, INTERNAL_API_KEY. Sacar `.env` del historial.
2. Cerrar `/auth/recover-by-code` (no devolver token; no usar `codigo` como secreto).
3. Borrar uploads del git y del historial.
4. Apuntar integration tests a la base del job y prohibir truncate contra prod.
5. Branch protection en `main`.

## Qué NO se verificó

- Runtime de `recedu.co` / `api.recedu.co` (no se atacó producción).
- Valor real del secret `DATABASE_URL` de GitHub Actions.
- Suite 554/554 (no se corrió `npm test` aquí).
- npm audit contra el lockfile en este entorno.
- Coolify en el servidor, backups restaurables, TLS real, logs de producción.
- Contenido de los PDF commiteados (no se abrieron).
- Historial git más allá del HEAD (shallow).
- App móvil línea por línea (solo árbol, `package.json` y ausencia de tests en scripts).
