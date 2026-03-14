# R.E.C Backend (NestJS + Prisma)

## Requisitos

- Node.js 20+
- PostgreSQL 16+

## Variables de entorno

Copia `.env.example` a `.env` y completa:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `EMBED_ORIGINS`

## Desarrollo local

```bash
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run start:dev
```

Backend en `http://localhost:4001` (según `PORT`).

## Producción en Docker

```bash
docker build -t rec-backend .
docker run --env-file .env -p 4001:4001 rec-backend
```

El contenedor ejecuta migraciones con `prisma migrate deploy` antes de iniciar.

## Healthcheck

- `GET /health`
- `GET /`

## Seguridad

- Contraseñas con bcrypt
- JWT obligatorio para endpoints protegidos
- CORS configurable por variable de entorno
