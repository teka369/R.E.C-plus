# Code Citations

## License: desconocido
https://github.com/garmoncheg/django_multiuploader/blob/9bae12ef47c18be5cea9c6aa530f3c4425bd6602/django_multiuploader/multiuploader/default_settings.py

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: desconocido
https://github.com/pilau/starter/blob/ea85ca3780f38c0b3d85ca61dbadcbd4a2f1f48a/src/wp-content/themes/pilau-starter/inc/setup.php

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: MIT
https://github.com/simmatrix/plutro/blob/630080b0ebbcac0ae84f19e51666b6b5af2de177/application/helpers/helper_helper.php

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: desconocido
https://github.com/garmoncheg/django_multiuploader/blob/9bae12ef47c18be5cea9c6aa530f3c4425bd6602/django_multiuploader/multiuploader/default_settings.py

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: desconocido
https://github.com/pilau/starter/blob/ea85ca3780f38c0b3d85ca61dbadcbd4a2f1f48a/src/wp-content/themes/pilau-starter/inc/setup.php

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: MIT
https://github.com/simmatrix/plutro/blob/630080b0ebbcac0ae84f19e51666b6b5af2de177/application/helpers/helper_helper.php

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: desconocido
https://github.com/garmoncheg/django_multiuploader/blob/9bae12ef47c18be5cea9c6aa530f3c4425bd6602/django_multiuploader/multiuploader/default_settings.py

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: desconocido
https://github.com/pilau/starter/blob/ea85ca3780f38c0b3d85ca61dbadcbd4a2f1f48a/src/wp-content/themes/pilau-starter/inc/setup.php

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: MIT
https://github.com/simmatrix/plutro/blob/630080b0ebbcac0ae84f19e51666b6b5af2de177/application/helpers/helper_helper.php

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: desconocido
https://github.com/garmoncheg/django_multiuploader/blob/9bae12ef47c18be5cea9c6aa530f3c4425bd6602/django_multiuploader/multiuploader/default_settings.py

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: desconocido
https://github.com/pilau/starter/blob/ea85ca3780f38c0b3d85ca61dbadcbd4a2f1f48a/src/wp-content/themes/pilau-starter/inc/setup.php

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```


## License: MIT
https://github.com/simmatrix/plutro/blob/630080b0ebbcac0ae84f19e51666b6b5af2de177/application/helpers/helper_helper.php

```
---

# FASE 5 — Evaluación Comercial: Readiness para Beta Cerrada

> Fecha de auditoría: 1 de abril de 2026  
> Estado: **CONDICIONAL** — se puede lanzar beta cerrada corrigiendo 3 bloqueadores activos

---

## 1. Inventario de lo logrado (FASE 1→4)

| Área | Antes | Ahora |
|---|---|---|
| Multi-tenant | Validación incompleta (H-01) | 3 capas: aplicación + triggers DB + TenantBoundaryGuard global |
| JWT TTL | 7 días (token obsoleto persistía tras cambio de institución) | 15m access / 30d refresh con rotación |
| Arquitectura | 8 copias de lógica de tenant duplicada | `TenantScopedService` centralizado, ~85 líneas eliminadas |
| Índices DB | 5 combinaciones de filtro sin índice | 5 índices compuestos CONCURRENTLY aplicados |
| N+1 queries | `institutions.findAll` ejecutaba 1+N queries | 2 queries fijas + Map O(1) |
| Paginación | 8+ endpoints sin límite | Todos retornan `{ data, meta }` con max 100, default 20 |
| Pool conexiones | limit=10 (saturaba a ~30 req/s concurrent) | limit=50, pool_timeout=20 |
| Compresión HTTP | Sin comprimir | `compression()` middleware, ~60-70% menos tráfico JSON |
| Body limit | 8 MB (vector DoS) | 1 MB |
| Rate limit en login | Sin límite especial | `@Throttle({ ttl: 60, limit: 5 })` — 5 intentos/min |
| SQL raw | `$queryRawUnsafe` libre | Bloqueado en `PrismaService.override` — throws si se llama |
| Secretos en error | Posible stack leak | `AllExceptionsFilter` — nunca envía stack al cliente, solo `correlationId` |

---

## 2. Arquitectura: Veredicto

```
┌─────────────────────────────────────┐
│  PLANO DE CONTROL (Muy sólido ✅)    │
│  JWT 15m + Refresh Rotation         │
│  AuthSession con revocación         │
│  TenantBoundaryGuard como APP_GUARD │
│  InstitutionsController: @UseGuards │
│  a nivel de clase (@Controller)     │
├─────────────────────────────────────┤
│  BASE DE DATOS (Sólida ✅)           │
│  37 modelos, 37 migraciones         │
│  Triggers CHECK en 4 tablas críticas│
│  5 índices compuestos nuevos        │
│  Backup diario a las 03:00          │
├─────────────────────────────────────┤
│  OBSERVABILIDAD (Mínima ⚠️)          │
│  Sentry integrado (opcional por env)│
│  pino-logger estructurado           │
│  Sin audit log de acciones de negocio│
└─────────────────────────────────────┘
```

---

## 3. Bloqueadores para Beta (must-fix antes de lanzar)

### 🔴 B-01 — Sin whitelist de MIME en uploads de materiales

**Archivo**: [materials.service.ts](r.e.c-backend/src/materials/materials.service.ts#L107)

Un profesor puede subir un archivo `.php`, `.exe`, `.sh`, o `.html` — el sistema solo valida tamaño. Si el servidor de archivos los sirve con el header `Content-Type` incorrecto, hay riesgo de ejecución o XSS stored.

**Fix requerido:**
```typescript
// En materials.service.ts, después de la validación de tamaño:
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg', 'image/png', 'image/
```

