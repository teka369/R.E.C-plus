-- Fase 7: Vincular RecoveryConfig y RecoverySchedule a AcademicPeriod
-- Los singletons (id=1) se mantienen hacia atrás; se añade FK opcional al período

-- 1. RecoveryConfig: añadir academicPeriodId
ALTER TABLE "RecoveryConfig" ADD COLUMN "academicPeriodId" INTEGER;
ALTER TABLE "RecoveryConfig"
  ADD CONSTRAINT "RecoveryConfig_academicPeriodId_fkey"
  FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. RecoverySchedule: añadir academicPeriodId y updatedAt
ALTER TABLE "RecoverySchedule" ADD COLUMN "academicPeriodId" INTEGER;
ALTER TABLE "RecoverySchedule" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "RecoverySchedule"
  ADD CONSTRAINT "RecoverySchedule_academicPeriodId_fkey"
  FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Backfill: vincular al período ACTIVE si existe
UPDATE "RecoveryConfig" rc
SET "academicPeriodId" = ap.id
FROM "AcademicPeriod" ap
WHERE ap."estado" = 'ACTIVE'
  AND rc."academicPeriodId" IS NULL;

UPDATE "RecoverySchedule" rs
SET "academicPeriodId" = ap.id
FROM "AcademicPeriod" ap
WHERE ap."estado" = 'ACTIVE'
  AND rs."academicPeriodId" IS NULL;
