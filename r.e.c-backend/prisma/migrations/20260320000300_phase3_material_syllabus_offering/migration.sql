-- Fase 3 de normalizacion academica.
-- Vincula StudyMaterial y Syllabus a la oferta academica formal.
-- Todos los cambios son aditivos: columnas opcionales con backfill.

-- 1. Columna en StudyMaterial
ALTER TABLE "StudyMaterial"
ADD COLUMN "academicOfferingId" INTEGER;

UPDATE "StudyMaterial" sm
SET "academicOfferingId" = ao."id"
FROM "AcademicOffering" ao
WHERE ao."groupId" = sm."groupId"
  AND ao."subjectId" = sm."subjectId";

ALTER TABLE "StudyMaterial"
ADD CONSTRAINT "StudyMaterial_academicOfferingId_fkey"
FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StudyMaterial_academicOfferingId_idx"
ON "StudyMaterial"("academicOfferingId");

-- 2. Columna en Syllabus
ALTER TABLE "Syllabus"
ADD COLUMN "academicOfferingId" INTEGER;

UPDATE "Syllabus" s
SET "academicOfferingId" = ao."id"
FROM "AcademicOffering" ao
WHERE ao."groupId" = s."groupId"
  AND ao."subjectId" = s."subjectId";

ALTER TABLE "Syllabus"
ADD CONSTRAINT "Syllabus_academicOfferingId_fkey"
FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Syllabus_academicOfferingId_idx"
ON "Syllabus"("academicOfferingId");
