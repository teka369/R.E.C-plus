Implementación completada siguiendo el patrón de `communication` y conectada al dashboard.

## Qué se creó/cambió

### Backend

1. **Nuevo DTO**
- `src/communication/dto/activity-feed-item.dto.ts`
- `ActivityFeedItemDto` con:
  - `type`
  - `description`
  - `date`
  - `href`

2. **Nuevo método en service**
- `src/communication/communication.service.ts`
- Método:
  - `getActivityFeed(actor: Actor, limit: number): Promise<ActivityFeedItemDto[]>`
- Hace 4 queries en `Promise.all`, filtra por institución, unifica, ordena por fecha desc y aplica `slice(0, limit)`.

3. **Nuevo endpoint en controller**
- `src/communication/communication.controller.ts`
- Ruta:
  - `GET /communication/activity-feed`
- Con:
  - `@UseGuards(JwtAuthGuard)`
  - `@HttpCode(200)`
  - `limit` con `DefaultValuePipe(10)` + `ParseIntPipe`
  - `safeLimit = Math.min(limit, 20)`

### Frontend

4. **Cliente API de comunicación**
- `r.e.c-frontend/lib/communicationApi.ts`
- Nuevo tipo:
  - `ActivityFeedItem`
- Nuevo método:
  - `getActivityFeed(limit = 10)`

5. **Dashboard secretaria**
- `app/(dashboard)/secretaria/page.tsx`
- Se agregó `communicationApi.getActivityFeed(10)` al `Promise.all` inicial.
- Nuevo estado:
  - `activityFeed`
- Se reemplazó el mock de actividad por `activityFeed`.
- Se eliminó el TODO del feed.
- Renderiza descripción + fecha formateada (`toLocaleDateString("es-CO")`) + `Link` con `href`.

---

## Respuestas pedidas

1. **Guards/decoradores de GET en communication y confirmación del nuevo**
- En `communication.controller.ts`, los GET existentes usan principalmente:
  - `@UseGuards(JwtAuthGuard)`
- Uno específico (`GET feedback/group/:groupId`) usa además:
  - `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`
- El nuevo `GET /activity-feed` quedó con **el mismo patrón de GET generales**: `@UseGuards(JwtAuthGuard)`.

2. **Cómo obtuve `institutionId` en el service**
- `CommunicationService` ya extiende `TenantScopedService`.
- Usé directamente:
  - `this.getActorInstitutionId(actor)`
- Sin duplicar helpers ni mover lógica.

3. **Confirmación de `Promise.all` / useEffect del dashboard**
- Sí: sigue siendo **un solo `useEffect`**.
- Solo se agregó una llamada más dentro del mismo `Promise.all`.

4. **Problemas con queries y cómo se resolvieron**
- No hubo bloqueo de relaciones: `teacherAssignment -> group/teacher/subject` y `recoveryRequest -> group/student/subject` estaban disponibles.
- Ajuste necesario: en recuperación, la fecha correcta del modelo es `requestedAt` (no `createdAt`), se usó esa.
- En estudiantes/grupos/asignaciones se usó `createdAt` como pediste.