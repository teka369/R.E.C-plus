# Resultados de QA

- Backend unit: 558/558 passed.
- Backend build: OK.
- Backend lint: 0 warnings.
- Frontend build: OK.
- Frontend lint: 0 errors, 2 warnings.
- Secret guard: OK.
- Deploy dry-run: OK.
- Integration/E2E: no aprobados. CI #43 (`44823132036`, SHA `c060cb7`) canceló Integration Tests a los 20m 17s por timeout. Los tests sí terminaron: 9 suites fallidas, 1 pass, 120 failed / 13 passed / 133, 45.4s. Luego Jest no salió. El primer fallo fue `POST /auth/login` → 429 (límite 5 por IP). No declarar success hasta un job con conclusion `success`.