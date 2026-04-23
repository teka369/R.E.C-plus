-- CreateEnum
CREATE TYPE "GradingMode" AS ENUM ('SIMPLE', 'COMPETENCY');

-- CreateEnum
CREATE TYPE "CompetencyCategory" AS ENUM ('COGNITIVE', 'PROCEDURAL', 'ATTITUDINAL', 'SELF_EVAL', 'CO_EVAL');

-- AlterTable
ALTER TABLE "AcademicEvaluation" ADD COLUMN     "competencyCategory" "CompetencyCategory";

-- AlterTable
ALTER TABLE "InstitutionGradingPolicy" ADD COLUMN     "competencyWeights" JSONB NOT NULL DEFAULT '{"COGNITIVE":30,"PROCEDURAL":30,"ATTITUDINAL":30,"SELF_EVAL":5,"CO_EVAL":5}',
ADD COLUMN     "gradingMode" "GradingMode" NOT NULL DEFAULT 'SIMPLE';
