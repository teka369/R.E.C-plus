# Plan de Rollback — Migraciones Prisma

## Rollback estándar (migración individual)

```bash
# Revertir la última migración
npx prisma migrate down

# Revertir a una migración específica
npx prisma migrate reset --to 20251030214808_init
```

## Rollback en producción (Coolify / Docker)

```bash
# 1. Identificar la migración problemática
docker exec -it <container> npx prisma migrate status

# 2. Revertir suavemente: aplicar la migración anterior
docker exec -it <container> npx prisma migrate resolve --rolled-back "<migration_name>"

# 3. Desplegar la versión anterior del código
#    En Coolify: Rollback al deployment anterior

# 4. Re-aplicar migraciones hasta el punto deseado
docker exec -it <container> npx prisma migrate deploy
```

## Rollback destructivo (solo si es necesario)

```bash
# Esto BORRA TODOS LOS DATOS y recrea desde cero
npx prisma migrate reset
```

## Prevención

1. **Nunca** eliminar columnas en el primer deploy — usa 2 fases:
   - Fase 1: Dejar nullable + marcar como deprecated
   - Fase 2 (próximo deploy): Eliminar columna
2. **Siempre** hacer backup antes de migrar:
   ```bash
   pg_dump -Fc rec_db > pre-migration-$(date +%Y%m%d).dump
   ```
3. **Probar** migraciones en staging antes de producción
