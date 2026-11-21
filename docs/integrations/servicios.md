# Servicios externos

Estado leído del código, no de un proveedor.

| Servicio | Obligatorio | Para qué | Si falta |
| --- | --- | --- | --- |
| PostgreSQL | Sí | Datos de la aplicación. Prisma aplica el esquema. | El API no arranca de forma útil. |
| Resend | Sí para correo | Restablecimiento de contraseña (`MailService`). | El proceso arranca y registra que no enviará correo. El usuario no recibe el enlace. |
| Redis | No | Intentos de login, rate limit, caché y adapter de Socket.IO si hay varias instancias. | Cada proceso usa memoria. Con más de una instancia los límites no se comparten. |
| Firebase Admin | No | Push a tokens guardados en la base. | Si no existe `firebase-service-account.json`, el push queda desactivado. |
| Sentry | No | Errores del backend si hay `SENTRY_DSN`. El frontend puede usar `NEXT_PUBLIC_SENTRY_DSN`. | No se reportan errores fuera del log local. |
| Disco local | Sí para archivos | Materiales y adjuntos de recuperación se escriben en `uploads/`. | Sin un volumen persistente, un redeploy borra los archivos. |

No hay cliente S3 instalado. La abstracción que elegía `STORAGE_PROVIDER=s3` se retiró porque no estaba conectada a materiales y la dependencia no estaba declarada.

Socket.IO forma parte del backend. No es un servicio que haya que contratar. Si hay más de un proceso y `REDIS_URL`, el adapter de Socket.IO usa Redis.

El correo sale solo por Resend. No hay otro proveedor en el código.
