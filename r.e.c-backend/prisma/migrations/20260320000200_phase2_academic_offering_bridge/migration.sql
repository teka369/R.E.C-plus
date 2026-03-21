-- Fase 2 de normalizacion academica.
-- Se introduce una oferta academica formal y se enlaza TeacherAssignment sin romper el modelo legado.

CREATE TABLE "AcademicOffering" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "academicPeriodId" INTEGER NOT NULL,
    "groupSubjectId" INTEGER,
    "weeklyHours" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicOffering_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicOffering_groupId_subjectId_academicPeriodId_key"
ON "AcademicOffering"("groupId", "subjectId", "academicPeriodId");

CREATE INDEX "AcademicOffering_groupSubjectId_idx"
ON "AcademicOffering"("groupSubjectId");

ALTER TABLE "AcademicOffering"
ADD CONSTRAINT "AcademicOffering_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcademicOffering"
ADD CONSTRAINT "AcademicOffering_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcademicOffering"
ADD CONSTRAINT "AcademicOffering_academicPeriodId_fkey"
FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcademicOffering"
ADD CONSTRAINT "AcademicOffering_groupSubjectId_fkey"
FOREIGN KEY ("groupSubjectId") REFERENCES "GroupSubject"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AcademicOffering" (
    "groupId",
    "subjectId",
    "academicPeriodId",
    "groupSubjectId",
    "weeklyHours",
    "isActive"
)
SELECT
    gs."groupId",
    gs."subjectId",
    COALESCE(gs."academicPeriodId", ap."id") AS "academicPeriodId",
    gs."id" AS "groupSubjectId",
    gs."weeklyHours",
    gs."isActive"
FROM "GroupSubject" gs
LEFT JOIN "AcademicPeriod" ap
  ON ap."codigo" = 'LEGACY-2026'
ON CONFLICT ("groupId", "subjectId", "academicPeriodId") DO NOTHING;

ALTER TABLE "TeacherAssignment"
ADD COLUMN "academicOfferingId" INTEGER;

UPDATE "TeacherAssignment" ta
SET "academicOfferingId" = ao."id"
FROM "AcademicOffering" ao
LEFT JOIN "AcademicPeriod" ap
  ON ap."codigo" = 'LEGACY-2026'
WHERE ao."groupId" = ta."groupId"
  AND ao."subjectId" = ta."subjectId"
  AND (
    ao."academicPeriodId" = ap."id"
    OR ap."id" IS NULL
  )
  AND ta."academicOfferingId" IS NULL;

ALTER TABLE "TeacherAssignment"
ADD CONSTRAINT "TeacherAssignment_academicOfferingId_fkey"
FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "TeacherAssignment_academicOfferingId_idx"
ON "TeacherAssignment"("academicOfferingId");