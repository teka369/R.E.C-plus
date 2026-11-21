# Resultados de QA

El resultado que vale es el de esta sección. Los apartados de abajo son historial de otros SHA.

## CI #87 — SHA `c74c89e7496d331181c1d22d19f85bcc5f899604` (merge PR #2)

- Run: https://github.com/teka369/R.E.C-plus/actions/runs/44948619362 (número 87)
- SHA evaluado: `c74c89e7496d331181c1d22d19f85bcc5f899604`
- Conclusión del workflow: `success`
- Jobs: 7 exitosos.
- Unitarias: 592/592.
- Cobertura de líneas: 69,23 %.
- Integración: 133/133 (10 suites).
- E2E Nest: 4/4.
- Playwright: 36/36.

## CI #60 — Node 26, con E2E desechable

- Run: [`44932319423`](https://github.com/teka369/R.E.C-plus/actions/runs/44932319423) (número 60)
- SHA evaluado: `dfc8e4d5aaae834a19b19a06d9734d563a6c8605`
- Rama: `work/audit-recovery`
- Conclusión del workflow: `success`
- Entorno: GitHub Actions `ubuntu-latest`, Node 26.13.1. Postgres 15 y Redis 7 del job. La base de E2E es `recedu_e2e` en loopback, no una base externa.
- No hubo deploy, migración contra una base real, rotación de credenciales ni purga de historial.

| Job | Conclusión |
| --- | --- |
| Secret and upload guard (script Node y script bash) | `success` |
| Lint backend, `prisma validate` y `nest build` | `success` |
| Lint frontend y `next build` | `success` |
| Unit Tests | `success` |
| Integration Tests | `success` |
| E2E | `success` |

Cifras de este run, no de uno anterior:

- Unitarias: 586 passed / 586 (38 suites)
- Cobertura de líneas: 69,23 % (piso del workflow: 50 %)
- Integración: 133 passed / 133 (10 suites)
- E2E Nest contra `recedu_e2e`: 4 passed / 4
- Playwright: 36 passed / 36 (1,5 min). Recuperación de contraseña y la matriz de routing siguen mockeadas. Notas, asistencia, asignación, reporte y el E2E de Nest pegan al API y a Postgres.

No se corrió E2E en esta máquina: aquí no hay Node, Docker ni Postgres. La aprobación es el job de GitHub, no una corrida local.

## CI #52 — Node 26, sin E2E

- Run: [`44925628939`](https://github.com/teka369/R.E.C-plus/actions/runs/44925628939) (número 52)
- SHA evaluado: `600e4f2da7209531a76700da1ccf8939faf011d7`
- Rama: `work/audit-recovery`
- Conclusión del workflow: `success`
- Entorno: GitHub Actions `ubuntu-latest`, Node 26.13.1. Integración con PostgreSQL 15 y Redis 7 del job, no con una base externa.
- E2E Playwright: no ejecutado en ese workflow. No usar este SHA como aprobación de E2E.

| Job | Conclusión |
| --- | --- |
| Secret and upload guard (script Node y script bash) | `success` |
| Lint backend, `prisma validate` y `nest build` | `success` |
| Lint frontend y `next build` | `success` |
| Unit Tests | `success` |
| Integration Tests | `success` |

Cifras de esos jobs, no de una corrida anterior:

- Unitarias: 581 passed / 581 (37 suites)
- Cobertura de líneas: 69,23 % (piso del workflow: 50 %)
- Integración: 133 passed / 133 (10 suites, 163 s)

## CI #51 — mismo árbol de Node 26, integración rota

- Run: `44924264534`
- SHA: `a4c6618e5a6a82707fa8f78336522b443f8d7a81`
- Conclusión: `failure`
- Integración: 3 failed, 130 passed, 133 total. Los tres fueron `read ECONNRESET` en `security-fixes.integration-spec.ts`. Supertest cerraba el servidor que él mismo había abierto mientras había logins en paralelo.
- No usar este SHA como aprobación.

## CI #50 — Node 20, sin builds en el workflow

- Run: `44836699619`
- SHA: `57b0d9180243308b3b2928db580cc02ed34a7d2c`
- Conclusión: `success` en Node 20
- Unitarias 581 e integración 133 en ese runtime. Los builds no formaban parte de ese workflow.
- No equivale al CI #52.

## CI #48 y #49

- #48, SHA `63a1ed4`: integración `success`
- #49, SHA `8dbb7e7`: `success` (solo documentación)

## Local, 20 de noviembre de 2026

- `npm audit` de frontend y backend en Node 26.13.1. Clasificación en [dependencias](../quality/dependencias.md). Los fixes que exigen majors no se aplicaron.
- Esos comandos locales no sustituyen el CI #60.

## Producción

NO-GO. Falta rotar credenciales históricas, purgar el historial si se autoriza, y montar un disco persistente para `uploads/`.
