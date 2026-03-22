# 🚀 RUTAS DE ATAQUE ESPECÍFICAS NO CUBIERTAS

**Vulnerabilidades probadas/probables que NO serían detectadas en CI/CD**

**Auditoría Externa - 21 de marzo de 2026**

---

## VULNERABILITY #1: Cross-Institution Grade Tampering

**Likelihood**: 🔴 HIGH | **Impact**: CRÍTICA | **Detectability**: 🔴 NOT IN TESTS | **Complexity**: MEDIA

### Escenario de Ataque

```
Institución A: Colegio Bogotá
  └─ Profesor Juan (ID: 101, teacherInstitutionId: 1)
     └─ Grupo 10A (groupId: 50, institutionId: 1)
        └─ Estudiante Carlos (studentId: 200)

Institución B: Colegio Medellín
  └─ Profesor Pedro (ID: 102, teacherInstitutionId: 2)
     └─ Grupo 10B (groupId: 51, institutionId: 2)
        └─ Estudiante Carlos (studentId: 300)

         [ATAQUE]
         
Profesor Juan intenta modificar calificación de Carlos en Institución B:
  
  PATCH /performance/grades/{gradeIdFromTeacherPedro}
  Authorization: Bearer token_juan (institutionId: 1)
  {
    "value": 5.0,  // Cambiar de 2.5 a 5.0
    "comment": "Revisada"
  }
```

### Código Vulnerable (performance.service.ts)

```typescript
# CURRENT CODE (sin test)
async updateGrade(actor: Actor, gradeId: number, value: number) {
  // ✗ FALTA: Validación de institution
  const grade = await this.prisma.grade.findUnique({
    where: { id: gradeId },
    // ✗ NO INCLUYE group { institutionId } check
  });
  
  if (!grade) throw new NotFoundException();
  
  // ✗ FALTA: Validación de teacher ownership
  return this.prisma.grade.update({
    where: { id: gradeId },
    data: { value, updatedAt: new Date() },
  });
}
```

### Por Qué No Se Detecta

```
1. No existe test/unit/performance/performance.service.unit-spec.ts
2. Integration tests no corren (PostgreSQL no disponible)
3. E2E tests no incluyen cross-institution grade scenarios
4. RolesGuard solo verifica rol (PROFESOR), no ownership
5. TenantBoundaryGuard no navega hasta grade.group.institutionId
```

### Impacto Real

```
Riesgo:
  - Profesor falsifica calificaciones de otros colegios
  - Estudia falsifica sus propias calificaciones
  - Directores no pueden auditar cambios entre instituciones
  
Compliance:
  - GDPR: Datos de menores (estudiantes) comprometidos
  - COPPA: Manipulación de registros académicos
  - Estándares educativos: Integridad de datos violada
```

### Detección Manual (Qué debería probarse)

```typescript
// TEST FALTANTE:
describe('Performance - updateGrade cross-institution', () => {
  it('debe rechazar a profesor de institución A al modificar calificación de institución B', async () => {
    // Setup: 2 instituciones, profesores, grupos, calificaciones
    const directorA = await createUser(directorRole, institutionA);
    const gradeFromInstitutionB = await createGrade(...institutionB);
    
    // Act: Intento de modificación
    const result = await performanceService.updateGrade(
      { userId: directorA.id, role: 'SECRETARIA', institutionId: institutionA.id },
      gradeFromInstitutionB.id,
      5.0
    );
    
    // Assert: Debe rechazar
    expect(() => result).toThrow(403 ForbiddenException);
  });
});
```

---

## VULNERABILITY #2: Cross-Tenant Communication Intercept

**Likelihood**: 🔴 HIGH | **Impact**: CRÍTICA | **Detectability**: 🔴 NOT IN TESTS | **Complexity**: MEDIA

### Escenario de Ataque

```
Institución A: Colegio Bogotá (ID: 1)
  └─ Profesor Juan (ID: 101, institutionId: 1)
Institución B: Colegio Medellín (ID: 2)
  └─ Estudiante María (ID: 300, institutionId: 2)
  
       [ATAQUE]
       
Profesor Juan intenta enviar mensaje a María (institución diferente):

  POST /communication/messages
  Authorization: Bearer token_juan (institutionId: 1)
  {
    "recipientId": 300,  // María de institución 2
    "message": "Necesito ayuda académica"
  }
```

### Código Vulnerable

```typescript
# communication.service.ts (actual)
async sendMessage(actor: Actor, dto: SendMessageDto) {
  // ✗ FALTA: Información de institución del recipiente no se valida
  const recipient = await this.prisma.user.findUnique({
    where: { id: dto.recipientId },
    // ✗ NO INCLUYE institutionId check
  });
  
  if (!recipient) throw new NotFoundException();
  
  // ✗ FALTA: Validar que recipient.institutionId === actor.institutionId
  
  return this.prisma.message.create({
    data: {
      senderId: actor.userId,
      recipientId: recipient.id,
      message: dto.message,
    },
  });
}
```

### Por Qué No Se Detecta

```
1. No existe test/unit/communication/communication.service.unit-spec.ts
2. Falta test para cruzar límites de institución
3. No hay validación en el controller (solo en service)
4. TenantBoundaryGuard no valida destination en POST body
```

### Impacto Real

```
- Profesor A puede contactar estudiantes de institución B
- Confidencialidad académica violada
- GDPR/COPPA: Contacto no autorizado con menores
- Historial de comunicaciones perdido entre instituciones
```

---

## VULNERABILITY #3: File Upload Path Traversal + Malware

**Likelihood**: 🔴 ALTA | **Impact**: CRÍTICA | **Detectability**: 🔴 NOT IN TESTS | **Complexity**: BAJA

### Escenario de Ataque

```
Attack Vector 1: Path Traversal
  
  POST /materials/upload
  Authorization: Bearer some_token
  Content-Disposition: form-data; name="file"; filename="../../.env"
  
  ✗ Sin validación de path, .env se expone (DB_PASSWORD, JWT_SECRET)

Attack Vector 2: Malware Upload

  POST /materials/upload
  File: malware.exe (renombrado como Syllabus.pdf)
  Content-Type: application/pdf
  
  ✗ Sin MIME validation, estudiantes descargan y ejecutan malware

Attack Vector 3: Zip Bomb

  POST /materials/upload
  File: 45MB_archive.zip (expande a 500GB)
  
  ✗ Sin uncompressed size check, servidor se queda sin disco
```

### Código Vulnerable

```typescript
# materials.service.ts (actual)
async uploadMaterial(actor: Actor, file: Express.Multer.File) {
  // ✗ FALTA: filename sanitization
  const filename = file.originalname;  // "../../.env" no se valida
  
  // ✗ FALTA: MIME type vs extension validation
  if (file.mimetype !== 'application/pdf') {
    // Solo verifica MIME, pero cliente puede falsificar
  }
  
  // ✗ FALTA: Max file size check
  // ✗ FALTA: Virus scan integration
  // ✗ FALTA: Decompressed size validation
  
  const filepath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filepath, file.buffer);  // ¡Path traversal!
  
  return { stored: true };
}
```

### Por Qué No Se Detecta

```
1. No existe test/unit/materials/materials.service.unit-spec.ts
2. No hay unit tests para validación de archivo
3. No hay integration tests con archivos reales
4. No hay E2E tests de upload malicious
5. Multer config sin límites visibles en tests
```

### Impacto Real

```
- .env expuesto: DB credentials, JWT secret, API keys
- Malware ejecutado en computadoras de estudiantes
- Servidor down por falta de espacio (ZIP bomb)
- GDPR violado: Datos de menores comprometidos
```

### Test Faltante

```typescript
// TEST FALTANTE:
describe('Materials - uploadMaterial security', () => {
  it('debe bloquear path traversal en nombre de archivo', async () => {
    const maliciousFile = {
      originalname: '../../.env',
      buffer: Buffer.from('SECRET=value'),
      mimetype: 'text/plain',
    };
    
    await expect(materialsService.uploadMaterial(actor, maliciousFile))
      .rejects
      .toThrow('Nombre de archivo inválido');
  });
  
  it('debe rechazar archivo .exe aunque sea renombrado como .pdf', async () => {
    const exeFile = {
      originalname: 'malware.pdf',
      buffer: require('fs').readFileSync('malware.exe'),
      mimetype: 'application/pdf', // Falsificado
    };
    
    // Debería validar magic bytes, no solo MIME
    await expect(materialsService.uploadMaterial(actor, exeFile))
      .rejects
      .toThrow('Tipo de archivo no permitido');
  });
  
  it('debe rechazar archivo comprimido que expande más de 1GB', async () => {
    const zipBomb = {
      originalname: 'archive.zip',
      buffer: // 45MB que descomprime a 500GB
      mimetype: 'application/zip',
    };
    
    await expect(materialsService.uploadMaterial(actor, zipBomb))
      .rejects
      .toThrow('Archivo demasiado grande');
  });
});
```

---

## VULNERABILITY #4: Recovery Request Deletion Cross-Teacher

**Likelihood**: 🟡 MEDIA | **Impact**: ALTA | **Detectability**: 🟡 PARTIAL (integration test exists but doesn't run) | **Complexity**: BAJA

### Escenario de Ataque

```
Institución: Colegio Bogotá
  Profesor A (ID: 101) - Matemáticas
  Profesor B (ID: 102) - Lenguaje
  Estudiante C (ID: 200)

TIMELINE:
  Lunes: Estudiante C solicita recovery de Matemáticas (Profesor A)
  Miércoles: Profesor B intenta BORRAR solicitud de Profesor A
  
         [ATAQUE]
         
  DELETE /recovery/requests/{requestId}
  Authorization: Bearer token_profesor_B
```

### Código Vulnerable (recovery.service.ts)

```typescript
# ORIGINAL CODE (roto antes del fix):
async deleteRequest(actor: Actor, id: number) {
  const request = await this.prisma.recoveryRequest.findUnique({
    where: { id }
    // ✗ ORIGINAL: No validaba ensureRequestAccess
  });
  
  if (!request) throw new NotFoundException();
  
  // ✗ Borra sin validar ownership
  await this.prisma.recoveryRequest.delete({ where: { id } });
  return { deleted: true };
}

# FIXED CODE (pero sin test unitario):
async deleteRequest(actor: Actor, id: number) {
  const request = await this.ensureRequestAccess(actor, id); // ✓ Fix
  
  if (actor.role === UserRole.SECRETARIA) {
    await this.prisma.recoveryRequest.delete({ where: { id } });
    return { deleted: true };
  }
  // ... validaciones por rol
}
```

### IMPORTANTE: Fix Existe en Código Pero NO en Tests

```
Problem: ensureRequestAccess tiene logica que valida ownership
         PERO NO HAY UNIT TEST que lo verifique

Riesgo:
  - Alguien refactor: "ensureRequestAccess es redundante, usa findUnique"
  - CI/CD pasa (no hay test que lo valide)
  - Vulnerability regresa silenciosamente
```

### Por Qué No Se Detecta Completamente

```
1. ✓ Integration test EXISTE (recovery-tenant-boundary.integration-spec.ts)
   PERO no ejecuta (PostgreSQL no disponible)
   
2. ✗ Unit test NO existe (test/unit/recovery/recovery.service.unit-spec.ts)
   
3. ✗ E2E test NO existe para recovery workflow

Result: Fix es bueno pero desprotegido de regresiones futuras
```

### Test Faltante (Unit)

```typescript
// TEST QUE DEBERÍA EXISTIR:
describe('Recovery - deleteRequest security', () => {
  it('debe rechazar a profesor diferente al eliminar solicitud', async () => {
    // Setup:
    const teacherA = { userId: 101, role: 'PROFESOR', institutionId: 1 };
    const teacherB = { userId: 102, role: 'PROFESOR', institutionId: 1 };
    const request = { id: 1, teacherId: 101 };
    
    const mockPrisma = {
      recoveryRequest: {
        findUnique: jest.fn().mockResolvedValue(request),
      },
    };
    
    // Act: TeacherB intenta borrar request de TeacherA
    const result = await recoveryService.deleteRequest(teacherB, request.id);
    
    // Assert: Debe rechazar
    expect(result).rejects.toThrow(ForbiddenException);
  });
});
```

---

## VULNERABILITY #5: Attendance Double-Entry (Idempotency)

**Likelihood**: 🟡 MEDIA | **Impact**: ALTA | **Detectability**: 🔴 NOT IN TESTS | **Complexity**: BAJA

### Escenario de Ataque (O Bug)

```
Profesor registra asistencia de Grupo 10A el lunes:

  POST /performance/attendance
  { date: "2026-03-21", groupId: 50, students: [200, 201, 202] }
  
  ✓ Registrado en BD

Pero la request se reIntenta (conexión lenta, timeout):

  POST /performance/attendance (RETRY automático)
  Same payload
  
  ✗ Sin idempotency: Registra DUPLICADO
  
Result:
  - Asistencia lunes: [200, 201, 202, 200, 201, 202] ← duplicado
  - Reportes de asistencia incorrectos
  - Datos históricos inconsistentes
```

### Código Vulnerable

```typescript
# performance.service.ts
async markAttendance(actor: Actor, dto: MarkAttendanceDto) {
  // ✗ FALTA: Validación de IDEMPOTENCY
  // ✗ FALTA: Unique constraint check (date + groupId)
  
  for (const studentId of dto.students) {
    await this.prisma.attendance.create({
      data: {
        studentId,
        groupId: dto.groupId,
        date: dto.date,
        present: true,
      },
    });
  }
  
  return { registered: dto.students.length };
}
```

### Por Qué No Se Detecta

```
1. No existe test/unit/performance/performance.service.unit-spec.ts
2. Test faltante para idempotency checking
3. No hay validation de fecha futura (permite registrar asistencia de mañana)
4. No hay unit/integration test para retries
```

### Impact

```
- Reportes de attendance incorrectos
- Datos históricos para menores comprometidos
- Auditoría académica invalida
```

---

## VULNERABILITY #6: Cascading Delete Without Orphan Validation

**Likelihood**: 🟡 MEDIA | **Impact**: MEDIA | **Detectability**: 🟡 PARTIAL (integration test structure exists) | **Complexity**: MEDIA

### Escenario

```
Estructura:
  Institution → Period → Group → StudentGroup
                              → Grade (calificación del student)
                              → Attendance
                              → RecoveryRequest

ATAQUE O BUG:
  DELETE /academic/groups/{groupId}
  
Qué DEBERÍA ocurrir:
  1. Elimina StudentGroup ✓
  2. Elimina Grade (calificaciones) ✓
  3. Elimina Attendance ✓
  4. Elimina RecoveryRequest ✓
  5. LUEGO elimina Group ✓

Qué PODRÍA ocurrir si hay bug:
  Group deleted PERO Attendance orphan sin grupo
  → Reportes de asistencia referencian groupId inválido
```

### Por Qué No Se Detecta

```
1. ✓ Integration test EXISTE (prisma-relations.integration-spec.ts)
   PERO no ejecuta (PostgreSQL no disponible)
   
2. ✗ Unit test NO existe
3. ✗ Validación de cascades no se prueba en CI
```

---

## VULNERABILITY SUMMARY TABLE

| # | Vulnerability | Module | Likelihood | Impact | Tests | CI Detection | Fix |
|---|---|---|---|---|---|---|---|
| 1 | Cross-Institution Grade | performance | 🔴 ALTA | CRÍTICA | ❌ 0 | ❌ NO | 8h |
| 2 | Cross-Tenant Messages | communication | 🔴 ALTA | CRÍTICA | ❌ 0 | ❌ NO | 6h |
| 3 | File Upload Traversal | materials | 🔴 ALTA | CRÍTICA | ❌ 0 | ❌ NO | 8h |
| 4 | Recovery Delete Regression | recovery | 🟡 MEDIA | ALTA | 🟡 INT only | ✓ PARTIAL | 4h |
| 5 | Attendance Idempotency | performance | 🟡 MEDIA | ALTA | ❌ 0 | ❌ NO | 6h |
| 6 | Cascading Delete Orphan | academic | 🟡 MEDIA | MEDIA | 🟡 INT only | ✓ PARTIAL | 4h |

**Total Undetected Vulnerabilities**: 6  
**Total Detected in CI**: 0 (without integration tests running)  
**Estimated Fix Time**: 36 hours

---

## CONCLUSIÓN

```
Todas estas vulnerabilidades:

✓ Podrían existir dentro de commit correctamente estructurado
✗ NO serían detectadas por CI/CD actual
✗ Requerirían testing manual o código review muy estricto
✗ Comprometería datos de MENORES (GDPR/COPPA VIOLATION)

RIESGO OPERACIONAL: 🔴 CRÍTICO
RECOMENDACIÓN: No deployen sin Tier 1 security tests (36h de tarea)
```

---

*Fin de análisis de vulnerabilidades*
