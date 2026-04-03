-- AlterTable
ALTER TABLE "AcademicOffering" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EvaluationGrade" ALTER COLUMN "publicId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "publicId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RecoveryRequest" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ScheduleEvent" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ScheduleNote" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudentAcademicRecord" ALTER COLUMN "publicId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StudentGroup" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudyMaterial" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "publicId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WeeklyScheduleEntry" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AcademicOffering_deletedAt_idx" ON "AcademicOffering"("deletedAt");

-- CreateIndex
CREATE INDEX "Institution_deletedAt_idx" ON "Institution"("deletedAt");

-- CreateIndex
CREATE INDEX "Notification_deletedAt_idx" ON "Notification"("deletedAt");

-- CreateIndex
CREATE INDEX "RecoveryRequest_deletedAt_idx" ON "RecoveryRequest"("deletedAt");

-- CreateIndex
CREATE INDEX "ScheduleEvent_deletedAt_idx" ON "ScheduleEvent"("deletedAt");

-- CreateIndex
CREATE INDEX "ScheduleNote_deletedAt_idx" ON "ScheduleNote"("deletedAt");

-- CreateIndex
CREATE INDEX "StudentGroup_deletedAt_idx" ON "StudentGroup"("deletedAt");

-- CreateIndex
CREATE INDEX "StudyMaterial_deletedAt_idx" ON "StudyMaterial"("deletedAt");

-- CreateIndex
CREATE INDEX "Subject_deletedAt_idx" ON "Subject"("deletedAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "WeeklyScheduleEntry_deletedAt_idx" ON "WeeklyScheduleEntry"("deletedAt");
