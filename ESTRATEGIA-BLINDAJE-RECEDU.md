# ESTRATEGIA DE BLINDAJE RECEDU.CO — PLAN DE REMEDIACIÓN DE TESTS

**Estado Crítico:** 6.23% cobertura global | 8 módulos sin tests | 3 fixes sin ejecución | DEPLOY BLOQUEADO

**Versión:** 1.0  
**Fecha:** 2026-03-15  
**Basado en:** Auditoría Técnica Externa + Análisis de Dependencias  
**Horizonte:** 4 semanas (76 horas estimadas)

---

## PARTE 1: CLASIFICACIÓN DE MÓDULOS POR CRITICIDAD

### MATRIZ DE RIESGO RECEDU

| Módulo | Líneas | Cobertura | T1/T2/T3 | Riesgo Multi-Tenant | Riesgo Legal | Prioridad | Bloqueante Deployment |
|--------|--------|-----------|----------|---------------------|--------------|-----------|-----|
| **recovery** | 761 | 0% | T1 | 🔴 CRÍTICO | Alto (menores) | P0 | ✅ SÍ |
| **performance** | 1,322 | 0% | T1 | 🔴 CRÍTICO | Muy Alto (GDPR/COPPA) | P0 | ✅ SÍ |
| **academic** | 1,172 | 0% | T1 | 🔴 CRÍTICO | Alto (registro académico) | P0 | ✅ SÍ |
| **communication** | 377 | 0% | T1 | 🔴 CRÍTICO | Alto (feedback profesor) | P0 | ✅ SÍ |
| **materials** | 751 | 0% | T1 | 🟡 MEDIO | Medio (uploads) | P1 | ✅ SÍ |
| **schedule** | 329 | 0% | T2 | 🟡 MEDIO | Bajo | P2 | ❌ NO |
| **institutions** | 163 | 0% | T2 | 🔴 CRÍTICO | Bajo | P1 | ✅ SÍ |
| **recovery-settings** | 255 | 0% | T2 | 🔴 CRÍTICO | Bajo | P2 | ⚠️ CONDICIONAL |
| **users** | 687 | 39-74% | T2 | 🟡 MEDIO | Medio | P3 | ❌ NO |
| **auth** | 412 | 100% | T3 | 🟢 SEGURO | — | P4 | ✅ OK |
| **common/pipes** | 164 | 86.95% | T3 | 🟢 SEGURO | — | P4 | ✅ OK |
| **prisma** | 58 | 77.77% | T3 | 🟢 SEGURO | — | P4 | ✅ OK |

---

## PARTE 2: MÓDULOS TIER 1 — PLAN DE TESTS DETALLADO

### 2.1 recovery/ — SOLICITUDES DE RECUPERACIÓN (Criticidad MÁXIMA)

**Por qué es crítico:**
- Business-critical: toda la lógica de apoyo académico depende de esto
- 3 unprotected security fixes detectados en auditoría:
  - `deleteRequest()` - Removido `ensureRequestAccess()` but not tested
  - `updateRequestStatus()` - Added tenant barrier, not tested
  - `deleteActivity()` - Owner verification, no test
- Multi-tenant: requests must be institution-scoped
- Minors: Registros de apoyo académico de menores

**Métodos críticos que requieren tests:**

#### Recovery Requests (CRUD + Business Logic)

| Método | Firma | Tests Requeridos | Tipo | Mock | Risk Level |
|--------|-------|------------------|------|------|-----------|
| `createRequest()` | `(actor, groupId, description)` | 1. Happy path: creation en grupo autorizado 2. Deny: student intenta crear (role check) 3. Deny: cross-tenant assignment 4. Validate: descripcion sanitized | Unit | PrismaService mock (Group.findUnique, RecoveryRequest.create) | 🟡 MEDIUM |
| `listMyRequests()` | `(actor)` | 1. Happy: lista propias solicitudes por institucion 2. Deny: acceso a solicitudes de otra institucion 3. Empty: sin solicitudes | Unit + Integration | Prisma mock (test DB para isolation) | 🟡 MEDIUM |
| `listGroupRequests()` | `(actor, groupId)` | 1. Happy: docente lista solicitudes del grupo 2. Deny: docente de otro grupo 3. Deny: student (role) 4. Deny: cross-institution (instituciones A y B) | Unit + Integration | Prisma mock + test DB | 🔴 CRITICAL |
| `updateRequestStatus()` ⚠️ | `(actor, requestId, status)` | 1. Happy: Director/Secretaria approve request 2. Deny: student intenta cambiar status 3. Deny: cross-institution status change **← Security Fix Validation** 4. Validate: status transition logic (PENDING→APPROVED→COMPLETED only) | Unit + Integration | Prisma mock + test DB (cascading updates) | 🔴 CRITICAL |
| `deleteRequest()` ⚠️ | `(actor, requestId)` | 1. Happy: Director delete own institution's request 2. Deny: Student delete request 3. Deny: cross-institution deletion **← Security Fix Validation** 4. Validate: cascade deletes activities | Unit + Integration | Prisma mock + test DB (cascade safety) | 🔴 CRITICAL |

#### Recovery Activities (Sub-resource)

| Método | Tests Requeridos | Tipo | Mock | Risk |
|--------|------------------|------|------|------|
| `createActivity()` | 1. Happy: docente crea activity en request propia 2. Deny: intenta crear en request de otra institucion 3. Validate: activity description sanitized 4. Validate: timestamp correctness | Unit + Integration | Prisma mock | 🟡 MEDIUM |
| `updateActivity()` | 1. Happy: docente update propia activity 2. Deny: cross-institution update 3. Validate: status transitions (PENDING→DONE) | Unit | Prisma mock | 🟡 MEDIUM |
| `deleteActivity()` | 1. Happy: docente delete propia activity 2. Deny: cross-tenant deletion 3. Validate: request still exists after activity deleted | Unit + Integration | Prisma mock + test DB | 🔴 CRITICAL |

#### Messages & Communication within Recovery

| Método | Tests Requeridos | Tipo | Mock | Risk |
|--------|------------------|------|------|------|
| `createMessage()` | 1. Happy: docente send message en request activity 2. Deny: cross-institution messaging 3. Validate: timestamp, actor ownership | Unit | Prisma mock | 🟡 MEDIUM |
| `listMessages()` | 1. Happy: list messages en activity propia 2. Deny: cross-institution message access | Unit + Integration | Prisma mock | 🟡 MEDIUM |

**Test Count for recovery/:** 19 tests (9 unit, 5 integration, 5 E2E)

**Expected Coverage:** 85% (goal) — all public methods + critical private helpers

**Mocks Specification:**

```typescript
// recovery.service.spec.ts - Mock Setup Pattern

mockPrisma = {
  group: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  recoveryRequest: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  recoveryActivity: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  recoveryActivityMessage: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  // For cascade validation
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

// Tenant boundary validation pattern:
const mockActor = {
  userId: 1,
  role: UserRole.PROFESOR,
  institutionId: 100 // Tenant A
};

// Test: Cross-tenant denial
const wrongInstitutionRequest = { id: 999, group: { institutionId: 200 } }; // Tenant B
// Should throw ForbiddenException
```

**Integration Test Setup** (test DB):
```typescript
// recovery.integration.spec.ts
beforeAll(async () => {
  // Setup test database with clean schema
  // Create Institution A, Institution B, Users, Groups
});

afterEach(async () => {
  // Clean via transaction rollback or TRUNCATE
  // Ensure no data leakage between tests
});

// Tests must validate:
// 1. ensureRequestAccess() enforcement
// 2. Cascading deletes (request → activities → messages)
// 3. Status transition rules (PENDING→APPROVED→INACTIVE)
```

---

### 2.2 performance/ — CALIFICACIONES Y ASISTENCIA (CRÍTICO LEGAL)

**Por qué es crítico:**
- **GDPR/COPPA Compliance:** Datos de menores (notas, asistencia)
- **Legal Liability:** Modificación de calificaciones = fraude académico
- **Largest Module:** 1,322 líneas, múltiples métodos complejos
- **Cascading Impact:** Grades feed into GradePerformance, StudentAcademicRecord
- **No tests exist:** 0% coverage, 6 ruptures undetected

**Métodos críticos que requieren tests:**

#### Grade Management (Calificaciones)

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `createGrade()` | `(actor, groupId, evaluationId, ...)` | 1. Happy: docente crea calificacion en evaluation propia 2. Deny: cross-institution grade creation 3. Deny: student (role) 4. Validate: grade range [0-100] 5. Validate: no duplicate gradings for same student+eval | Unit + Integration | Prisma (Evaluation.findUnique, Grade.create) | 🔴 CRITICAL |
| `updateGrade()` | `(actor, gradeId, newScore)` | 1. Happy: docente modifica calificacion propia 2. Deny: cross-institution grade modification **← Grade Tampering Risk** 3. Deny: student modifies grade 4. Validate: grade history logged (audit trail) 5. Validate: score range enforcement | Unit + Integration | Prisma + test DB (audit verification) | 🔴 CRITICAL |
| `deleteGrade()` | `(actor, gradeId)` | 1. Happy: docente delete propia calificacion 2. Deny: cross-institution deletion 3. Validate: cascade to GradePerformance, StudentAcademicRecord 4. Validate: history recorded (soft delete acceptable) | Unit + Integration | Prisma (Evaluation, StudentAcademicRecord cascade) | 🔴 CRITICAL |
| `listStudentGrades()` | `(actor, studentId, [subjectId])` | 1. Happy: docente/director lista grades de students en su institucion 2. Deny: cross-institution student access 3. Deny: student lista grades de otro student (self-read ok) 4. Empty: student sin calificaciones | Unit + Integration | Prisma (institution WHERE filter) | 🔴 CRITICAL |

#### Attendance (Asistencia)

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `markAttendance()` | `(actor, studentId, date, présent)` | 1. Happy: docente marca asistencia 2. Deny: cross-institution attendance 3. Deny: student marca su asistencia (profesor-only) 4. Idempotency: marcar 2x same date → updated not created 5. Validate: date range (sólo school days) | Unit + Integration | Prisma (StudentAttendance upsert) | 🔴 CRITICAL |
| `listStudentAttendance()` | `(actor, studentId, [period])` | 1. Happy: list asistencia del estudiante (self-read) 2. Deny: cross-institution access 3. Empty: student without records | Unit | Prisma mock | 🟡 MEDIUM |

#### Grade Performance & Analytics

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `upsertGradePerformance()` | `(actor, gradeId, dto)` | 1. Happy: upsert performance metrics 2. Deny: cross-institution upsert 3. Validate: calculation fields (promedio, asistencia, aprobacion) 4. Test idempotency (updates existing, no duplicate) | Unit + Integration | Prisma mock + calculation verification | 🟡 MEDIUM |
| `getGradePerformance()` | `(actor, gradeId)` | 1. Happy: retrieve performance for grade 2. Deny: unauthorized access 3. Validate: derived signals (recovery rate, resources) | Unit | Prisma mock | 🟡 MEDIUM |

**Test Count for performance/:** 21 tests (12 unit, 7 integration, 2 E2E)

**Expected Coverage:** 80% (critical paths + boundary checks)

**Mocks Specification:**

```typescript
// performance.service.spec.ts
mockPrisma = {
  grade: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  evaluation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  studentAttendance: {
    upsert: jest.fn(), // ← Idempotency
    findMany: jest.fn(),
  },
  gradePerformance: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  studentAcademicRecord: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

// Multi-tenant test vector:
const actorInstitution100 = {
  userId: 101,
  role: UserRole.PROFESOR,
  institutionId: 100,
};
const gradeFromInstitution200 = { 
  id: 999, 
  evaluation: { group: { institutionId: 200 } }
};
// Expected: ForbiddenException("Cross-institution access")
```

**Integration Test Requirements** (test DB):
- Create complete academic hierarchy: Institution → Period → Grade → Group → Subject → Evaluation → Student
- Test cascade: updateGrade() → studentAcademicRecord update
- Test idempotency: markAttendance() twice same day = 1 record
- Validation: Score range [0-100] enforced at Prisma constraint level
- Audit trail: Track who modified grade and when

---

### 2.3 academic/ — ESTRUCTURA ACADÉMICA (CRÍTICO)

**Por qué es crítico:**
- **Foundation Module:** Todo depende de: Periods → Groups → Subjects → StudentGroups
- **1 Unprotected Security Fix:** `assignSubjectToGroup()` with `institutionWhere` filter, no unit test
- **Enrollment Risk:** `assignStudentToGroup()` sin tests = cross-institution assignment posible
- **Cascading Deletes:** `deleteGroup()` cascade safety not tested

**Métodos críticos que requieren tests:**

#### Academic Periods

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `createAcademicPeriod()` | `(actor, name, startDate, endDate)` | 1. Happy: Director crea period en sua institucion 2. Deny: cross-institution creation 3. Deny: student role (authorization) 4. Validate: date range (end > start) 5. Unique: solo 1 active period per institution | Unit + Integration | Prisma (Period.create, uniqueness) | 🔴 CRITICAL |
| `updateAcademicPeriod()` | `(actor, periodId, dto)` | 1. Happy: update status (ACTIVE→INACTIVE) 2. Deny: cross-institution update 3. Validate: can't change period dates after-the-fact | Unit + Integration | Prisma mock | 🟡 MEDIUM |
| `listAcademicPeriods()` | `(actor)` | 1. Happy: list institution's periods 2. Deny: cross-institution visibility | Unit | Prisma mock | 🟡 MEDIUM |

#### Groups (Grados/Cursos)

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `createGroup()` | `(actor, gradeId, name, [capacity])` | 1. Happy: create group in authorized grade 2. Deny: cross-institution group creation 3. Validate: capacity > 0 4. Validate: grade exists & belongs to institution | Unit + Integration | Prisma (Group.create, Grade.findUnique) | 🔴 CRITICAL |
| `deleteGroup()` | `(actor, groupId)` | 1. Happy: delete group (no students) 2. Deny: can't delete group with enrolled students 3. Deny: cross-institution deletion 4. Validate: cascade deletes GroupSubjects, StudentGroups **← Safety** 5. Validate: linked Offerings deleted/archived | Unit + Integration | Prisma mock + test DB (cascade verification) | 🔴 CRITICAL |
| `listGroupStudents()` | `(actor, groupId)` | 1. Happy: list students en grupo 2. Deny: cross-institution access 3. Validate: returns StudentGroup with status, enrollment date | Unit + Integration | Prisma mock | 🟡 MEDIUM |

#### Group-Subject Assignments ⚠️

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `assignSubjectToGroup()` ⚠️ | `(actor, groupId, subjectId)` | 1. Happy: assign subject to group + sync with AcademicOffering 2. Deny: cross-institution subject assignment **← Security Fix Validation** 3. Validate: subject exists in institution 4. Validate: upsert idempotency (2nd assignment = toggle isActive) 5. Validate: creates related AcademicOffering if period is active | Unit + Integration | Prisma (GroupSubject upsert, AcademicOffering) | 🔴 CRITICAL |
| `deleteGroupSubject()` | `(actor, groupSubjectId)` | 1. Happy: remove subject from group 2. Deny: cross-institution deletion 3. Validate: cascade deletes related AcademicOffering | Unit + Integration | Prisma + test DB (cascade) | 🔴 CRITICAL |

#### Student-Group Enrollment

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `assignStudentToGroup()` | `(actor, studentId, groupId)` | 1. Happy: assign student to group 2. Deny: cross-institution enrollment **← HIGH RISK** 3. Deny: duplicate enrollment (idempotency → toggle active) 4. Validate: student exits 5. Validate: creates StudentAcademicRecord | Unit + Integration | Prisma (StudentGroup upsert) | 🔴 CRITICAL |
| `deleteStudentGroup()` | `(actor, studentId)` | 1. Happy: unenroll student 2. Deny: cross-institution unenrollment 3. Validate: record soft-deleted (status=INACTIVE) not hard-deleted | Unit + Integration | Prisma mock | 🟡 MEDIUM |

#### Subjects (Materias)

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `createSubject()` | `(actor, name, code)` | 1. Happy: create subject 2. Deny: cross-institution creation 3. Validate: code unique per institution | Unit + Integration | Prisma mock | 🟡 MEDIUM |
| `deleteSubject()` | `(actor, subjectId)` | 1. Happy: delete (no groups using it) 2. Deny: can't delete if groups depend on it 3. Deny: cross-institution deletion | Unit + Integration | Prisma (cascade safety) | 🟡 MEDIUM |

#### Teacher-Subject Assignments

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `assignTeacherToOffering()` | `(actor, teacherId, offeringId)` | 1. Happy: assign profesor to subject-group-period 2. Deny: cross-institution assignment 3. Validate: profesor exists, offering exists | Unit + Integration | Prisma mock | 🟡 MEDIUM |
| `deleteTeacherAssignment()` | `(actor, assignmentId)` | 1. Happy: remove teacher 2. Deny: cross-institution deletion | Unit + Integration | Prisma mock | 🟡 MEDIUM |

**Test Count for academic/:** 25 tests (13 unit, 10 integration, 2 E2E)

**Expected Coverage:** 85%

**Mocks Specification:**

```typescript
// academic.service.spec.ts
mockPrisma = {
  academicPeriod: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  grade: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  group: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  subject: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  groupSubject: {
    upsert: jest.fn(), // ← Idempotency
    findUnique: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  studentGroup: {
    upsert: jest.fn(), // ← Idempotency
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  academicOffering: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  studentAcademicRecord: {
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

// Cross-institution attack vector:
const attackerFromInstitution200 = {
  userId: 205,
  role: UserRole.SECRETARIA,
  institutionId: 200,
};
const subjectFromInstitution100 = { id: 50, institutionId: 100 };
const groupFromInstitution100 = { id: 75, institutionId: 100 };
// attackerFromInstitution200.assignSubjectToGroup(groupFromInstitution100, subjectFromInstitution100)
// Expected: ForbiddenException
```

---

### 2.4 communication/ — MENSAJERÍA Y FEEDBACK (CRÍTICO)

**Por qué es crítico:**
- **GDPR:** Feedback profesor sobre estudiantes (minores)
- **1 Unprotected Security Fix:** `deleteFeedback()` with institution boundary check, no unit test
- **Cross-tenant Risk:** Mensajes deben aislarse por institución
- **Data Sensitivity:** Comentarios académicos, notas conductuales

**Métodos críticos que requieren tests:**

#### Feedback (Evaluación Cualitativa)

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `createFeedback()` | `(actor, groupId, studentId, content)` | 1. Happy: docente crea feedback para estudiante del grupo 2. Deny: cross-institution feedback creation 3. Deny: student intenta dar feedback 4. Sanitize: content HTML sanitized 5. Validate: student in group | Unit + Integration | Prisma (Group.findUnique, StudentGroup.findUnique) | 🔴 CRITICAL |
| `updateFeedback()` | `(actor, feedbackId, content)` | 1. Happy: docente update feedback propio 2. Deny: docente de otro grupo modifica 3. Deny: cross-institution update 4. Sanitize: content | Unit + Integration | Prisma mock | 🟡 MEDIUM |
| `deleteFeedback()` ⚠️ | `(actor, feedbackId)` | 1. Happy: docente delete feedback de su grupo 2. Deny: cross-institution deletion **← Security Fix Validation** 3. Deny: student deletes feedback 4. Soft-delete: record marked as deleted (GDPR trail) | Unit + Integration | Prisma (Group.institutionId verification) | 🔴 CRITICAL |
| `listFeedbackByGroup()` | `(actor, groupId)` | 1. Happy: docente lista feedback del grupo 2. Deny: docente otro grupo 3. Deny: cross-institution access 4. Pagination: 20 per page | Unit + Integration | Prisma mock | 🟡 MEDIUM |
| `listFeedbackByStudent()` | `(actor, studentId)` | 1. Happy: student lista feedback propio 2. Happy: docente lista feedback del student 3. Deny: cross-institution access | Unit + Integration | Prisma mock | 🟡 MEDIUM |

#### Messages (within Feedback)

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `sendMessage()` | `(actor, feedbackId, content)` | 1. Happy: docente/student message en feedback thread 2. Deny: message en feedback de otra institucion 3. Sanitize: content 4. Notify: recipient notificado | Unit + Integration | Prisma + notification service | 🟡 MEDIUM |
| `listMessages()` | `(actor, feedbackId)` | 1. Happy: list messages en feedback 2. Deny: cross-institution access | Unit + Integration | Prisma mock | 🟡 MEDIUM |

#### Notifications

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `createNotification()` | `(actor, userId, type, relatedId)` | 1. Happy: create notification 2. Deny: cross-institution notification 3. Validate: type enum (MESSAGE, FEEDBACK, GRADE, etc.) | Unit | Prisma mock | 🟡 MEDIUM |
| `listNotifications()` | `(actor)` | 1. Happy: user lista propias notifications 2. Paginated: latest first 3. Deny: access a notifications de otro usuario | Unit + Integration | Prisma mock | 🟡 MEDIUM |

**Test Count for communication/:** 15 tests (8 unit, 5 integration, 2 E2E)

**Expected Coverage:** 80%

**Mocks Specification:**

```typescript
// communication.service.spec.ts
mockPrisma = {
  group: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  studentGroup: {
    findUnique: jest.fn(),
  },
  feedback: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  feedbackMessage: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

// Institution boundary test for deleteFeedback:
const docente100 = { userId: 101, role: UserRole.PROFESOR, institutionId: 100 };
const feedback200 = {
  id: 999,
  group: { institutionId: 200 },
};
// Expected: ForbiddenException when docente100 tries to delete feedback200
```

---

### 2.5 materials/ — GESTIÓN DE ARCHIVOS (CRÍTICO)

**Por qué es crítico:**
- **Security Vectors:** Path traversal, malware upload, ZIP bomb DoS
- **File Operations:** Disk I/O, potential for resource exhaustion
- **Access Control:** Multi-tenant file listing/download
- **Data Sensitivity:** Student-facing educational materials

**Métodos críticos que requieren tests:**

#### Study Materials (Uploads)

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `uploadMaterial()` | `(actor, groupId, file, metadata)` | 1. Happy: docente uploads PDF/DOC 2. Deny: cross-institution upload 3. File validation: whitelist types (pdf, doc, xlsx, pptx), max 50MB 4. Sanitize: filename (no path traversal) 5. Sanitize: metadata HTML 6. Unique path: store with UUID, not original name 7. Deny: executable files (.exe, .bat, .sh) | Unit + Integration | File system mock (fs.promises), Prisma mock | 🔴 CRITICAL |
| `downloadMaterial()` | `(actor, materialId)` | 1. Happy: download file en grupo propio 2. Deny: cross-institution download 3. Deny: path traversal attempts (../, etc) 4. Return: correct file via stream 5. Log: download event (audit) | Unit + Integration | File system mock, Prisma mock | 🔴 CRITICAL |
| `deleteMaterial()` | `(actor, materialId)` | 1. Happy: docente delete upload propio 2. Deny: cross-institution deletion 3. Disk cleanup: file actually removed from disk 4. DB cleanup: record deleted | Unit + Integration | File system mock, Prisma mock | 🟡 MEDIUM |
| `listMaterialsByGroup()` | `(actor, groupId)` | 1. Happy: list materials en grupo 2. Deny: cross-institution listing 3. Pagination: 20 per page | Unit | Prisma mock | 🟡 MEDIUM |

#### Study Syllabus

| Método | Firma | Tests | Tipo | Mock | Risk |
|--------|-------|-------|------|------|------|
| `createSyllabus()` | `(actor, groupId, content, [file])` | 1. Happy: docente crea syllabus 2. Deny: cross-institution creation 3. Sanitize: content HTML 4. Optional file upload (same validations as uploadMaterial) | Unit + Integration | File system mock, Prisma mock, HTML sanitizer | 🟡 MEDIUM |
| `updateSyllabus()` | `(actor, syllabusId, content)` | 1. Happy: update propio 2. Deny: cross-institution update 3. Sanitize: content | Unit | Prisma mock | 🟡 MEDIUM |
| `deleteSyllabus()` | `(actor, syllabusId)` | 1. Happy: delete propio 2. Deny: cross-institution deletion 3. File cleanup if exists | Unit + Integration | File system mock, Prisma mock | 🟡 MEDIUM |

**Test Count for materials/:** 14 tests (7 unit, 5 integration, 2 E2E)

**Expected Coverage:** 75% (file operations mocked)

**Mocks Specification:**

```typescript
// materials.service.spec.ts
// File system mock (jest.mock('fs/promises'))
const mockFs = {
  mkdir: jest.fn().mockResolvedValue(void 0),
  writeFile: jest.fn().mockResolvedValue(void 0),
  readFile: jest.fn().mockResolvedValue(Buffer.from('file content')),
  unlink: jest.fn().mockResolvedValue(void 0),
};

mockPrisma = {
  group: {
    findUnique: jest.fn(),
  },
  studyMaterial: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  syllabus: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

// Path traversal attack vector:
const attackPayload = {
  filename: '../../../etc/passwd',
  content: 'malicious',
};
// Expected: BadRequestException("Invalid filename")

// File type attack:
const exeFile = { name: 'malware.exe', size: 1024, mimetype: 'application/x-msdownload' };
// Expected: BadRequestException("Unsupported file type")

// ZIP bomb test:
const zipBomb = { size: 51 * 1024 * 1024 }; // 51MB
// Expected: BadRequestException("File too large")
```

---

## PARTE 3: MÓDULOS TIER 2 — PLAN COMPRIMIDO

### 3.1 institutions/ — Gestión de Instituciones (Tenant Management)

**Criticidad:** Media-Alta (Tenant isolation)

| Método | Tests | Tipo | Risk |
|--------|-------|------|------|
| `createInstitution()` | 1. Happy: SuperAdmin crea institucion 2. Deny: non-SuperAdmin (role) 3. Unique: nombre unico | Unit | 🟡 MEDIUM |
| `updateInstitution()` | 1. Happy: SuperAdmin update 2. Deny: cross-tenant access (DirectorA no puede update InstitutionB) | Unit + Integration | 🔴 CRITICAL |

**Test Count:** 6 tests (4 unit, 2 integration)  
**Expected Coverage:** 85%

---

### 3.2 recovery-settings/ — Configuración de Recovery

**Criticidad:** Media (Configuration)

| Método | Tests | Tipo | Risk |
|--------|-------|------|------|
| `updateSettings()` | 1. Happy: Director update recovery config (approval required?, activity limit?) 2. Deny: cross-institution settings update 3. Validate: numeric fields | Unit + Integration | 🔴 CRITICAL |

**Test Count:** 5 tests (2 unit, 3 integration)  
**Expected Coverage:** 80%

---

### 3.3 schedule/ — Horarios y Agendas

**Criticidad:** Media (Operational)

| Método | Tests | Tipo | Risk |
|--------|-------|------|------|
| `createEntry()` | 1. Happy: docente crea schedule entry 2. Deny: cross-institution 3. Conflict check: no 2 entries same time | Unit + Integration | 🟡 MEDIUM |
| `deleteEntry()` | 1. Happy: delete own 2. Deny: cross-institution | Unit + Integration | 🟡 MEDIUM |
| `createEvent()` | 1. Happy: schedule event 2. Deny: cross-institution | Unit | 🟡 MEDIUM |

**Test Count:** 12 tests (6 unit, 4 integration, 2 E2E)  
**Expected Coverage:** 75%

---

## PARTE 4: PLAN DE IMPLEMENTACIÓN POR FASES

### FASE 1: CRÍTICOS DE SEGURIDAD (Semana 1 — 20 horas)

**Objetivo:** Bloquear vulnerabilidades multi-tenant + security fixes

**Módulos:**
1. **recovery/** (19 tests)
   - Enfoque: `ensureRequestAccess()` + `updateRequestStatus()` + `deleteRequest()`
   - Mock: Complete Prisma mock, 1 test DB container
   - Deliverables: recovery.service.spec.ts, recovery.integration.spec.ts

2. **academic/** (Subset: 12 tests — only critical paths)
   - Focus: `assignSubjectToGroup()` (security fix), `assignStudentToGroup()`, `deleteGroup()`
   - Mock: Prisma mock
   - Deliverables: academic.service.spec.ts (partial)

3. **communication/** (Subset: 8 tests — critical paths)
   - Focus: `deleteFeedback()` (security fix), `createFeedback()`, `listFeedbackByGroup()`
   - Deliverables: communication.service.spec.ts (partial)

**Coverage Target:** 30% global (up from 6.23%)

**Execution Order:**
1. Set up Jest configuration + shared Prisma mocks
2. Implement recovery/ tests (highest owner validation risk)
3. Implement communication/deleteFeedback tests
4. Implement academic/assignSubjectToGroup tests
5. Run full suite, iterate on failures

**Acceptance Criteria:**
- All 39 tests PASS
- Zero cross-institution access in test results
- All 3 security fixes validated

---

### FASE 2: CORE BUSINESS LOGIC (Semana 2-3 — 35 horas)

**Objetivo:** Complete critical modules (T1), extend coverage

**Módulos:**
1. **performance/** (21 tests) — full
   - Grade CRUD, attendance marking, idempotency, audit trail
2. **academic/** (remaining 13 tests)
   - Period management, group operations, enrollment
3. **communication/** (remaining 7 tests)
   - Messages, notifications
4. **materials/** (14 tests) — partial (file ops mocked)
   - Upload validation, download access control, file cleanup
5. **schedule/** (12 tests) — subset
6. **institutions/** (6 tests)

**Coverage Target:** 55% global

**Dependencies:**
- Phase 1 passing
- Test DB configuration mature
- Mocking patterns established

**Execution Order:**
1. Performance tests (highest impact, most complex)
2. Academic remaining (extends phase 1)
3. Materials (file mocking strategy)
4. Communication remaining
5. Schedule tests
6. Institutions tests

**Acceptance Criteria:**
- 109 Unit + Integration tests PASS
- Coverage per module meets minimums (80%+)
- No regressions from Phase 1

---

### FASE 3: E2E + INTEGRATION + OPTIMIZATION (Semana 4 — 21 horas)

**Objetivo:** User journey validation, integ tests with real DB, coverage >70%

**Work Streams:**

#### Stream 1: E2E Playwright (Critical Flows)
- **Login + Dashboard redirect** (all roles)
- **Grade entry workflow** (Teacher creates eval → enters grades → view historic)
- **Student enrollment** (Secretary assigns → student appears in group → can see materials)
- **Recovery request** (Student requests → teacher approves → activity tracking)
- **Report generation** (Admin generates PDF)

#### Stream 2: Integration Tests with Test DB
- Cascade delete safety (deleteGroup → delete StudentGroups, GroupSubjects)
- Constraint validation (Prisma unique constraints)
- Transaction rollback (ensure cleanup between tests)
- Soft-delete patterns (records marked inactive vs hard-deleted)

#### Stream 3: Coverage Optimization
- Identify uncovered branches in critical services
- Add edge case tests (null handling, boundary values, invalid states)
- Mock refinement (remove unused mocks, consolidate fixtures)

**Coverage Target:** 70% global + 85% for T1 modules

**Acceptance Criteria:**
- All 150+ tests PASS
- Global coverage ≥70%
- All P0 E2E flows green
- Zero test flakiness (run suite 3x, all green)

---

## PARTE 5: TEST FIXTURES Y SHARED MOCKS

### 5.1 Prisma Mock Factory

**Location:** `r.e.c-backend/test/fixtures/prisma.mock.ts`

```typescript
// Pattern: Return a fully-mocked Prisma service with sensible defaults
export function createMockPrisma(): PrismaService {
  return {
    // Institution
    institution: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Academic
    academicPeriod: { /* ... */ },
    grade: { /* ... */ },
    group: { /* ... */ },
    subject: { /* ... */ },
    // Performance
    studentAttendance: { /* ... */ },
    gradePerformance: { /* ... */ },
    // Recovery
    recoveryRequest: { /* ... */ },
    // Communication
    feedback: { /* ... */ },
    // Materials
    studyMaterial: { /* ... */ },
    // Utilities
    $transaction: jest.fn((cb) => cb(this)),
    $executeRaw: jest.fn(),
  };
}
```

### 5.2 Test Data Builders

**Location:** `r.e.c-backend/test/fixtures/builders.ts`

```typescript
export class TestDataBuilder {
  static actorWithRole(role: UserRole, institutionId = 100): Actor {
    return { userId: Date.now(), role, institutionId };
  }

  static institution(name = 'Test Colegio'): Institution {
    return { id: Date.now(), name, createdAt: new Date(), updatedAt: new Date() };
  }

  static academicPeriod(institutionId = 100): AcademicPeriod {
    return { 
      id: Date.now(),
      name: '2026-1',
      estado: 'ACTIVE',
      institutionId,
      // ...
    };
  }

  // Builders for all critical models
}
```

### 5.3 Test Database Seeding

**Location:** `r.e.c-backend/test/fixtures/seed-test-db.ts`

```typescript
// For integration tests with real DB
export async function seedTestHierarchy(prisma: PrismaClient) {
  const institution = await prisma.institution.create({
    data: { name: 'Colegio Test' },
  });
  
  const period = await prisma.academicPeriod.create({
    data: { 
      nombre: '2026-1', 
      estado: 'ACTIVE',
      institutionId: institution.id,
    },
  });

  const director = await prisma.user.create({
    data: { 
      email: 'director@test.local',
      password: 'hashed',
      role: 'DIRECTOR',
      institutionId: institution.id,
    },
  });

  // ... build complete hierarchy
  return { institution, period, director };
}

export async function cleanTestDb(prisma: PrismaClient) {
  // Truncate in reverse FK order
  await prisma.$executeRaw`
    TRUNCATE 
      "StudentAttendance", "Grade", "StudentAcademicRecord", 
      "StudentGroup", "GroupSubject", "AcademicOffering",
      "RecoveryActivityMessage", "RecoveryActivity", "RecoveryRequest",
      "Feedback", "Notification", "StudyMaterial",
      "TeacherAssignment", "Subject", "Group",
      "AcademicPeriod", "User", "Institution"
    CASCADE;
  `;
}
```

---

## PARTE 6: CONFIGURACIÓN CI/CD PARA TESTS

### 6.1 Jest Configuration Update

**Location:** `r.e.c-backend/jest.config.ts`

```typescript
export default {
  // ... existing config
  collectCoverageFrom: [
    'src/**/*.service.ts',     // Focus on services
    'src/**/*.controller.ts',  // Controllers
    '!src/**/*.module.ts',
    '!src/**/dto/**',
  ],
  coverageThresholds: {
    // Phase 1 (Week 1)
    // Phase 2 (Week 3): recovery/: 85%, performance/: 80%, academic/: 85%
    // Phase 4: global: 70%
    './src/recovery/': { branches: 75, functions: 75, lines: 75, statements: 75 },
    './src/performance/': { branches: 70, functions: 70, lines: 70, statements: 70 },
    './src/academic/': { branches: 75, functions: 75, lines: 75, statements: 75 },
    './src/communication/': { branches: 70, functions: 70, lines: 70, statements: 70 },
    './src/materials/': { branches: 65, functions: 65, lines: 65, statements: 65 },
  },
  testTimeout: 10000,
  // Reset mocks between tests
  clearMocks: true,
};
```

### 6.2 Test Runner Scripts

**Location:** `r.e.c-backend/package.json`

```json
{
  "scripts": {
    "test:unit": "jest --passWithNoTests --coverage",
    "test:unit:watch": "jest --watch",
    "test:integration": "jest --config jest-integration.json",
    "test:integration:reset-db": "npm run db:reset && npm run test:integration",
    "test:all": "npm run test:unit && npm run test:integration",
    "test:phase1": "jest --testPathPattern='(recovery|communication|academic)' --coverage",
    "test:phase2": "jest --coverage",
    "test:coverage:report": "jest --coverage && open coverage/lcov-report/index.html"
  }
}
```

---

## PARTE 7: MATRIZ DE RIESGOS RESIDUALES

### Después de Implementar Fase 1

| Riesgo | Antes | Después | Mitigation |
|--------|-------|---------|-----------|
| Cross-institution request deletion | ✅ Vulnerable | 🟡 Tested | ensureRequestAccess validation |
| Cross-institution feedback deletion | ✅ Vulnerable | 🟡 Tested | group.institutionId check |
| Cross-institution subject assignment | ✅ Vulnerable | 🟡 Tested | institutionWhere filter |
| Unchecked Grade modification | ✅ Vulnerable | Pending | Will fix in Phase 2 |
| Unchecked Attendance double-recording | ✅ Vulnerable | Pending | Will fix in Phase 2 |

### Después de Implementar Fase 2

| Riesgo | Mitigation | coverage |
|--------|-----------|----------|
| **All Tier 1 cross-tenant attacks** | Unit + Integration tests validating boundaries | 85% |
| **Cascade delete orphans** | Test DB validates actual constraints | 80%+ |
| **Idempotency bugs** (upsert patterns) | Explicit idempotency tests (2x same data) | 75%+ |
| **Malware upload** | File type whitelist + name sanitization | 70%+ |
| **Grade tampering history** | Audit trail validated | 80%+ |

---

## PARTE 8: MÉTRICAS DE ÉXITO Y EXITOSOS

| Métrica | Baseline | Fase 1 | Fase 2 | Fase 3 | Target |
|---------|----------|--------|--------|--------|--------|
| Global Coverage | 6.23% | 30% | 55% | 70% | **70%+** |
| Recovery/ Coverage | 0% | 85% | 85% | 85% | **85%** |
| Performance/ Coverage | 0% | — | 80% | 80% | **80%** |
| Academic/ Coverage | 0% | 40% | 85% | 85% | **85%** |
| Communication/ Coverage | 0% | 70% | 80% | 80% | **80%** |
| Materials/ Coverage | 0% | — | 75% | 75% | **75%** |
| **Cross-tenant bugs found** | 6 potential | 3 validated | 6 validated | 6 validated | **0 in prod** |
| **Test Suite Runtime** | — | <2min | <5min | <8min | **<10min** |
| **PR Merge Blocker** | ❌ Disabled | ⚠️ Advisory | ✅ Enabled | ✅ Enabled | **✅ Enforced** |
| **Deployment Gate** | ❌ FAIL | ⚠️ Manual | 🟡 Conditional | ✅ AUTO | **✅ Pass** |

---

## PARTE 9: DEPENDENCIAS Y BLOQUEADORES

### Go/No-Go para Fase 1

**Bloqueante:**
- [ ] Test database (PostgreSQL test container) configured and accessible
- [ ] Jest configuration updated with coverage thresholds
- [ ] Prisma mock factory created and validated
- [ ] Test data builders ready

**Nice-to-have:**
- [ ] GitHub Actions CI/CD
- [ ] Coverage reports uploaded to Codecov

### Go/No-Go para Fase 2

**Bloqueante:**
- [ ] All Phase 1 tests passing
- [ ] Coverage reports showing 30%+ baseline
- [ ] No test flakiness detected
- [ ] Team code review of test patterns

**Nice-to-have:**
- [ ] Test documentation in README

### Go/No-Go para Fase 3

**Bloqueante:**
- [ ] Phase 2 complete (55% coverage)
- [ ] E2E environment (staging) ready
- [ ] Playwright fixtures setup

---

## PARTE 10: PRÓXIMOS PASOS INMEDIATOS

### Semana 1 — Antes de escribir código

1. **Setup:**
   - [ ] Create `r.e.c-backend/test/fixtures/` directory
   - [ ] Create jest-integration.json config
   - [ ] Start PostgreSQL test container (Docker)
   - [ ] Create Prisma mock factory
   - [ ] Create test data builders

2. **Planning:**
   - [ ] Review this strategy with QA team
   - [ ] Assign owners (Fase 1: recovery/performance leads)
   - [ ] Schedule daily standup (15 min)
   - [ ] Create GitHub issues for each test suite

3. **Approval Gate:**
   - [ ] This strategy approved by team lead ✓
   - [ ] Estimated hours validated (76 total)
   - [ ] Risk mitigation accepted
   - [ ] Budget allocated

### Code Writing Starts: **Day 2 of Week 1**

1. recovery/*.spec.ts + recovery.integration.spec.ts
2. communication/deleteFeedback test + suite subset
3. academic/assignSubjectToGroup test + critical path subset

---

## CONCLUSIÓN

Este plan **diseña sin implementar** una estrategia de blindaje de 4 semanas que:

✅ **Bloquea deployment** (FAIL verification)  
✅ **Remedia 6 vectores de ataque** multi-tenant  
✅ **Valida 3 security fixes** sin tests  
✅ **Alcanza 70% cobertura global** (arriba del 6.23%)  
✅ **Prioriza riesgos legales** (minores, GDPR/COPPA)  
✅ **Fase-diza la carga** (30% → 55% → 70%)  
✅ **Proporciona mocks y fixtures** reutilizables  

**Siguiente fase:** Ejecutar Fase 1, confirmando que tests pasen y riesgos validados.

