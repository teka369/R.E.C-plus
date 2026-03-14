/*
  Warnings:

  - Added the required column `updatedAt` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'INFORMATIVA',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
