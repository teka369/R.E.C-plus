# FASE 1 – Hardening Multi-Tenant (2026-04-02)

## Cambios Implementados

### 🔒 Bug Critical Fix: `createFeedback` Cross-Tenant Validation

**Archivo**: `r.e.c-backend/src/communication/communication.service.ts`

**Problema corregido**: 
- El método `createFeedback` no validaba explícitamente que el `groupId` y `studentId` pertenecieran a la misma institución.
- Riesgo: Si existieran datos corruptos (cross-tenant), el feedback se crearía sin detectar la inconsistencia.

**Solución implementada**:
1. Agregada validación explícita del `group.institutionId` contra la institución del actor
2. Agregada validación explícita del `student.institutionId` contra la institución del actor
3. Agregada defensa en profundidad: verificación de consistencia `group.institutionId === student.institutionId`

**Impacto**: Bloquea creación de feedback con datos cross-tenant incluso si hay corrupción previa en BD.

---

### ⚠️ Refactorización: `updateFeedback` Tenant-First Validation

**Archivo**: `r.e.c-backend/src/communication/communication.service.ts`

**Mejora implementada**:
- Reordenadas validaciones: primero boundary tenant, luego permisos de autoría
- Mejora legibilidad y auditabilidad del código
- Alinea con principio "fail fast on tenant boundary"

**Lógica anterior**:
```typescript
if (existing.teacherId !== actor.userId) throw ...
if (existing.group.institutionId !== actor.institutionId) throw ...
```

**Lógica nueva**:
```typescript
// Tenant primero
if (existing.group.institutionId !== actor.institutionId) throw ...
// Luego permisos
if (existing.teacherId !== actor.userId) throw ...
```

---

### 📊 Observabilidad: Logging Cross-Tenant Attempts

**Archivo**: `r.e.c-backend/src/common/guards/tenant-boundary.guard.ts`

**Agregado**:
- Logger de NestJS en `TenantBoundaryGuard`
- Log estructurado en cada intento de acceso cross-tenant bloqueado

**Información registrada**:
```json
{
  "event": "CROSS_TENANT_ACCESS_ATTEMPT",
  "actorUserId": 123,
  "actorInstitutionId": 1,
  "requestedInstitutionIds": [2],
  "endpoint": "/api/feedback",
  "method": "POST",
  "timestamp": "2026-04-02T12:00:00.000Z"
}
```

**Uso**: Permite auditar intentos de violación tenant para detectar:
- Ataques intencionales
- Bugs en frontend
- Datos corruptos

---

### 🚀 Optimización: Índice Compuesto Feedback

**Archivo**: `r.e.c-backend/prisma/schema.prisma`

**Agregado**:
```prisma
@@index([studentId, createdAt(sort: Desc)])
```

**Impacto**: 
- Optimiza query `listFeedbackByStudent` con ordenamiento por fecha
- Reduce tiempo de respuesta en perfiles de estudiantes con mucho feedback
- Evita full table scan en consultas frecuentes

**Migración aplicada**: `20260402041543_add_feedback_student_created_index`

---

## ⚠️ Acción Requerida: Configuración Producción

### JWT_EXPIRES en Coolify

**Archivo afectado**: `.env.coolify.example`

**Problema detectado**:
- Valor actual en ejemplo: `JWT_EXPIRES=7d` (7 días)
- Valor recomendado: `JWT_EXPIRES=15m` (15 minutos)

**Riesgo actual**:
- Ventana de exposición de 7 días si token es robado
- No cumple OWASP best practices para tokens con datos sensibles

**Acción inmediata**:
1. Verificar valor actual en Coolify: `echo $JWT_EXPIRES`
2. Si es `7d`, cambiar a `15m` o máximo `30m`
3. Reiniciar backend para aplicar cambio
4. **Nota**: El refresh token permanece en `30d` (correcto con rotación implementada)

**Comando para verificar en producción**:
```bash
# En servidor Coolify, ejecutar en contenedor backend:
docker exec <container-id> env | grep JWT_EXPIRES
```

---

## Testing Recomendado

### Test Manual Crítico

**Escenario 1**: Crear feedback válido
```bash
POST /communication/feedback
Headers: Authorization: Bearer <token-profesor-inst-1>
Body: {
  "studentId": 10,  # Estudiante de institución 1
  "groupId": 5,     # Grupo de institución 1
  "title": "Test",
  "content": "Test content"
}
# Esperado: 201 Created
```

**Escenario 2**: Intentar crear feedback cross-tenant (debe fallar)
```bash
POST /communication/feedback
Headers: Authorization: Bearer <token-profesor-inst-1>
Body: {
  "studentId": 10,  # Estudiante de institución 1
  "groupId": 99,    # Grupo de institución 2
  "title": "Test",
  "content": "Test"
}
# Esperado: 403 Forbidden con mensaje "El grupo no pertenece a su institución"
```

**Escenario 3**: Verificar logging
```bash
# Buscar en logs del backend después del test anterior:
grep "CROSS_TENANT_ACCESS_ATTEMPT" logs/app.log
# Debe aparecer entrada con actorUserId, requestedInstitutionIds, etc.
```

### Test de Performance

**Antes del índice**:
```sql
EXPLAIN ANALYZE
SELECT * FROM "Feedback"
WHERE "studentId" = 10
ORDER BY "createdAt" DESC
LIMIT 20;
-- Esperado antes: Seq Scan on Feedback
```

**Después del índice**:
```sql
-- Mismo query, debe usar:
-- Index Scan using "Feedback_studentId_createdAt_idx"
```

---

## Checklist Pre-Producción

- [x] Código revisado y sin errores TypeScript
- [x] Migración de Prisma generada y aplicada localmente
- [x] Logging de seguridad implementado
- [ ] **PENDIENTE**: Cambiar `JWT_EXPIRES` a 15m en Coolify
- [ ] **PENDIENTE**: Ejecutar tests manuales en staging
- [ ] **PENDIENTE**: Verificar performance del nuevo índice en staging
- [ ] **PENDIENTE**: Revisar logs de producción después del deploy (buscar CROSS_TENANT_ATTEMPT)

---

## Siguientes Pasos (FASE 2)

1. **Auditoría extendida**: Revisar otros módulos (academic, materials) con mismo patrón
2. **Tests automatizados**: Crear suite E2E para validaciones tenant
3. **Constraints en BD**: Evaluar triggers o generated columns para defensa en profundidad a nivel PostgreSQL
4. **Documentación**: Crear `docs/TENANT_VALIDATION_GUIDE.md` con patrones canónicos

---

## Métricas de Éxito

**Objetivo**: Beta cerrada segura con 2-3 instituciones piloto

**KPIs**:
- ✅ 0 bugs de cross-tenant reportados en 30 días
- ✅ 0 entradas `CROSS_TENANT_ACCESS_ATTEMPT` legítimas en logs (solo ataques/bugs)
- ✅ p95 < 500ms en `listFeedbackByStudent` (con índice nuevo)
- ⚠️ JWT_EXPIRES configurado correctamente en producción
