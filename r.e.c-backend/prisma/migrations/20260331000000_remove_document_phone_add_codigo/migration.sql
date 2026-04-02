-- DropIndex
DROP INDEX IF EXISTS "User_documento_identidad_key";

-- AlterTable: Add codigo column with default for existing rows
ALTER TABLE "User" ADD COLUMN "codigo" TEXT;

-- Populate existing rows with unique cuids
UPDATE "User" SET "codigo" = 'c' || substr(md5(random()::text || id::text), 1, 24) WHERE "codigo" IS NULL;

-- Make codigo NOT NULL and add unique constraint
ALTER TABLE "User" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX "User_codigo_key" ON "User"("codigo");

-- Drop old columns
ALTER TABLE "User" DROP COLUMN "documento_identidad";
ALTER TABLE "User" DROP COLUMN "telefono";
