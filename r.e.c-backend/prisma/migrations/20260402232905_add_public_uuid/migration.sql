-- Step 1: Add publicId columns as nullable
ALTER TABLE "User" ADD COLUMN "publicId" TEXT;
ALTER TABLE "Institution" ADD COLUMN "publicId" TEXT;
ALTER TABLE "EvaluationGrade" ADD COLUMN "publicId" TEXT;
ALTER TABLE "StudentAcademicRecord" ADD COLUMN "publicId" TEXT;

-- Step 2: Backfill existing rows with UUIDs
UPDATE "User" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;
UPDATE "Institution" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;
UPDATE "EvaluationGrade" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;
UPDATE "StudentAcademicRecord" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;

-- Step 3: Set NOT NULL + default for new rows
ALTER TABLE "User" ALTER COLUMN "publicId" SET NOT NULL, ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Institution" ALTER COLUMN "publicId" SET NOT NULL, ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "EvaluationGrade" ALTER COLUMN "publicId" SET NOT NULL, ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "StudentAcademicRecord" ALTER COLUMN "publicId" SET NOT NULL, ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid()::text;

-- Step 4: Unique constraints
CREATE UNIQUE INDEX "User_publicId_key" ON "User"("publicId");
CREATE UNIQUE INDEX "Institution_publicId_key" ON "Institution"("publicId");
CREATE UNIQUE INDEX "EvaluationGrade_publicId_key" ON "EvaluationGrade"("publicId");
CREATE UNIQUE INDEX "StudentAcademicRecord_publicId_key" ON "StudentAcademicRecord"("publicId");

-- Step 5: Performance indexes
CREATE INDEX "User_publicId_idx" ON "User"("publicId");
CREATE INDEX "Institution_publicId_idx" ON "Institution"("publicId");
CREATE INDEX "EvaluationGrade_publicId_idx" ON "EvaluationGrade"("publicId");
CREATE INDEX "StudentAcademicRecord_publicId_idx" ON "StudentAcademicRecord"("publicId");
