# Resultados de QA

El resultado que vale es el de esta sección. Los apartados de abajo son historial de otros SHA.

## CI #52 — Node 26, builds y pruebas

- Run: [`44925628939`](https://github.com/teka369/R.E.C-plus/actions/runs/44925628939) (número 52)
- SHA evaluado: `600e4f2da7209531a76700da1ccf8939faf011d7`
- Rama: `work/audit-recovery`
- Conclusión del workflow: `success`
- Entorno: GitHub Actions `ubuntu-latest`, Node 26.13.1. Integración con PostgreSQL 15 y Redis 7 del job, no con una base externa.
- E2E Playwright: no ejecutado. Sigue fuera de CI.

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
- Esos comandos locales no sustituyen el CI #52.

## Producción

NO-GO. Falta rotar credenciales históricas, purgar el historial si se autoriza, y montar un disco persistente para `uploads/`.
