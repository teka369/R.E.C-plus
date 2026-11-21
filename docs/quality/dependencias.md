# Dependencias

Escaneo del 20 de noviembre de 2026, con Node.js 26.13.1, sobre los lockfiles de la rama. No se usó `npm audit fix --force`.

## Frontend

`npm audit fix` sin `--force` actualizó transitivos que no exigían un major. Después del arreglo quedan 7 moderadas.

| Paquete | Severidad | Directa | Producción | Motivo de no aplicar el fix restante |
| --- | --- | --- | --- | --- |
| `exceljs` / `uuid` | moderada | sí / no | sí | El fix publicado baja a exceljs 3.4.0, un major hacia atrás. Rompería la exportación actual. |
| `@sentry/nextjs` y sus plugins, `glob`, `minimatch` | moderada | sentry sí | sí | `npm audit fix` no los resolvió sin `--force`. El aviso de glob es un bypass de cancelación en herramientas de build, no en el runtime del navegador. |

`next` 16.4.6 y `axios` 1.21.1 ya no aparecen en el escaneo.

## Backend

30 avisos: 4 altos y 26 moderados. Todos los fixes publicados exigen un major.

| Paquete | Severidad | Directa | Motivo |
| --- | --- | --- | --- |
| `prisma`, `@prisma/config`, `effect`, `deepmerge-ts` | alta | prisma sí | El fix es Prisma 7. Cambia la configuración del cliente y las migraciones. No se aplica en este ciclo. |
| `jest` y paquetes `@jest/*` | moderada | jest sí | El fix es Jest 29. El proyecto ya usa la línea 30. Bajar de major no es una corrección. |
| `firebase-admin` y clientes de Google | moderada | firebase-admin sí | El fix es firebase-admin 14. Cambia la API de la cuenta de servicio. |
| `@nestjs/cli`, `glob`, `minimatch` | moderada | cli sí | El fix es `@nestjs/cli` 12. Afecta el compilador de desarrollo, no el runtime publicado. |

Ninguno de esos altos está en el camino de una petición HTTP sin pasar por Prisma, que ya está fijado en la línea 6.
