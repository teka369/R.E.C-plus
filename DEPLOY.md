# Deploy: Vercel + Render + Neon

No hay VPS. El frontend vive en Vercel, el API Nest en Render y Postgres en Neon.
Los secretos se generan en runtime y se inyectan por API. No se commitean.

## Automatizado

Exporta los tokens en la terminal (no en un archivo del repo) y corre:

```bash
npm run deploy:all -- --dry-run
npm run deploy:all
```

En Windows el `--` es obligatorio para que npm pase los flags.

Flags: `--dry-run`, `--skip-neon`, `--skip-render`, `--skip-vercel`, `--rotate-secrets`.

Orden real de `deploy:all`:

1. Genera `JWT_SECRET`, `JWT_REFRESH_SECRET` e `INTERNAL_API_KEY` (o reutiliza `REC_SECRETS_FILE`).
2. Crea o reutiliza el proyecto Neon y obtiene URL pooled + directa.
3. Crea o actualiza el servicio Render, inyecta variables y despliega.
4. Espera `GET /health` 200.
5. Crea o actualiza el proyecto Vercel (`rootDirectory=r.e.c-frontend`) e inyecta la URL de Render y el mismo `JWT_SECRET`. No define `SESSION_COOKIE_DOMAIN`.
6. Actualiza `CORS_ORIGIN`, `EMBED_ORIGINS` y `FRONTEND_URL` en Render y redeploy.

Piezas sueltas: `npm run deploy:secrets`, `deploy:neon`, `deploy:render`, `deploy:vercel`.
En bash: `bash scripts/deploy/deploy-all.sh --dry-run`.

Variables que debes exportar antes del run real:

| Variable | Para qué |
|---|---|
| `NEON_API_KEY` | Crear/leer el proyecto. Si ya exportas `DATABASE_URL` y `DATABASE_DIRECT_URL`, Neon no se vuelve a crear |
| `RENDER_API_KEY` | Crear servicio, env vars y deploys |
| `RENDER_OWNER_ID` | Opcional. Si falta, el script lista owners |
| `RENDER_BRANCH` | Opcional. Por defecto la rama git actual |
| `VERCEL_TOKEN` | Proyecto, env y deployment |
| `VERCEL_ORG_ID` | Opcional, si la cuenta es un team |
| `VERCEL_PROJECT_ID` | Opcional. Si falta, crea `rec-frontend` |
| `RESEND_API_KEY` | Opcional. Solo se inyecta si está en el entorno |

El repo de GitHub tiene que estar conectado en Vercel y Render. El script no puede autorizar OAuth por ti.

Los scripts viejos de PM2 quedaron como `deploy:pm2:*`. No uses esos para este stack.

## 1. Secretos

```bash
npm run secrets:generate
node scripts/generate-secrets.mjs --out /tmp/rec-secrets.env
```

`--out` rechaza cualquier ruta dentro del repo y intenta dejar el archivo en modo 600.

En Linux/macOS también vale `bash scripts/generate-secrets.sh`.
Imprime `JWT_SECRET`, `JWT_REFRESH_SECRET` e `INTERNAL_API_KEY`.
Cópialos a un gestor de contraseñas. No los guardes en un archivo del repo.

`JWT_SECRET` del backend y el de Vercel tienen que ser el mismo string.
`JWT_REFRESH_SECRET` tiene que ser distinto y de al menos 32 caracteres.

## 2. Neon

1. Crea un proyecto en [Neon](https://neon.tech). Misma región que Render si puedes.
2. Copia las dos connection strings:
   - **Pooled** (host con `-pooler`) → `DATABASE_URL`
   - **Direct** (host sin `-pooler`) → `DATABASE_DIRECT_URL`
3. Ambas deben llevar `sslmode=require`.
4. En la pooled añade `&pgbouncer=true&connect_timeout=15` si Neon no lo puso ya.
5. No uses la URL pooled para migraciones. Prisma `migrate deploy` usa `DATABASE_DIRECT_URL`.

Ejemplo de forma, no de valor:

```text
DATABASE_URL=postgresql://USER:CHANGE_ME@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15
DATABASE_DIRECT_URL=postgresql://USER:CHANGE_ME@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

## 3. Render (backend)

1. New → Blueprint, o New → Web Service, y conecta este repo.
2. Si usas el blueprint, Render lee `render.yaml`. Los secretos quedan vacíos (`sync: false`): rellénalos en Environment.
3. Si lo creas a mano:
   - Root Directory: `r.e.c-backend`
   - Runtime: Node
   - Build Command: `npm ci --include=dev && npx prisma generate && npm run build`
   - Start Command: `npm run start:render`  
     Eso es `prisma migrate deploy && node dist/main.js`.
   - Health Check Path: `/health`
4. Variables obligatorias:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `DATABASE_URL` | URL pooled de Neon |
| `DATABASE_DIRECT_URL` | URL directa de Neon |
| `JWT_SECRET` | salida del generador |
| `JWT_REFRESH_SECRET` | otra salida, distinta |
| `JWT_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `30d` |
| `JWT_ISSUER` | `recedu` |
| `JWT_AUDIENCE` | `recedu-app` |
| `CORS_ORIGIN` | `https://TU_APP.vercel.app` (sin barra final; varias separadas por coma) |
| `EMBED_ORIGINS` | el mismo origen, o varios separados por espacio |
| `FRONTEND_URL` | `https://TU_APP.vercel.app` |
| `INTERNAL_API_KEY` | salida del generador |
| `RESEND_API_KEY` | clave de Resend, si vas a enviar correos |
| `RESEND_FROM` | remitente verificado en Resend |

Render inyecta `PORT`. No lo fijes a 4000.
`REDIS_URL` es opcional. Sin Redis el rate limit vive en memoria y se reinicia con el proceso.

El primer deploy del API puede hacerse antes de conocer la URL de Vercel. Cuando Vercel te dé el dominio, actualiza `CORS_ORIGIN`, `EMBED_ORIGINS` y `FRONTEND_URL` y redeploy.

Comprueba: `https://TU_SERVICIO.onrender.com/health` debe responder HTTP 200.
Si Neon no responde, el cuerpo dice `db: disconnected`, pero el status sigue siendo 200 para no tumbar el health check de Render.

## 4. Vercel (frontend)

1. Importa el mismo repo.
2. Root Directory: `r.e.c-frontend`
3. Framework: Next.js. Build y start los pone Vercel. No hace falta `output: "standalone"`.
4. Variables:

| Variable | Dónde | Valor |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | pública | `https://TU_SERVICIO.onrender.com` (Socket.IO) |
| `INTERNAL_API_URL` | servidor | la misma URL de Render |
| `JWT_SECRET` | servidor | el mismo que en Render |
| `NEXT_PUBLIC_SITE_URL` | pública | `https://TU_APP.vercel.app` |
| `NEXT_PUBLIC_EMAIL_DOMAIN` | pública | dominio de correo de la institución |
| `TRUST_PROXY_HEADERS` | servidor | `1` |

No definas `SESSION_COOKIE_DOMAIN`. La cookie `rec_token` es httpOnly en el dominio de Vercel.
El browser llama a `/api/rec` (mismo origen). Next reenvía a Render con `Authorization: Bearer`.
Socket.IO sí sale del browser hacia Render, con el token que pide a `/api/auth/session?socket=1`, no con la cookie cruzada.

Después del primer deploy de Vercel, vuelve a Render y pon esa URL en `CORS_ORIGIN`, `EMBED_ORIGINS` y `FRONTEND_URL`.

## 5. Orden

1. Neon: crear proyecto y copiar las dos URLs.
2. Generar secretos en local.
3. Render: conectar repo, variables, deploy. Esperar `/health` 200.
4. Vercel: conectar repo, root `r.e.c-frontend`, variables, deploy.
5. Actualizar CORS y `FRONTEND_URL` en Render con la URL real de Vercel. Redeploy del API.
6. Probar login en el dominio de Vercel.

## 6. Rotar secretos

1. Vuelve a ejecutar `node scripts/generate-secrets.mjs`.
2. Pega el nuevo `JWT_SECRET` en Render y en Vercel al mismo tiempo. Redeploy de ambos.
3. Pega el nuevo `JWT_REFRESH_SECRET` solo en Render. Las sesiones de refresh anteriores dejan de valer.
4. Pega el nuevo `INTERNAL_API_KEY` solo en Render.
5. Si la URL de Neon cambió, actualiza `DATABASE_URL` y `DATABASE_DIRECT_URL` en Render y redeploy.
6. No hagas commit de esos valores. El CI (`scripts/check-tracked-secrets.mjs`) falla si un `.env` real vuelve al índice.

Los secretos que alguna vez estuvieron en `main` siguen en el historial público. Rótalos aunque esta rama ya no los trackee. Purgar el historial es un paso aparte y no está hecho aquí.
