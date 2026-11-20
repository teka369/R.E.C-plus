# Desarrollo local

## Backend

1. Copia `r.e.c-backend/.env.example` a `r.e.c-backend/.env`.
2. Crea la base `rec_db` y, si vas a correr integración, `recedu_test`.
3. `npm ci`
4. `npx prisma generate`
5. `npx prisma migrate deploy`
6. `npm run start:dev`

`JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ISSUER` y `JWT_AUDIENCE` son obligatorios. El secreto debe tener al menos 32 caracteres y el de refresh debe ser distinto.

## Frontend

1. Copia `r.e.c-frontend/.env.example` a `r.e.c-frontend/.env.local`.
2. `JWT_SECRET` debe ser el mismo que en el backend.
3. `npm ci`
4. `npm run dev`

## Datos de desarrollo

`npm run bootstrap:dev-access` y `npm run saas:superadmin`, dentro de `r.e.c-backend`, crean acceso local. No los uses contra una base real.
