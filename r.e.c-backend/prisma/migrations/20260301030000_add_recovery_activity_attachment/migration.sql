-- CreateTable
CREATE TABLE "RecoveryActivityAttachment" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileContent" BYTEA NOT NULL,
    "uploadedById" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryActivityAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryActivityAttachment_activityId_key" ON "RecoveryActivityAttachment"("activityId");

-- CreateIndex
CREATE INDEX "RecoveryActivityAttachment_uploadedAt_idx" ON "RecoveryActivityAttachment"("uploadedAt");

-- AddForeignKey
ALTER TABLE "RecoveryActivityAttachment"
ADD CONSTRAINT "RecoveryActivityAttachment_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "RecoveryActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
