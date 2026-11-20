# Resultados de QA

- Secret guard, lint y unitarios: success en CI #46 (`44828701825`, SHA `d596849`).
- Frontend lint local previo: 0 errors, 2 warnings.
- Integration: no aprobada. CI #46 terminó el job Integration Tests en `failure`: 6 suites fallidas, 4 pass, 60 failed / 73 passed / 133, 121s. Jest salió solo.
- Causa del 429: `AuthService.throwLoginTooManyAttempts`. Redis guardaba 5 fallos por IP y las suites siguientes heredaban el bloqueo. El límite de producción sigue en 5.
- Recovery tenant boundary: 401 porque el JWT de prueba no llevaba issuer/audience. No es un fallo del control de tenant.
- No declarar integración en success hasta que GitHub lo reporte en el SHA correspondiente.
