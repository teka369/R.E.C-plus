# Arquitectura identificada — Recedu

## Visión general

Monorepo de dos aplicaciones independientes (no workspace npm real):

- `r.e.c-frontend`: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4.
- `r.e.c-backend`: NestJS 11 + Prisma 6 + PostgreSQL + (Redis opcional) + Socket.IO.
- Raíz: scripts de deploy, docker-compose (Coolify), PM2, documentación.

No hay aplicación móvil dentro de este repo (repo aparte `teka369/recedu-mobile`).

## Flujo de datos

```
Browser
  -> Next.js (Vercel)
     -> /api/rec/[[...path]]  (BFF, reenvía a Nest con Authorization: Bearer)
     -> /api/auth/session     (verifica JWT con JWT_SECRET compartido)
  -> NestJS (Render) :PORT
     -> Guards: Throttler, JwtAuth, Roles, TenantBoundary
     -> Controllers -> Services -> Prisma -> PostgreSQL (Neon)
     -> Socket.IO (tenant-{id}, user-{id}) directo browser<->Render
  -> Redis (opcional): rate limit, cache, socket adapter
  -> Resend (correo), Firebase Admin (push)
  -> uploads/ en disco local (materiales)
```

Cookie `rec_token` httpOnly en dominio de Vercel; Next reenvía el token a Render. Socket.IO sale del browser directo a Render con token de `/api/auth/session?socket=1`.

## Backend (NestJS)

- 139 archivos `.ts` en `src`.
- Módulos: academic, admin, auth, communication, gateway, health, institutions, materials, performance, prisma, recovery, users, common.
- Guards globales: Throttler, TenantBoundary, JwtAuth, Roles.
- ValidationPipe global: whitelist, forbidNonWhitelisted, transform.
- Helmet, CORS por lista, body limit 1 MB.
- Swagger solo si `NODE_ENV !== production`.
- Health: `/health` (DB status, sigue 200 si DB caída), `/health/metrics` (INTERNAL_API_KEY).
- Soft delete + restore (solo SUPER_ADMIN).
- Multi-tenant por columna `institutionId` + filtros en servicio + triggers SQL en modelos hoja.

## Base de datos (Prisma + PostgreSQL)

- 41 modelos, 47 migraciones.
- IDs enteros autoincrement en la mayoría de entidades; `publicId` UUID en `User` e `Institution` (y Group/Subject/Grade según migración `20260401060000`).
- Triggers de integridad tenant (migración `20260401000000_tenant_integrity_triggers`).
- Soft delete (migración `20260403020750`).

## Frontend (Next.js)

- 195 archivos `.ts/.tsx`.
- App Router, rutas por rol: `(auth)`, `(dashboard)` con subrutas docente/estudiante/secretaria/super-admin.
- BFF en `app/api/rec/[[...path]]/route.ts` y `app/api/auth/session`.
- Contextos: AuthContext, SocketContext.
- Playwright e2e (no en CI).

## Comunicación en tiempo real

- Socket.IO con adaptador Redis opcional.
- Rooms: `tenant-{institutionId}`, `user-{userId}`.
- Gateway de recuperación (recovery) y gateway de app.

## Observabilidad

- Sentry (opcional, DSN vacío en ejemplo).
- nest-winston / pino-http.
- Health + métricas internas.

## Despliegue

- Vercel (frontend), Render (backend), Neon (PostgreSQL).
- `render.yaml` blueprint.
- `scripts/deploy/*` automatización.
- Legacy: PM2 + Docker/Coolify (no usar para este stack).