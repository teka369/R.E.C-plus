# Checklist de Cierre V2.0 (Auditoría contra R.E.C-viejo)

Fecha de revisión: 2026-02-28
Base comparada:
- Viejo: R.E.C-viejo/R.E.C-fullstack/R.E.C-fullstack
- Plus: r.e.c-backend + r.e.c-frontend

## Resultado ejecutivo
- Estado global: PARCIAL (alto avance, faltantes críticos para declarar 2.0 cerrada).
- Criterio: paridad funcional mínima + seguridad crítica + build/lint/test base + módulos recovery/performance funcionales.

## Matriz rápida por dominio

### Hallazgos frontend viejo (impactan paridad)
- [x] Flujo completo de recuperaciones en una vista central con modales para solicitud/detalle/actividades/seguimiento.
- [x] Guard de periodo activo de recuperaciones desde contexto global (`RecuperacionContext`) con redirección si el periodo no está activo.
- [x] Página dedicada para configurar periodo de recuperaciones (en UI de secretaría).
- [x] Página dedicada para horario de recuperación con visor PDF + descarga + carga de archivo.
- [x] Página de reportes/estadísticas por grado conectada a endpoints de estadísticas.

Implicación en Plus:
- [x] Configuración de periodo y horario de recuperación reproducidos en frontend Plus (vistas + navegación + integración API).
- [x] Experiencia frontend de estadísticas/performance base cubierta para docencia y secretaría.

### 1) Recuperaciones
- [x] Solicitudes (crear/listar/actualizar estado) implementadas en Plus.
- [x] Actividades de recuperación (crear/listar/actualizar) implementadas en Plus.
- [x] Seguimiento/mensajes implementado en Plus.
- [x] Estadísticas base de recuperación implementadas en Plus (grupo/estudiante).
- [x] Eliminar solicitud implementado en Plus (backend + frontend docente/estudiante con permisos).
- [x] Eliminar actividad implementado en Plus (backend + frontend docente con permisos).
- [x] Adjuntos de recuperación con flujo robusto upload/download seguro E2E (implementado con autorización por solicitud/actividad).
- [x] Guard de periodo activo aplicado en backend (operaciones mutables) y frontend (bloqueo UX).

Evidencia viejo:
- backend/src/routes/recuperacion.routes.js
- backend/src/controller/recuperacion.controller.js

Evidencia Plus:
- r.e.c-backend/src/recovery/recovery.controller.ts
- r.e.c-backend/src/recovery/recovery.service.ts
- r.e.c-frontend/app/(dashboard)/docente/recuperaciones/page.tsx
- r.e.c-frontend/app/(dashboard)/estudiante/recuperaciones/page.tsx

### 2) Configuración de recuperación y horario de recuperación
- [x] Configuración de periodo de recuperaciones (inicio/fin) equivalente al viejo: implementado en Plus.
- [x] Horario de recuperación (archivo/visor) equivalente al viejo: implementado en Plus.

Evidencia viejo:
- backend/src/routes/configuracion.routes.js
- backend/src/controller/configuracion.controller.js
- frontend/src/views/main/ConfiguracionRecuperacion.tsx
- frontend/src/views/main/HorarioRecuperacion.tsx

### 3) Performance / Estadísticas
- [x] Módulo de performance/estadísticas funcional base equivalente implementado en Plus.

Evidencia viejo:
- backend/src/routes/Estadisticas.routes.js
- backend/src/controller/Estadisticas.controller.js

Evidencia Plus:
- r.e.c-backend/src/performance/performance.controller.ts
- r.e.c-backend/src/performance/performance.service.ts

### 4) Materiales y temarios
- [x] CRUD y permisos por rol implementados en Plus.
- [x] Temarios implementados en Plus.
- [x] Métricas de vistas/descargas de material implementadas en Plus.

Evidencia viejo:
- backend/src/routes/materiales.routes.js
- backend/src/controller/materiales.controller.js

Evidencia Plus:
- r.e.c-backend/src/materials/materials.controller.ts
- r.e.c-backend/src/materials/materials.service.ts

### 5) Horarios y notas importantes
- [x] Gestión de horarios en Plus (entries, notes, events) implementada.
- [x] Controles de acceso por rol implementados.

Evidencia viejo:
- backend/src/routes/horario.routes.js
- backend/src/controller/horario.controller.js

Evidencia Plus:
- r.e.c-backend/src/schedule/schedule.controller.ts
- r.e.c-backend/src/schedule/schedule.service.ts

### 6) Administración secretaría
- [x] Gestión amplia en frontend Plus (usuarios, académico, docentes, estudiantes, promociones, registro masivo).
- [x] Endpoints críticos de usuarios endurecidos por rol en backend Plus.
- [ ] Falta validar cobertura E2E de todos los flujos de secretaría para declarar “completa” en sentido de cierre v2.

Evidencia Plus:
- r.e.c-frontend/app/(dashboard)/secretaria/**
- r.e.c-backend/src/users/users.controller.ts

## Checklist de cierre priorizado (lo mínimo para declarar V2.0)

### P0 (bloqueantes)
- [x] Implementar configuración de recuperaciones (fecha_inicio, fecha_fin) con endpoint y vista de secretaría.
- [x] Implementar horario de recuperación (subida/consulta segura de archivo) con endpoint y vista.
- [x] Completar performance/estadísticas con endpoints y pantalla equivalente.
- [x] Cerrar adjuntos de recovery end-to-end (upload, storage, autorización de descarga, auditoría básica).
- [x] Aplicar guard de periodo activo en backend/frontend para recovery.

### P1 (paridad fina)
- [x] Agregar endpoints de eliminación de solicitud/actividad de recovery (si negocio lo mantiene).
- [x] Añadir métricas vistas/descargas de materiales (si siguen siendo requisito de producto).

### P2 (calidad de release)
- [ ] Ejecutar y dejar pasando build/lint/test base en CI para backend y frontend.
- [x] Añadir E2E mínimo por actor (estudiante/profesor/secretaría) sobre recovery/performance (autorización por rol).
- [ ] Congelar matriz de paridad final en docs y aprobar checklist con QA/producto.

Avance QA aplicado en código (2026-02-28):
- [x] Pruebas automatizadas de permisos por rol en recovery/performance (servicios y controllers) en backend.
- [x] Pruebas unitarias añadidas para eliminación de recovery y métricas de materiales.
- [x] Pruebas E2E por rol añadidas en test/app.e2e-spec.ts (401/403/201 en recovery config y performance).

## Definición operativa de “V2 lista”
Se declara lista cuando todos los P0 estén cerrados y al menos:
1) Recovery + performance funcionales,
2) Configuración/horario de recuperación operativos,
3) Validación E2E mínima por roles,
4) build/lint/test base en verde.
