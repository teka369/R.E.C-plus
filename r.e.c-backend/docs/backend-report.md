---
title: "Informe Técnico del Backend R.E.C"
author: "Asistente Técnico"
date: "2025-11-03"
---

# Informe Técnico del Backend R.E.C

## Resumen Ejecutivo

El backend de R.E.C está construido sobre NestJS (v11), con Prisma (v6) para acceso a base de datos y JWT para autenticación. La arquitectura es modular (auth, users, academic, materials, schedule, communication, performance, recovery) y se apoya en un `ValidationPipe` global para asegurar entradas válidas. Durante esta auditoría y endurecimiento, se aplicaron mejoras clave:

- Integración de `helmet` para cabeceras de seguridad.
- Implementación de rate limiting con `@nestjs/throttler` (global y específico para `/auth/login`).
- Documentación Swagger en `/docs` con esquema Bearer.
- DTO de login con validación estricta.
- Eliminación del seed SQL con contraseñas en texto plano y guía para usar script seguro.
- Corrección del flujo de cambio de contraseña para eliminar comparaciones en texto plano.

## Stack y Versiones

- NestJS: `@nestjs/common ^11.0.1`, `@nestjs/core ^11.0.1`
- Prisma: `@prisma/client ^6.18.0`
- Seguridad: `bcryptjs ^3.0.2`, `helmet ^7.1.0`
- Rate limiting: `@nestjs/throttler ^6.2.0`
- Documentación: `@nestjs/swagger ^8.1.0`, `swagger-ui-express ^5.0.1`
- Testing: Jest e2e configurado en `test/jest-e2e.json`

## Bootstrap y Configuración Global

- Archivo `src/main.ts`:
  - `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`.
  - CORS configurable vía `CORS_ORIGIN` (lista separada por comas, o `*` por defecto).
  - `helmet()` para cabeceras de seguridad.
  - Swagger en `/docs` con `addBearerAuth()`.

- `src/app.module.ts`:
  - Importa módulos funcionales (`UsersModule`, `AcademicModule`, `MaterialsModule`, `RecoveryModule`, `ScheduleModule`, `CommunicationModule`, `PerformanceModule`, `AuthModule`, `PrismaModule`).
  - `ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }])` para rate limiting global.
  - Guardia global `APP_GUARD` con `ThrottlerGuard`.

## Autenticación y Autorización

- `src/auth/auth.service.ts`:
  - `validateUser(email, password)` usa `bcrypt.compare` contra el hash (sin compatibilidad texto plano).
  - Generación de JWT con `JwtService`. Payload: `{ sub, role, email }`.

- `src/auth/auth.controller.ts`:
  - `POST /auth/login` con `LoginDto` (email válido, password 8–128 chars).
  - Rate limiting específico: `@Throttle(5, 60)` (5 req/min).
  - `@ApiTags('Auth')` para Swagger.

- Guards y Roles:
  - `JwtAuthGuard` protege endpoints según rol.
  - `RolesGuard` y decorador `@Roles` para acceso por roles (`SECRETARIA`, `PROFESOR`, `ESTUDIANTE`).

## Usuarios

- `src/users/users.service.ts`:
  - Creación: profesores requieren `telefono`; estudiantes sin password usan `documento_identidad` como contraseña inicial.
  - Hashing: `bcrypt.hash` aplicado siempre.
  - Cambio de contraseña sin validación: para `SECRETARIA` (administrativo), `changePassword(id, newPassword)`.
  - Cambio con validación: `changePasswordWithValidation(id, currentPassword, newPassword)` ahora requiere hash en DB y valida con bcrypt; si no está hasheada, exige restablecimiento administrativo.

- `src/users/users.controller.ts`:
  - CRUD con restricciones de rol (`SECRETARIA` para crear/actualizar/eliminar).
  - `PATCH /users/:id/password`: propio usuario con `currentPassword`; `SECRETARIA` sin `currentPassword`.
  - Swagger: `@ApiTags('Users')`, `@ApiBearerAuth()`.

## Módulo Académico y Materiales

- `src/materials/dto/*`:
  - `update-study-material.dto.ts`: campos opcionales con validación (`title`, `description`, `type`, `resourceUrl`, `filePath`, `visibility`).
  - `create-syllabus.dto.ts`: requiere `subjectId`, `groupId`, `title` (con longitudes), `content` opcional.
  - `update-syllabus.dto.ts`: `title` y `content` opcionales con longitudes.

## Horarios (Schedule)

- Control de acceso:
  - `ensureViewAccess` (SECRETARIA; PROFESOR director/asignado; ESTUDIANTE en grupo).
  - `ensureManageAccess` (solo PROFESOR director del grupo).

- Endpoints:
  - Entradas semanales: listar, crear, actualizar, eliminar.
  - Notas: listar, crear, actualizar, eliminar.
  - Eventos: listar (filtro `startAt`/`endAt`), crear, actualizar, eliminar.

- DTOs `src/schedule/dto`:
  - `entry.dto.ts`: `dayOfWeek` (1–7), `startMinutes` (>=0), `endMinutes` (>=1), opcionales `title`, `subjectId`, `location`.
  - `event.dto.ts`: `title`, `startAt`/`endAt` ISO, opcionales `description`, `location`.
  - `note.dto.ts`: `content` requerido.

- Swagger: `@ApiTags('Schedule')`, `@ApiBearerAuth()` aplicado al controlador.

## Comunicación

- Scripts de verificación (`scripts/message-and-notification-checks.js`) prueban envío/lectura de mensajes y notificaciones con Prisma.

## Performance y Recuperación

- `performance.controller.ts` y `performance.service.ts`: actualmente vacíos; módulo base preparado.
- `recovery.controller.ts` y `recovery.service.ts`: vacíos; módulo base preparado.

## Prisma y Base de Datos

- `prisma/schema.prisma`: modelos de usuarios, relaciones académicas y comunicación (no se detallan aquí por brevedad, ver archivo para estructura completa).
- Migraciones en `prisma/migrations`.
- Script `prisma:generate`, `prisma:migrate`, `prisma:studio` definidos en `package.json`.

## Scripts Operativos

- `scripts/seed-secretaria.js`: crea usuario `SECRETARIA` con contraseña hasheada.
- `scripts/assign-director-and-groupinfo.js`: asigna director a grupo y crea/actualiza `groupInfo` con métricas y enlaces.
- `scripts/sql-checks.js`, `scripts/uniqueness-checks.js`: verificaciones de integridad.
- `scripts/verify-communication.js`: validaciones de flujo de comunicación.

## Seguridad: Hallazgos y Correcciones

### Críticos

- Seed SQL con contraseña en texto plano: eliminado; documentado uso del script seguro.
- Cambio de contraseña con bypass de texto plano: eliminado; ahora solo bcrypt.

### Altos

- Validación de login: ahora con `LoginDto` y `ValidationPipe`.
- CORS por defecto permisivo: soporta lista vía `CORS_ORIGIN`; se recomienda configurar dominios permitidos.
- Rate limiting: integrado globalmente; refuerzo en `/auth/login`.

### Medios

- `Helmet`: activado.
- Fortalecimiento de validaciones de contraseñas (mín. 8 chars en login).

### Bajos

- Documentación Swagger incorporada.
- Logging/Auditing mínimo; se recomienda ampliarlo.

## Endpoints Clave

- `POST /auth/login`: Body `LoginDto`; rate limit 5/min; devuelve `access_token` (JWT) y datos básicos de usuario.
- `GET /users`: lista de usuarios (sin contraseñas).
- `PATCH /users/:id/password`: propio usuario con validación; `SECRETARIA` sin `currentPassword`.
- `GET /schedule/groups/:groupId/entries|notes|events`: protegido por JWT, acceso por rol/relación.
- `POST|PUT|DELETE /schedule/...`: gestión reservada a `PROFESOR` director.

## Pruebas

- E2E: `test/app.e2e-spec.ts` valida el endpoint raíz `/` con estado 200 y respuesta "Hello World!".
- Tras cambios, test e2e pasa correctamente.

## Despliegue y Configuración

- `docker-compose.yml`: revisar credenciales por defecto de PostgreSQL; se recomienda variables seguras y redes limitadas.
- Variables de entorno:
  - `PORT` (por defecto 3000)
  - `CORS_ORIGIN` (lista separada por comas)
  - JWT secret/expiración (según configuración de `AuthModule`/`JwtModule` en el proyecto)

## Uso de Swagger

- Abrir `http://localhost:3000/docs` tras levantar el servidor.
- `Authorize`: usar `Bearer <token>` tras login.

## Recomendaciones y Roadmap

- Configurar `CORS_ORIGIN` con dominios específicos del frontend.
- Añadir rate limiting granular por ruta sensible (`users`, `academic` escritura, etc.).
- Introducir `ConfigModule`/`ConfigService` para centralizar variables.
- Expandir pruebas unitarias y e2e, especialmente en módulos con reglas de negocio (schedule, materials, communication).
- Añadir auditoría y logging estructurado (p.ej. interceptores).
- Revisar uso de `IsEnum` y tipos `any` residuales en DTOs.
- Completar módulos `performance` y `recovery` con controladores y servicios.

## Anexos

### Roles y Acceso

- `SECRETARIA`: gestión administrativa, puede cambiar contraseñas sin validación.
- `PROFESOR`: acceso según asignación y dirección de grupo; gestión de horarios.
- `ESTUDIANTE`: acceso de lectura según pertenencia a grupo.

### Scripts útiles

- `node scripts/seed-secretaria.js`: crea usuario con rol `SECRETARIA` (hash seguro).
- `node scripts/assign-director-and-groupinfo.js`: asigna director y datos del grupo.

---

Este informe sintetiza la arquitectura, seguridad y operación del backend R.E.C, incluyendo mejoras aplicadas y recomendaciones para un endurecimiento adicional.