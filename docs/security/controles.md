# Controles y pendientes externos

## Lo que el código hace

- El acceso usa JWT con issuer, audience y secreto de al menos 32 caracteres.
- El refresh es otro secreto y queda ligado a una sesión en la base.
- Un login fallido incrementa un contador por IP. Al quinto fallo, durante 900 segundos, no se aceptan más intentos de esa IP. En producción con Redis el contador es compartido. Sin Redis, cada proceso tiene el suyo.
- Las rutas de institución, usuarios, materiales, horario, recuperación y rendimiento comprueban rol y pertenencia en el servicio, no solo en la pantalla.
- `GET` y `PATCH` de usuarios identifican a la persona por `publicId`, no por el id interno.
- Los archivos de materiales se leen solo si la ruta resuelta sigue dentro de `uploads/`.
- El árbol actual ignora `.env` y `uploads/`. El workflow rechaza secretos y uploads rastreados.

Las suites de integración cubren el rechazo entre dos instituciones en usuarios, académico, materiales, horario, recuperación y rendimiento. Eso no sustituye una revisión de cada método nuevo.

## Lo que el propietario debe hacer

Estas acciones no se pueden cerrar desde el repositorio. Hasta hacerlas, el historial público se trata como comprometido.

| Clase | Dónde apareció | Acción |
| --- | --- | --- |
| Contraseña de Postgres | `.env` histórico del backend | Rotar el rol en el proveedor y actualizar el servidor |
| `JWT_SECRET` | backend y frontend | Generar uno nuevo e inyectarlo en ambos procesos |
| `JWT_REFRESH_SECRET` | backend | Generar otro distinto |
| `INTERNAL_API_KEY` | backend | Generar uno nuevo |
| `RESEND_API_KEY` | backend | Revocar la clave y crear otra |
| Cuenta de Firebase | si el JSON estuvo en el árbol | Rotar la cuenta de servicio |

No hay evidencia en este repositorio de que esas revocaciones ya se hayan hecho.

## Purga del historial

Se ejecutó `git-filter-repo` y se reescribió `main` con autorización del propietario. La copia de respaldo quedó fuera del repositorio. El historial accesible ya no contiene los `.env` ni `uploads/`. Las referencias internas de GitHub (PRs, cachés y forks) pueden conservar blobs y requieren solicitud a soporte o acción manual del propietario.
