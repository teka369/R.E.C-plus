-- DropIndex
DROP INDEX IF EXISTS "StudentGroup_groupId_academicPeriodId_idx";

-- DropIndex
DROP INDEX IF EXISTS "StudentGroup_studentId_academicPeriodId_idx";

-- AlterTable: remove absencesByPeriod (schema no longer defines it)
ALTER TABLE "StudentAcademicRecord" DROP COLUMN IF EXISTS "absencesByPeriod";

-- CreateIndex: composite indexes for query perf
CREATE INDEX IF NOT EXISTS "AcademicOffering_groupId_academicPeriodId_isActive_idx" ON "AcademicOffering"("groupId", "academicPeriodId", "isActive");

CREATE INDEX IF NOT EXISTS "Message_recipientId_createdAt_idx" ON "Message"("recipientId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "StudentGroup_studentId_academicPeriodId_status_idx" ON "StudentGroup"("studentId", "academicPeriodId", "status");

CREATE INDEX IF NOT EXISTS "StudentGroup_groupId_academicPeriodId_status_idx" ON "StudentGroup"("groupId", "academicPeriodId", "status");
