# Resultados de QA

## CI #50 — último SHA con builds todavía fuera del workflow

- Run: `44836699619`
- SHA: `57b0d9180243308b3b2928db580cc02ed34a7d2c`
- Rama: `work/audit-recovery`
- Conclusión: `success`
- Entorno: GitHub Actions, Node 20, PostgreSQL 15 y Redis 7 en integración
- Unitarias: 581
- Integración: 133
- Cobertura de líneas: 69,23 %
- Builds de backend y frontend: no formaban parte de ese workflow
- E2E: no ejecutado

## CI #48 y #49

- #48, SHA `63a1ed4`: integración `success`
- #49, SHA `8dbb7e7`: `success` (solo documentación)

## Local, 20 de noviembre de 2026

- `npm audit` de frontend y backend, Node 26.13.1. Resultado en [dependencias](../quality/dependencias.md).
- Los builds de este ciclo se validan en el CI que usa Node 26. No se declaran aprobados hasta que ese job termine en `success`.

## Producción

NO-GO hasta rotar credenciales históricas, purgar el historial si se autoriza, y montar un disco persistente para `uploads/`.
