# R.E.C Plus 2.0 — Matriz de Paridad y Roadmap de Cierre

## Objetivo
Consolidar `R.E.C-plus` como versión 2.0 de `R.E.C-viejo` manteniendo la misma temática funcional (gestión académica integral) con mejoras de seguridad, rendimiento, mantenibilidad y escalabilidad multi-colegio.

## Contexto funcional heredado (R.E.C viejo)
Del análisis de `R.E.C-viejo` (Node/Express + MySQL + React/Vite), el dominio funcional real incluye:

1. Autenticación por rol (estudiante, profesor, secretaría).
2. Gestión académica base:
   - Grados, grupos, materias.
   - Asignaciones profesor↔grupo↔materia.
   - Asignación estudiante↔grupo.
3. Materiales de estudio por grupo/grado.
4. Temarios por docente y grupo.
5. Horarios y notas importantes.
6. Observaciones de seguimiento académico.
7. Recuperaciones:
   - Solicitudes,
   - Actividades (incluye archivo),
   - Seguimiento,
   - Estadísticas.
8. Configuración de recuperación y horario de recuperación.
9. Reportes/certificados y vistas por rol en frontend.

## Matriz de paridad Viejo -> Plus

### Ya implementado en Plus (alto nivel)
- Auth JWT + roles.
- Usuarios (alta, edición, bulk, cambio de contraseña).
- Académico (grados, grupos, materias, asignaciones, promociones).
- Materiales y temarios.
- Horarios (entradas, notas, eventos).
- Comunicación (feedback, mensajes, notificaciones).
- Frontend dashboards por rol y navegación principal.

### Parcial / pendiente crítico para paridad completa
- `recovery` (en Plus está módulo vacío, en Viejo era dominio completo).
- `performance/estadísticas` (en Plus vacío, en Viejo sí tenía endpoints y datos).
- Configuración específica de recuperación (equivalente a `configuracion.routes.js` del viejo).
- Flujo de adjuntos para recuperación (upload/descarga segura).

## Endurecimiento ya aplicado en esta fase (P0)
1. Endpoints de usuarios endurecidos:
   - `GET /users` ahora sólo `SECRETARIA`.
   - `GET /users/:id` sólo `SECRETARIA` o dueño del perfil.
2. Cookies de sesión frontend endurecidas:
   - `secure` dependiente de `NODE_ENV`.
   - `rec_uid` pasa a `HttpOnly`.
3. Swagger restringido fuera de producción.
4. DTO de notificación desacoplado de enum runtime de Prisma para reducir fragilidad.
5. Lint frontend deja de analizar `public/**` (evita ruido por `pdf.worker.min.js`).

## Estado de calidad actual
- Backend build: OK.
- Frontend lint: falla por deuda previa de tipado estricto (`any`), reglas de hooks y warnings de optimización de imagen.
- Testing backend: muchas suites son boilerplate (`should be defined`) y varias fallan por inyección/mocks incompletos.

## Roadmap de cierre de V2 (orden recomendado)

### Fase 1 — Seguridad y estabilidad base (obligatoria)
- Cerrar cualquier endpoint sensible sin guard.
- Estandarizar cookie/session policy para producción.
- Rotación y gestión de secretos (fuera de `.env` en despliegue real).
- Normalizar errores API (envelope + códigos consistentes).

### Fase 2 — Paridad funcional faltante
- Implementar dominio `recovery` completo en Nest + Prisma:
  - solicitudes,
  - actividades,
  - seguimiento,
  - estadísticas,
  - adjuntos.
- Implementar `performance`/estadísticas en backend y vistas frontend equivalentes.
- Configuración de recuperación y horario de recuperación.

### Fase 3 — Calidad de código y DX
- Eliminar `any` en frontend/lib y páginas críticas.
- Refactor de páginas grandes a hooks/servicios/componentes.
- Alinear DTOs del backend (evitar bodies inline sin validación).

### Fase 4 — Pruebas reales
- Unit tests de servicios críticos con mocks.
- E2E de auth/roles/permisos por actor.
- Contract tests frontend-backend para DTOs sensibles.

### Fase 5 — Escala multi-colegio (objetivo estratégico)
- Diseñar multi-tenancy (`School/Tenant`) en modelo de datos.
- Scope obligatorio por tenant en queries y guards.
- Índices compuestos por tenant y consultas críticas.
- Observabilidad (logs estructurados, métricas, alertas).

## Definición de “R.E.C Plus 2.0 completo”
Se considera completo cuando:
1. Hay paridad funcional mínima respecto a R.E.C viejo.
2. Se corrigen los riesgos de seguridad críticos.
3. Lint/build/test base pasan en CI.
4. Módulos `recovery` y `performance` están implementados funcionalmente.
5. Existe plan o implementación inicial de multi-colegio.

## Siguiente ejecución recomendada (inmediata)
1. Implementar backend `recovery` (modelos Prisma + controller/service + DTOs).
2. Conectar frontend de recuperación en dashboards por rol.
3. Corregir bloque principal de errores de lint (`any` y hooks) en módulos de materiales/usuarios.
