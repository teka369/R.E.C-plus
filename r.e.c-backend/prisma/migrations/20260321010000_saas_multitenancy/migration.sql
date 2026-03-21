DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Role'
      AND e.enumlabel = 'SUPER_ADMIN'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'InstitutionPlan'
  ) THEN
    CREATE TYPE "InstitutionPlan" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Institution" (
  "id" SERIAL NOT NULL,
  "nombre" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "codigo" TEXT,
  "dominio" TEXT,
  "plan" "InstitutionPlan" NOT NULL DEFAULT 'BASIC',
  "activa" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Institution_slug_key" ON "Institution"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Institution_codigo_key" ON "Institution"("codigo");

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "institutionId" INTEGER;

INSERT INTO "Institution" ("nombre", "slug", "codigo", "dominio", "plan", "activa", "createdAt", "updatedAt")
SELECT 'Institucion Inicial', 'institucion-inicial', 'INIT', NULL, 'BASIC', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Institution");

WITH default_institution AS (
  SELECT id FROM "Institution" ORDER BY id ASC LIMIT 1
)
UPDATE "User" u
SET "institutionId" = di.id
FROM default_institution di
WHERE u."institutionId" IS NULL
  AND u."role"::text <> 'SUPER_ADMIN';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_institutionId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_institutionId_fkey"
      FOREIGN KEY ("institutionId") REFERENCES "Institution"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "User_institutionId_idx" ON "User"("institutionId");
