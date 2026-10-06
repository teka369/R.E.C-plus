# Auditoría completa R.E.C-plus

| Campo | Valor |
| --- | --- |
| Repo | https://github.com/teka369/R.E.C-plus |
| Rama | `main` |
| Commit auditado | `2795c65feff765d42b21e0476c7f7e5f49705ca9` |
| Fecha del commit | 2026-07-01 23:41:01 +0200 |
| Fecha/hora de auditoría | 2026-10-06, tarde America/Bogota (UTC-5) |
| Alcance | Árbol de ese commit + mirada al repo móvil `teka369/recedu-mobile` @ `1903bdbfa902d20ee9a052c72a713114212e2686` |
| Regla | Nada de esta auditoría se ejecutó contra producción. No se imprimen secretos. |

Estados usados: CONFIRMADO, PROBABLE, SOSPECHOSO, NO VERIFICADO, DESCARTADO.

## 1. Resumen ejecutivo

R.E.C-plus es un monorepo real de frontend Next.js y backend NestJS/Prisma, con multi-tenant por institución, refresh tokens rotados, ValidationPipe estricto y triggers SQL de tenant. Eso está bien encaminado.

No está listo para producción. El repo es público y trackea `r.e.c-backend/.env` con credenciales reales, `r.e.c-frontend/.env.local` con `JWT_SECRET`, y archivos de materiales (PDF e imagen) bajo `r.e.c-backend/uploads/`. El reset por código devuelve el token de recuperación en la respuesta HTTP. El job de integración hace `TRUNCATE` de `User` e `Institution` y no usa el Postgres del workflow.

## 2. Estado actual

- Default branch: `main`. Un solo remote. Sin rulesets (lista vacía en la API de rulesets).
- Último commit conocido: el de arriba. Clone usado: depth 1. Historial anterior NO VERIFICADO.
- 569 archivos fuera de `.git` en el snapshot. ~28 MB.
- No hay README raíz. Sí `r.e.c-frontend/README.md` y `r.e.c-backend/README.md`.
- `.gitignore` ignora `.env`, pero esos archivos ya estaban en el índice.
- Dominio de producto citado en código: `recedu.co` / `api.recedu.co`. Disponibilidad real NO VERIFICADA.

## 3. Arquitectura detectada

```
Browser / Expo
  -> Next.js (App Router, proxy.ts, cookies httpOnly)
      -> /api/auth/session (verifica JWT con el mismo secreto)
      -> /api/rec/[[...path]] y axios hacia Nest
  -> NestJS :4001
      -> Guards: Throttler, TenantBoundary, JwtAuth, Roles
      -> Services (varios god-services)
      -> Prisma -> PostgreSQL
      -> Redis opcional (throttle, cache, socket adapter)
      -> uploads/ en disco local
      -> Socket.IO (tenant-{id}, user-{id})
Coolify compose: postgres, backend, frontend, backup cron
También existe ecosystem.config.cjs (PM2)
```

Separación front/back es clara. La lógica de negocio está en services, no en controllers, pero `academic` y `performance` concentran demasiado. No hay workers ni cola de jobs.

## 4. Stack real

| Capa | Confirmado |
| --- | --- |
| Web | Next.js App Router, TypeScript, Tailwind, Axios, Sentry, Playwright |
| API | NestJS 11, class-validator, Swagger solo no-prod, Helmet, compression |
| Datos | Prisma 6.18, PostgreSQL, 41 models, 46 migraciones |
| Cache/rate | Redis opcional; fallback a memoria |
| Realtime | Socket.IO + adapter Redis en dependencias |
| Mail | Resend |
| Push | Firebase Admin + modelo `PushToken` |
| Móvil | Expo 54 en otro repo. No está en este monorepo |
| Deploy | Dockerfiles multi-stage, compose Coolify, PM2, Nginx example |

## 5. Funcionalidades auditadas (por código)

Páginas `page.tsx`: 68. Roles de dashboard: estudiante, docente, secretaría, super-admin. Marketing: blog, colegios, vs/q10, funcionalidades, tutorial, materiales públicos.

Backend modules: auth, users, academic, materials, recovery, recovery-settings, schedule, communication, performance, institutions, admin/restore, health, gateway, mail, logger.

Flujos leídos con evidencia: login, refresh, logout, forgot-password, recover-by-code, reset-password, CRUD usuarios, períodos, materiales y archivo, restore super-admin, health.

Runtime de cada botón: NO VERIFICADO (no hay entorno levantado).

## 6. Seguridad

Controles presentes y confirmados:

- `ValidationPipe` whitelist + forbidNonWhitelisted (`main.ts`).
- Login throttled 5/15 min. Forgot/recover/reset throttled. Global 100 req/min.
- Refresh hasheado, rotación, revocación al reset.
- Cookies httpOnly. Comparación constant-time de `INTERNAL_API_KEY`.
- Path traversal de uploads rechazado si sale de `uploadsRoot`.
- Filename sanitizado en Content-Disposition.
- Swagger off en production.

Fallos: secretos en git, recover-by-code, archivos en git, token de socket aceptado por query string, CSP con `unsafe-inline`, rol del JWT no revalidado en DB.

## 7. Multi-tenancy

Modelo: fila con `institutionId` en Institution, User, Grade, Group, Subject, AcademicPeriod. Modelos hoja sin columna propia; triggers BEFORE INSERT/UPDATE comparan instituciones de FKs (`20260401000000_tenant_integrity_triggers`).

`TenantBoundaryGuard` es `APP_GUARD`. Solo compara `institutionId` pedido (param, query, body, header `x-institution-id`) con el del JWT. Si el request no trae `institutionId`, el guard no bloquea el id del recurso. `SUPER_ADMIN` pasa siempre.

Servicios académicos revisados (`getAcademicPeriod`, `activateAcademicPeriod`) sí filtran antes de update. Materiales autorizan por `teacherId` / asignación / grupo del actor, no por `institutionId` directo. Triggers reducen filas cruzadas, no lecturas.

IDs: `@default(autoincrement())`. `publicId` UUID existe en User e Institution y no es la clave de las rutas.

## 8. Backend

Modules bajo `r.e.c-backend/src`. Pipes globales. Filtro `AllExceptionsFilter`. Timeout interceptor. Audit context middleware.

Auth: `auth.controller.ts` sin JwtAuthGuard (endpoints públicos, correcto para login). Roles por método, no globales: un endpoint con solo `JwtAuthGuard` acepta cualquier rol autenticado.

Hotspots de tamaño: `performance.service.ts` 59674 bytes, `academic.service.ts` 55379, `materials.service.ts` 27918, `recovery.service.ts` 27775.

## 9. Frontend

App Router, dashboards por rol, `proxy.ts` pone CSP y nonce (el CSP igual permite `unsafe-inline`). Sesión vía cookies seteadas por `/api/auth/session`, que verifica el access token con `JWT_SECRET` del proceso Next. Refresh silencioso contra `/auth/refresh`.

`dangerouslySetInnerHTML`: no encontrado en el grep de ts/tsx de app. localStorage se usa para preferencias de UI, no para el access token. El token de reset sí va a `sessionStorage`.

## 10. Mobile

Repo `teka369/recedu-mobile`, privado, no es parte del commit auditado. Expo 54, expo-secure-store presente en dependencias (uso línea a línea NO VERIFICADO). `.env.local` trackeado (42 bytes; contenido no reproducido). Sin script de test. Deep link de reset documentado en backend: scheme `recedu://reset?token=`. Diferencia web/móvil: NO VERIFICADA en runtime.

## 11. Database

41 models. Migraciones desde `20251030214808_init` hasta `20260701000001_align_schema`. Unique email y codigo globales en User (no por institución). Institution.codigo unique. Group codigo unique por institución. Soft delete. AuditLog. AuthSession. PasswordResetToken indexado por token.

Integridad: FKs Prisma + triggers tenant. Activar período cierra otros y luego updatea el elegido sin transacción única (`academic.service.ts` `activateAcademicPeriod`): race PROBABLE.

Paginación: helper `paginateParams`. No todas las listas se revisaron una a una.

## 12. Performance

NO VERIFICADO en runtime. Code splitting de Next por rutas. Backend serializa includes anidados en offerings (teachers). Uploads se leen enteros a Buffer (`getStudyFile`). Sin medición de bundle.

## 13. Escalabilidad

| Escenario | Lectura realista |
| --- | --- |
| 100 | Una instancia aguanta |
| 1.000 | Aguanta si Postgres tiene los índices compuestos ya migrados y Redis está up |
| 10.000 | Uploads locales, conexiones Prisma y Socket.IO en un proceso se vuelven el límite |
| 100.000+ | Hace falta object storage, pooler, workers, y dejar de usar ids globales calientes |

Orden probable de ruptura: 1) disco/uploads y réplica única, 2) Postgres/Prisma sin pooler externo, 3) rate limit y cache en memoria si Redis cae.

## 14. Testing

Backend: decenas de `*.unit-spec.ts` e integration specs (tenant-boundary, security-fixes, users, schedule, recovery). Commit message dice 554/554. Esta auditoría no ejecutó jest: NO VERIFICADO.

Frontend: e2e Playwright presente (`auth`, `grade-entry`, `attendance`, `messaging`, etc.). 0 archivos `*.test.ts(x)` encontrados. CI no corre Playwright ni `next build`.

Coverage gate: si falta `coverage-summary.json`, el step sale 0 (`ci.yml`).

## 15. DevOps

- Workflow único `.github/workflows/ci.yml`: lint, unit, integration. Sin build, sin deploy, sin e2e.
- Integration env: `DATABASE_URL` y `DATABASE_URL_TEST` = `secrets.DATABASE_URL`. El servicio postgres:15 del job no se usa.
- `cleanTestDb` ejecuta TRUNCATE de User, Institution y el resto académico.
- Docker backend: `prisma migrate deploy` en el CMD, usuario node, health `/health`.
- Compose Coolify incluye backup cron 03:00 y volumen. Restore de backup NO VERIFICADO.
- PM2 script `deploy` en backend package.json. Dos caminos de deploy.
- Branch protection: no hay rulesets.

## 16. Dependencias

Nest 11, Prisma 6, Next en el frontend lock. `npm audit` no se corrió aquí: vulnerabilidades CVE NO VERIFICADAS. No se declara ninguna CVE sin escaneo.

Root `package.json` arrastra `@sentry/node` y winston sin ser la app: ruido de deploy.

## 17. UX

Formularios de login y recuperación existen, con mensajes de error. Recover-by-code dice “revisa el código” si el token viene null: enumeración de códigos. Empty states y a11y: NO VERIFICADOS en browser. Checklist responsive en `RESPONSIVE-QA-CHECKLIST.md` (documento, no evidencia de pase).

## 18. Calidad de código

Pocos `any` (suma de matches `: any` ≈ 5 en src). Un TODO de negocio. Servicios demasiado grandes. Uploads, playwright-report, test-results y `tsconfig.tsbuildinfo` trackeados. Archivo vacío `r.e.c-frontend/let`.

## 19. Riesgos

Ver matriz. Los que bloquean producción: secretos, recover-by-code, archivos en git, CI destructivo.

## 20. Contradicciones

- `.gitignore` dice que `.env` no se commitea; `git ls-files` los lista.
- `.env.coolify.example` advierte que 7d es inseguro y pide 15m; el `.env` trackeado tiene `JWT_EXPIRES` de 3 caracteres (compatible con `15m`, valor exacto no publicado aquí).
- Cookie `rec_refresh` se guarda 7 días (`session/route.ts`); el refresh del backend se configura aparte (`JWT_REFRESH_EXPIRES`).
- CI levanta Postgres de servicio y luego ignora su URL.
- Commit dice 554 tests; no reejecutados.
- README/producto hablan de app móvil; el móvil no vive en este repo.
- `publicId` existe; las rutas usan int.

## 21. Hotspots

`performance.service.ts`, `academic.service.ts`, `materials.service.ts`, `recovery.service.ts`, `users.service.ts`, `auth.service.ts`. Migraciones de normalización marzo 2026 (phase1–phase11) muestran deuda ya atacada, no cerrada del todo (TODO de umbrales).

## 22. Hallazgos detallados

### SEC-01

ID: SEC-01
Título: Secretos reales trackeados en repositorio público
Severidad: CRÍTICO
Categoría: Security issue

Estado: CONFIRMADO

Ubicación:
archivo: `r.e.c-backend/.env`, `r.e.c-frontend/.env.local`
línea: archivos enteros
módulo: config

Problema: El repo es público. Están en el índice `DATABASE_URL` (116 chars), `DATABASE_DIRECT_URL`, `JWT_SECRET` (128), `JWT_REFRESH_SECRET` (128), `RESEND_API_KEY` (36), `INTERNAL_API_KEY` (44), `REDIS_URL`, y el mismo largo de `JWT_SECRET` en el frontend. `.env.docker.example` tiene un `POSTGRES_PASSWORD` de 36 caracteres que no parece placeholder.

Evidencia: `git ls-files` los lista. Inventario por longitud, sin volcar valores. Visibilidad del repo: `private: false`.

Cómo reproducirlo: clonar `teka369/R.E.C-plus` y abrir esos archivos.

Impacto: Suplantación de tokens, acceso a la base, envío de correo con la cuenta Resend, lectura de métricas internas.

Por qué ocurre: Se commitearon antes o a pesar del gitignore. Gitignore no borra lo ya trackeado.

Riesgo: Cualquiera con el URL del repo.

Solución recomendada: Rotar todos esos secretos ya. `git rm --cached` los env. Borrar del historial (filter-repo o BFG) y forzar push. El valor viejo queda comprometido aunque se borre el archivo.

Prioridad: Inmediata
Esfuerzo estimado: MEDIO

### SEC-02

ID: SEC-02
Título: Reset de contraseña por código devuelve el token
Severidad: CRÍTICO
Categoría: Security issue

Estado: CONFIRMADO

Ubicación:
archivo: `r.e.c-backend/src/auth/auth.controller.ts`
línea: 46-51
módulo: auth

Problema: `POST /auth/recover-by-code` es público. Si el `codigo` existe, `recoverByCode` crea un `PasswordResetToken` y el controller responde `{ token }`. El frontend (`forgot-password/page.tsx`) lo guarda en `sessionStorage` y navega a `/reset-password`. Además, si no se manda password al crear usuario, la contraseña inicial es el mismo `codigo` (`users.service.ts` 137-138) y el create devuelve `codigo`.

Evidencia: controller líneas 46-51; service 380-401; page 39-45; users.service 137-158. Throttle: 3 cada 5 minutos por IP, no por código.

Cómo reproducirlo: conocer o filtrar un `codigo` (respuesta de alta, listado de secretaría, captura) y llamar el endpoint. Con el token, `POST /auth/reset-password`.

Impacto: Toma de cuenta sin acceso al correo. Enumeración: token null vs string, y el UI lo dice.

Por qué ocurre: El código se diseñó como segundo factor, pero se trata como secreto y se devuelve el token de un solo uso al cliente.

Riesgo: Alto si el código se muestra o se exporta. Brute force de cuid es poco práctico; reutilización del código conocido no.

Solución recomendada: Eliminar la respuesta con token. Recuperación solo por correo, o un OTP que no sea el identificador público. No usar `codigo` como password. Forzar cambio en el primer login. Rate limit por código, respuesta uniforme.

Prioridad: Inmediata
Esfuerzo estimado: BAJO

### SEC-03

ID: SEC-03
Título: Materiales académicos commiteados
Severidad: CRÍTICO
Categoría: Privacy / data exposure

Estado: CONFIRMADO

Ubicación:
archivo: `r.e.c-backend/uploads/study-materials/`
línea: n/a
módulo: materials

Problema: Hay varios PDF `Document_54.pdf` y una imagen con nombre de WhatsApp en el árbol git público. No se abrieron.

Evidencia: `git ls-files` lista esas rutas, incluido `teacher-12/2026-03/...WhatsApp_Image_...jpeg`.

Cómo reproducirlo: clonar el repo y listar `uploads/`.

Impacto: Posible dato personal o académico de un colegio en un repo público.

Por qué ocurre: La carpeta de uploads no está ignorada del todo, o se añadió a propósito.

Riesgo: Fuga de datos de menores o docentes. Contexto colombiano: dato personal; la obligación legal concreta requiere validación jurídica. El riesgo técnico es claro.

Solución recomendada: Borrar del árbol y del historial. Ignorar `uploads/`. Mover archivos a object storage privado. Avisar a la institución si el contenido es real.

Prioridad: Inmediata
Esfuerzo estimado: MEDIO

### OPS-01

ID: OPS-01
Título: Integration tests pueden truncar la base del secret
Severidad: CRÍTICO
Categoría: DevOps

Estado: CONFIRMADO el cableado. Impacto sobre producción: PROBABLE / NO VERIFICADO (no se leyó el valor del secret).

Ubicación:
archivo: `.github/workflows/ci.yml`, `r.e.c-backend/test/helpers/db-cleanup.ts`, `test/helpers/prisma-test-client.ts`
línea: workflow env DATABASE_URL; cleanup TRUNCATE
módulo: CI

Problema: El job define Postgres en el runner, pero exporta `DATABASE_URL` y `DATABASE_URL_TEST` desde `secrets.DATABASE_URL`. El cliente de test usa esa URL. `beforeEach` ejecuta TRUNCATE de User, Institution y tablas académicas con RESTART IDENTITY CASCADE.

Evidencia: lectura de los tres archivos.

Cómo reproducirlo: correr el workflow si el secret no es una base desechable.

Impacto: Borrado de colegios, usuarios y notas si el secret apunta a un entorno real.

Por qué ocurre: Se copió el secret de deploy al job de test.

Riesgo: Un push a main dispara el job.

Solución recomendada: URL fija al servicio del job (`postgresql://postgres:postgres@localhost:5432/recedu_test`). Guard que aborte si la URL no es localhost en test.

Prioridad: Inmediata
Esfuerzo estimado: BAJO

### SEC-04

ID: SEC-04
Título: Autorización de recurso no la cubre el guard de tenant
Severidad: ALTO
Categoría: Security issue

Estado: CONFIRMADO como límite del guard. Explotación cross-tenant general: PROBABLE, no probada en vivo.

Ubicación:
archivo: `r.e.c-backend/src/common/guards/tenant-boundary.guard.ts`
línea: 58-69 y 142-149
módulo: common

Problema: El guard solo mira `institutionId` explícito. Un `GET /materials/study/:id` con id de otro colegio no lleva `institutionId`. La protección queda en cada service. Materiales comprueban asignación o grupo; no comparan `institutionId` del grupo contra el actor en todos los caminos leídos.

Evidencia: guard citado; `getStudyMaterial` autoriza por teacher assignment o group/grade del actor (`materials.service.ts` ~500-522). Triggers impiden ciertas escrituras cruzadas, no lecturas.

Cómo reproducirlo: dos instituciones, id de material de B, token de A. No ejecutado (no hay base de auditoría).

Impacto: IDOR/BOLA si algún service olvida el filtro.

Por qué ocurre: Guard global incompleto + ids enteros globales.

Riesgo: Alto en superficie; mitigado donde el service filtra y donde hay trigger.

Solución recomendada: Scope obligatorio en un interceptor/Prisma extension por `institutionId` del JWT. Preferir `publicId`. Tests de IDOR por cada controller.

Prioridad: Alta
Esfuerzo estimado: ALTO

### SEC-05

ID: SEC-05
Título: Rol e institución del JWT no se revalidan
Severidad: ALTO
Categoría: Security issue

Estado: CONFIRMADO

Ubicación:
archivo: `r.e.c-backend/src/auth/jwt.strategy.ts`
línea: 37-46
módulo: auth

Problema: `validate` confía en `role` e `institutionId` del token. No lee User. Un rol bajado o una institución desactivada siguen válidos hasta expirar el access (el guard sí mira `activa` con cache 30 s; el rol no).

Evidencia: strategy citada. Tenant guard consulta `activa`, no el rol en DB.

Impacto: Ventana de privilegio stale.

Solución recomendada: Access corto (15 min ya sugerido en el example) y, en cambios de rol, revocar sesiones. Opcional: version de token en User.

Prioridad: Alta
Esfuerzo estimado: MEDIO

### SEC-06

ID: SEC-06
Título: Token de WebSocket aceptado por query string
Severidad: MEDIO
Categoría: Security issue

Estado: CONFIRMADO

Ubicación:
archivo: `r.e.c-backend/src/gateway/app.gateway.ts`
línea: 79-83
módulo: gateway

Problema: El handshake acepta `query.token`. Eso suele quedar en logs de proxy.

Evidencia: `getToken`.

Solución recomendada: Solo `auth.token`, header o cookie httpOnly. La cookie ya está soportada.

Prioridad: Media
Esfuerzo estimado: BAJO

### SEC-07

ID: SEC-07
Título: CSP permite unsafe-inline
Severidad: MEDIO
Categoría: Security issue

Estado: CONFIRMADO

Ubicación:
archivo: `r.e.c-frontend/proxy.ts`
módulo: frontend

Problema: `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`. El comentario dice que un nonce estricto rompe Next. Baja la barrera de XSS.

Solución recomendada: Nonce real cuando la versión de Next lo permita. Mientras, no renderizar HTML de usuario.

Prioridad: Media
Esfuerzo estimado: MEDIO

### OPS-02

ID: OPS-02
Título: Sin branch protection
Severidad: ALTO
Categoría: DevOps

Estado: CONFIRMADO

Ubicación: repo rulesets API, lista vacía

Problema: Push directo a `main` posible. CI no es required check.

Solución recomendada: Ruleset en main: PR, checks de CI, sin force-push.

Prioridad: Alta
Esfuerzo estimado: BAJO

### OPS-03

ID: OPS-03
Título: Uploads locales y migrate en el arranque
Severidad: ALTO
Categoría: Scalability / DevOps

Estado: CONFIRMADO

Ubicación: `materials.service.ts` `uploadsRoot`; `r.e.c-backend/Dockerfile` CMD

Problema: Archivos en `process.cwd()/uploads`. Segunda réplica no los ve. `migrate deploy` en cada boot puede competir si hay varias réplicas.

Solución recomendada: Volumen o S3-compatible. Migraciones en un job, no en el CMD de cada réplica.

Prioridad: Alta antes de escalar
Esfuerzo estimado: MEDIO

### OPS-04

ID: OPS-04
Título: CI no construye ni corre e2e
Severidad: MEDIO
Categoría: Testing

Estado: CONFIRMADO

Ubicación: `.github/workflows/ci.yml`

Problema: No hay `nest build` ni `next build` ni Playwright. El umbral de coverage se salta si falta el JSON.

Solución recomendada: Job de build. E2e contra la base del job. Fallar si no hay coverage summary.

Prioridad: Media
Esfuerzo estimado: MEDIO

### DB-01

ID: DB-01
Título: Activar período no es transaccional
Severidad: MEDIO
Categoría: Bug / integrity

Estado: CONFIRMADO en código. Race en vivo NO VERIFICADO.

Ubicación: `academic.service.ts` `activateAcademicPeriod` (~1292-1307)

Problema: updateMany que cierra activos y update del elegido, sin `$transaction`. Dos secretarías pueden dejar dos ACTIVE o cerrar de más.

Solución recomendada: Transacción + constraint parcial unique de un ACTIVE por institución.

Prioridad: Media
Esfuerzo estimado: BAJO

### DB-02

ID: DB-02
Título: Email y código únicos globales
Severidad: MEDIO
Categoría: Architecture smell

Estado: CONFIRMADO

Ubicación: `schema.prisma` model User (`email @unique`, `codigo @unique`)

Problema: Un docente no puede existir en dos colegios con el mismo correo. Filtración indirecta de existencia cross-tenant en altas.

Solución recomendada: `@@unique([institutionId, email])` si el producto es multi-colegio de verdad.

Prioridad: Media
Esfuerzo estimado: MEDIO

### ARCH-01

ID: ARCH-01
Título: God services
Severidad: MEDIO
Categoría: Technical debt

Estado: CONFIRMADO

Ubicación: performance y academic services

Problema: Miles de líneas, difícil de testear por comportamiento y de revisar IDOR.

Solución recomendada: Partir por caso de uso (grades, offerings, periods).

Prioridad: Media
Esfuerzo estimado: ALTO

### FE-01

ID: FE-01
Título: JWT_SECRET duplicado en Next
Severidad: MEDIO
Categoría: Architecture smell

Estado: CONFIRMADO

Ubicación: `app/api/auth/session/route.ts`

Problema: El frontend verifica el access token. El secreto tiene que vivir en dos procesos. Ya se filtró en `.env.local`.

Solución recomendada: Sesión opaca que solo el backend firma, o cookie seteada por el API. Next no debería tener el secreto de firma.

Prioridad: Media (después de rotar)
Esfuerzo estimado: MEDIO

### MOB-01

ID: MOB-01
Título: Móvil fuera de banda y sin tests
Severidad: MEDIO
Categoría: Product gap

Estado: CONFIRMADO estructura. Paridad funcional NO VERIFICADA.

Ubicación: `teka369/recedu-mobile`

Problema: Otro repo, otro SHA, `.env.local` trackeado, sin tests en scripts.

Solución recomendada: Auditoría dedicada del móvil. SecureStore para tokens (dependencia presente; uso no leído línea a línea).

Prioridad: Media
Esfuerzo estimado: MEDIO

### QA-01

ID: QA-01
Título: Claim 554/554 no reejecutado
Severidad: BAJO
Categoría: Testing

Estado: NO VERIFICADO

Ubicación: mensaje del commit

Problema: No se corrió jest en esta auditoría (sin instalar node_modules; no se usó la base real).

Solución recomendada: Correr `npm run test:unit` en CI ya existente y guardar el número en el snapshot siguiente.

Prioridad: Baja
Esfuerzo estimado: BAJO

### INF-01

ID: INF-01
Título: Health público revela environment
Severidad: BAJO
Categoría: Info leak

Estado: CONFIRMADO

Ubicación: `health.controller.ts` y `app.controller.ts` `/health`

Problema: Status, uptime, `NODE_ENV` sin auth. Útil para probes; no pone secretos.

Solución recomendada: Dejar `/health` mínimo. Métricas ya están con API key.

Prioridad: Baja
Esfuerzo estimado: BAJO

### INF-02

ID: INF-02
Título: Artefactos de test y build en git
Severidad: BAJO
Categoría: Technical debt

Estado: CONFIRMADO

Ubicación: `r.e.c-frontend/playwright-report`, `test-results`, `tsconfig.tsbuildinfo`, archivo `let` vacío

Solución recomendada: gitignore y `git rm --cached`.

Prioridad: Baja
Esfuerzo estimado: BAJO

## 23. Matriz de riesgo

| ID | Problema | Severidad | Probabilidad | Impacto | Estado |
| --- | --- | --- | --- | --- | --- |
| SEC-01 | Secretos en repo público | CRÍTICO | Alta | Alto | CONFIRMADO |
| SEC-02 | Takeover por código | CRÍTICO | Alta si el código se conoce | Alto | CONFIRMADO |
| SEC-03 | Archivos académicos en git | CRÍTICO | Alta (ya están) | Alto | CONFIRMADO |
| OPS-01 | TRUNCATE contra secret de CI | CRÍTICO | Media | Alto | CONFIRMADO cableado |
| SEC-04 | IDOR si el service no filtra | ALTO | Media | Alto | CONFIRMADO límite |
| SEC-05 | Rol stale en JWT | ALTO | Media | Medio | CONFIRMADO |
| OPS-02 | Sin branch protection | ALTO | Alta | Medio | CONFIRMADO |
| OPS-03 | Uploads locales / migrate on boot | ALTO | Alta al escalar | Alto | CONFIRMADO |
| DB-02 | Unique email global | MEDIO | Media | Medio | CONFIRMADO |
| DB-01 | Período activo sin transacción | MEDIO | Baja | Medio | CONFIRMADO código |
| FE-01 | JWT secret en Next | MEDIO | Alta (ya filtrado) | Alto | CONFIRMADO |
| SEC-06 | WS token en query | MEDIO | Media | Medio | CONFIRMADO |
| SEC-07 | CSP unsafe-inline | MEDIO | Media | Medio | CONFIRMADO |
| OPS-04 | CI sin build/e2e | MEDIO | Alta | Medio | CONFIRMADO |
| ARCH-01 | God services | MEDIO | Alta | Medio | CONFIRMADO |
| MOB-01 | Móvil desacoplado | MEDIO | Alta | Medio | CONFIRMADO |
| QA-01 | Tests no reejecutados | BAJO | n/a | Bajo | NO VERIFICADO |
| INF-01 | Health verboso | BAJO | Alta | Bajo | CONFIRMADO |
| INF-02 | Artefactos trackeados | BAJO | Alta | Bajo | CONFIRMADO |

## 24. Matriz de cobertura

| Área | Revisada | Evidencia | Riesgos |
| --- | --- | --- | --- |
| Frontend | Sí | pages, proxy, session route, env | FE-01, SEC-07 |
| Backend | Sí | modules, guards, auth, materials, users, academic | SEC-02, SEC-04, SEC-05 |
| Database | Sí | schema, migraciones, triggers, cleanup | DB-01, DB-02, OPS-01 |
| Security | Sí | auth, tenant guard, cookies, uploads path | SEC-01..07 |
| Mobile | Parcial | árbol y package.json del otro repo | MOB-01, uso de SecureStore NO VERIFICADO |
| DevOps | Sí | CI, Docker, compose, rulesets | OPS-01..04 |
| Testing | Parcial | inventario; no ejecución | QA-01 |
| Performance | Parcial | lectura estática | sin números |
| Runtime prod | No | no se llamó recedu.co | BLOQUEADO a propósito |
| Historial git | No | shallow | BLOQUEADO |
| npm audit | No | no instaladas deps | BLOQUEADO |
| Coolify vivo | No | no hay acceso al servidor | BLOQUEADO |

## 25. Score

| Área | Nota | Por qué |
| --- | --- | --- |
| Seguridad | 4/10 | Buenos controles, anulados por secretos y reset por código |
| Arquitectura | 7/10 | Módulos claros, tenant pensado, services enormes |
| Backend | 7/10 | Nest sólido, validación estricta |
| Frontend | 6/10 | Sesión en cookie bien; secreto duplicado |
| Mobile | 4/10 | Existe aparte, no auditado a fondo, sin tests |
| Base de datos | 7/10 | Migraciones y triggers; ids enteros y unique global |
| Performance | 5/10 | Sin medición |
| Escalabilidad | 4/10 | Disco local, una réplica, sin workers |
| Testing | 6/10 | Mucha spec unitaria; CI incompleto; no reejecutado |
| DevOps | 4/10 | Compose y backup script; CI peligroso; sin protection |
| UX | 6/10 | Flujos presentes; enumeración en recuperación |
| Mantenibilidad | 5/10 | Hotspots grandes, artefactos en git |
| Calidad general | 5/10 | Base seria, no vendible como SaaS cerrado hoy |

Un 5 no es “mediocre en todo”. Auth y tenant están por encima de un CRUD típico. Los críticos pesan más que el promedio.

## 26. Prioridades

1. Rotar secretos y sacarlos del historial.
2. Cerrar recover-by-code.
3. Borrar uploads del git.
4. Arreglar CI para que no pueda truncar prod.
5. Branch protection.
6. Object storage y migrate job.
7. Prisma extension de tenant + tests IDOR.
8. Partir god services.

## 27. Roadmap

Semana 1: SEC-01, SEC-02, SEC-03, OPS-01, OPS-02.
Semana 2: SEC-04 tests de IDOR en materials, grades, recovery, users. Transacción de período.
Mes 1: uploads a object storage, quitar secreto del Next, e2e en CI, unique por institución si el producto lo pide.
Después: partir services, pooler, workers de correo/push.

## 28. Antes de producción

SEC-01, SEC-02, SEC-03, OPS-01. Sin eso, no.

## 29. Aceptable temporalmente

CSP unsafe-inline si no hay HTML de usuario. Health verboso. God services. Móvil en beta si no guarda tokens en AsyncStorage (NO VERIFICADO). Unique email global si solo hay un colegio piloto.

## 30. No verificable aquí

Producción viva, valor del secret de Actions, suite 554, CVE de dependencias, restore de backups, TLS real, contenido de los PDF, historial anterior al HEAD, código móvil línea a línea.

## Comandos

No se ejecutó lint, typecheck, test ni build en esta pasada: instalar el monorepo y apuntar a una base habría mezclado esta auditoría con el riesgo OPS-01. Queda explícito.

```
COMMAND: npm run test:unit (no ejecutado)
OUTPUT: n/a
ROOT CAUSE: sin node_modules; no se usó DATABASE_URL del repo
IMPACT: el “554/554” del commit queda NO VERIFICADO
```

## Cierre del loop

Seguridad, auth, autorización, multi-tenant, APIs, DB, Prisma, frontend, mobile (parcial), performance (estática), escalabilidad, Docker, Coolify (compose, no el servidor), CI, dependencias (manifiesto, no audit), tests (inventario), errores, edge de tenant, inconsistencias, TODO, código muerto superficial, docs vs código, hotspots, fugas entre tenants, datos sensibles, riesgos de prod: revisados o marcados bloqueados.
