# ÍNDICE MAESTRO — ESTRATEGIA DE BLINDAJE RECEDU

**Este documento:** Guía de navegación para los 4 documentos estratégicos creados.  
**Tiempo de lectura total:** 90 minutos (sin código)  
**Formato:** Estructura jerárquica para acceso rápido

---

## 📊 MAPA DE DOCUMENTOS

```
                    AUDIT REPORTS (Anteriores)
                            │
                            ▼
   ┌────────────────────────────────────────────────┐
   │  README-STRATEGY-OVERVIEW.md (COMIENZA AQUÍ) │  ← Executive summary
   │  [30 min] Problema + Solución + Roadmap      │
   └────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
    ┌──────────────────┐┌──────────────┐┌──────────────────┐
    │ESTRATEGIA-       ││DEPENDENCIAS- ││LAUNCH-CHECKLIST-│
    │BLINDAJE-RECEDU  ││ARQUITECTURA- ││WEEK1.md          │
    │[45 min]         ││TESTS.md      ││[15 min]          │
    │Para: Architects │││[20 min]     ││Para: Engineers   │
    │      Test leads │││Para: QA/SRE ││      Project Mgr │
    └──────────────────┘└──────────────┘└──────────────────┘
              │
              ├─ Test plan per module
              ├─ Mock requirements
              ├─ Phase 1/2/3 roadmap
              └─ Success criteria

↓
EXECUTION PHASE 1 (Week 1)
```

---

## 📖 DOCUMENTO 1: README-STRATEGY-OVERVIEW.md

**Propósito:** Portada ejecutiva + índice de navegación

**Longitud:** 4 páginas (30 min lectura)

**Audiencia:**
- Tech Lead (10 min overview)
- Project Manager (timeline + impact)
- Whole team (context setting)

**Secciones:**
```
1. The Problem (6.23% coverage → BLOCKED)
2. The Solution (4-week plan)
3. Roadmap Visualization
4. Risk Mitigation Scorecard
5. Resource & Timeline
6. Testing Pyramid
7. Critical Success Factors
8. Dependency Chain
9. Deliverables Tree
10. How to Use These Documents
11. Expected Impact
12. Approval Gate
13. Next Steps
```

**⚡ Quick Links:**
- For tech lead: → ESTRATEGIA-BLINDAJE-RECEDU.md Parts 1-3
- For QA: → DEPENDENCIAS-ARQUITECTURA-TESTS.md
- For SRE: → LAUNCH-CHECKLIST-WEEK1.md (Env Setup)
- For engineers: → LAUNCH-CHECKLIST-WEEK1.md (Full day plan)
- For product: → This doc section "Expected Impact"

---

## 📕 DOCUMENTO 2: ESTRATEGIA-BLINDAJE-RECEDU.md

**Propósito:** Plan técnico detallado para cada módulo & fase

**Longitud:** 25 páginas (45 min lectura)

**Audiencia:**
- Architects (module tiers, risk matrices)
- Test engineers (exact test requirements, mocks)
- Tech lead (approval)

**Estructura por Parte:**

### PARTE 1: Module Classification (5 pages)
```
┌─ Matriz de Riesgo Recedu (tabla 12 módulos)
│  ├─ Líneas de código
│  ├─ Cobertura actual
│  ├─ Tier (T1/T2/T3)
│  ├─ Riesgo multi-tenant 🔴🟡🟢
│  ├─ Riesgo legal
│  ├─ Prioridad
│  └─ Bloqueante deployment
│
└─ Decisiones:
   ├─ T1 modules = CRÍTICOS (recovery, performance, academic, communication, materials)
   ├─ T2 modules = IMPORTANTES (schedule, institutions, recovery-settings)
   └─ T3 modules = MANTENIMIENTO (users, auth, common)
```

**Key insight:** recovery > performance > academic > communication > materials (por riesgo)

### PARTE 2: Tier 1 Detailed Plans (15 pages)

#### 2.1 recovery/ (Criticidad MÁXIMA)
```
├─ 19 tests required
├─ Breakdown:
│  ├─ Unit: 9 tests
│  ├─ Integration: 5 tests
│  └─ E2E: 5 tests
├─ Mock spec: Complete Prisma mock
├─ Risk level: 🔴 CRITICAL
└─ Success metric: 85% coverage
```

#### 2.2 performance/ (MISIÓN-CRÍTICA — GDPR/COPPA)
```
├─ 21 tests required
├─ Focus: Grade CRUD, Attendance idempotency, Audit trail
├─ Mock spec: Prisma mock + calculation verification
├─ Risk level: 🔴 CRITICAL
└─ Success metric: 80% coverage
```

#### 2.3 academic/ (CRÍTICA — Foundation)
```
├─ 25 tests required
├─ Focus: Period lifecycle, Group ops, Enrollment, Subject assignment
├─ Mock spec: Prisma mock + FK validation
├─ Risk level: 🔴 CRITICAL
└─ Success metric: 85% coverage
```

#### 2.4 communication/ (CRÍTICA — GDPR)
```
├─ 15 tests required
├─ Focus: Feedback CRUD, Institution boundary (security fix)
├─ Mock spec: Prisma mock + notification cascade
├─ Risk level: 🔴 CRITICAL
└─ Success metric: 80% coverage
```

#### 2.5 materials/ (CRÍTICA — Security)
```
├─ 14 tests required
├─ Focus: File validation, path traversal, upload security
├─ Mock spec: fs.promises mock + Prisma mock
├─ Risk level: 🔴 CRITICAL
└─ Success metric: 75% coverage
```

**Each section contains:**
- Method-by-method test matrix
- Input/output specifications
- Risk assessment per method
- Mock requirements
- Integration test strategy

### PARTE 3: Tier 2 Compressed Plans (3 pages)

```
├─ schedule/ (12 tests, 75% target)
├─ institutions/ (6 tests, 85% target)
└─ recovery-settings/ (5 tests, 80% target)
```

### PARTE 4: Phased Implementation (4 pages)

```
FASE 1 (Semana 1 — 20 horas)
├─ Módulos: recovery, communication.deleteFeedback, academic.assignSubjectToGroup
├─ Objetivo: 30% cobertura global
├─ Entregables: Mocks + 26 tests
└─ Bloquea Phase 2 hasta completarse

FASE 2 (Semanas 2-3 — 35 horas)
├─ Módulos: performance (full), academic (remaining), communication (remaining), materials, schedule, institutions
├─ Objetivo: 55% cobertura global
├─ Entregables: 78 tests + test DB setup
└─ Requiere Phase 1 passing

FASE 3 (Semana 4 — 21 horas)
├─ E2E Playwright, Integration refinement, Coverage gaps
├─ Objetivo: 70% cobertura global
├─ Entregables: 20-30 E2E tests + metrics
└─ Deployment unblocked
```

### PARTE 5: Fixtures & Shared Mocks (2 pages)

```
├─ Prisma Mock Factory Pattern
├─ Test Data Builders (actor, institution, period, group, etc.)
├─ Test Database Seeding
├─ Connection Management
└─ Cleanup Strategies
```

### PARTE 6: CI/CD Configuration (1 page)

```
├─ Jest config updates
├─ Coverage thresholds by module
├─ Test runner scripts (npm run test:unit, test:integration, etc.)
└─ GitHub Actions reference
```

### PARTE 7-10: Matrices & Appendices (4 pages)

```
├─ Risk matrix post-Phase 1/2/3
├─ Success metrics table
├─ Dependencies list
└─ Next steps before code
```

**⚡ Navigation Tips:**
- Want to know what tests to write for recovery/? → Section 2.1
- Want test counts? → Table at start of PARTE 3
- Want mock specifications? → Each module section
- Want Jest config? → PARTE 6
- Want coverage targets? → Summary table PARTE 8

---

## 📗 DOCUMENTO 3: DEPENDENCIAS-ARQUITECTURA-TESTS.md

**Propósito:** Visual architecture guide + service dependency matrix

**Longitud:** 12 páginas (20 min lectura)

**Audiencia:**
- QA leads (understand dependencies)
- SRE/DevOps (test DB strategy)
- Architects (validate design)

**Estructura:**

### PARTE 1: Dependency Graph (3 pages)

```
ASCII art diagrams showing:
├─ Authentication Layer (✅ tested)
├─ Academic Structure Layer (🔴 untested)
├─ Performance & Grading Layer (🔴 untested)
├─ Recovery & Support Layer (🔴 untested)
├─ Communication Layer (🔴 untested)
├─ Materials & Content Layer (🔴 untested)
├─ Scheduling Layer (🟡 untested)
└─ Tenant Boundary Enforcement (patterns)
```

**Key insight:** academic/ is FOUNDATION → everything depends on it

### PARTE 2: Test Execution Tree (3 pages)

```
Phase 1 (Week 1)
├─ Fixture Setup
├─ recovery/ tests (19)
├─ communication/ partial (3)
├─ academic/ partial (4)
└─ → 30% coverage

Phase 2 (Weeks 2-3)
├─ performance/ (21)
├─ academic/ remaining (13)
├─ communication/ remaining (12)
├─ materials/ (14)
├─ schedule/ (12)
├─ institutions/ (6)
└─ → 55% coverage

Phase 3 (Week 4)
├─ E2E Playwright
├─ Integration + Test DB
├─ Coverage gaps
└─ → 70% coverage
```

### PARTE 3: Service-to-Service Call Matrix (2 pages)

```
academic.service
├─ Calls: Prisma (all academic models)
└─ Called by: performance, recovery, communication, materials, schedule

performance.service
├─ Calls: academic* (implicitly), Prisma (grades, attendance)
└─ Called by: Controllers, Reports

recovery.service
├─ Calls: academic.findGroup, Prisma (requests, activities)
└─ Called by: Controllers

... etc for all 12 services
```

**Why this matters:**
- If academic tests fail → everything blocks
- If performance tests need Groups → academic must be tested first
- If recovery needs StudentGroup → academic must be working

### PARTE 4: Mock Strategy by Layer (2 pages)

```
Unit Tests: MOCK Prisma completely
Integration Tests: REAL Prisma + Test Database
E2E Tests: REAL database (staging)

File System: Mock fs.promises in unit, real temp dir in integration
```

### PARTE 5-6: Circular Dependency + Rationale (2 pages)

```
WHY recovery/ first?
├─ Highest security risk
├─ Most critical fix
├─ Self-contained (doesn't need other tests passing)
└─ Fastest ROI (85% coverage, 20 hours)

WHY performance/ second?
├─ Highest legal risk (GDPR grades)
├─ Related to academic (depends on Groups)
├─ Needs recovery proven to establish patterns
└─ Benefits from academic being partially ready

WHY academic/ throughout?
├─ Foundation for everything
├─ Tests in Phase 1 (partial) unlock Phase 2
├─ Full Phase 2 tests complete foundation
```

---

## 📙 DOCUMENTO 4: LAUNCH-CHECKLIST-WEEK1.md

**Propósito:** Día-a-día execution plan para Semana 1

**Longitud:** 8 páginas (15 min lectura)

**Audiencia:**
- Engineers (what to do Monday-Friday)
- Project manager (timeline execution)
- Tech lead (go/no-go verification)

**Estructura:**

### Executive Summary (1 page)
```
Current state: 6.23% coverage (BLOCKED)
Decision: Execute 4-week plan
Resource: 2 engineers
Timeline: Monday-Friday
Success: 26 tests passing, 30% coverage
```

### Week 1 Critical Path (4 pages)

#### Monday (2 hours)
```
M1. Project Kickoff (sign-offs)
M2. Environment Setup (Docker DB, .env.test)
M3. Jest Configuration (jest.config.ts, jest-integration.json)
M4. Prisma Mock Factory (test/fixtures/prisma.mock.ts)
M5. GitHub Project (issues + milestone)
```

#### Tuesday (8 hours)
```
T1. recovery/ Service Tests (19 tests unit)
T2. Unit Test Execution & Iteration (debug mocks)
T3. communication/deleteFeedback Tests (3 tests)
T4. academic/assignSubjectToGroup Tests (4 tests)
T5. Coverage Report (screenshot vs baseline)
```

#### Wednesday (6 hours)
```
W1. recovery.integration.spec.ts (5 integration tests)
W2. Phase 1 Test Summary (report coverage delta)
```

#### Thursday (4 hours)
```
TH1. Coverage Gaps & Edge Cases (improve recovery/ to 85%)
TH2. Test Pattern Documentation (TEST-PATTERNS.md)
```

#### Friday (2 hours)
```
F1. Full Test Suite Execution (npm run test:phase1)
F2. Go/No-Go Decision (verify checklist)
F3. Decision (GO → Phase 2, NO-GO → weekend fix)
```

### Week 2-3 Resource Allocation (1 page)

```
Task                    Engineer   Duration   Phase
────────────────────────────────────────────────────
performance/            E1         12 hrs     2
academic/ remaining     E1         8 hrs      2
materials/              E2         10 hrs     2
communication/          E2         8 hrs      2
schedule/               Both       8 hrs      2
institutions/           Both       4 hrs      2
Integration DB tests    E1         8 hrs      2
Code review             Both       4 hrs      2

Total: 62 hours across 2 people (no crunch)
```

### Week 4 Finalization (compact)

```
E2E Playwright  (8 hrs)
Integration     (4 hrs)
Coverage gaps   (4 hrs)
Load test       (2 hrs)
Reporting       (2 hrs)
```

### Critical Success Factors (1 page)

```
✓ MUST HAVE:
├─ Prisma Mock Factory
├─ Test Data Builders
├─ Test Database Setup
├─ Jest Configuration
└─ Phase 1 Tests Passing (26+, 0 flaky, ≥30% coverage)

⚠️ NICE-TO-HAVE:
├─ CI/CD integration
├─ Coverage reports (Codecov)
└─ Performance monitoring (k6)
```

### Go/No-Go Checkpoints (1 page)

```
Coverage Metrics
├─ recovery/: ≥ 80% .......... [ ]
├─ communication/: ≥ 70% ..... [ ]
├─ academic/: ≥ 50% ......... [ ]
└─ Global: ≥ 30% ........... [ ]

Test Execution
├─ 26+ tests PASSING ......... [ ]
├─ 0 flaky tests ............ [ ]
├─ < 2 min runtime .......... [ ]
└─ CI/CD integration ready ... [ ]

Security Fixes
├─ recovery.deleteRequest() .. [ ]
├─ recovery.updateRequestStatus() [ ]
└─ communication.deleteFeedback() [ ]

Approval
├─ Tech Lead sign-off ........ [ ]
├─ QA Lead acceptance ........ [ ]
└─ Proceed to Phase 2 ........ [ ]
```

**⚡ How to use for daily standup:**
- Morning: "Today's focus is Task T2 (unit test iteration)"
- 4pm: "Mark TH1 ✅ if complete, else document blocker"
- Friday: Fill Go/No-Go checklist, make decision

---

## 🔀 NAVIGATION DECISION TREE

### "I'm a tech lead approving this strategy"
```
1. Read README-STRATEGY-OVERVIEW.md (30 min)
   ├─ Understand problem + 4-week solution
   ├─ Review impact metrics
   └─ Approve or request changes
2. Scan ESTRATEGIA-BLINDAJE-RECEDU.md Parts 1-3 (20 min)
   ├─ Verify module tier classification
   ├─ Check test counts seem reasonable
   └─ Validate mock strategy
3. Review LAUNCH-CHECKLIST-WEEK1.md Success Criteria (10 min)
   └─ Set up go/no-go expectations with team
→ SIGN OFF
```

### "I'm a test engineer starting Phase 1"
```
1. Read README-STRATEGY-OVERVIEW.md (30 min)
   └─ Get context
2. Read LAUNCH-CHECKLIST-WEEK1.md (15 min)
   ├─ Know Monday-Friday plan
   ├─ Set up environment
   └─ Start Task M1
3. Refer to ESTRATEGIA-BLINDAJE-RECEDU.md Section 2.1 (recovery/)
   ├─ Understand all 19 tests needed
   ├─ Mock spec from this section
   └─ Start writing recovery.service.spec.ts
4. Refer to DEPENDENCIAS-ARQUITECTURA-TESTS.md PARTE 4 (mock strategy)
   └─ Use patterns for other modules
→ EXECUTE Phase 1
```

### "I'm QA validating the plan is sound"
```
1. Read README-STRATEGY-OVERVIEW.md (30 min)
   ├─ Coverage targets
   ├─ Risk mitigation scorecard
   └─ Success metrics
2. Read DEPENDENCIAS-ARQUITECTURA-TESTS.md (20 min)
   ├─ Understand why this order
   ├─ Validate service dependencies
   └─ Verify multi-tenancy test matrix
3. Read ESTRATEGIA-BLINDAJE-RECEDU.md PARTE 7 (risk matrix)
   └─ Confirm risks blocked by phase
→ VALIDATE & APPROVE
```

### "I'm DevOps setting up test infrastructure"
```
1. Read LAUNCH-CHECKLIST-WEEK1.md Tasks M2-M3 (10 min)
   ├─ Docker DB container setup
   ├─ .env.test configuration
   ├─ Migration pipeline
   └─ Start container before Engineer 1 Monday
2. Read ESTRATEGIA-BLINDAJE-RECEDU.md PARTE 5 (fixtures)
   ├─ Test database seeding pattern
   ├─ Cleanup strategy (TRUNCATE)
   └─ Provide scripts to engineers
3. Read ESTRATEGIA-BLINDAJE-RECEDU.md PARTE 6 (CI/CD)
   └─ Prepare jest.config.ts + coverage thresholds
→ SETUP INFRASTRUCTURE
```

### "I'm a developer curious about the whole plan"
```
1. Read README-STRATEGY-OVERVIEW.md (30 min) ← Start here
2. Skim ESTRATEGIA-BLINDAJE-RECEDU.md (15 min) ← Get sense of modules
3. Skim DEPENDENCIAS-ARQUITECTURA-TESTS.md (10 min) ← Why this order
4. Read LAUNCH-CHECKLIST-WEEK1.md (15 min) ← Monday plan
→ UNDERSTAND & CONTRIBUTE
```

---

## 📌 QUICK REFERENCE INDEX

### By Question

**"When do I start testing [MODULE]?"**
→ ESTRATEGIA-BLINDAJE-RECEDU.md PARTE 4 (phased implementation)

**"What tests should I write for recovery/service?"**
→ ESTRATEGIA-BLINDAJE-RECEDU.md Section 2.1 (19 tests listed)

**"How do I mock Prisma for tests?"**
→ ESTRATEGIA-BLINDAJE-RECEDU.md PARTE 5 + DEPENDENCIAS-ARQUITECTURA-TESTS.md PARTE 4

**"Why does academic/ need to be tested first?"**
→ DEPENDENCIAS-ARQUITECTURA-TESTS.md PARTE 1 & 6 (dependency chain)

**"What's the Phase 1 go/no-go criteria?"**
→ LAUNCH-CHECKLIST-WEEK1.md last section

**"What's my task for tomorrow?"**
→ LAUNCH-CHECKLIST-WEEK1.md Week 1 day-by-day

**"What's the multi-tenancy test pattern?"**
→ DEPENDENCIAS-ARQUITECTURA-TESTS.md PARTE 1 (Tenant Boundary section)

**"How many tests per module total?"**
→ ESTRATEGIA-BLINDAJE-RECEDU.md PARTE 3 (summary table)

**"What's the expected coverage week-by-week?"**
→ README-STRATEGY-OVERVIEW.md Roadmap section OR ESTRATEGIA-BLINDAJE-RECEDU.md PARTE 8

**"What if a test fails in Phase 1?"**
→ LAUNCH-CHECKLIST-WEEK1.md Blocker Prevention section

---

## 📊 DOCUMENT STATISTICS

| Document | Pages | Words | Time | Audience |
|----------|-------|-------|------|----------|
| README-STRATEGY-OVERVIEW.md | 4 | 2,500 | 30 min | Everyone |
| ESTRATEGIA-BLINDAJE-RECEDU.md | 25 | 12,000 | 45 min | Tech leads / Engineers |
| DEPENDENCIAS-ARQUITECTURA-TESTS.md | 12 | 6,000 | 20 min | QA / Architects |
| LAUNCH-CHECKLIST-WEEK1.md | 8 | 4,000 | 15 min | Engineers / Project mgr |
| **TOTAL** | **49** | **24,500** | **110 min** | Cross-functional |

---

## ✅ APPROVAL CHECKLIST

Before proceeding to Phase 1:

- [ ] README-STRATEGY-OVERVIEW.md read & approved by Tech Lead
- [ ] ESTRATEGIA-BLINDAJE-RECEDU.md reviewed by Test Lead
- [ ] DEPENDENCIAS-ARQUITECTURA-TESTS.md validated by Architect
- [ ] LAUNCH-CHECKLIST-WEEK1.md scheduled with 2 engineers
- [ ] Environment (Docker DB) ready for Monday
- [ ] Jest configuration files prepared
- [ ] GitHub Project created with Phase 1 issues
- [ ] **Decision recorded:** ✅ APPROVED TO PROCEED

---

## 🚀 WHERE TO NEXT

Once all documents are read and approved:

→ **Open [LAUNCH-CHECKLIST-WEEK1.md](LAUNCH-CHECKLIST-WEEK1.md)**

→ **Start Monday with Task M1: Project Kickoff**

→ **Friday EOD: Go/No-Go decision**

---

## 📞 QUESTIONS DURING EXECUTION

| Issue | Document Section | Solution |
|-------|------------------|----------|
| "What tests for [module]?" | ESTRATEGIA-BLINDAJE → 2.X | Reference test matrix |
| "How to mock [service]?" | ESTRATEGIA-BLINDAJE → PARTE 5 | Copy mock factory pattern |
| "Why test order?" | DEPENDENCIAS-ARQUITECTURA → PARTE 6 | Read rationale |
| "Is this blocker go/no-go?" | LAUNCH-CHECKLIST → Success Criteria | Check list |
| "Test running slow?" | LAUNCH-CHECKLIST → Blocker Prevention | Profile + fix |

---

**Status:** 🟢 READY TO LAUNCH  
**Approval:** Pending tech lead sign-off  
**Next:** Execute Phase 1 (starting Monday)

✅ **All 4 strategic documents complete. No code written yet (per request).**

