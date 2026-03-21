-- =============================================================
-- Fases 8-11: Eliminación de columnas legadas, corrección de
-- restricciones únicas, normalización de JSON y enums
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- FASE 8A: Eliminar columnas legadas de StudentAcademicRecord
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "StudentAcademicRecord" DROP COLUMN IF EXISTS "parcial1";
ALTER TABLE "StudentAcademicRecord" DROP COLUMN IF EXISTS "parcial2";
ALTER TABLE "StudentAcademicRecord" DROP COLUMN IF EXISTS "parcial3";
ALTER TABLE "StudentAcademicRecord" DROP COLUMN IF EXISTS "parcial4";
ALTER TABLE "StudentAcademicRecord" DROP COLUMN IF EXISTS "gradesJson";

-- ─────────────────────────────────────────────────────────────
-- FASE 8B: Eliminar estudiantesDestacados de GradePerformance
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "GradePerformance" DROP COLUMN IF EXISTS "estudiantesDestacados";

-- ─────────────────────────────────────────────────────────────
-- FASE 8C: Eliminar columnas JSON de GroupInfo
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "GroupInfo" DROP COLUMN IF EXISTS "highlights";
ALTER TABLE "GroupInfo" DROP COLUMN IF EXISTS "metrics";
ALTER TABLE "GroupInfo" DROP COLUMN IF EXISTS "links";

-- ─────────────────────────────────────────────────────────────
-- FASE 8D: Eliminar JSON de Feedback
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "Feedback" DROP COLUMN IF EXISTS "strengths";
ALTER TABLE "Feedback" DROP COLUMN IF EXISTS "improvements";

-- ─────────────────────────────────────────────────────────────
-- FASE 8E: Syllabus — eliminar period, añadir academicPeriodId
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "Syllabus" DROP COLUMN IF EXISTS "period";
ALTER TABLE "Syllabus" ADD COLUMN IF NOT EXISTS "academicPeriodId" INTEGER;
ALTER TABLE "Syllabus"
  ADD CONSTRAINT "Syllabus_academicPeriodId_fkey"
  FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Syllabus_academicPeriodId_idx"
  ON "Syllabus"("academicPeriodId");

-- Backfill: vincular syllabi al período activo
UPDATE "Syllabus" s
SET "academicPeriodId" = ao."academicPeriodId"
FROM "AcademicOffering" ao
WHERE s."academicOfferingId" = ao.id
  AND s."academicPeriodId" IS NULL;

-- Fallback: periodo ACTIVE si no tiene offering
UPDATE "Syllabus" s
SET "academicPeriodId" = (
    SELECT id FROM "AcademicPeriod" WHERE "estado" = 'ACTIVE' LIMIT 1
)
WHERE s."academicPeriodId" IS NULL;

-- ─────────────────────────────────────────────────────────────
-- FASE 9: Corregir restricción única de GradePerformance
-- ─────────────────────────────────────────────────────────────

-- Asegurar que existe un período activo; si no hay, crear uno por defecto
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

-- Backfill: dar un período a todos los registros GradePerformance sin período
UPDATE "GradePerformance" gp
SET "academicPeriodId" = (
    SELECT id FROM "AcademicPeriod" WHERE "estado" = 'ACTIVE' LIMIT 1
)
WHERE gp."academicPeriodId" IS NULL;

-- Hacer academicPeriodId NOT NULL
ALTER TABLE "GradePerformance" ALTER COLUMN "academicPeriodId" SET NOT NULL;

-- Eliminar restricción única antigua (groupId @unique)
ALTER TABLE "GradePerformance" DROP CONSTRAINT IF EXISTS "GradePerformance_groupId_key";
DROP INDEX IF EXISTS "GradePerformance_groupId_key";

-- Eliminar índice antiguo de academicPeriodId (ahora cubierto por el unique compuesto)
DROP INDEX IF EXISTS "GradePerformance_academicPeriodId_idx";

-- Añadir restricción única compuesta
ALTER TABLE "GradePerformance"
  ADD CONSTRAINT "GradePerformance_groupId_academicPeriodId_key"
  UNIQUE ("groupId", "academicPeriodId");

-- FK a AcademicPeriod (cambiar de SetNull+Cascade a Cascade)
ALTER TABLE "GradePerformance" DROP CONSTRAINT IF EXISTS "GradePerformance_academicPeriodId_fkey";
ALTER TABLE "GradePerformance"
  ADD CONSTRAINT "GradePerformance_academicPeriodId_fkey"
  FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- FASE 10: Tablas hijas FeedbackStrength, FeedbackImprovement
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FeedbackStrength" (
    "id"         SERIAL PRIMARY KEY,
    "feedbackId" INTEGER NOT NULL,
    "texto"      TEXT NOT NULL,
    "orden"      INTEGER NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "FeedbackStrength"
  ADD CONSTRAINT "FeedbackStrength_feedbackId_fkey"
  FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "FeedbackStrength_feedbackId_idx"
  ON "FeedbackStrength"("feedbackId");

CREATE TABLE IF NOT EXISTS "FeedbackImprovement" (
    "id"         SERIAL PRIMARY KEY,
    "feedbackId" INTEGER NOT NULL,
    "texto"      TEXT NOT NULL,
    "orden"      INTEGER NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "FeedbackImprovement"
  ADD CONSTRAINT "FeedbackImprovement_feedbackId_fkey"
  FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "FeedbackImprovement_feedbackId_idx"
  ON "FeedbackImprovement"("feedbackId");

-- ─────────────────────────────────────────────────────────────
-- FASE 11: Conversión de String → Enum en PostgreSQL
-- ─────────────────────────────────────────────────────────────

-- SyllabusStatus
DO $$ BEGIN
  CREATE TYPE "SyllabusStatus" AS ENUM ('BORRADOR', 'ACTIVO', 'ARCHIVADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE "Syllabus" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Syllabus" ALTER COLUMN "status" TYPE "SyllabusStatus"
  USING "status"::"SyllabusStatus";
ALTER TABLE "Syllabus" ALTER COLUMN "status" SET DEFAULT 'BORRADOR';

-- FeedbackTipo
DO $$ BEGIN
  CREATE TYPE "FeedbackTipo" AS ENUM ('POSITIVA', 'NEGATIVA', 'INFORMATIVA', 'SEGUIMIENTO');
EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE "Feedback" ALTER COLUMN "tipo" DROP DEFAULT;
ALTER TABLE "Feedback" ALTER COLUMN "tipo" TYPE "FeedbackTipo"
  USING "tipo"::"FeedbackTipo";
ALTER TABLE "Feedback" ALTER COLUMN "tipo" SET DEFAULT 'INFORMATIVA';

-- FeedbackEstado
DO $$ BEGIN
  CREATE TYPE "FeedbackEstado" AS ENUM ('PENDIENTE', 'ATENDIDA');
EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE "Feedback" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Feedback" ALTER COLUMN "estado" TYPE "FeedbackEstado"
  USING "estado"::"FeedbackEstado";
ALTER TABLE "Feedback" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';

-- EvaluacionTipo
DO $$ BEGIN
  CREATE TYPE "EvaluacionTipo" AS ENUM ('PARCIAL', 'EXAMEN_FINAL', 'TALLER', 'PROYECTO', 'QUIZ', 'PRACTICA');
EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE "AcademicEvaluation" ALTER COLUMN "tipo" DROP DEFAULT;
ALTER TABLE "AcademicEvaluation" ALTER COLUMN "tipo" TYPE "EvaluacionTipo"
  USING "tipo"::"EvaluacionTipo";
ALTER TABLE "AcademicEvaluation" ALTER COLUMN "tipo" SET DEFAULT 'PARCIAL';

-- ─────────────────────────────────────────────────────────────
-- FASE 11B: AcademicEvaluation — restricción única (orden por offering)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "AcademicEvaluation"
  DROP CONSTRAINT IF EXISTS "AcademicEvaluation_academicOfferingId_orden_key";
ALTER TABLE "AcademicEvaluation"
  ADD CONSTRAINT "AcademicEvaluation_academicOfferingId_orden_key"
  UNIQUE ("academicOfferingId", "orden");
-- Eliminar índice simple reemplazado por el unique compuesto
DROP INDEX IF EXISTS "AcademicEvaluation_academicOfferingId_idx";
