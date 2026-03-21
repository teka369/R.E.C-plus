-- Fase 4: Normalización de StudentAcademicRecord
-- Additive bridge: parcial1-4 y gradesJson se mantienen como columnas legadas
-- Se añaden: AcademicEvaluation (plantilla) y EvaluationGrade (nota por estudiante)

-- 1. Añadir academicOfferingId a StudentAcademicRecord
ALTER TABLE "StudentAcademicRecord" ADD COLUMN "academicOfferingId" INTEGER;
ALTER TABLE "StudentAcademicRecord"
  ADD CONSTRAINT "StudentAcademicRecord_academicOfferingId_fkey"
  FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "StudentAcademicRecord_academicOfferingId_idx"
  ON "StudentAcademicRecord"("academicOfferingId");

-- 2. Backfill: vincular registros al AcademicOffering del período ACTIVE
UPDATE "StudentAcademicRecord" sar
SET "academicOfferingId" = ao.id
FROM "AcademicOffering" ao
JOIN "AcademicPeriod" ap ON ap.id = ao."academicPeriodId"
WHERE ao."groupId" = sar."groupId"
  AND ao."subjectId" = sar."subjectId"
  AND ap."estado" = 'ACTIVE'
  AND sar."academicOfferingId" IS NULL;

-- 3. Crear tabla AcademicEvaluation
CREATE TABLE "AcademicEvaluation" (
    "id"                 SERIAL PRIMARY KEY,
    "academicOfferingId" INTEGER NOT NULL,
    "titulo"             TEXT NOT NULL,
    "tipo"               TEXT NOT NULL DEFAULT 'PARCIAL',
    "porcentaje"         DOUBLE PRECISION,
    "orden"              INTEGER NOT NULL DEFAULT 0,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "AcademicEvaluation"
  ADD CONSTRAINT "AcademicEvaluation_academicOfferingId_fkey"
  FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "AcademicEvaluation_academicOfferingId_idx"
  ON "AcademicEvaluation"("academicOfferingId");

-- 4. Crear tabla EvaluationGrade
CREATE TABLE "EvaluationGrade" (
    "id"                   SERIAL PRIMARY KEY,
    "academicEvaluationId" INTEGER NOT NULL,
    "studentGroupId"       INTEGER NOT NULL,
    "nota"                 DOUBLE PRECISION NOT NULL,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "EvaluationGrade"
  ADD CONSTRAINT "EvaluationGrade_academicEvaluationId_fkey"
  FOREIGN KEY ("academicEvaluationId") REFERENCES "AcademicEvaluation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvaluationGrade"
  ADD CONSTRAINT "EvaluationGrade_studentGroupId_fkey"
  FOREIGN KEY ("studentGroupId") REFERENCES "StudentGroup"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "EvaluationGrade_academicEvaluationId_studentGroupId_key"
  ON "EvaluationGrade"("academicEvaluationId", "studentGroupId");
CREATE INDEX "EvaluationGrade_studentGroupId_idx"
  ON "EvaluationGrade"("studentGroupId");

-- 5. Migrar datos: crear AcademicEvaluation para cada offering con parciales
--    Se insertan sólo si existen registros con notas en esas columnas
INSERT INTO "AcademicEvaluation" ("academicOfferingId", "titulo", "tipo", "orden", "updatedAt")
SELECT DISTINCT sar."academicOfferingId", 'Parcial 1', 'PARCIAL', 1, CURRENT_TIMESTAMP
FROM "StudentAcademicRecord" sar
WHERE sar."parcial1" IS NOT NULL AND sar."academicOfferingId" IS NOT NULL;

INSERT INTO "AcademicEvaluation" ("academicOfferingId", "titulo", "tipo", "orden", "updatedAt")
SELECT DISTINCT sar."academicOfferingId", 'Parcial 2', 'PARCIAL', 2, CURRENT_TIMESTAMP
FROM "StudentAcademicRecord" sar
WHERE sar."parcial2" IS NOT NULL AND sar."academicOfferingId" IS NOT NULL;

INSERT INTO "AcademicEvaluation" ("academicOfferingId", "titulo", "tipo", "orden", "updatedAt")
SELECT DISTINCT sar."academicOfferingId", 'Parcial 3', 'PARCIAL', 3, CURRENT_TIMESTAMP
FROM "StudentAcademicRecord" sar
WHERE sar."parcial3" IS NOT NULL AND sar."academicOfferingId" IS NOT NULL;

INSERT INTO "AcademicEvaluation" ("academicOfferingId", "titulo", "tipo", "orden", "updatedAt")
SELECT DISTINCT sar."academicOfferingId", 'Parcial 4', 'PARCIAL', 4, CURRENT_TIMESTAMP
FROM "StudentAcademicRecord" sar
WHERE sar."parcial4" IS NOT NULL AND sar."academicOfferingId" IS NOT NULL;

-- 6. Migrar notas: copiar parcial1-4 a EvaluationGrade
INSERT INTO "EvaluationGrade" ("academicEvaluationId", "studentGroupId", "nota", "updatedAt")
SELECT ae.id, sg.id, sar."parcial1", CURRENT_TIMESTAMP
FROM "StudentAcademicRecord" sar
JOIN "AcademicEvaluation" ae
  ON ae."academicOfferingId" = sar."academicOfferingId" AND ae."titulo" = 'Parcial 1'
JOIN "StudentGroup" sg
  ON sg."studentId" = sar."studentId" AND sg."groupId" = sar."groupId"
WHERE sar."parcial1" IS NOT NULL AND sar."academicOfferingId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "EvaluationGrade" ("academicEvaluationId", "studentGroupId", "nota", "updatedAt")
SELECT ae.id, sg.id, sar."parcial2", CURRENT_TIMESTAMP
FROM "StudentAcademicRecord" sar
JOIN "AcademicEvaluation" ae
  ON ae."academicOfferingId" = sar."academicOfferingId" AND ae."titulo" = 'Parcial 2'
JOIN "StudentGroup" sg
  ON sg."studentId" = sar."studentId" AND sg."groupId" = sar."groupId"
WHERE sar."parcial2" IS NOT NULL AND sar."academicOfferingId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "EvaluationGrade" ("academicEvaluationId", "studentGroupId", "nota", "updatedAt")
SELECT ae.id, sg.id, sar."parcial3", CURRENT_TIMESTAMP
FROM "StudentAcademicRecord" sar
JOIN "AcademicEvaluation" ae
  ON ae."academicOfferingId" = sar."academicOfferingId" AND ae."titulo" = 'Parcial 3'
JOIN "StudentGroup" sg
  ON sg."studentId" = sar."studentId" AND sg."groupId" = sar."groupId"
WHERE sar."parcial3" IS NOT NULL AND sar."academicOfferingId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "EvaluationGrade" ("academicEvaluationId", "studentGroupId", "nota", "updatedAt")
SELECT ae.id, sg.id, sar."parcial4", CURRENT_TIMESTAMP
FROM "StudentAcademicRecord" sar
JOIN "AcademicEvaluation" ae
  ON ae."academicOfferingId" = sar."academicOfferingId" AND ae."titulo" = 'Parcial 4'
JOIN "StudentGroup" sg
  ON sg."studentId" = sar."studentId" AND sg."groupId" = sar."groupId"
WHERE sar."parcial4" IS NOT NULL AND sar."academicOfferingId" IS NOT NULL
ON CONFLICT DO NOTHING;
