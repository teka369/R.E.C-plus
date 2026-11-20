# Pruebas

Entorno de referencia del backend: Node 20 en GitHub Actions, PostgreSQL 15 y Redis 7 solo para integración.

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

`npm run test:e2e` exige la aplicación levantada y cuentas de prueba. No se declara ejecutado si no se corrió.

## CI

`.github/workflows/ci.yml` corre en `work/audit-recovery` y en `main`. Comprueba secretos rastreados, lint, unitarios del backend e integración contra Postgres y Redis temporales. No despliega.

El último resultado aprobado hay que leerlo en GitHub para el SHA que se va a entregar, no en un documento antiguo.
