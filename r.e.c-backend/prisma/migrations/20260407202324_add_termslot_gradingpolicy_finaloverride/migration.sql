-- AlterTable
ALTER TABLE "AcademicEvaluation" ADD COLUMN     "termSlot" INTEGER;

-- AlterTable
ALTER TABLE "EvaluationGrade" ADD COLUMN     "updatedByTeacherId" INTEGER;

-- AlterTable
ALTER TABLE "StudentAcademicRecord" ADD COLUMN     "finalOverride" DOUBLE PRECISION,
ADD COLUMN     "finalSource" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "finalUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InstitutionGradingPolicy" (
    "id" SERIAL NOT NULL,
    "institutionId" INTEGER NOT NULL,
    "gradeScaleMax" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "passingThreshold" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "allowClosedPeriodEdits" BOOLEAN NOT NULL DEFAULT false,
    "allowFinalOverride" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionGradingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionGradingPolicy_institutionId_key" ON "InstitutionGradingPolicy"("institutionId");

-- CreateIndex
CREATE INDEX "AcademicEvaluation_academicOfferingId_termSlot_orden_idx" ON "AcademicEvaluation"("academicOfferingId", "termSlot", "orden");

-- AddForeignKey
ALTER TABLE "InstitutionGradingPolicy" ADD CONSTRAINT "InstitutionGradingPolicy_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationGrade" ADD CONSTRAINT "EvaluationGrade_updatedByTeacherId_fkey" FOREIGN KEY ("updatedByTeacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
