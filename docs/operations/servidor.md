# Instalación en un servidor propio

Esta guía no despliega nada. La ejecuta quien administra el servidor.

## Obligatorio

- Node.js 20 y npm.
- PostgreSQL 15 o superior, con una base vacía para la aplicación.
- Un proceso para el backend y otro para el frontend, o el equivalente en el supervisor que ya use el servidor.
- Disco persistente para `r.e.c-backend/uploads`, con permisos de escritura para el usuario del proceso y copia de seguridad. Guardar un archivo en esa carpeta no lo hace persistente si el disco es efímero.
- Los secretos de [entorno.md](entorno.md), generados en el servidor. No los copies de un ejemplo ni de un historial de git.

## Opcional

- Redis, si habrá más de una instancia o se quiere que el límite de login sea compartido.
- Cuenta de Resend y dominio de envío, si los usuarios deben recibir el restablecimiento por correo.
- Cuenta de servicio de Firebase, si se quieren notificaciones push.
- Sentry, si se quieren errores fuera del servidor.

## Arranque

Backend, después de instalar dependencias y generar el cliente de Prisma:

```bash
cd r.e.c-backend
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy
npm run start:prod
```

`npm run start:with-migrations` aplica migraciones y luego arranca. Úsalo solo cuando el proceso tenga permiso de migrar y no haya varias instancias migrando a la vez.

Frontend:

```bash
cd r.e.c-frontend
npm ci
npm run build
npm run start
```

El navegador habla con Nest para Socket.IO usando `NEXT_PUBLIC_API_BASE_URL`. El servidor Next habla con Nest usando `INTERNAL_API_URL`. CORS del backend debe incluir el origen público del frontend, sin barra final.

Si hay un proxy inverso, define `TRUST_PROXY=1` en el backend. En el frontend, `TRUST_PROXY_HEADERS=1` solo si ese proxy es de confianza y reescribe la IP. No actives esa opción si el cliente puede enviar `X-Forwarded-For`.

## Comprobación

- `GET /health` del backend responde.
- Un login de prueba contra la base nueva funciona.
- Un archivo subido sigue disponible después de reiniciar el proceso, no necesariamente después de recrear el contenedor si el volumen no está montado.

## Copias

`scripts/backup.sh` es un script de volcado. Revísalo antes de programarlo: debe apuntar a la base de este servidor y guardar el resultado fuera de la máquina. Los archivos de `uploads/` no entran en un volcado de PostgreSQL.

## Qué no hace este repositorio

No crea bases, no compra dominios y no publica la aplicación. `ecosystem.config.cjs` es un ejemplo de PM2 por si el administrador ya usa PM2. No es un requisito.
