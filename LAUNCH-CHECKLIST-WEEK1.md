# LAUNCH CHECKLIST — RECEDU TEST REMEDIATION

**Status:** 🔴 DEPLOYMENT BLOCKED (6.23% coverage)  
**Decision:** Proceed with 4-week remediation plan  
**Start Date:** Monday, Week 1  
**Go/No-Go:** This Friday (Day 5)

---

## EXECUTIVE SUMMARY

**Current State:**
- 6.23% global test coverage (80% required)
- 8 modules untested (recovery, performance, academic, communication, materials, schedule, institutions, recovery-settings)
- 3 security fixes deployed WITHOUT tests
- 6 known vulnerability vectors in multi-tenancy

**Decision:**
- ✅ EXECUTE 4-week remediation plan
- ✅ Block any non-critical PRs until Phase 1 complete (Friday end-of-day)
- ✅ Phase 1 target: 30% coverage + 3 security fixes validated
- ✅ Phase 2 target: 55% coverage + all Tier 1 modules tested
- ✅ Phase 3 target: 70% coverage + E2E validation

**Resource Allocation:**
- 76 total hours (2 engineers × 4 weeks, not 1 engineer)
- Week 1: Setup + recovery/ tests (tight deadline)
- Week 2-3: Parallel execution (Phase 2 workstreams)
- Week 4: E2E + integration refinement

---

## WEEK 1 CRITICAL PATH — SETUP & PHASE 1 EXECUTION

### Monday Morning (2 hours)

#### Task M1: Project Kickoff
- [ ] Read & sign off on ESTRATEGIA-BLINDAJE-RECEDU.md
- [ ] Read DEPENDENCIAS-ARQUITECTURA-TESTS.md (understand flow)
- [ ] Confirm resource: 2 engineers assigned
- [ ] Create GitHub Project "TEST-REMEDIATION" with this checklist

#### Task M2: Environment Setup (Engineer 1)
- [ ] Clone/pull latest `r.e.c-backend`
- [ ] Create `test/` directory structure:
  ```
  r.e.c-backend/test/
  ├── fixtures/
  │   ├── prisma.mock.ts
  │   ├── builders.ts
  │   ├── seed-test-db.ts
  │   └── fixtures.ts (exports all)
  ├── jest-integration.json
  └── helpers/
      └── test-utils.ts
  ```
- [ ] Initialize test database container:
  ```bash
  docker run -d \
    --name recedu-test-db \
    -e POSTGRES_DB=recedu_test \
    -e POSTGRES_PASSWORD=test \
    -p 5433:5432 \
    postgres:15-alpine
  ```
- [ ] Create `.env.test`:
  ```
  DATABASE_URL="postgresql://postgres:test@localhost:5433/recedu_test"
  JWT_SECRET="test-secret"
  NODE_ENV="test"
  ```
- [ ] Run migrations:
  ```bash
  DATABASE_URL="..." npx prisma migrate deploy
  ```

#### Task M3: Jest Configuration (Engineer 1)
- [ ] Update `jest.config.ts`:
  ```typescript
  export default {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
      '**/*.(t|j)s',
      '!**/*.module.ts',
      '!src/main.ts',
    ],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    clearMocks: true,
    testTimeout: 10000,
  };
  ```
- [ ] Create `jest-integration.json`:
  ```json
  {
    "extends": "./jest.config.ts",
    "testRegex": ".*\\.integration\\.spec\\.ts$",
    "testTimeout": 30000,
    "setupFilesAfterEnv": ["<rootDir>/../test/fixtures/setup-integration.ts"]
  }
  ```
- [ ] Test Jest runs:
  ```bash
  npm run test -- --version  # should show version
  npm run test -- src/auth/auth.service.spec.ts  # should pass
  ```

#### Task M4: Prisma Mock Factory (Engineer 2)
- [ ] Create `test/fixtures/prisma.mock.ts`:
  - Complete mock with all service models (institution, academic*, performance*, recovery*, communication*, materials*, schedule*)
  - Pattern: `create: jest.fn()`, `findUnique: jest.fn()`, `update: jest.fn()`, `delete: jest.fn()`
  - Special: `$transaction: jest.fn((cb) => cb(this))`
  - Default values: sensible returns (id: 1, createdAt: now, etc)
- [ ] Create `test/fixtures/builders.ts`:
  - `TestDataBuilder` class
  - `actor()` factory (role + institutionId)
  - Model builders for: Institution, AcademicPeriod, Group, Subject, StudentGroup, RecoveryRequest, Feedback, StudyMaterial
  - All builders use Date.now() for unique IDs in tests
- [ ] Create `test/fixtures/setup-integration.ts`:
  - Export `getTestDatabase()` → Promise<PrismaClient>
  - Export `cleanTestDatabase()` → Promise<void>
  - Use TRUNCATE cascade on all tables

#### Task M5: GitHub Project Setup (Engineer 1)
- [ ] Create "TEST-REMEDIATION" project
- [ ] Add issues:
  ```
  Phase 1:
  - [ ] recovery/ service tests (19 tests)
  - [ ] communication/ deleteFeedback test (3 tests)
  - [ ] academic/ assignSubjectToGroup test (4 tests)
  
  Phase 2:
  - [ ] performance/ service tests (21 tests)
  - [ ] academic/ remaining tests (13 tests)
  - [ ] communication/ remaining tests (12 tests)
  - [ ] ... etc
  ```
- [ ] Add milestone: "Phase 1 - Friday End of Day"

---

### Tuesday (8 hours)

#### Task T1: recovery/ Service Tests (Engineer 1)

**File:** `src/recovery/recovery.service.spec.ts`

**Test Structure:**
```
describe('RecoveryService', () => {

  // 1. Setup: Mock Prisma, create service instance
  beforeEach(() => {
    // mockPrisma = createMockPrisma()
    // service = new RecoveryService(mockPrisma)
  });
  
  // 2. Happy Path Tests
  describe('createRequest()', () => {
    test('✓ should create request in authorized group', () => {
      // actor = { userId: 1, role: PROFESOR, institutionId: 100 }
      // group = { id: 50, institutionId: 100 }
      // mockPrisma.group.findUnique.mockResolvedValue(group)
      // mockPrisma.recoveryRequest.create.mockResolvedValue({ id: 1, ... })
      // result =service.createRequest(actor, 50, 'Help needed')
      // expect(result.id).toBeDefined()
    });
  });
  
  // 3. Authorization Tests (Role-based)
  describe('authorization', () => {
    test('✗ should deny student creating request', () => {
      // actor = { role: ESTUDIANTE, ... }
      // expect(() => service.createRequest(actor, 50, 'Help')).throws(ForbiddenException)
    });
  });
  
  // 4. Tenant Boundary Tests (CRITICAL)
  describe('multi-tenant isolation', () => {
    test('✗ should deny cross-institution request creation', () => {
      // actor from institution 100
      // group from institution 200
      // expect(() => ...).throws(ForbiddenException)
    });
    
    test('✗ should deny cross-institution request deletion', () => {
      // actor from institution 100
      // request from institution 200
      // expect(() => service.deleteRequest(actor, requestId)).throws(ForbiddenException)
    });
  });
  
  // 5. Business Logic Tests
  describe('status transitions', () => {
    test('✓ should transition PENDING → APPROVED', () => {
      // Initial status: PENDING
      // updateRequestStatus(actor, requestId, APPROVED)
      // expect(result.status).toBe(APPROVED)
    });
    
    test('✗ should deny invalid transition (APPROVED → PENDING)', () => {
      // Current: APPROVED
      // Try: PENDING
      // expect().throws(BadRequestException)
    });
  });
  
  // 6. Cascade Tests
  describe('cascading deletes', () => {
    test('✓ should delete activities when request deleted', () => {
      // Setup: request with 2 activities
      // deleteRequest(actor, requestId)
      // mockPrisma.recoveryActivity.deleteMany.called with { where: { requestId } }
      // expect(mock.delete).toHaveBeenCalled()
    });
  });
});
```

**Estimated:** 6 hours (setup + 9 unit tests + debugging)

#### Task T2: Unit Test Execution & Iteration (Engineer 1)
- [ ] Run tests:
  ```bash
  npm run test -- src/recovery/recovery.service.spec.ts --coverage
  ```
- [ ] Iterate on failures (expected 50% first run failure)
- [ ] Refine mocks as needed
- [ ] Document patterns in `TEST-PATTERNS.md`

#### Task T3: communication/deleteFeedback Tests (Engineer 2)

**File:** `src/communication/communication.service.spec.ts` (partial)

**Focus Tests:**
1. Happy path: Create feedback
2. Happy path: Delete feedback (authorized)
3. **SECURITY:** Cross-institution deletion denied
4. Happy path: List feedback (institution boundary)
5. HTML sanitization

**Estimated:** 3 hours

#### Task T4: academic/assignSubjectToGroup Tests (Engineer 2)

**File:** `src/academic/academic.service.spec.ts` (partial)

**Focus Tests:**
1. Happy path: Assign subject to group
2. **SECURITY FIX:** Cross-institution assignment denied (institutionWhere validation)
3. Idempotency: Assign twice = upsert, not duplicate
4. Validation: Subject/Group exist

**Estimated:** 2 hours

#### Task T5: Coverage Report (Engineer 1)
- [ ] Run full Phase 1 tests:
  ```bash
  npm run test:phase1 -- --coverage
  ```
- [ ] Screenshot coverage report
- [ ] Compare to baseline (6.23% → target 30%)

---

### Wednesday (6 hours)

#### Task W1: Integration Tests — recovery.integration.spec.ts (Engineer 1)

**File:** `src/recovery/recovery.integration.spec.ts`

**Setup:**
```typescript
describe('RecoveryService (Integration with Test DB)', () => {
  let prisma: PrismaClient;
  let service: RecoveryService;
  let testData: { institution, director, profesor, student, group };
  
  beforeAll(async () => {
    prisma = await getTestDatabase();
    service = new RecoveryService(prisma);
    testData = await seedTestHierarchy(prisma);
  });
  
  afterEach(async () => {
    await cleanTestDatabase(prisma);
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

**Tests:**
1. Cascade delete: deleteRequest → activities → messages (validate actual DB)
2. Cross-institution isolation: Verify actual DB constraint (if any)
3. Transaction rollback: CreateRequest → fail → verify DB clean

**Estimated:** 4-5 hours (setup + 5 integration tests)

#### Task W2: Phase 1 Test Summary (Engineer 2)
- [ ] Run all Phase 1 tests:
  ```bash
  npm run test:phase1 -- --coverage --json > phase1-report.json
  ```
- [ ] Generate coverage delta report
- [ ] Document pass/fail breakdown
- [ ] Identify flaky tests (if any)

---

### Thursday (4 hours)

#### Task TH1: Coverage Gaps & Edge Cases (Engineer 1)
- [ ] Identify uncovered branches in recovery/:
  ```bash
  npm run test:coverage:report
  open coverage/lcov-report/src/recovery/recovery.service.ts.html
  ```
- [ ] Add edge case tests:
  - Null descriptions
  - Empty request lists
  - Invalid status values
- [ ] Shoot for 85% coverage in recovery/

#### Task TH2: Test Pattern Documentation (Engineer 2)
- [ ] Create `TEST-PATTERNS.md`:
  ```markdown
  # Test Patterns — RECEDU
  
  ## Prisma Mock Pattern
  ```typescript
  mockPrisma.group.findUnique = jest.fn().mockResolvedValue({
    id: 1,
    institutionId: 100,
    // ...
  });
  ```
  
  ## Multi-tenant Test Vector
  ```typescript
  const actorA = { userId: 1, role: PROFESOR, institutionId: 100 };
  const resourceFromB = { id: 999, institutionId: 200 };
  expect(() => service.deleteRequest(actorA, resourceFromB.id))
    .toThrow(ForbiddenException);
  ```
  
  ## Idempotency Test
  ```typescript
  const result1 = await service.upsert(...);
  const result2 = await service.upsert(...);
  expect(result1.id).toBe(result2.id); // Same record
  ```
  ```

---

### Friday (2 hours)

#### Task F1: Full Test Suite Execution
- [ ] Run Phase 1 complete:
  ```bash
  npm run test:phase1 -- --coverage
  ```
- [ ] All tests must PASS
- [ ] Coverage must be ≥ 30% global

#### Task F2: Go/No-Go Decision
- [ ] Checkpoints:
  - [ ] recovery/ ≥ 80% coverage ✓
  - [ ] communication/deleteFeedback tested ✓
  - [ ] academic/assignSubjectToGroup tested ✓
  - [ ] 26+ tests passing ✓
  - [ ] All 3 security fixes validated ✓
  - [ ] Zero test flakiness ✓
  - [ ] < 2 min suite runtime ✓

#### Task F3: Decision
- **GO:** Phase 1 complete → Unlock Phase 2
- **NO-GO:** Identified, fix over weekend

---

## WEEK 2-3 RESOURCE ALLOCATION

| Task | Engineer | Duration | Phase |
|------|----------|----------|-------|
| performance/ tests (21) | E1 | 12 hours | 2 |
| academic/ remaining (13) | E1 | 8 hours | 2 |
| materials/ tests (14) | E2 | 10 hours | 2 |
| communication/ remaining (12) | E2 | 8 hours | 2 |
| schedule/ tests (12) | Parallel | 8 hours | 2 |
| institutions/ tests (6) | Parallel | 4 hours | 2 |
| **Integration DB tests** | E1 | 8 hours | 2 |
| **Code review + iteration** | Both | 4 hours | 2 |

**Total Phase 2:** 62 hours (distributed across 2 weeks, no crunch)

---

## WEEK 4 — FINALIZATION

| Task | Duration |
|------|----------|
| E2E Playwright (P0 flows) | 8 hours |
| Integration with test DB refinement | 4 hours |
| Coverage gap filling | 4 hours |
| Load test smoke (k6) | 2 hours |
| Final reporting + metrics | 2 hours |
| **Total Week 4** | **20 hours** |

---

## BLOCKER PREVENTION

### If tests fail frequently:
1. Review mocking pattern (copy from Phase 1 if works)
2. Add `console.log()` to service method to debug
3. Check Prisma mock return types match schema
4. Escalate to tech lead

### If coverage drops:
1. Run coverage report: `npm run test:coverage:report`
2. Identify uncovered branches
3. Add edge case tests
4. Document why certain branches untestable (if any)

### If test suite runs slow (> 10 sec):
1. Profile with `--detectOpenHandles`
2. Check for missing `afterEach` cleanup
3. Reduce number of E2E tests (focus on P0)

---

## SUCCESS CRITERIA — PHASE 1 SIGN-OFF

```
┌─────────────────────────────────────────────────┐
│           PHASE 1 GO/NO-GO CHECKPOINTS           │
└─────────────────────────────────────────────────┘

Coverage Metrics:
├─ recovery/: ≥ 80% .......... [ ] Checked
├─ communication/: ≥ 70% ..... [ ] Checked
├─ academic/: ≥ 50% (partial) [ ] Checked
└─ Global: ≥ 30% ............ [ ] Checked

Test Execution:
├─ 26+ tests PASSING ......... [ ] Verified
├─ 0 flaky tests ............ [ ] Confirmed
├─ < 2 min runtime .......... [ ] Validated
└─ CI/CD integration ready ... [ ] Checked

Security Fixes Validated:
├─ recovery.deleteRequest() .. [ ] Tested & documented
├─ recovery.updateRequestStatus() [ ] Tested & documented
└─ communication.deleteFeedback() [ ] Tested & documented

Documentation:
├─ TEST-PATTERNS.md created .. [ ] Reviewed
├─ Mocking strategy documented [ ] Readable
├─ Test data builders functional [ ] Verified
└─ Integration setup working .. [ ] Confirmed

Approval:
├─ Tech Lead sign-off ........ [ ] Signed
├─ QA Lead acceptance ........ [ ] Confirmed
└─ Proceed to Phase 2 ........ [ ] APPROVED

```

---

## LAUNCH ASSETS

**Files to Create This Week:**
- ✓ test/fixtures/prisma.mock.ts
- ✓ test/fixtures/builders.ts
- ✓ test/fixtures/seed-test-db.ts
- ✓ test/jest-integration.json
- ✓ src/recovery/recovery.service.spec.ts
- ✓ src/recovery/recovery.integration.spec.ts
- ✓ src/communication/communication.service.spec.ts (partial)
- ✓ src/academic/academic.service.spec.ts (partial)
- ✓ TEST-PATTERNS.md
- ✓ WEEK1-SUMMARY.md (for team update)

**Deployment Impact:**
- ❌ NO PRs merged this week (except critical bug fixes)
- ❌ NO deployments to production
- ✓ Staging available for team testing

---

## ESCALATION PATH

**If Engineer encounters blocker:**
1. Msg tech lead (max 30 min wait)
2. If unresolved: escalate to architect
3. Escalation: Friday 4pm → decision Monday morning

**If coverage won't reach 30%:**
1. Identify modules dragging down coverage
2. Add more test cases to that module
3. If still <30%: adjust Phase 2 to allocate more hours to high-gap module

---

## TEAM COMMUNICATION SCHEDULE

**Daily:**
- 9:00 AM — 15 min standup (slack thread)
- 4:00 PM — Status emoji reaction (✅ on-track, ⚠️ at-risk, 🔴 blocked)

**Weekly:**
- Friday 2 PM — Go/No-Go decision + next week plan

---

**Start: TOMORROW**  
**Phase 1 Gate: FRIDAY EOD**  
**Final Delivery: 4 weeks**  
**Deployment Unblock: When 70% coverage validated**

🚀 **Let's ship confident code.**

