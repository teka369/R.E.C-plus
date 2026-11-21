# Deuda técnica — Recedu

Nota de recuperación. Si una cifra de aquí contradice [QA_RESULTS.md](QA_RESULTS.md), manda ese archivo.

## Confirmado

- God services: `performance.service.ts` (~60 KB), `academic.service.ts` (~55 KB).
- Un solo TODO relevante: umbrales de calificación aún no viven solo en `InstitutionGradingPolicy` (`performance.service.ts:1377`).
- IDs enteros autoincrement expuestos; `publicId` UUID existe pero las APIs siguen en ids enteros.
- JWT no se revalida contra DB (rol e institución viven en el token hasta expirar).
- Uploads en disco local (`r.e.c-backend/uploads/study-materials`): no escala a varias réplicas.
- Rate limit en memoria si Redis no responde.
- Socket.IO sin adapter Redis activo en todas las réplicas.
- Frontend sin unit tests; Playwright e2e no corre en CI.
- Dual deploy PM2 + Docker/Coolify legacy.
- Historial git con secretos previos (purgado no realizado).
- Vulnerabilidades npm: backend/frontend con advisories (frontend: 45 vulns, 2 critical) — ver `npm audit`.
- El runtime de CI es Node 26. El resultado vigente está en QA_RESULTS.md, no en esta nota.
- Puppeteer postinstall intenta descargar Chrome; bloquea `npm install` sin `PUPPETEER_SKIP_DOWNLOAD`.

## Potencial / riesgo

- Multi-tenant por columna: defensa razonable si todos los servicios filtran; no uniforme (materiales autorizan por asignación/grupo).
- Sin branch protection en `main` (no verificado vía API de rulesets en esta sesión; PR #1 abierto sin merge).
- Cookie de refresh fija 7 días en Next aunque refresh JWT sea más largo (inconsistencia de sesión).
- Observabilidad: Sentry opcional; sin alerting verificado.

## No verificado

- Runtime de `recedu.co` / `api.recedu.co`.
- Suite de integración en este documento: la evidencia posterior está en QA_RESULTS.md.
- `npm audit` aplicado con fixes.
- Coolify en servidor, backups restaurables.