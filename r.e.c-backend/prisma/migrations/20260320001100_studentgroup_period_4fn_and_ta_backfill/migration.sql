-- ======================================================================
-- Migración 20260320001100: StudentGroup period 4FN + TA backfill
-- ======================================================================
-- 1. Backfill TeacherAssignment.academicOfferingId para los 4 registros que
--    aún tienen NULL, enlazándolos con la AcademicOffering correspondiente.
-- ======================================================================

UPDATE "TeacherAssignment" ta
SET "academicOfferingId" = ao.id
FROM "AcademicOffering" ao
WHERE ta."groupId"   = ao."groupId"
  AND ta."subjectId" = ao."subjectId"
  AND ta."academicOfferingId" IS NULL;

-- ======================================================================
-- 2. Completar TeacherOfferingAssignment para los registros recién enlazados
--    (no duplicar si ya existe la fila canónica).
-- ======================================================================

INSERT INTO "TeacherOfferingAssignment" ("teacherId", "academicOfferingId", "createdAt")
SELECT DISTINCT ta."teacherId", ta."academicOfferingId", NOW()
FROM "TeacherAssignment" ta
WHERE ta."academicOfferingId" IS NOT NULL
ON CONFLICT ("teacherId", "academicOfferingId") DO NOTHING;

-- ======================================================================
-- 3. StudentGroup: hacer academicPeriodId NOT NULL
--    (verificado en prod: 0 filas tienen NULL, backfill no necesario)
-- ======================================================================

ALTER TABLE "StudentGroup"
  ALTER COLUMN "academicPeriodId" SET NOT NULL;

-- ======================================================================
-- 4. Actualizar FK: SetNull → Cascade (compatible con NOT NULL)
-- ======================================================================

ALTER TABLE "StudentGroup"
  DROP CONSTRAINT IF EXISTS "StudentGroup_academicPeriodId_fkey";

ALTER TABLE "StudentGroup"
  ADD CONSTRAINT "StudentGroup_academicPeriodId_fkey"
  FOREIGN KEY ("academicPeriodId")
  REFERENCES "AcademicPeriod"(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ======================================================================
-- 5. Reemplazar unique constraint: [studentId, groupId] → [studentId, groupId, academicPeriodId]
--    La clave más amplia permite matriculaciones en distintos períodos.
-- ======================================================================

ALTER TABLE "StudentGroup"
  DROP CONSTRAINT IF EXISTS "StudentGroup_studentId_groupId_key";

ALTER TABLE "StudentGroup"
  ADD CONSTRAINT "StudentGroup_studentId_groupId_academicPeriodId_key"
  UNIQUE ("studentId", "groupId", "academicPeriodId");
