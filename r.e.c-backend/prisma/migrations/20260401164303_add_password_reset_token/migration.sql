/*
  Warnings:

  - You are about to drop the column `fileContent` on the `RecoveryActivityAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `fileContent` on the `RecoverySchedule` table. All the data in the column will be lost.
  - Added the required column `filePath` to the `RecoveryActivityAttachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `RecoverySchedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "StudentGroup_studentId_groupId_key";

-- AlterTable
ALTER TABLE "AcademicEvaluation" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AcademicOffering" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AcademicPeriod" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EvaluationGrade" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RecoveryActivityAttachment" DROP COLUMN "fileContent",
ADD COLUMN     "filePath" TEXT NOT NULL;

-- AlterTable
CREATE SEQUENCE recoveryconfig_id_seq;
ALTER TABLE "RecoveryConfig" ALTER COLUMN "id" SET DEFAULT nextval('recoveryconfig_id_seq');
ALTER SEQUENCE recoveryconfig_id_seq OWNED BY "RecoveryConfig"."id";

-- AlterTable
CREATE SEQUENCE recoveryschedule_id_seq;
ALTER TABLE "RecoverySchedule" DROP COLUMN "fileContent",
ADD COLUMN     "filePath" TEXT NOT NULL,
ALTER COLUMN "id" SET DEFAULT nextval('recoveryschedule_id_seq'),
ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER SEQUENCE recoveryschedule_id_seq OWNED BY "RecoverySchedule"."id";

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
