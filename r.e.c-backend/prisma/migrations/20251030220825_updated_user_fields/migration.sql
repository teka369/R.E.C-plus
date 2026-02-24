/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[documento_identidad]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apellidos` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documento_identidad` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombres` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "apellidos" TEXT NOT NULL,
ADD COLUMN     "documento_identidad" TEXT NOT NULL,
ADD COLUMN     "nombres" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_documento_identidad_key" ON "User"("documento_identidad");
