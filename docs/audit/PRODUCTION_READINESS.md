# Preparación para producción — Vercel / Render / Neon

## Vercel (frontend)

- Framework: Next.js 16.2.3. Root Directory: `r.e.c-frontend`.
- Build: `next build` (Vercel por defecto). No usar `output: standalone`.
- Variables requeridas:
  - `NEXT_PUBLIC_API_BASE_URL` (pública) — URL de Render
  - `INTERNAL_API_URL` (servidor) — URL de Render
  - `JWT_SECRET` (servidor) — idéntico al de Render
  - `NEXT_PUBLIC_SITE_URL` (pública)
  - `NEXT_PUBLIC_EMAIL_DOMAIN` (pública)
  - `TRUST_PROXY_HEADERS=1` en Vercel
- No definir `SESSION_COOKIE_DOMAIN`.
- Socket.IO sale directo del browser a Render con token de `/api/auth/session?socket=1`.
- Build verificado localmente: `npm run build` OK (Next 16, Turbopack).

## Render (backend)

- Tipo: Web Service, runtime Node. Root Directory: `r.e.c-backend`.
- Build Command: `npm ci --include=dev && npx prisma generate && npm run build`
- Start Command: `npm run start:render` = `prisma migrate deploy && node dist/main.js`
- Health Check Path: `/health`
- Puerto: Render inyecta `PORT`; no fijar a 4000.
- Variables obligatorias: `NODE_ENV=production`, `TRUST_PROXY=1`, `DATABASE_URL` (pooled Neon), `DATABASE_DIRECT_URL` (directa Neon), `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES=15m`, `JWT_REFRESH_EXPIRES=30d`, `JWT_ISSUER=recedu`, `JWT_AUDIENCE=recedu-app`, `CORS_ORIGIN`, `EMBED_ORIGINS`, `FRONTEND_URL`, `INTERNAL_API_KEY`.
- Opcionales: `RESEND_API_KEY`, `RESEND_FROM`, `REDIS_URL`, `SENTRY_DSN`.
- `render.yaml` blueprint presente y consistente.
- Build verificado localmente: `npm run build` OK (tsc/nest). Lint OK.

## Neon (PostgreSQL)

- Cadena pooled (host `-pooler`) → `DATABASE_URL`, con `sslmode=require&pgbouncer=true&connect_timeout=15`.
- Cadena directa (sin `-pooler`) → `DATABASE_DIRECT_URL`, con `sslmode=require`.
- Migraciones (`prisma migrate deploy`) usan `DATABASE_DIRECT_URL`.
- 47 migraciones en `prisma/migrations`; no se ejecutaron contra una base real en esta auditoría (sin Postgres local).
- Riesgo: compatibilidad backend↔DB no verificada en runtime; schema Prisma 6.19 vs migraciones.

## Bloqueos / no verificado

- No se crearon recursos ni se desplegó (instrucción explícita).
- Sin Postgres local: integration tests y `migrate deploy` no ejecutados.
- Sin Redis local: rate limit/cache en memoria.
- Conexión real Neon no probada.