# ANÁLISIS DE DEPENDENCIAS E INTEGRACIONES — RECEDU TEST STRATEGY

**Purpose:** Visualizar cómo los módulos se conectan y por qué el orden de test implementation importa  
**Audience:** Tech leads, test engineers  
**Format:** Diagrams + detailed dependency maps

---

## PARTE 1: DEPENDENCY GRAPH — RECEDU CORE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RECEDU DATA FLOW ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────┘

AUTHENTICATION LAYER (Tested ✅)
─────────────────────────────────
    ┌──────────────────┐
    │  auth.service    │ ✅ 100% (RolesGuard, TenantBoundary)
    │  (JWT + roles)   │
    └─────────┬────────┘
              │ Issues tokens for all roles:
              │ SUPER_ADMIN, DIRECTOR, SECRETARIA, PROFESOR, ESTUDIANTE
              │
              └─────────────────────┬─────────────────────┐
                                    │                     │
                                    ▼ RolesGuard        ▼ TenantBoundary
                              ┌──────────────┐      ┌──────────────┐
                              │  Validates   │      │ institutionId│
                              │  @Roles()    │      │  enforcement │
                              └──────────────┘      └──────────────┘


ACADEMIC STRUCTURE LAYER (Untested 🔴 HIGH PRIORITY)
─────────────────────────────────────────────────────

    ┌─────────────────────────────────────────────────────────────┐
    │                      ACADEMIC HIERARCHY                      │
    │                                                              │
    │   Institution (Tenant)                                      │
    │        │                                                    │
    │        ├─ AcademicPeriod (2026-1, 2026-2, etc.)          │
    │        │       │                                           │
    │        │       └─ Grade (1A, 2B, 3C, etc.) ◀─ Tier 1    │
    │        │              │                                    │
    │        │              └─ Group (Section, Parallel)        │
    │        │                     │                             │
    │        │                     ├─ Subject Catalog            │
    │        │                     │    (Mathematics, Spanish)   │
    │        │                     │                             │
    │        │                     └─ StudentGroup (Enrollment)  │
    │        │                            │                      │
    │        │                            └─ StudentAcademicRecord
    │        │                                  │                │
    │        │                                  ├─ Grade (mark)  │
    │        │                                  └─ Attendance    │
    │        │                                                   │
    │        └─ TeacherAssignment (Teacher → Subject → Group)  │
    │                                                            │
    └─────────────────────────────────────────────────────────────┘
    
    DEPENDENCY NOTES:
    - academic.service: Creates/manages EVERYTHING in this hierarchy
    - AcademicPeriod must exist before Group/Subject assignment
    - StudentGroup requires Group + Student + AcademicPeriod
    - TeacherAssignment requires Teacher + Subject + Group


PERFORMANCE & GRADING LAYER (Untested 🔴 CRITICAL)
───────────────────────────────────────────────────

                        ┌─────────────────┐
                        │  AcademicOffering
                        │ (Subject+Group+Period)
                        └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌────────────┐ ┌─────────────┐ ┌──────────────┐
            │ Evaluation │ │Grade Record │ │  Attendance  │
            │ (Exams)    │ │(Calification)│ │  Record      │
            │            │ │             │ │              │
            └────────┬───┘ └──────┬──────┘ └────────┬─────┘
                     │            │                │
                     └────┬───────┼────────┬───────┘
                          │       │        │
                          ▼       ▼        ▼
                    ┌──────────────────────────────┐
                    │   GradePerformance           │
                    │ (Aggregate metrics per Grade)│
                    │ - promedio                   │
                    │ - asistencia                 │
                    │ - aprobación                 │
                    │ - improved metrics           │
                    └──────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ StudentAcademicRecord│
                    │ (Historical tracking)│
                    └──────────────────────┘
    
    DEPENDENCY NOTES:
    - performance.service depends on academic/* being correct
    - Grades feed into GradePerformance calculations
    - Attendance idempotency CRITICAL (same day → update, not insert)
    - Cross-institutional grading FORBIDDEN


RECOVERY & SUPPORT LAYER (Untested 🔴 CRITICAL)
────────────────────────────────────────────────

    ┌─────────────────────────────────────────────┐
    │      StudentGroup (from academic/)          │
    │    [Student in Group relationship]          │
    └──────────────┬──────────────────────────────┘
                   │
                   ▼
     ┌──────────────────────────────────┐
     │  RecoveryRequest                 │
     │  (Student asks for help)         │
     │  - Status: PENDING → APPROVED    │
     │  - Owner: Student (requester)    │
     │  - Group: must belong to actor's │
     │    institution                   │
     └──────────┬───────────────────────┘
                │
                ▼
     ┌──────────────────────────────────┐
     │  RecoveryActivity                │
     │  (Teacher intervention plan)     │
     │  - Status: PENDING → COMPLETED   │
     │  - Created by: Profesor          │
     │  - In response to: RecoveryRequest
     └──────────┬───────────────────────┘
                │
                ▼
     ┌──────────────────────────────────┐
     │  RecoveryActivityMessage         │
     │  (Progress notes)                │
     │  - Sent by: Profesor/Student     │
     │  - Visible to both parties       │
     └─────────────────────────────────┘
    
    DEPENDENCY NOTES:
    - recovery.service depends on academic/* (StudentGroup exists)
    - ensureRequestAccess() MUST validate institution boundary
    - Cascade: delete request → delete activities → delete messages
    - Multi-step approval workflow: ensure status transitions


COMMUNICATION LAYER (Untested 🔴 CRITICAL)
──────────────────────────────────────────

    ┌──────────────────────────────────────────┐
    │   StudentGroup (from academic/)          │
    └───────────────────┬──────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
    ┌──────────────┐         ┌───────────────────┐
    │  Feedback    │         │    Notification   │
    │ (Qualitative)│         │  (System alerts)  │
    │  - by Profesor        │   - for all users │
    │  - on Student         │   - task reminders│
    │  - in Group context   │   - grade updates │
    │  - Thread-based msg   │                   │
    └────────┬─────┘         └───────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │  FeedbackMessage     │
    │  (Teacher-Student    │
    │   conversation)      │
    │  - Parent: Feedback  │
    │  - Actors: T+S       │
    └──────────────────────┘
    
    DEPENDENCY NOTES:
    - communication.service depends on academic/* (Group, StudentGroup)
    - deleteFeedback() must validate institution boundary (SECURITY FIX)
    - Notifications can't cross institution boundaries
    - Messages need content sanitization (HTML filter)


MATERIALS & CONTENT LAYER (Untested 🔴 HIGH)
─────────────────────────────────────────────

    ┌──────────────────────────┐
    │   Group (from academic/) │
    └────────────┬─────────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
    ▼                           ▼
┌──────────────────┐     ┌──────────────┐
│  StudyMaterial   │     │  Syllabus    │
│  (Uploads)       │     │  (Docs)      │
│  - PDF/DOC/IMG   │     │  - Version   │
│  - by Profesor   │     │  - History   │
│  - per Group     │     │  - Status    │
│  - Versioned     │     │              │
└────────┬─────────┘     └──────────────┘
         │
         ▼
    ┌──────────────────┐
    │  File on Disk    │
    │  uploads/        │
    │  {uuid}_{name}   │
    └──────────────────┘
    
    DEPENDENCY NOTES:
    - materials.service depends on academic/* (Group)
    - File path = UUID + sanitized name (prevent traversal)
    - Upload validation: type whitelist, size limit, scan for malware
    - Download: verify access before streaming file


SCHEDULING LAYER (Untested 🟡 MEDIUM)
──────────────────────────────────

    ┌──────────────────────┐
    │  Group (from academic/)
    └────────────┬─────────┘
                 │
    ┌────────────┴──────────────────┐
    │                               │
    ▼                               ▼
┌──────────────────┐    ┌────────────────────┐
│ WeeklySchedule   │    │ ScheduleEvent      │
│ Entry            │    │ (Conflict, Holiday)│
│ (Class time)     │    │ (No class days)    │
│ - by Profesor    │    │ - System-wide      │
│ - no conflicts?  │    │                    │
└──────────────────┘    └────────────────────┘
    
    DEPENDENCY NOTES:
    - schedule.service depends on academic/* (Group, TeacherAssignment)
    - Conflict detection: teachers can't teach 2 groups same time
    - Cross-tenant isolation: schedule A not appear in institution B


TENANT BOUNDARY ENFORCEMENT
────────────────────────────

    User (JWT token)
        │
        ├─ role: SUPER_ADMIN | DIRECTOR | SECRETARIA | PROFESOR | ESTUDIANTE
        └─ institutionId: 100 (Tenant A) OR 200 (Tenant B)
        
    Every service method receives Actor { userId, role, institutionId }
    
    PATTERN 1: Query Filter (Most Common)
    ──────────────────────────────────────
    async listGrades(actor: Actor) {
      return this.prisma.grade.findMany({
        where: {
          institutionId: actor.institutionId,  // ← FILTER AT QUERY LEVEL
          // ... other conditions
        }
      });
    }
    
    Vulnerability test: Actor from Inst 100 should NOT see Inst 200's grades
    
    PATTERN 2: Explicit Boundary Check (Critical Paths)
    ──────────────────────────────────────────────────
    async deleteRequest(actor: Actor, id: number) {
      const request = await this.prisma.recoveryRequest.findUnique({
        where: { id },
        include: { group: { select: { institutionId: true } } }
      });
      
      if (request.group.institutionId !== actor.institutionId) {
        throw new ForbiddenException('Cross-institution access');
      }
      
      return this.prisma.recoveryRequest.delete({ where: { id } });
    }
    
    Vulnerability test: Docente A can't delete request from Docente B's group
    (even if both groups exist, they're in different institutions)

```

---

## PARTE 2: TEST EXECUTION DEPENDENCY TREE

```
PHASE 1 (Week 1) — Foundation & Security Fixes
─────────────────────────────────────────────────

                    ┌──────────────────────┐
                    │  Fixture Setup       │
                    │  - Prisma mocks      │
                    │  - Test data builders│
                    └──────────┬───────────┘
                               │
                    ┌──────────┴────────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────────┐   ┌────────────────────────┐
            │ recovery/tests   │   │ communication/ (partial)│
            │ (19 tests)       │   │ deleteFeedback         │
            │ - Unit (9)       │   │ (3 tests)              │
            │ - Integration (5)│   │                        │
            │ - E2E (5)        │   └────────────────────────┘
            │                  │
            │ Validates:       │   ┌────────────────────────┐
            │ ✓ ensure Access  │   │ academic/ (partial)    │
            │ ✓ status update  │   │ assignSubjectToGroup   │
            │ ✓ request delete │   │ (4 tests)              │
            │ ✓ cascade delete │   │                        │
            └──────────┬───────┘   └─────┬──────────────────┘
                       │                 │
                       └─────────┬───────┘
                               ▼
                    ┌──────────────────┐
                    │ Phase 1 Complete │
                    │ Coverage: 30%     │
                    │ Vectors validated:3│
                    │ ✓ release phase 2 │
                    └──────────────────┘


PHASE 2 (Weeks 2-3) — Core Modules
──────────────────────────────────

                    ┌─────────────────────┐
                    │ Phase 1 baseline    │
                    │ (foundation ready)  │
                    └────────────┬────────┘
                                 │
                    ┌────────────────────────┐
                    │                        │
                    ▼                        ▼
            ┌─────────────────┐    ┌──────────────────┐
            │ performance/    │    │ academic/        │
            │ tests (21)      │    │ remaining (13)   │
            │ - Grade CRUD    │    │ - Period lifecycle
            │ - Attendance    │    │ - Group operations
            │ - Idempotency   │    │ - Enrollment     │
            │ - Audit trail   │    │ - Subject assign │
            └────────┬────────┘    └────────┬─────────┘
                     │                      │
                     │  DEPENDENCY:         │
                     │  Performance needs   │ Academic provides
                     │  valid Groups/       │ Groups/Subjects
                     │  Offerings from      │ for testing
                     │  Academic            │
                     │                      │
                     └──────────┬───────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │ communication/       │
                    │ remaining (7)        │
                    │ - Messages           │
                    │ - Notifications      │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ materials/           │
                    │ tests (14)           │
                    │ - Upload validation  │
                    │ - Download access    │
                    │ - File cleanup       │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ schedule/            │
                    │ tests (12)           │
                    │ - Entry CRUD         │
                    │ - Conflict detection │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ institutions/        │
                    │ tests (6)            │
                    │ - Tenant CRUD        │
                    │ - Isolation          │
                    └────────┬─────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ Phase 2 Complete     │
                    │ Coverage: 55%        │
                    │ ✓ release phase 3    │
                    └──────────────────────┘


PHASE 3 (Week 4) — E2E & Integration
───────────────────────────────────

                    ┌────────────────────┐
                    │ Phase 2 baseline    │
                    │ (core tested)       │
                    └────────┬───────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
        ┌──────────────────┐  ┌─────────────────┐
        │ E2E Playwright   │  │ Integration +   │
        │ (P0 flows)       │  │ Test DB         │
        │ - Login flow     │  │ - Cascade tests │
        │ - Grade entry    │  │ - Constraint    │
        │ - Enrollment     │  │   validation    │
        │ - Recovery req   │  │ - Soft-delete   │
        │ - Reports        │  │   patterns      │
        │ (15-20 tests)    │  │ (10-15 tests)   │
        └────────┬─────────┘  └────────┬────────┘
                 │                     │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Phase 3 Complete     │
                 │ Coverage: 70%        │
                 │ ✓ DEPLOYMENT READY   │
                 └──────────────────────┘
```

---

## PARTE 3: INTER-SERVICE CALL MATRIX

### Which services call which?

```
                  ┌──────────────────────────────────────┐
                  │  Service-to-Service Dependencies      │
                  └──────────────────────────────────────┘

academic.service
└─ Calls:
   ├── prisma.academicPeriod.* (CRUD)
   ├── prisma.grade.* (CRUD)
   ├── prisma.group.* (CRUD)
   ├── prisma.subject.* (CRUD)
   ├── prisma.groupSubject.* (CRUD + UPSERT idempotency)
   ├── prisma.studentGroup.* (CRUD + UPSERT idempotency)
   ├── prisma.academicOffering.* (sync on subject assign)
   └── prisma.teacherAssignment.* (CRUD)

   ◆ Note: academic.service is FOUNDATIONAL
     - All other services depend on its models
     - Tests MUST provide valid Groups/Subjects/Offerings
     
   Testing strategy:
   - Mock Prisma for unit tests
   - Use test DB for integration (validate constraints)
   - Idempotency critical: upsert() called twice = same result

────────────────────────────────────────────────────────────

performance.service
└─ Calls:
   ├── academic.service.* (Implicitly: uses Groups/Offering)
   ├── prisma.grade.* (Create/Read/Update/Delete marks)
   ├── prisma.evaluation.* (Read offerings)
   ├── prisma.studentAttendance.* (UPSERT idempotency critical!)
   ├── prisma.gradePerformance.* (UPSERT aggregate metrics)
   └── prisma.studentAcademicRecord.* (Cascading updates)

   ◆ Note: Depends on valid academic structure
   
   Testing strategy:
   - Unit tests: Mock Prisma, test grade validation logic
   - Integration tests: 
     * Create real Group/Offering via academic setter
     * Then test grade creation
     * Validate cascade to StudentAcademicRecord
   - Idempotency test: 
     * Mark same student present twice same day
     * Assert 1 attendance record, not 2 (upsert works)

────────────────────────────────────────────────────────────

recovery.service
└─ Calls:
   ├── academic.service.* (Implicitly: uses Groups/StudentGroups)
   ├── prisma.group.* (findUnique to validate)
   ├── prisma.recoveryRequest.* (CRUD)
   ├── prisma.recoveryActivity.* (CRUD)
   ├── prisma.recoveryActivityMessage.* (Create/Read)
   └── Notifications? (If sends notification on status change)

   ◆ Note: CRITICAL security boundary
     - ensureRequestAccess() validates institution boundary
     - Must check request.group.institutionId === actor.institutionId
   
   Testing strategy:
   - Unit tests: Mock boundary check
   - Integration tests: 
     * Create 2 institutions, 2 groups, 2 requests
     * Actor from Inst A tries to delete request from Inst B
     * Assert ForbiddenException

────────────────────────────────────────────────────────────

communication.service
└─ Calls:
   ├── academic.service.* (Implicitly: uses Groups/StudentGroups)
   ├── prisma.group.* (findUnique + institutionId check)
   ├── prisma.studentGroup.* (Validate student in group)
   ├── prisma.feedback.* (CRUD)
   ├── prisma.feedbackMessage.* (Create/Read)
   └── prisma.notification.* (Create notifications)

   ◆ Note: CRITICAL security fix on deleteFeedback()
     - Must check feedback.group.institutionId === actor.institutionId
     - No cross-institution feedback deletion allowed
   
   Testing strategy:
   - Unit tests: Mock boundary check
   - Integration tests:
     * Create feedback in Group from Inst A
     * Actor from Inst B tries to delete
     * Assert ForbiddenException
     * Asset notification cascade works

────────────────────────────────────────────────────────────

materials.service
└─ Calls:
   ├── academic.service.* (Implicitly: uses Groups/TeacherAssignments)
   ├── prisma.group.* (findUnique to validate)
   ├── prisma.teacherAssignment.* (Validate profesor-subject-group)
   ├── prisma.studyMaterial.* (CRUD)
   ├── prisma.syllabus.* (CRUD)
   ├── fs.promises.* (File I/O: mkdir, writeFile, readFile, unlink)
   └── UUID generation (Randomize filename)

   ◆ Note: File security critical
     - Filename: NOT user input (use UUID)
     - Path: must stay in uploads/ (no ../)
     - Type: whitelist only (PDF, DOC, XLSX, PPTX)
     - Size: max 50MB
   
   Testing strategy:
   - Unit tests: Mock fs, test path validation
   - Integration tests:
     * Mock file writes (don't hit disk)
     * Test path traversal prevention
     * Test file type validation
   - File cleanup: assert file deleted on deleteMaterial()

────────────────────────────────────────────────────────────

schedule.service
└─ Calls:
   ├── academic.service.* (Implicitly: uses Groups/TeacherAssignments)
   ├── prisma.group.* (findUnique)
   ├── prisma.weeklyScheduleEntry.* (CRUD)
   ├── prisma.scheduleEvent.* (CRUD)
   └── Conflict detection logic (Custom logic)

   ◆ Note: Conflict detection is complex
     - Teachers can't teach 2 groups same time
     - Schedule entries must have time slots filled
   
   Testing strategy:
   - Unit tests: Mock conflict detection algorithm
   - Integration tests:
     * Create 2 groups taught by same teacher
     * Try to assign same time slot
     * Assert NotFoundException("Conflict detected")

────────────────────────────────────────────────────────────

institutions.service
└─ Calls:
   ├── prisma.institution.* (CRUD)
   └── User provisioning? (If creates default admin)

   ◆ Note: Minimal, high-impact module
     - SuperAdmin only
     - Used for tenant isolation
   
   Testing strategy:
   - Unit tests: Mock CRUD validation
   - Integration tests:
     * Create institution
     * Director tries to update another institution
     * Assert ForbiddenException

────────────────────────────────────────────────────────────

users.service [PARTIALLY TESTED]
└─ Calls:
   ├── prisma.user.* (CRUD)
   ├── Password hashing (bcrypt)
   └─ Role assignment logic

   ◆ Note: Already has partial tests (39-74% coverage)
   
   Testing needs:
   - Extend unit tests to 85%+
   - Test role transitions (Student → TA, Profesor → Director)
   - Cross-institution user isolation

────────────────────────────────────────────────────────────

auth.service [FULLY TESTED ✓]
└─ Calls:
   ├── JWT creation/validation
   ├── RolesGuard enforcement
   ├── TenantBoundaryGuard enforcement
   └─ users.service.* (Lookup for login)

   ✓ Already 100% tested
   ✓ Guards working correctly
   ✗ But ONLY tested at guard level, not at service level for each endpoint

```

---

## PARTE 4: MOCK STRATEGY POR LAYER

```
LAYER 1: Authentication (JWT+Guards) ✓ Tested
──────────────────────────────────────────
No mocking needed — guards are already tested
Use real JWT tokens in integration/E2E tests

LAYER 2: Prisma ORM (Database Access)
──────────────────────────────────────
Unit tests: MOCK completely
├─ Each service has its own mockPrisma instance
├─ Jest.fn() for every .create/.findUnique/.update/.delete
└─ setupMockPrismaResponse() returns sensible defaults

Integration tests: REAL Prisma
├─ Use test database container
├─ Run migrations (prisma migrate deploy)
├─ Seed with test data builders
├─ Clean via TRUNCATE after each test

E2E tests: REAL database (staging)
├─ Full PostgreSQL instance
├─ Production-like schema
├─ Real constraints/Foreign Keys
└─ Validates actual cascade behavior

LAYER 3: Services (Business Logic)
──────────────────────────────────
Unit tests: MOCK Prisma, REAL service code
├─ Instantiate service with mockPrisma
├─ Call service methods directly
├─ Assert service logic (validation, authorization)
└─ Mock should return what DB would return

Integration tests: REAL Prisma + Services
├─ Instantiate service with REAL PrismaClient
├─ Against test database
├─ Validates both service + DB constraints together
└─ Essential for cascade/constraint tests

LAYER 4: Controllers (HTTP Layer)
─────────────────────────────────
Integration tests: REAL app + request
├─ Use NestJS TestingModule
├─ Instantiate app with real modules
├─ Mock Prisma at provider level (optional)
└─ Send HTTP requests via supertest

E2E tests: Playwright in browser
├─ Full HTTP stack (backend running)
├─ Real database (staging)
├─ Click buttons, fill forms, verify UI
└─ Critical workflows only

LAYER 5: File System (uploads/)
──────────────────────────────
Unit tests: Mock fs.promises completely
├─ jest.mock('fs/promises')
├─ Mock mkdir, writeFile, readFile, unlink
└─ Test path validation logic

Integration tests: Mock or use temp directory
├─ Create real temp dir for test
├─ Write files there
├─ Clean up after
└─ Assert disk I/O operations work

E2E tests: Real file system
├─ Test upload → download → delete
└─ Verify file actually exists on disk

```

---

## PARTE 5: CIRCULAR DEPENDENCY PREVENTION

```
DEPENDENCY RULE ENFORCEMENT:
────────────────────────────

academic/ ← NEVER imports from:
├─ performance/
├─ recovery/
├─ communication/
└─ materials/

Reason: academic/ is FOUNDATION
If academic imports from performance, circular import possible

performance/ ← CAN import from:
├─ academic/ (read Groups, Offerings)
└─ ✓ OK to depend downward

recovery/ ← CAN import from:
├─ academic/ (read Groups, StudentGroups)
└─ ✓ OK to depend downward

communication/ ← CAN import from:
├─ academic/ (read Groups, StudentGroups)
└─ ✓ OK to depend downward

materials/ ← CAN import from:
├─ academic/ (read Groups, TeacherAssignments)
└─ ✓ OK to depend downward

TEST IMPLICATION:
─────────────────
Phase 1: Test academic/ FIRST
└─ Phase 2 tests depend on academic being correct

MOCK IMPLICATION:
─────────────────
When mocking academic dependencies:
├─ Return what academic.service would return
├─ Validate structure matches real academic models
└─ Use TestDataBuilder for consistency

```

---

## PARTE 6: EXECUTION SEQUENCE RATIONALE

### WHY THIS ORDER?

```
Week 1: recovery + communication.deleteFeedback + academic.assignSubjectToGroup
─────────────────────────────────────────────────────────────────────────

1. recovery/ FIRST because:
   ✓ Most critical security fix (ensureRequestAccess, deleteRequest)
   ✓ Self-contained (doesn't need other tests passing)
   ✓ Highest legal risk (student data, approval workflows)
   ✓ Fastest ROI: 85% coverage in 20 hours
   
2. communication/deleteFeedback SECOND because:
   ✓ Single critical fix (validates institution boundary)
   ✓ Depends on recovery being tested (patterns established)
   ✓ High legal risk (GDPR feedback on minors)
   ✓ Can reuse mocking patterns from recovery
   
3. academic/assignSubjectToGroup THIRD because:
   ✓ Foundation for other tests, but critical fix first
   ✓ Validates institutionWhere filter works
   ✓ Prepares for Phase 2 (full academic/ tests)
   ✓ Unblocks schedule/ + materials/ testing


Week 2-3: performance/ + academic/ (full) + communication/ (full) + materials/ + schedule/ + institutions/
──────────────────────────────────────────────────────────────────────────────────────────────

1. performance/ FIRST because:
   ✓ 2nd highest legal risk (grades of minors)
   ✓ Most complex module (1,322 lines, 21 test cases)
   ✓ Idempotency patterns (markAttendance, upsert)
   ✓ Build confidence in mocking + integration patterns
   
2. academic/ (REMAINING) SECOND because:
   ✓ Foundation for everything else
   ✓ Phase 1 gave confidence in patterns
   ✓ Once complete, unblocks all other modules
   ✓ 25 test cases, but patterns reused
   
3. communication/ (REMAINING) PARALLEL because:
   ✓ Can be tested independently (doesn't depend on academic being 100%)
   ✓ Lower complexity than performance/
   ✓ Tests can run in parallel to academic/
   
4. materials/ PARALLEL because:
   ✓ Self-contained (file operations)
   ✓ Can be tested independently
   ✓ File mocking patterns different from DB mocking
   
5. schedule/ & institutions/ LAST because:
   ✓ Lower priority (no legal/security blockers)
   ✓ Wait for academic dependencies to be solid
   ✓ Can be done in parallel


Week 4: E2E + Integration refinement
────────────────────────────────────

1. E2E Playwright flows (P0 only)
   ✓ Login + dashboard
   ✓ Grade entry workflow
   ✓ Student enrollment
   ✓ Recovery request cycle
   ✓ Report generation
   
2. Integration tests with test DB
   ✓ Cascade delete validation
   ✓ Constraint enforcement
   ✓ Transaction rollback patterns
   
3. Coverage gap filling
   ✓ Branch coverage for critical paths
   ✓ Edge case handling (nulls, boundaries)

```

---

## CONCLUSIÓN: DEPENDENCY SUMMARY

| Phase | Module | Depends On | Tests | Coverage Target |
|-------|--------|-----------|-------|-----------------|
| 1 | recovery/ | Prisma mocks | 19 | 85% |
| 1 | communication/ (partial) | academic models | 3 | 70% |
| 1 | academic/ (partial) | Prisma mocks | 4 | 40% |
| 2 | performance/ | academic/ (foundation) | 21 | 80% |
| 2 | academic/ (full) | Prisma mocks | 13 (total 25) | 85% |
| 2 | communication/ (full) | academic/ (foundation) | 12 (total 15) | 80% |
| 2 | materials/ | academic/ (foundation) | 14 | 75% |
| 2 | schedule/ | academic/ (foundation) | 12 | 75% |
| 2 | institutions/ | Prisma mocks | 6 | 85% |
| 3 | E2E flows | All services | 20-30 | 100% (P0 flows) |
| 3 | Integration DB | Real PostgreSQL | 10-15 | Constraint validation |

**Critical Path:** recovery → performance → academic (full) → everything else

**Unblocking Logic:** Phase 1 tests establish mock patterns → Phase 2 tests expand reusing patterns → Phase 3 validates with real DB

