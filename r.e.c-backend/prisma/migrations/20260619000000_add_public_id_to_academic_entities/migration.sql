-- publicId migration for Group, Subject, Grade
ALTER TABLE "Group" ADD COLUMN "publicId" TEXT;

UPDATE "Group" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;

ALTER TABLE "Group" ALTER COLUMN "publicId" SET NOT NULL;

CREATE UNIQUE INDEX "Group_publicId_key" ON "Group"("publicId");


ALTER TABLE "Subject" ADD COLUMN "publicId" TEXT;

UPDATE "Subject" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;

ALTER TABLE "Subject" ALTER COLUMN "publicId" SET NOT NULL;

CREATE UNIQUE INDEX "Subject_publicId_key" ON "Subject"("publicId");


ALTER TABLE "Grade" ADD COLUMN "publicId" TEXT;

UPDATE "Grade" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;

ALTER TABLE "Grade" ALTER COLUMN "publicId" SET NOT NULL;

CREATE UNIQUE INDEX "Grade_publicId_key" ON "Grade"("publicId");
