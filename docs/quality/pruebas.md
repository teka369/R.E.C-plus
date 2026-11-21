# Pruebas

Entorno de referencia: Node.js 26 en GitHub Actions. La integración usa PostgreSQL 15 y Redis 7.

## Backend

```bash
cd r.e.c-backend
npm run lint
npm run test:unit
npm run test:cov
npm run build
npx prisma validate
```

Integración, con `DATABASE_URL` apuntando a una base de prueba vacía:

```bash
npx prisma migrate deploy
npm run test:integration
```

No uses `--forceExit`. Si Jest no termina, hay un handle abierto.

## Frontend

```bash
cd r.e.c-frontend
npm run lint
npm run build
```

`npm run test:e2e` no está en el CI. Playwright arranca solo Next. El login real necesita Nest, PostgreSQL migrado y usuarios de prueba creados en esa base. No hay un seed que cree esas cuentas de forma determinista, así que un job de E2E fallaría o dependería de datos externos. Para ejecutarlo a mano: levanta Postgres, aplica migraciones, crea secretaria, profesor y estudiante, exporta `E2E_*_EMAIL` y `E2E_*_PASSWORD`, arranca el backend y corre `npm run test:e2e` en el frontend.

## CI

`.github/workflows/ci.yml` corre en `work/audit-recovery` y en `main` con Node.js 26. Comprueba secretos rastreados, lint, build de backend y frontend, unitarios, `prisma validate` y la integración contra Postgres y Redis temporales. No despliega.

El último resultado aprobado hay que leerlo en GitHub para el SHA que se va a entregar, no en un documento antiguo.
