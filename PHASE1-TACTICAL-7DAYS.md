# PHASE 1 EJECUTABLE - 7 DIAS A PRODUCCION SEGURA

Objetivo: blindaje minimo de produccion con foco exclusivo en tenant boundaries, RecoveryService, PerformanceService y autorizacion.

Alcance: Tier 1 critico solamente.

Duracion total: 7 dias, 40 horas (24 horas ejecucion + 16 horas buffer).

Meta de salida:
- Cobertura global >= 25%.
- Cobertura 100% en archivos tocados por la fase.
- 0 fugas cross-institution en pruebas.

## Lista concreta de tareas ejecutables

| ID | Tarea | Horas | Resultado verificable (criterio de aceptacion) |
|---|---|---:|---|
| T1 | Preparar base de tests (mocks Prisma + builders actor/tenant) | 4h | Suite unitaria corre sin errores de mock en recovery/performance/academic/communication |
| T2 | Levantar DB de prueba y migraciones | 2h | Migraciones aplicadas en entorno test y limpieza automatica por suite |
| T3 | Implementar primeros 6 tests de denegacion (muralla externa) | 4h | 6 tests verdes, todos con ForbiddenException o 403 esperados |
| T4 | Implementar 3 happy paths criticos e idempotencia | 3h | 3 tests verdes, idempotencia validada con conteo = 1 |
| T5 | Implementar test de integridad de cascade delete | 2h | Eliminacion en 3 niveles validada sin huerfanos |
| T6 | Implementar test de tenant leakage query inspection | 2h | Falla cuando falta institutionId y pasa cuando el filtro existe |
| T7 | Endurecer gates de cobertura y calidad en CI local | 3h | Pipeline local falla si global < 25% o touched files < 100% |
| T8 | Ejecucion final, estabilizacion, reporte go/no-go | 4h | 11 tests verdes, 0 flaky, runtime estable |

## Orden exacto de implementacion - primeros 10 tests

1. Guard denies cross-institution access (guard level)
Duracion: 40 min
Criterio: request con token tenant A hacia recurso tenant B responde 403.

2. Recovery delete denial (wrong institution)
Duracion: 30 min
Criterio: deleteRequest lanza ForbiddenException y registro permanece en DB.

3. Recovery status update denial
Duracion: 25 min
Criterio: updateRequestStatus cross-tenant lanza ForbiddenException.

4. Communication deleteFeedback denial
Duracion: 25 min
Criterio: deleteFeedback cross-tenant retorna 403 o ForbiddenException.

5. Performance grade tampering denial
Duracion: 30 min
Criterio: updateGrade cross-tenant bloqueado y nota no cambia.

6. Academic enrollment boundary denial
Duracion: 30 min
Criterio: assignStudentToGroup cross-tenant bloqueado y no crea StudentGroup.

7. Recovery happy path
Duracion: 25 min
Criterio: delete/status update en mismo tenant completa sin error y persiste cambio esperado.

8. Performance attendance idempotency
Duracion: 35 min
Criterio: dos marcaciones mismo dia generan un solo registro (count = 1).

9. Academic valid enrollment happy path
Duracion: 25 min
Criterio: asignacion valida en mismo tenant se crea una vez (upsert idempotente).

10. Integration: cascade delete integrity
Duracion: 35 min
Criterio: eliminar RecoveryRequest elimina Activities y Messages asociados.

## Test adicional invisible pero critico

11. Tenant leakage query inspection
Duracion: 45 min
Criterio:
- Caso A: una query sin institutionId debe fallar el test (detector activo).
- Caso B: la misma query con institutionId debe pasar.

Implementacion recomendada:
- Spy al metodo Prisma invocado (findMany/findFirst/updateMany segun servicio).
- Assert estricto de presencia de where.institutionId en cada llamada sensible.
- Este test debe correr en recovery y performance como minimo.

## Secuencia por dia (7 dias)

Dia 1 (6h)
- T1 + T2.

Dia 2 (4h)
- Tests 1, 2, 3.

Dia 3 (4h)
- Tests 4, 5, 6.

Dia 4 (3h)
- Tests 7, 8.

Dia 5 (3h)
- Tests 9, 10.

Dia 6 (2h)
- Test 11 (tenant leakage inspection) + ajustes.

Dia 7 (2h)
- T7 + T8, decision final go/no-go.

## Gates de aceptacion (no negociables)

Gate A - Seguridad de frontera
- Los 6 tests de denegacion deben pasar.
- Ningun test permite acceso cross-institution.

Gate B - Cobertura
- Cobertura global >= 25%.
- Cobertura = 100% en archivos tocados en esta fase.

Gate C - Integridad
- Idempotencia de asistencia validada.
- Cascade delete validado sin huerfanos.

Gate D - Estabilidad
- 11 tests verdes.
- 0 flaky.
- Runtime consistente entre corridas.

Si cualquier gate falla: NO-GO.

## Fuera de alcance en esta fase

- Tier 2 y Tier 3.
- E2E Playwright completo.
- Carga (k6).

Enfoque: impacto maximo de seguridad, no volumen.

