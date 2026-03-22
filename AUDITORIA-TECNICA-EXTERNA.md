# 🔍 AUDITORÍA TÉCNICA EXTERNA - Recedu.co

**Fecha**: 21 de marzo de 2026  
**Auditor**: Senior QA Architect (Modo Externo)  
**Alcance**: Suite de tests, cobertura real, detección de vulnerabilidades  
**Conclusión**: 🔴 **FALSO SENTIDO DE SEGURIDAD** - Suite superficial que enmascara gaps críticos

---

## EJECUTIVO

| Métrica | Valor | Threshold | Estado |
|---------|-------|-----------|--------|
| **Cobertura global** | 6.23% | 80% | 🔴 CRÍTICO |
| **Tests unitarios** | 19/19 PASS | 100% | ✅ (pero superficiales) |
| **Módulos sin cobertura** | 8/12 | 0% | 🔴 CRÍTICO |
| **Cambios de seguridad sin tests** | 3 métodos | 0% | 🔴 CRÍTICO |
| **Detección de rupturas intencionadas** | 2/3 | 66% | 🟡 PARCIAL |
| **Tests de integración** | Structure only | N/A | 🟡 PODRÍA FUNCIONAR (DB no disponible) |
| **E2E Coverage** | 3 escenarios | 100% P0 flows | 🟡 MÍNIMA |

---

## SECCIÓN 1: ANÁLISIS DE COBERTURA REAL

### 1.1 Resultado del Coverage Report

```
Test Suites: 6 passed, 6 total (100%)
Tests:       19 passed, 19 total (100%)
Time:        10.931 s

COVERTURA GLOBAL:
  Statements: 6.23% ← FALLIDO (threshold: 80%)
  Branches:   5.38% ← FALLIDO (threshold: 80%)
  Functions:  3.52% ← FALLIDO (threshold: 80%)
  Lines:      5.9%  ← FALLIDO (threshold: 80%)
```

### 1.2 Desglose por Módulo

#### ✅ MÓDULOS CON TESTS (Cobertura Real)

| Módulo | Tests | Coverage | Verdict |
|--------|-------|----------|---------|
| **auth/** | 7 tests | ~100% en guards probados | 🟢 Roles guard OK, pero solo esos 2 guards |
| **common/pipes/** | 3 tests | 86.95% | 🟡 Bien implementado, pero falta edge cases |
| **common/guards/** | 4 tests | 100% en TenantBoundaryGuard | 🟢 Buena cobertura del guard |
| **prisma/** | 2 tests | 77.77% | 🟡 Bloquea $queryRawUnsafe, pero no pone valores en mocks |
| **users/** (service+controller) | 6 tests | 39% | 🟡 Muchas rutas no probadas |

**Subtotal**: 19 tests, pero **solo 5 archivos probados directamente**

#### 🔴 MÓDULOS SIN TESTS (Cobertura = 0%)

| Módulo | Métodos Async | Criticidad | Status |
|--------|---|--|--|
| **academic/academic.service.ts** | 20+ | **CRÍTICA** | 🔴 **0% coverage** - Gestión de periodos, grupos, materias SIN TESTS |
| **communication/communication.service.ts** | 15+ | **CRÍTICA** | 🔴 **0% coverage** - Mensajes, feedback, notificaciones SIN TESTS |
| **materials/materials.service.ts** | 12+ | **ALTA** | 🔴 **0% coverage** - Upload de archivos SIN TESTS |
| **performance/performance.service.ts** | 15+ | **CRÍTICA** | 🔴 **0% coverage** - Calificaciones, asistencia SIN TESTS |
| **recovery/recovery.service.ts** | 18+ | **CRÍTICA** | 🔴 **0% coverage** - Solicitudes de recuperación SIN TESTS |
| **recovery-settings/recovery-settings.service.ts** | 10+ | **ALTA** | 🔴 **0% coverage** - Configuración SIN TESTS |
| **schedule/schedule.service.ts** | 8+ | **MEDIA** | 🔴 **0% coverage** - Horarios SIN TESTS |
| **institutions/institutions.service.ts** | 5+ | **MEDIA** | 🔴 **0% coverage** - Tenants SIN TESTS |

**Total de código de negocio sin unit tests**: ~95 métodos async en módulos críticos = **0% cobertura**

---

## SECCIÓN 2: PRUEBAS INTENCIONADAS DE RUPTURA

### Hipótesis de Auditoría
"Si introducimos vulnerabilidades reales, ¿los tests las detectan?"

### Test 1: RolesGuard - Escalación de Privilegios
**Ruptura**: Comenté la validación `if (!requiredRoles.includes(user.role))` permitiendo ESTUDIANTE acceder a rutas SECRETARIA.

```typescript
// Antes (correcto):
if (!requiredRoles.includes(user.role)) {
  throw new ForbiddenException('No autorizado');
}

// Después (RUPTURA):
// if (!requiredRoles.includes(user.role)) {
//   throw new ForbiddenException('No autorizado');
// }
return true; // ← Permite cualquier rol
```

**Resultado**: ✅ **DETECTADO**
```
FAIL test/unit/auth/roles.guard.unit-spec.ts
  ● RolesGuard › rechaza rol fuera de la matriz
    Expected constructor: ForbiddenException
    Received function did not throw
```
**Test que falló**: `"rechaza rol fuera de la matriz"` (línea 46)
- Comprueba que ESTUDIANTE NO puede acceder a ruta SECRETARIA
- **Veredicto**: Este test tiene lógica real

---

### Test 2: TenantBoundaryGuard - Aislamiento Multi-Tenant
**Ruptura**: Comenté la validación `if (!actor.institutionId)` permitiendo actores sin contexto de tenant.

```typescript
// Antes (correcto):
if (!actor.institutionId) {
  throw new ForbiddenException('Contexto de tenant invalido');
}

// Después (RUPTURA):
// if (!actor.institutionId) { ... }
// [fallthrough - no lanza excepción]
return true;
```

**Resultado**: ✅ **DETECTADO**
```
FAIL test/unit/auth/tenant-boundary.guard.unit-spec.ts
  ● TenantBoundaryGuard › debe rechazar actor tenant sin institutionId
    Expected constructor: ForbiddenException
    Received function did not throw
```
**Test que falló**: `"debe rechazar actor tenant sin institutionId"` (línea 37)
- Verifica que SECRETARIA con `institutionId: null` sea rechazado
- **Veredicto**: Este test tiene lógica real

---

### Test 3: RecoveryService - Transacción Crítica (deleteRequest)
**Ruptura**: Eliminé `ensureRequestAccess(actor, id)` y reemplacé con simple `findUnique`, permitiendo a profesor A borrar solicitud de profesor B.

```typescript
// Antes (correcto):
const request = await this.ensureRequestAccess(actor, id); // valida ownership

// Después (RUPTURA):
const request = await this.prisma.recoveryRequest.findUnique({ 
  where: { id } // ← no valida permissions
});
```

**Resultado**: ❌ **NO DETECTADO** (No hay tests unitarios para recovery.service)
- No existe `test/unit/recovery/recovery.service.unit-spec.ts`
- Los integration tests que SÍ detectarían esto no corrieron (DB no disponible)
- **Veredicto**: Esta vulnerabilidad NO sería detectada en CI/CD

---

## SECCIÓN 3: ANÁLISIS DE TESTS SUPERFICIALES vs. REALES

### 3.1 Tests que Tienen Lógica Real (🟢)

#### TenantBoundaryGuard - Test Real
```typescript
it('debe rechazar actor tenant sin institutionId', () => {
  const context = buildContext({ userId: 2, role: UserRole.SECRETARIA, institutionId: null });
  expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
});
```
**Por qué es real**: 
- Prueba condición específica (`institutionId: null`)
- Valida excepción exacta (`ForbiddenException`)
- Cambiar el código rompe el test ✅

#### RolesGuard - Test Real
```typescript
it('rechaza rol fuera de la matriz', () => {
  reflector.getAllAndOverride.mockReturnValue([UserRole.SECRETARIA]);
  expect(() => guard.canActivate(contextWithRole(UserRole.ESTUDIANTE))).toThrow(ForbiddenException);
});
```
**Por qué es real**:
- Simula escenario específico (rol no autorizado)
- Valida que lanza excepción → si lo quitas, test falla
- **Veredicto**: Tiene valor defensivo

---

### 3.2 Tests Superficiales o Redundantes

#### SanitizeInputPipe - Test Parcialmente Superficial
```typescript
it('debe lanzar error con claves peligrosas', () => {
  const result = pipe.transform({ constructor: 'bad' }, {});
  // Espera que removeKey sea llamado... pero ¿valida que constructor fue bloqueado?
});
```
**Problemas**:
- Solo verifica que el pipe se ejecutó
- No valida que TODAS las claves peligrosas sean detectadas
- No prueba payloads anidados: `{ data: { __proto__: 'xss' } }`
- No prueba con arrays: `[{ __proto__: 'xss' }]`

**Falta de cobertura de edge cases**:
```typescript
// ¿Qué pasa con esto?
pipe.transform({ user: { data: { __proto__: 'xss' } } }, {})

// ¿Y esto?
pipe.transform([{ __proto__: 'xss' }, { constructor: 'bad' }], {})

// ¿Y esto (control characters)?
pipe.transform({ name: 'test\x00\x01\x02' }, {})
```

---

#### UsersService - Tests Muy Limited
```typescript
it('rechaza creación de SUPER_ADMIN por actor tenant', () => {
  // Prueba UNA cosa: que tenant no puede crear SUPER_ADMIN
  // Pero no prueba:
  // - ¿Qué pasa si actor es SUPER_ADMIN? ¿Puede crear SUPER_ADMIN?
  // - ¿Qué pasa con roles intermedios (SECRETARIA)?
  // - ¿Transacciones atómicas en batch create?
  // - ¿Hash de contraseñas?
  // - ¿Validación de email único?
});
```

**Cobertura de usuarios.service.ts**: ~30% (solo 3 métodos de 10+)
- ✅ createUser (validación de SUPER_ADMIN)
- ✅ createStudent (password = documento)
- ✅ createTeacher (validación de teléfono)
- ❌ updateUser
- ❌ changePassword (lógica de hash viejo/nuevo)
- ❌ getUserByEmail
- ❌ deleteUser
- ❌ listUsers (filtrado por tenant)
- ❌ assignRole (escalación)
- ❌ activeStatus

---

## SECCIÓN 4: VULNERABILIDADES CRÍTICAS SIN TESTS

### Tabla: Cambios de Seguridad Implementados pero SIN Unit Tests

| Archivo | Cambio | Método | Protección | ¿Tests? | Riesgo |
|---------|--------|--------|-----------|---------|--------|
| **recovery.service.ts** | Cambio de `getRequestOrThrow` → `ensureRequestAccess` | `updateRequestStatus()` | Validación de tenant antes de actualizar estado | ❌ **NO** | 🔴 Profesor podría actualizar requests de otra institución |
| **recovery.service.ts** | Cambio de `getRequestOrThrow` → `ensureRequestAccess` | `deleteRequest()` | Validación de tenant antes de eliminar | ❌ **NO** | 🔴 Profesor A podría eliminar requests de profesor B |
| **communication.service.ts** | Agregó `group.institutionId` check | `deleteFeedback()` | Valida que feedback pertenece a institución del actor | ❌ **NO** | 🔴 Secretaria A podría eliminar feedback de institución B |
| **academic.service.ts** | Filtro `...this.institutionWhere(actor)` | `assignSubjectToGroup()` | Asegura que periodo está en misma institución | ❌ **NO** | 🔴 Directora A podría asignar materias de institución B |

### Problem: Cambios sin Tests = Deuda Técnica

```
Si alguien refactoriza recovery.service.ts en 6 meses:
  "ensureRequestAccess es redundante, solo usemos findUnique"
  → Cambio se hace, ningún test falla
  → Vulnerability entra a producción
  → No se detecta hasta que un profesor borra requests ajenos
```

---

## SECCIÓN 5: ANÁLISIS DE TESTS DE INTEGRACIÓN E2E

### 5.1 Tests de Integración (Estructura Lista, Ejecución Bloqueada)

#### Test: recovery-tenant-boundary.integration-spec.ts
**Status**: ❌ No ejecutado (PostgreSQL no disponible)
**Estructura**: ✅ Bien diseñado
```typescript
it('rechaza a SECRETARIA de tenant A al actualizar solicitud de tenant B', async () => {
  // Setup:
  // 1. Crea institutionA e institutionB
  // 2. Crea SECRETARIA en institutionA
  // 3. Crea recoveryRequest en institutionB
  // 4. Intenta actualizar request de B con token de A
  // Expected: 403 ForbiddenException
});
```

**Potencial**: Si PostgreSQL estuviera disponible, este test DETECTARÍA la ruptura en recovery.service.ts

---

#### Test: prisma-relations.integration-spec.ts 
**Status**: ❌ No ejecutado (PostgreSQL no disponible)
**Estructura**: ✅ Valida constraints
```typescript
// Valida:
// - Unique constraints (no duplicados)
// - Cascading deletes (eliminar grupo elimina StudenGroup)
// - Transaction rollback (si falla una operación, se revierte todo)
```

**Veredicto**: **Bien diseñado pero sin evidencia de ejecución**

---

### 5.2 Tests E2E (Playwright) - Minimal Coverage

#### auth-and-roles.spec.ts
```typescript
✅ Test 1: Unauthenticated redirect
   "GET /secretaria sin token → redirige a /acceso-secretaria"
   
✅ Test 2: Role blocking on login
   "LOGIN como SECRETARIA → error, no redirige"
   
✅ Test 3: Cookie-based role redirect
   "GET /docente con cookie rec_role=ESTUDIANTE → redirige a /estudiante"
```

**Cobertura**:
- Critical P0 flows: ✅ 3/3 cubiertos (login, role redirect)
- Cross-tenant scenarios: ❌ NO cubierto
- Student isolation: ❌ NO cubierto
- File upload malicious: ❌ NO cubierto

**Veredicto**: 🟡 **Mínima pero correcta**

---

## SECCIÓN 6: ANÁLISIS DE MOCKS Y DEPENDENCIAS

### 6.1 Mocks Débiles en Unit Tests

#### Ejemplo: RolesGuard test
```typescript
let reflector: { getAllAndOverride: jest.fn() };
```

**Problema**: 
- Solo mockea 1 método (`getAllAndOverride`)
- No mockea el comportamiento real del Reflector
- Si Reflector cambia su API, test sigue pasando falsamente

**Mejor práctica**:
```typescript
import { createMock } from '@golevelup/ts-jest';
const reflector = createMock<Reflector>();
```

---

#### Ejemplo: TenantBoundaryGuard test
```typescript
function buildContext(user): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}
```

**Problemas**:
- Cast `as ExecutionContext` oculta errores de tipo
- Si ExecutionContext agrega nuevo método, test no falla
- No valida comportamiento completo

**Veredicto**: Mocks son frágiles, podrían pasar falsamente

---

### 6.2 Falta de Service Mocks en Controller Tests

#### UsersController test
```typescript
it('bloquea lectura de otro usuario si no es secretaria/superadmin', () => {
  const mockUsersService = { findOne: jest.fn().mockResolvedValue(...) };
  // ... pero ¿qué pasa si findOne lanza excepción?
  // ¿Qué pasa si retorna null?
  // No se prueba.
});
```

---

## SECCIÓN 7: EVALUACIÓN DE CI/CD vs. REALIDAD

### Pipeline Definido en .github/workflows/quality-gate.yml

```yaml
Jobs:
  1. backend-lint-and-unit ✅ (pasa 19/19)
  2. backend-integration ❌ (no puede ejecutar - DB)
  3. backend-build ✅
  4. frontend-lint-and-e2e ❌ (E2E no ejecutado)
  5. deploy 🚫 (placeholder)
```

### Problema: Pipeline Verde Pero Suite Roja

| Etapa | Status en CI | Realidad | Confianza |
|-------|------------|----------|-----------|
| Unit tests | ✅ PASS (19/19) | 6.23% cobertura global | 🔴 BAJA |
| Integration | ⏭️ SKIPPED (DB) | Podría ayudar, nunca corre | 🔴 NULA |
| E2E | ⏭️ SKIPPED | Playwright config OK, no se ejecuta | 🔴 NULA |
| Lint | ✅ PASS | Code style OK | 🟢 ALTA |
| Build | ✅ PASS | Código compila | 🟢 MEDIA |

**Veredicto**: Pipeline da falsa sensación de seguridad

---

## SECCIÓN 8: CLASIFICACIÓN FINAL - 🔴🟡🟢

### Hallazgo 1: Cobertura Global Crítica
**Severidad**: 🔴 **FALSO SENTIDO DE SEGURIDAD**

```
Global Coverage:     6.23% (threshold: 80%)
Tests Passing:       19/19 (100%)
Módulos Sin Tests:   8/12 (66%)
```

**Por qué es grave**:
- Tests reportan 100% PASS pero cobertura es 6.23%
- Equipo cree estar "protegido" cuando 95% del código no tiene tests
- Cualquier cambio en academic.service, communication.service, etc. NO se valida
- Tests unitarios NO correren en PR, solo los 6 test suites

---

### Hallazgo 2: Cambios de Seguridad Sin Tests
**Severidad**: 🔴 **FALSO SENTIDO DE SEGURIDAD**

```
Métodos críticos con cambios:
  ✅ RolesGuard - tiene test (detecta ruptura)
  ✅ TenantBoundaryGuard - tiene test (detecta ruptura)
  ❌ recovery.service.deleteRequest - NO tiene test (ruptura no detectada)
  ❌ communication.service.deleteFeedback - NO tiene test
  ❌ academic.service.assignSubjectToGroup - NO tiene test
```

**Por qué es grave**:
- Hicieron arreglos de seguridad importantes
- Pero sin tests defensivos
- Refactorización futura puede deshacer los arreglos silenciosamente

---

### Hallazgo 3: Dependencia en Tests de Integración
**Severidad**: 🟡 **COBERTURA PARCIAL**

```
Integration tests PODRÍAN detectar:
  ✅ Cross-tenant access blocking (recovery-tenant-boundary.integration-spec.ts)
  ✅ Cascading deletes y constraints (prisma-relations.integration-spec.ts)
```

**Pero**:
- Nunca se ejecutan en CI/CD (PostgreSQL no configurada)
- Desarrolladores no pueden correr locales sin Docker
- Sin ejecución visible, no hay confianza

---

### Hallazgo 4: E2E Mínimo pero Correcto
**Severidad**: 🟡 **COBERTURA PARCIAL**

```
P0 flows (critical):
  ✅ Login + role redirect
  ✅ Role validation
  ✅ Cookie-based redirect
  
P1 flows (not covered):
  ❌ Cross-tenant data access attempts
  ❌ File upload security
  ❌ Grade entry workflow
  ❌ Attendance registration
  ❌ Recovery request flow (END-TO-END)
```

---

### Hallazgo 5: Mocks Débiles
**Severidad**: 🟡 **RIESGO DE REGRESSIÓN**

```
Problemas:
  - Reflector mock solo tiene 1 método (getAllAndOverride)
  - ExecutionContext cast con 'as' oculta errores
  - UsersService mocks no cubren casos de excepción
  - SanitizeInputPipe no prueba payloads anidados
```

---

## SECCIÓN 9: RECOMENDACIONES CRÍTICAS

### Fase Inmediata (Semana 1)

**🔴 Blocker**: Sin estos cambios, no deployen a producción

1. **Creen tests unitarios para 3 servicios críticos** (40 horas)
   ```
   [ ] academic.service - 20+ métodos
   [ ] communication.service - 15+ métodos  
   [ ] performance.service - 15+ métodos
   ```

2. **Ejecuten integration tests localmente** (2 horas)
   ```bash
   docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
   npm run test:integration:migrate
   npm run test:integration
   ```

3. **Ejecuten E2E tests con backend corriendo** (1 hora)
   ```bash
   npm run start:dev  # Backend
   npm run test:e2e   # Frontend
   ```

---

### Fase Corto Plazo (Semanas 2-4)

4. **Creen tests de integración para cambios de seguridad** (20 horas)
   - deleteRequest con cross-tenant
   - deleteFeedback con cross-institution
   - assignSubjectToGroup con wrong institution

5. **Configuren CI/CD para ejecutar integration tests** (4 horas)
   - Agregar postgres service a quality-gate.yml
   - Configurar DATABASE_URL_TEST en secrets

6. **Amplíen E2E coverage a flows críticos** (16 horas)
   - Grade entry (Docente → calificación)
   - Attendance (Docente → asistencia)
   - Recovery workflow (Estudiante → solicitud)
   - File upload (Validar tipos/tamaño)

---

### Métricas de Éxito Objetivo

| Métrica | Hoy | Objetivo | Deadline |
|---------|-----|----------|----------|
| **Global Coverage** | 6.23% | 70% | Semana 4 |
| **Unit Test Suites** | 6 | 12+ | Semana 4 |
| **Unit Tests** | 19 | 80+ | Semana 4 |
| **Integration Tests Ejecutando** | 0% | 100% (en CI) | Semana 2 |
| **E2E Coverage P0 Flows** | 3/6 | 6/6 | Semana 3 |
| **Security Changes w/Tests** | 0/3 | 3/3 | Semana 2 |

---

## SECCIÓN 10: SCORING FINAL

### Suite de Tests - Clasificación

| Aspecto | Score | Veredicto |
|--------|-------|-----------|
| **Estructura** | 6/10 | Organización OK, falta mucho código |
| **Lógica de Tests** | 7/10 | Guards bien, servicios vacíos |
| **Mock Quality** | 5/10 | Débiles, muchos `as`, poco coverage |
| **Real Vulnerability Detection** | 5/10 | Detectó 2/3 rupturas intencionales |
| **CI/CD Integration** | 3/10 | Pipeline existe pero no ejecuta todo |
| **E2E Coverage** | 4/10 | Mínimo pero correcto, falta mucho |
| **Documentation** | 4/10 | Existe; falta guía de PRs y escalada |
| **Maintainability** | 6/10 | Se puede mejorar sin reescribir |

**PROMEDIO FINAL: 5.0/10**

### Clasificación Global

```
🔴 FALSO SENTIDO DE SEGURIDAD

Razones:
  ✘ 19 tests passing pero 6.23% cobertura global
  ✘ 66% de módulos críticos sin unit tests
  ✘ Cambios de seguridad sin tests defensivos
  ✘ Integration/E2E tests no ejecutan en CI/CD
  ✘ Tests de ruptura detectan 66% del daño (2/3)
  
Riesgo de Producción:
  - Escalación de roles: DETECTARÍA en CI/CD ✅
  - Aislamiento multi-tenant: DETECTARÍA en CI/CD ✅
  - Cambios en recovery/communication: NO DETECTARÍA ❌
  - File upload malicious: NO validado ❌
  - Cascading deletes: NO validado ❌
```

---

## PRÓXIMOS PASOS

1. **Ejecutar directamente**: `npm run test:all --coverage`
   - Incluir integration + E2E
   - Generar HTML coverage report
   - Mostrar a equipo

2. **Documentar brechas**: Por cada módulo sin tests
   - Listar métodos críticos
   - Documentar escenarios de error
   - Asignar peso (CRÍTICA/ALTA/MEDIA)

3. **Priorizar tests**: Primero academic + performance (afectan datos de menores)

---

**Fin de Auditoría Externa**  
*Senior QA Architect - 21 de marzo de 2026*
