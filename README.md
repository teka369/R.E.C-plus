# Recedu

Sistema escolar para instituciones: usuarios, grupos, materiales, recuperación académica, horario y comunicación. El backend autoriza cada operación. El frontend no es la frontera de seguridad.

## Qué hay en el repositorio

- `r.e.c-backend`: API NestJS, Prisma y PostgreSQL.
- `r.e.c-frontend`: aplicación Next.js.
- `docs/`: cómo desarrollarlo, operarlo y qué servicios externos usa.

## Requisitos locales

- Node.js 26 (LTS activo). Node 20 está fuera de soporte.
- PostgreSQL 15 o superior.
- npm.

Redis, Resend, Firebase y Sentry son opcionales. Sin ellos el proceso arranca, pero el correo, el push y el reporte de errores no salen del servidor. El detalle está en [docs/integrations/servicios.md](docs/integrations/servicios.md).

## Desarrollo

```bash
cd r.e.c-backend
cp .env.example .env
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

```bash
cd r.e.c-frontend
cp .env.example .env.local
npm ci
npm run dev
```

El frontend queda en `http://localhost:3000` y el API en `http://localhost:4000`.

## Pruebas

```bash
cd r.e.c-backend
npm run lint
npm run test:unit
npm run build
```

La integración necesita PostgreSQL y Redis de prueba. En GitHub Actions los levanta el workflow. Localmente:

```bash
cd r.e.c-backend
npm run test:integration
```

```bash
cd r.e.c-frontend
npm run lint
npm run build
```

## Documentación

El índice está en [docs/README.md](docs/README.md).

El alojamiento previsto es un servidor administrado por un tercero. No hay despliegue automático a un proveedor concreto. La guía de instalación está en [docs/operations/servidor.md](docs/operations/servidor.md).
