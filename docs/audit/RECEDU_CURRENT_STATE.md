# Estado real del proyecto Recedu

Nota: el alojamiento descrito más abajo como Render o Vercel quedó retirado. Usa [docs/operations/servidor.md](../operations/servidor.md).

Fecha de auditoría: 2026-11-20. Rama de trabajo: `work/audit-recovery` (tracking `origin/fix/audit-2026-11-11-critical`, commit `ef89eb2`).

## Identidad

- Repo: `teka369/R.E.C-plus` (público).
- Rama principal: `main` @ `c5a4445` (2026-10-06).
- Rama de trabajo actual: `work/audit-recovery` @ `ef89eb2` (2026-11-11), +5 commits sobre main.
- Default branch: `main`.

## Stack real

- Frontend: Next.js 16.2.3, React 19.2, TypeScript 5, Tailwind 4, Axios 1.15, Sentry, Playwright.
- Backend: NestJS 11.0.1, Prisma 6.18 (client 6.19), PostgreSQL, Redis opcional, Socket.IO, JWT/Passport, bcryptjs, class-validator, Helmet, Resend, Firebase Admin, Swagger (no prod).
- DB: PostgreSQL (Neon en prod). 41 modelos, 47 migraciones.
- Infra objetivo: Vercel (front), Render (back), Neon (DB).

## Estado de código

- Backend unit tests: 557 passed / 557 (jest, 33 suites). Ejecutado localmente.
- Backend build: OK (`prisma generate && nest build`).
- Backend lint: OK (0 warnings, max-warnings 0).
- Frontend build: OK (`next build`).
- Frontend lint: OK con 2 warnings (react-hooks/exhaustive-deps), 0 errors.
- Secret guard: OK (`scripts/check-tracked-secrets.mjs`).
- Integration tests: NO EJECUTADOS (sin Postgres local).
- E2E Playwright: NO EJECUTADOS.

## Seguridad (confirmado en código)

- `.env` y uploads NO trackeados en la rama de trabajo (verificado `git ls-files`).
- ValidationPipe global whitelist/forbidNonWhitelisted/transform.
- Helmet, CORS por lista, body limit 1MB, Swagger apagado en prod.
- RBAC por endpoint + RolesGuard, SUPER_ADMIN bypass.
- TenantBoundaryGuard global.
- Refresh token rotado con jti, hash bcrypt, revocación en AuthSession.
- Cookies httpOnly, SameSite=Lax, Secure fuera de dev.
- Rate limit login IP-based.

## Riesgos abiertos

- Secretos históricos en `main` (rotación pendiente).
- `/auth/recover-by-code` devuelve token de reset (pendiente de cierre).
- IDs enteros predecibles; guard de tenant no cubre id del recurso.
- JWT no se revalida contra DB.
- Uploads en disco local.
- Sin branch protection verificada.

## Preparación para despliegue

- Vercel: listo (build OK, variables documentadas en DEPLOY.md).
- Render: listo (render.yaml, start:render, health /health).
- Neon: procedimiento documentado; migraciones no ejecutadas contra base real.

## Conclusión

El proyecto está en estado funcional y compilable. No listo para producción por riesgos de seguridad (secretos históricos, reset por código) y falta de verificación de integración/producción. Ver `NEXT_STEPS.md` y `PRODUCTION_READINESS.md`.