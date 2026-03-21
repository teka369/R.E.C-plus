-- Fase 4FN: relación canónica Docente <-> Oferta académica
-- Objetivo: desacoplar multivaluación y eliminar redundancia de groupId/subjectId

CREATE TABLE "TeacherOfferingAssignment" (
    "id" SERIAL PRIMARY KEY,
    "teacherId" INTEGER NOT NULL,
    "academicOfferingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "TeacherOfferingAssignment"
  ADD CONSTRAINT "TeacherOfferingAssignment_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeacherOfferingAssignment"
  ADD CONSTRAINT "TeacherOfferingAssignment_academicOfferingId_fkey"
  FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "TeacherOfferingAssignment_teacherId_academicOfferingId_key"
  ON "TeacherOfferingAssignment" ("teacherId", "academicOfferingId");

CREATE INDEX "TeacherOfferingAssignment_academicOfferingId_idx"
  ON "TeacherOfferingAssignment" ("academicOfferingId");

-- Backfill desde TeacherAssignment ya normalizadas con academicOfferingId
INSERT INTO "TeacherOfferingAssignment" ("teacherId", "academicOfferingId", "createdAt")
SELECT DISTINCT ta."teacherId", ta."academicOfferingId", ta."createdAt"
FROM "TeacherAssignment" ta
WHERE ta."academicOfferingId" IS NOT NULL
ON CONFLICT ("teacherId", "academicOfferingId") DO NOTHING;

-- Backfill best-effort para filas legacy sin academicOfferingId
INSERT INTO "TeacherOfferingAssignment" ("teacherId", "academicOfferingId", "createdAt")
SELECT DISTINCT
  ta."teacherId",
  ao."id" as "academicOfferingId",
  ta."createdAt"
FROM "TeacherAssignment" ta
JOIN "AcademicPeriod" ap ON ap."estado" = 'ACTIVE'
JOIN "AcademicOffering" ao
  ON ao."groupId" = ta."groupId"
 AND ao."subjectId" = ta."subjectId"
 AND ao."academicPeriodId" = ap."id"
WHERE ta."academicOfferingId" IS NULL
ON CONFLICT ("teacherId", "academicOfferingId") DO NOTHING;
