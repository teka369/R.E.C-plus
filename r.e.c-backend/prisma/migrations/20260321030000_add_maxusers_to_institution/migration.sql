-- AddColumn maxUsers to Institution with default 500
ALTER TABLE "Institution"
ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER NOT NULL DEFAULT 500;
