-- CreateEnum
CREATE TYPE "RecoveryRequestType" AS ENUM ('RECOVERY', 'REINFORCEMENT');

-- CreateEnum
CREATE TYPE "RecoveryRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RecoveryActivityType" AS ENUM ('HOMEWORK', 'EXAM', 'PROJECT', 'PRACTICE');

-- CreateEnum
CREATE TYPE "RecoveryActivityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED');

-- CreateTable
CREATE TABLE "RecoveryRequest" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "type" "RecoveryRequestType" NOT NULL DEFAULT 'RECOVERY',
    "reason" TEXT NOT NULL,
    "status" "RecoveryRequestStatus" NOT NULL DEFAULT 'PENDING',
    "teacherComment" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "finalScore" DOUBLE PRECISION,

    CONSTRAINT "RecoveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryActivity" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "activityType" "RecoveryActivityType" NOT NULL DEFAULT 'HOMEWORK',
    "status" "RecoveryActivityStatus" NOT NULL DEFAULT 'PENDING',
    "startAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3) NOT NULL,
    "score" DOUBLE PRECISION,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryMessage" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecoveryRequest_studentId_idx" ON "RecoveryRequest"("studentId");

-- CreateIndex
CREATE INDEX "RecoveryRequest_teacherId_idx" ON "RecoveryRequest"("teacherId");

-- CreateIndex
CREATE INDEX "RecoveryRequest_groupId_idx" ON "RecoveryRequest"("groupId");

-- CreateIndex
CREATE INDEX "RecoveryRequest_subjectId_idx" ON "RecoveryRequest"("subjectId");

-- CreateIndex
CREATE INDEX "RecoveryRequest_status_idx" ON "RecoveryRequest"("status");

-- CreateIndex
CREATE INDEX "RecoveryActivity_requestId_idx" ON "RecoveryActivity"("requestId");

-- CreateIndex
CREATE INDEX "RecoveryActivity_teacherId_idx" ON "RecoveryActivity"("teacherId");

-- CreateIndex
CREATE INDEX "RecoveryActivity_status_idx" ON "RecoveryActivity"("status");

-- CreateIndex
CREATE INDEX "RecoveryActivity_dueAt_idx" ON "RecoveryActivity"("dueAt");

-- CreateIndex
CREATE INDEX "RecoveryMessage_requestId_idx" ON "RecoveryMessage"("requestId");

-- CreateIndex
CREATE INDEX "RecoveryMessage_authorId_idx" ON "RecoveryMessage"("authorId");

-- CreateIndex
CREATE INDEX "RecoveryMessage_createdAt_idx" ON "RecoveryMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "RecoveryRequest" ADD CONSTRAINT "RecoveryRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryRequest" ADD CONSTRAINT "RecoveryRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryRequest" ADD CONSTRAINT "RecoveryRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryRequest" ADD CONSTRAINT "RecoveryRequest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryActivity" ADD CONSTRAINT "RecoveryActivity_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RecoveryRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryActivity" ADD CONSTRAINT "RecoveryActivity_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryMessage" ADD CONSTRAINT "RecoveryMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RecoveryRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryMessage" ADD CONSTRAINT "RecoveryMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
