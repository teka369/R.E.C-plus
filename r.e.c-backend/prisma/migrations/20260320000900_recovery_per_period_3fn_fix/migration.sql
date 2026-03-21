-- Rectificación 3FN: RecoveryConfig y RecoverySchedule por período académico
-- Elimina patrón singleton (id=1) y fuerza 1 registro por período

-- 1) Asegurar que exista período activo para backfill
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "AcademicPeriod" WHERE "estado" = 'ACTIVE') THEN
    INSERT INTO "AcademicPeriod" ("nombre", "codigo", "tipo", "estado", "fechaInicio", "fechaFin", "createdAt", "updatedAt")
    VALUES (
      'Período 2026-I',
      'PERIODO-2026-1',
      'TERM',
      'ACTIVE',
      '2026-01-15 00:00:00'::timestamp,
      '2026-06-30 23:59:59'::timestamp,
      NOW(),
      NOW()
    )
    ON CONFLICT ("codigo") DO UPDATE SET "estado" = 'ACTIVE';
  END IF;
END $$;

-- 2) RecoveryConfig: backfill periodo si está nulo
UPDATE "RecoveryConfig"
SET "academicPeriodId" = (
  SELECT id FROM "AcademicPeriod" WHERE "estado" = 'ACTIVE' LIMIT 1
)
WHERE "academicPeriodId" IS NULL;

-- 3) RecoverySchedule: backfill periodo si está nulo
UPDATE "RecoverySchedule"
SET "academicPeriodId" = (
  SELECT id FROM "AcademicPeriod" WHERE "estado" = 'ACTIVE' LIMIT 1
)
WHERE "academicPeriodId" IS NULL;

-- 4) Resolver posibles duplicados por periodo conservando el más reciente
DELETE FROM "RecoveryConfig" rc
USING "RecoveryConfig" rc_keep
WHERE rc."academicPeriodId" = rc_keep."academicPeriodId"
  AND rc.id < rc_keep.id;

DELETE FROM "RecoverySchedule" rs
USING "RecoverySchedule" rs_keep
WHERE rs."academicPeriodId" = rs_keep."academicPeriodId"
  AND rs.id < rs_keep.id;

-- 5) Hacer academicPeriodId obligatorio + único
ALTER TABLE "RecoveryConfig" ALTER COLUMN "academicPeriodId" SET NOT NULL;
ALTER TABLE "RecoverySchedule" ALTER COLUMN "academicPeriodId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "RecoveryConfig_academicPeriodId_key"
  ON "RecoveryConfig" ("academicPeriodId");
CREATE UNIQUE INDEX IF NOT EXISTS "RecoverySchedule_academicPeriodId_key"
  ON "RecoverySchedule" ("academicPeriodId");

-- 6) Re-crear FKs con onDelete Cascade para dependencia total del período
ALTER TABLE "RecoveryConfig" DROP CONSTRAINT IF EXISTS "RecoveryConfig_academicPeriodId_fkey";
ALTER TABLE "RecoveryConfig"
  ADD CONSTRAINT "RecoveryConfig_academicPeriodId_fkey"
  FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecoverySchedule" DROP CONSTRAINT IF EXISTS "RecoverySchedule_academicPeriodId_fkey";
ALTER TABLE "RecoverySchedule"
  ADD CONSTRAINT "RecoverySchedule_academicPeriodId_fkey"
  FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
