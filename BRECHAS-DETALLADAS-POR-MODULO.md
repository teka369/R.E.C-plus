# 📋 MATRIZ DETALLADA DE BRECHAS POR MÓDULO

**Auditoría Externa - 21 de marzo de 2026**

---

## 1. ACADEMIC MODULE (1,172 líneas, 0% cobertura)

### Métodos Críticos Sin Tests

```
✗ createGrade(actor, dto)
  ├─ Risk: [MEDIA] SECRETARIA crea grado en institution B
  ├─ Missing: Cross-institution check
  ├─ Test Case: createGrade({ institutionId: 2 }, { nombre: '10' })
  ├─ Expected: 403
  └─ Current: UNKNOWN (no test)

✗ createGroup(actor, dto)  
  ├─ Risk: [CRÍTICA] Crear grupo ligado a período inactivo
  ├─ Missing: Period active status validation
  ├─ Test Case: createGroup(actor, { periodId: INACTIVE_ID })
  ├─ Expected: 400
  └─ Current: UNKNOWN (no test)

✗ assignSubjectToGroup(actor, dto) ⚠️ CAMBIO DE SEGURIDAD
  ├─ Risk: [CRÍTICA] Permitir asignar período de institución ajena
  ├─ Missing: Unit test para validar institutionWhere
  ├─ Test Case: assignSubjectToGroup(directorA, { groupB, subjectB })
  ├─ Expected: 403 (group de institución diferente)
  └─ Current: Código tiene fix pero NO TESTADO

✗ assignStudentToGroup(actor, dto)
  ├─ Risk: [CRÍTICA] Estudiante A entra a grupo de institución B
  ├─ Missing: Cross-tenant isolation validation
  ├─ Test Case: assignStudentToGroup(director, { studentB, groupA })
  ├─ Expected: 403 (student de otra institución)
  └─ Current: UNKNOWN (no test)

✗ listGroupSubjects(actor, groupId)
  ├─ Risk: [ALTA] SECRETARIA A ve materias de grupo institución B
  ├─ Missing: Institution boundary in WHERE clause
  ├─ Test Case: listGroupSubjects(secretariaA, groupIdB)
  ├─ Expected: 403 or empty
  └─ Current: UNKNOWN (no test)

✗ deleteGroup(actor, id)
  ├─ Risk: [ALTA] Elimina grupo sin validar cascade integrity
  ├─ Missing: Cascading delete test, orphan check
  ├─ Test Case: deleteGroup(director, groupWithStudents)
  ├─ Expected: StudentGroups also deleted, no orphans
  └─ Current: UNKNOWN (no test)
```

### Rutas de Ataque Conocidas (No Cubiertas)

```
Attack Vector 1: Cross-Institution Period Linking
  Intento: Directora A asigna materia a período de institución B
  Código corregido en assignSubjectToGroup:
    const activePeriod = await prisma.academicPeriod.findFirst({
      where: { 
        estado: ACTIVE,
        ...this.institutionWhere(actor)  ← FIX AQUÍ
      }
    })
  Problema: NO HAY TEST unitario que valide esta protección
  Impacto: Si alguien refactoriza y quita institutionWhere, no se detecta

Attack Vector 2: Cross-Institution Student Assignment
  Intento: SECRETARIA A agrega estudiante C (institución B) a grupo A
  Código esperado: assignStudentToGroup debería validar
    - studentId: belongs to same institution
    - groupId: belongs to same institution
  Problema: SIN TEST para este escenario
  Impacto: Datos de estudiantes se mezclan entre instituciones
```

---

## 2. COMMUNICATION MODULE (377 líneas, 0% cobertura)

### Métodos Críticos Sin Tests

```
✗ createFeedback(actor, dto)
  ├─ Risk: [CRÍTICA] Profesor A deja feedback a estudiante de institución B
  ├─ Missing: Cross-institution validation
  ├─ Test Case: createFeedback(teacherA, { groupB })
  ├─ Expected: 403
  └─ Current: UNKNOWN

✗ deleteFeedback(feedbackId, actor) ⚠️ CAMBIO DE SEGURIDAD
  ├─ Risk: [CRÍTICA] Feedback eliminable por secretaria de diferente institución
  ├─ Missing: Unit test para validar group.institutionId
  ├─ Test Case: deleteFeedback(feedbackIdB, secretariaA)
  ├─ Expected: 403
  └─ Current: Código tiene fix pero NO TESTADO

✗ listFeedbackByGroup(groupId, actor)
  ├─ Risk: [ALTA] SECRETARIA A accede feedback de grupo institución B
  ├─ Missing: Institution boundary
  ├─ Test Case: listFeedbackByGroup(groupB, secretariaA)
  ├─ Expected: 403 or empty
  └─ Current: UNKNOWN

✗ sendMessage(actor, dto)
  ├─ Risk: [CRÍTICA] Mensaje entre instituciones
  ├─ Missing: Recipient institution check
  ├─ Test Case: sendMessage(userA, { recipientB })
  ├─ Expected: 403 (different institutions)
  └─ Current: UNKNOWN

✗ sendNotification(actor, dto)
  ├─ Risk: [ALTA] Notificaciones a usuarios ajenos
  ├─ Missing: Batch notification isolation
  ├─ Test Case: sendNotification(admin, { userIdsFromB: [...] })
  ├─ Expected: 403 or filter to same institution
  └─ Current: UNKNOWN
```

### Rutas de Ataque Conocidas

```
Attack Vector 1: Feedback Cross-Institution Deletion
  Intento: Secretaria A (instB) borra feedback a estudiante A (instA)
  Código corregido:
    const existing = await prisma.feedback.findUnique({
      where: { id },
      include: { group: { select: { institutionId: true } } }
    });
    if (existing.group.institutionId !== getActorInstitutionId(actor)) {
      throw new ForbiddenException();  ← FIX AQUÍ
    }
  Problema: NO HAY TEST unitario
  Impacto: Secretaria puede borrar evaluaciones de otros colegios

Attack Vector 2: Message Recipient Validation
  Intento: Usuario A (instA) envía mensaje a usuario B (instB)
  Código esperado: Validar que recipient.institutionId === actor.institutionId
  Problema: SIN TESTS
  Impacto: Mensajes se filtran entre instituciones
```

---

## 3. PERFORMANCE MODULE (1,322 líneas, 0% cobertura)

### Métodos Críticos Sin Tests

```
✗ createGrade(actor, dto)
  ├─ Risk: [CRÍTICA] Calificación en materia ajena
  ├─ Missing: Subject-teacher ownership validation
  ├─ Test Case: createGrade(teacherA, { subjectB })
  ├─ Expected: 403
  └─ Current: UNKNOWN

✗ updateGrade(actor, gradeId, newValue)
  ├─ Risk: [CRÍTICA] Profesor A modifica calificación de profesor B
  ├─ Missing: Ownership + cross-tenant check
  ├─ Test Case: updateGrade(teacherA, gradeFromTeacherB)
  ├─ Expected: 403
  └─ Current: UNKNOWN

✗ deleteGrade(actor, id)
  ├─ Risk: [CRÍTICA] Eliminar calificación de otro profesor
  ├─ Missing: Ownership validation
  ├─ Test Case: deleteGrade(teacherA, gradeFromTeacherB)
  ├─ Expected: 403
  └─ Current: UNKNOWN

✗ markAttendance(actor, dto)
  ├─ Risk: [CRÍTICA] Asistencia doble + datos de menores
  ├─ Missing: Idempotency check, date validation
  ├─ Test Case: markAttendance(teacher, { date: FUTURE })
  ├─ Expected: 400 (future date)
  └─ Current: UNKNOWN

✗ listStudentGrades(actor, studentId)
  ├─ Risk: [CRÍTICA] Acceso a calificaciones de estudiante ajeno
  ├─ Missing: Authorization matrix
  ├─ Test Case: listStudentGrades(teacherA, studentB)
  ├─ Expected: 403 or filtered
  └─ Current: UNKNOWN
```

### Rutas de Ataque Conocidas

```
Attack Vector 1: Grade Tampering
  Intento: Profesor A modifica calificación de profesor B
  Escenario: Grupo tiene 2 profesores (Math: A, Lang: B)
  Ataque: A intenta actualizar calificación de B
  Código esperado:
    const grade = await getGrade(id);
    if (grade.createdByTeacherId !== actor.userId && actor.role !== 'SECRETARIA') {
      throw new ForbiddenException();
    }
  Problema: SIN TESTS
  Impacto: Fraude académico, datos de menores comprometidos

Attack Vector 2: Attendance Manipulation
  Intento: Profesor registra asistencia futura (próximo lunes)
  Escenario: Habilitar fecha futura para manipular reportes
  Código esperado:
    if (dto.date > TODAY) throw new BadRequestException();
  Problema: SIN TESTS
  Impacto: Reportes de asistencia inconsistentes, datos de menores
```

---

## 4. RECOVERY MODULE (761 líneas, 0% cobertura)

### Métodos Críticos Sin Tests

```
✗ updateRequestStatus(actor, id, dto) ⚠️ CAMBIO DE SEGURIDAD
  ├─ Risk: [CRÍTICA] Profesor A aprueba solicitudes de profesor B
  ├─ Missing: Unit test para ensureRequestAccess
  ├─ Test Case: updateRequestStatus(teacherA, requestFromTeacherB)
  ├─ Expected: 403
  └─ Current: Código tiene fix (ensureRequestAccess) pero NO TESTADO

✗ deleteRequest(actor, id) ⚠️ CAMBIO DE SEGURIDAD
  ├─ Risk: [CRÍTICA] Profesor A borra solicitudes de profesor B
  ├─ Missing: Unit test para ensureRequestAccess
  ├─ Test Case: deleteRequest(teacherA, requestIdFromTeacherB)
  ├─ Expected: 403
  └─ Current: Código tiene fix pero NO TESTADO

✗ deleteActivity(actor, id, dto)
  ├─ Risk: [CRÍTICA] Elimina actividad de another teacher
  ├─ Missing: Owner verification
  ├─ Test Case: deleteActivity(teacherA, activityFromTeacherB)
  ├─ Expected: 403
  └─ Current: UNKNOWN

✗ createActivity(actor, requestId, dto)
  ├─ Risk: [ALTA] Agregar actividad a solicitud ajena
  ├─ Missing: Request ownership
  ├─ Test Case: createActivity(teacherA, requestB)
  ├─ Expected: 403
  └─ Current: UNKNOWN

✗ listMyActivities(actor)
  ├─ Risk: [MEDIA] Filter por student vs teacher
  ├─ Missing: Role-based activity visibility
  ├─ Test Case: listMyActivities(studentA) → debe retornar solo sus
  ├─ Expected: ✓ Solo actividades donde es estudiante
  └─ Current: UNKNOWN
```

### Rutas de Ataque Conocidas

```
Attack Vector 1: Cross-Teacher Request Modification
  Intento: Profesor A aprueba solicitud de profesor B
  Escenario: 
    - Profesor B tiene solicitud PENDING de estudiante C
    - Profesor A intenta PATCH /recovery/requests/{id}/status → APPROVED
  Código corregido:
    const request = await this.ensureRequestAccess(actor, id);  ← FIX
  Problema: NO HAY TEST unitario que valide ensureRequestAccess
  Impacto: Profesor A puede aprobar recuperaciones de profesor B
  Detección: Integration test detectaría (si PostgreSQL estuviera disponible)

Attack Vector 2: Recovery Request Deletion
  Intento: Profesor A elimina solicitud de profesor B
  Escenario: Similar a arriba, pero DELETE
  Código original (roto):
    const request = await this.prisma.recoveryRequest.findUnique({ 
      where: { id } 
    });
  Código corregido:
    const request = await this.ensureRequestAccess(actor, id);  ← FIX
  Problema: NO HAY TEST unitario
  Impacto: Profesor puede borrar registros de otro profesor
  
Attack Vector 3: Activity Ownership
  Intento: Profesor A borra actividad de profesor B
  Código esperado en deleteActivity:
    const activity = await getActivity(id);
    validate activity.request.teacherId === actor.userId
  Problema: SIN TESTS
  Impacto: Pérdida de registro de seguimiento
```

---

## 5. MATERIALS MODULE (751 líneas, 0% cobertura)

### Métodos Críticos Sin Tests

```
✗ uploadMaterial(actor, dto, file)
  ├─ Risk: [CRÍTICA] File type + size validation sin tests
  ├─ Missing: Malicious file detection
  ├─ Test Cases: 
  │   1) Zip bomb (45MB comprimido → 500GB descomprimido)
  │   2) Executable (.exe masqueraded as .pdf)
  │   3) Negative file size
  ├─ Expected: All 400 or 413
  └─ Current: UNKNOWN (no test)

✗ downloadMaterial(actor, id)
  ├─ Risk: [CRÍTICA] Path traversal + timing attack
  ├─ Missing: Path sanitization validation
  ├─ Test Case: downloadMaterial(actor, { path: '../../etc/passwd' })
  ├─ Expected: 403 or not found
  └─ Current: UNKNOWN

✗ deleteMaterial(actor, id)
  ├─ Risk: [ALTA] Publisher intenta borrar material de otro
  ├─ Missing: Ownership check
  ├─ Test Case: deleteMaterial(teacher1, materialFromTeacher2)
  ├─ Expected: 403
  └─ Current: UNKNOWN

✗ listMaterialsByGroup(actor, groupId)
  ├─ Risk: [ALTA] Cross-institution material listing
  ├─ Missing: Institution boundary
  ├─ Test Case: listMaterialsByGroup(teacherA, groupB)
  ├─ Expected: 403 or empty
  └─ Current: UNKNOWN
```

### Rutas de Ataque Conocidas

```
Attack Vector 1: Malicious File Upload
  Intento: Upload de .exe como docente
  Escenario:
    - Malware.exe renombrado a Syllabus.pdf
    - Sube vía uploadMaterial con content-type application/pdf
    - Estudiante descarga y ejecuta
  Código esperado:
    - Validar MIME type vs extension
    - Verificar magic bytes
    - Ejecutar validación de virus
  Problema: SIN TESTS unitarios
  Impacto: Malware en computadoras de menores

Attack Vector 2: Disk Space Exhaustion
  Intento: Intento DoS con zip bombs
  Escenario:
    - 45MB zip que descomprime a 500GB
    - Agota almacenamiento y servidor cae
  Código esperado:
    - Validar tamaño descomprimido
    - Poner limite (ej: 100MB maxSize)
    - Usar streaming, no descomprimir en memoria
  Problema: SIN TESTS
  Impacto: Denegación de servicio

Attack Vector 3: Path Traversal
  Intento: Acceder a archivo fuera del directorio de materiales
  Escenario:
    - downloadMaterial(actor, { fileId: '../../src/app.module.ts' })
    - O peor: '../../.env' (credenciales expuestas)
  Código esperado:
    - Sanitizar fileId (solo números/UUID)
    - Validar que archivo está en directorio permitido
    - No concatenar rutas directamente
  Problema: SIN TESTS
  Impacto: Exposición de código fuente y credenciales
```

---

## 6. SCHEDULE MODULE (329 líneas, 0% cobertura)

### Métodos Críticos Sin Tests

```
✗ createSchedule(actor, dto)
  ├─ Risk: [ALTA] Horario conflictativo
  ├─ Missing: Conflict detection tests
  ├─ Test Case: createSchedule(director, { teacher, time, group1, group2 })
  ├─ Expected: 400 (same teacher, overlapping times)
  └─ Current: UNKNOWN

✗ getScheduleByGroup(actor, groupId)
  ├─ Risk: [MEDIA] Cross-institution access to schedule
  ├─ Missing: Institution boundary
  ├─ Test Case: getScheduleByGroup(directorA, groupB)
  ├─ Expected: 403 or empty
  └─ Current: UNKNOWN

✗ generateWeeklySchedule(actor, groupId)
  ├─ Risk: [MEDIA] Bulk generation without validation
  ├─ Missing: Atomic transaction + rollback
  ├─ Test Case: generateWeeklySchedule - falla a mitad
  ├─ Expected: Todo o nada (ACID)
  └─ Current: UNKNOWN (no transaction test)
```

---

## 7. INSTITUTIONS MODULE (163 líneas, 0% cobertura)

```
✗ createInstitution(actor, dto)
  ├─ Risk: [MEDIA] Solo SUPER_ADMIN debería crear
  ├─ Missing: Role validation
  ├─ Test Case: createInstitution(secretaria, {...})
  ├─ Expected: 403
  └─ Current: UNKNOWN

✗ updateInstitution(actor, id, dto)
  ├─ Risk: [MEDIA] SECRETARIA A modifica institución B
  ├─ Missing: Ownership check
  ├─ Test Case: updateInstitution(directora, changedId)
  ├─ Expected: 403
  └─ Current: UNKNOWN
```

---

## 8. RECOVERY-SETTINGS MODULE (255 líneas, 0% cobertura)

```
✗ updateSettings(actor, dto)
  ├─ Risk: [MEDIA] SECRETARIA A cambia settings de institución B
  ├─ Missing: Institution boundary
  ├─ Test Case: updateSettings(secretariaA, instiutionB)
  ├─ Expected: 403
  └─ Current: UNKNOWN
```

---

## RESUMEN DE BRECHAS

### Por Criticidad

```
CRÍTICA (Producción bloqueado sin tests):
  ✗ academic.assignSubjectToGroup (código tiene fix, sin test)
  ✗ academic.assignStudentToGroup (sin cross-tenant test)
  ✗ communication.deleteFeedback (código tiene fix, sin test)
  ✗ communication.sendMessage (sin institution check test)
  ✗ performance.createGrade (sin ownership test)
  ✗ performance.updateGrade (sin ownership test)
  ✗ performance.markAttendance (sin idempotency test)
  ✗ recovery.updateRequestStatus (código tiene fix, sin test)
  ✗ recovery.deleteRequest (código tiene fix, sin test)
  ✗ materials.uploadMaterial (sin file type validation test)
  Total: 10 métodos críticos sin tests

ALTA (Importante antes de producción):
  ✗ 12 métodos adicionales
  Total: 12 métodos

MEDIA (Nice to have antes de producción):
  ✗ 8+ métodos
  Total: 8+ métodos
```

### Por Tipo de Validación Faltante

```
Falta: Cross-Institution Isolation
  Count: 8 métodos
  Files: academic, communication, materials, schedule, institutions
  Impact: Datos de múltiples colegios se mezclan

Falta: Ownership/Authorization
  Count: 6 métodos
  Files: performance, recovery, materials
  Impact: Acceso a datos de otros usuarios

Falta: Input Validation
  Count: 5 métodos
  Files: materials (file), schedule (time), academic (period status)
  Impact: Datos inválidos en BD, DoS

Falta: Idempotency/Transaction Safety
  Count: 3 métodos
  Files: performance (attendance), schedule (generation)
  Impact: Datos duplicados o inconsistentes
```

---

## PLAN DE CIERRE DE BRECHAS

### Prioridad Tier 1 (Semana 1)

```
[ ] Agregar 10 unit tests para 10 métodos CRÍTICA
    Módulos: academic.assignSubjectToGroup, communication.deleteFeedback,
             recovery.deleteRequest, recovery.updateRequestStatus
    Horas: 20h
    
[ ] Ejecutar integration tests (recovery-tenant-boundary)
    Setup: docker containers
    Horas: 2h
```

### Prioridad Tier 2 (Semana 2-3)

```
[ ] 12 unit tests para métodos ALTA
    Módulos: academic (student assignment), performance (grades)
    Horas: 24h

[ ] 8 unit tests para métodos MEDIA
    Horas: 16h
    
[ ] Agregar E2E para critical workflows
    Horas: 16h
```

### Métrica de Éxito

```
Global coverage:  6.23% → 60% (Semana 2)
                          → 80% (Semana 4)

Critical methods with tests: 0/10 → 10/10 (Semana 1)

Integration tests passing: 0/4 → 4/4 in CI (Semana 2)

E2E P0 flows:     3/6 → 6/6 (Semana 3)
```

---

**Fin del análisis detallado**
