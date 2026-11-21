# Pruebas

Entorno de referencia: Node.js 26. La integración y el E2E usan PostgreSQL 15 local y Redis 7. No apuntan a una base remota.

## Backend

```bash
cd r.e.c-backend
npm run lint
npm run test:unit
npm run test:cov
npm run build
npx prisma validate
```

Integración, con `DATABASE_URL` apuntando a una base de prueba vacía (en CI, `recedu_test`):

```bash
npx prisma migrate deploy
npm run test:integration
```

No uses `--forceExit`. Si Jest no termina, hay un handle abierto.

## E2E desechable

Hace falta PostgreSQL en loopback, base `recedu_e2e`, y `E2E_DATABASE=1`. El guardia `test/e2e/assert-e2e-database.ts` aborta si falta el flag, si el host no es loopback, si el nombre no es `recedu_e2e`, o si la URL menciona un proveedor remoto.

```bash
export E2E_DATABASE=1
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/recedu_e2e?schema=public
export DATABASE_DIRECT_URL="$DATABASE_URL"
export JWT_SECRET=ci-jwt-secret-at-least-32-characters-long
export JWT_REFRESH_SECRET=ci-refresh-secret-at-least-32-chars
export JWT_ISSUER=recedu-ci
export JWT_AUDIENCE=recedu-ci
bash scripts/run-disposable-e2e.sh
```

Ese script aplica migraciones, corre el E2E de Nest, siembra los usuarios y levanta el backend en `127.0.0.1:4000` antes de Playwright. Chromium debe estar instalado (`npx playwright install chromium` en `r.e.c-frontend`).

El seed (`npm run seed:e2e` en el backend) borra y recrea la institución `e2e-recedu`. Las contraseñas pasan por bcrypt con 12 rondas, el mismo coste que el alta de usuarios. El fixture queda en `r.e.c-backend/test/e2e/.generated/fixture.json` y no se versiona. No hay cuentas de ejemplo en el código de Playwright: si falta el fixture, el login real falla.

Usuarios sembrados, todos con la misma contraseña de prueba del fixture:

- `e2e.secretaria@e2e.test`
- `e2e.profesor@e2e.test` — materia `E2E Matematicas`, grupo `E2E Grupo A`
- `e2e.profesor2@e2e.test` — sin esa materia, para la asignación
- `e2e.estudiante@e2e.test` — reporte con nota `3.70` y observación `E2E-REPORTE-370`
- `e2e.nota@e2e.test` y `e2e.asistencia@e2e.test` — escrituras aisladas

## Qué es mock y qué es real

Mock, sin Nest: `password-recovery.spec.ts`, `auth-and-roles.spec.ts` y `p0-role-routing.spec.ts`. Cubren el formulario de recuperación y el enrutado del middleware. El correo real no se envía.

Reales, contra Nest y PostgreSQL: login, notas, asistencia, feedback, asignación de materia, reporte del estudiante y `r.e.c-backend/test/app.e2e-spec.ts`. Las de escritura recargan la página y comprueban el valor guardado. No aprueban si el control o el dato no está.

## CI

`.github/workflows/ci.yml` corre en `work/audit-recovery` y en `main` con Node.js 26. Comprueba secretos rastreados, lint, build, unitarios, `prisma validate`, integración contra `recedu_test`, y el job E2E contra `recedu_e2e`. Si Playwright falla, el job sube `playwright-report` y `test-results` durante 7 días. No despliega.

Hay dos guardias de secretos. El script bash y el de Node bloquean `.env` y uploads rastreados. El de Node, además, reutiliza `scripts/tracked-secret-rules.mjs` y revisa el contenido del índice. Se conservan los dos.

El resultado aprobado hay que leerlo en GitHub para el SHA que se va a entregar, no en un documento antiguo.
