-- Academic multitenancy scoping for core academic entities
-- Adds institutionId to AcademicPeriod, Grade, Group, Subject with safe backfill.

ALTER TABLE "AcademicPeriod"
  ADD COLUMN IF NOT EXISTS "institutionId" INTEGER;

ALTER TABLE "Grade"
  ADD COLUMN IF NOT EXISTS "institutionId" INTEGER;

ALTER TABLE "Group"
  ADD COLUMN IF NOT EXISTS "institutionId" INTEGER;

ALTER TABLE "Subject"
  ADD COLUMN IF NOT EXISTS "institutionId" INTEGER;

WITH default_institution AS (
  SELECT id FROM "Institution" ORDER BY id ASC LIMIT 1
)
UPDATE "Grade" g
SET "institutionId" = di.id
FROM default_institution di
WHERE g."institutionId" IS NULL;

UPDATE "Group" g
SET "institutionId" = gr."institutionId"
FROM "Grade" gr
WHERE g."gradeId" = gr."id"
  AND g."institutionId" IS NULL
  AND gr."institutionId" IS NOT NULL;

WITH default_institution AS (
  SELECT id FROM "Institution" ORDER BY id ASC LIMIT 1
)
UPDATE "Group" g
SET "institutionId" = di.id
FROM default_institution di
WHERE g."institutionId" IS NULL;

WITH default_institution AS (
  SELECT id FROM "Institution" ORDER BY id ASC LIMIT 1
)
UPDATE "Subject" s
SET "institutionId" = di.id
FROM default_institution di
WHERE s."institutionId" IS NULL;

WITH default_institution AS (
  SELECT id FROM "Institution" ORDER BY id ASC LIMIT 1
)
UPDATE "AcademicPeriod" ap
SET "institutionId" = di.id
FROM default_institution di
WHERE ap."institutionId" IS NULL;

ALTER TABLE "AcademicPeriod"
  ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "Grade"
  ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "Group"
  ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "Subject"
  ALTER COLUMN "institutionId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AcademicPeriod_institutionId_fkey'
  ) THEN
    ALTER TABLE "AcademicPeriod"
      ADD CONSTRAINT "AcademicPeriod_institutionId_fkey"
      FOREIGN KEY ("institutionId") REFERENCES "Institution"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Grade_institutionId_fkey'
  ) THEN
    ALTER TABLE "Grade"
      ADD CONSTRAINT "Grade_institutionId_fkey"
      FOREIGN KEY ("institutionId") REFERENCES "Institution"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Group_institutionId_fkey'
  ) THEN
    ALTER TABLE "Group"
      ADD CONSTRAINT "Group_institutionId_fkey"
      FOREIGN KEY ("institutionId") REFERENCES "Institution"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Subject_institutionId_fkey'
  ) THEN
    ALTER TABLE "Subject"
      ADD CONSTRAINT "Subject_institutionId_fkey"
      FOREIGN KEY ("institutionId") REFERENCES "Institution"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "AcademicPeriod_codigo_key";
DROP INDEX IF EXISTS "Grade_nombre_key";
DROP INDEX IF EXISTS "Subject_nombre_key";

CREATE UNIQUE INDEX IF NOT EXISTS "AcademicPeriod_institutionId_codigo_key"
  ON "AcademicPeriod"("institutionId", "codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "Grade_institutionId_nombre_key"
  ON "Grade"("institutionId", "nombre");
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_institutionId_nombre_key"
  ON "Subject"("institutionId", "nombre");

CREATE INDEX IF NOT EXISTS "AcademicPeriod_institutionId_idx"
  ON "AcademicPeriod"("institutionId");
CREATE INDEX IF NOT EXISTS "Grade_institutionId_idx"
  ON "Grade"("institutionId");
CREATE INDEX IF NOT EXISTS "Group_institutionId_idx"
  ON "Group"("institutionId");
CREATE INDEX IF NOT EXISTS "Subject_institutionId_idx"
  ON "Subject"("institutionId");
