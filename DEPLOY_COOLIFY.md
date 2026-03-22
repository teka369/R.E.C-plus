# Despliegue en VPS con Coolify

Esta guía deja el monorepo listo para producción usando:
- frontend Next.js: `r.e.c-frontend`
- backend NestJS + Prisma: `r.e.c-backend`
- base de datos PostgreSQL

## 1) Prerrequisitos en VPS

- VPS con Docker funcional
- Coolify instalado y con acceso web
- Dominio apuntando a la IP del VPS
  - `app.tu-dominio.com` para frontend
  - `api.tu-dominio.com` para backend

## 2) Opción recomendada: desplegar como Compose Stack

1. En Coolify: **New Resource** -> **Docker Compose**.
2. Conecta tu repositorio y selecciona el archivo `docker-compose.coolify.yml`.
3. Carga variables de entorno usando `.env.coolify.example` como plantilla.
4. Asigna dominios:
   - Servicio `frontend` -> `app.tu-dominio.com`
   - Servicio `backend` -> `api.tu-dominio.com`
5. Habilita HTTPS/Let's Encrypt desde Coolify.
6. Deploy.

## 3) Variables críticas

Debes configurar al menos:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGIN` (ej. `https://app.tu-dominio.com`)
- `EMBED_ORIGINS` (normalmente igual a frontend)
- `NEXT_PUBLIC_API_BASE_URL` (ej. `https://api.tu-dominio.com`)

## 4) Verificación post deploy

- Frontend: `https://app.tu-dominio.com`
- Backend health: `https://api.tu-dominio.com/health`
- Login funcional desde frontend
- Carga/descarga de materiales (volumen persistente `/app/uploads`)

## 5) Notas operativas

- El backend ejecuta `prisma migrate deploy` al iniciar.
- Si actualizas el esquema Prisma, asegúrate de subir migraciones a `prisma/migrations`.
- El frontend usa `NEXT_PUBLIC_API_BASE_URL` en build; al cambiar dominio debes redeploy del frontend.

## 6) Plan B en Coolify (servicios separados)

Si prefieres no usar Compose:

1. Crear PostgreSQL administrado en Coolify.
2. Crear app backend desde `r.e.c-backend/Dockerfile`.
3. Crear app frontend desde `r.e.c-frontend/Dockerfile`.
4. Configurar variables equivalentes en cada servicio.

## 7) Despliegue automatico desde GitHub Actions

El workflow [.github/workflows/quality-gate.yml](.github/workflows/quality-gate.yml) ya incluye un job `deploy` que se ejecuta en `main` solo cuando todos los gates pasan.

Configura estos secretos en GitHub (Settings -> Secrets and variables -> Actions):

- `COOLIFY_DEPLOY_WEBHOOK_URL` (obligatorio): URL del webhook de deploy de Coolify para tu stack/proyecto.
- `COOLIFY_DEPLOY_WEBHOOK_TOKEN` (opcional): token Bearer si tu webhook esta protegido.

Comportamiento del job:

- Falla inmediatamente si falta `COOLIFY_DEPLOY_WEBHOOK_URL`.
- Dispara un `POST` al webhook con metadatos de `ref`, `sha` y repositorio.
- Falla si Coolify responde fuera del rango HTTP 2xx.
