# R.E.C Frontend (Next.js)

## Requisitos

- Node.js 20+

## Variables de entorno

Copia `.env.example` a `.env.local`:

- `NEXT_PUBLIC_API_BASE_URL` (URL pública del backend)
- `NEXT_PUBLIC_EMAIL_DOMAIN` (opcional)

## Desarrollo local

```bash
npm install
npm run dev
```

Frontend en `http://localhost:3000`.

## Build de producción

```bash
npm run build
npm run start
```

## E2E con Playwright

```bash
npm run test:e2e
```

El proyecto incluye pruebas de login, protección por rol y redirecciones de acceso no autorizado.

## Producción en Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.tu-dominio.com \
  --build-arg NEXT_PUBLIC_EMAIL_DOMAIN=iejavieralondonobarriosevilla.edu.co \
  -t rec-frontend .

docker run -p 3000:3000 rec-frontend
```

## Notas de despliegue

- `NEXT_PUBLIC_API_BASE_URL` se inyecta en build. Si cambia el dominio del backend, hay que redeploy del frontend.
- Este proyecto está preparado para ejecutarse en Coolify usando el stack en la raíz del repo (`docker-compose.coolify.yml`).
