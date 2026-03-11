-- CreateTable
CREATE TABLE "StudentAcademicRecord" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "updatedByTeacherId" INTEGER,
    "parcial1" DOUBLE PRECISION,
    "parcial2" DOUBLE PRECISION,
    "parcial3" DOUBLE PRECISION,
    "parcial4" DOUBLE PRECISION,
    "notaFinal" DOUBLE PRECISION,
    "progresoMateria" DOUBLE PRECISION,
    "inasistenciasJustificadas" INTEGER NOT NULL DEFAULT 0,
    "inasistenciasInjustificadas" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAcademicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentAcademicRecord_studentId_groupId_subjectId_key" ON "StudentAcademicRecord"("studentId", "groupId", "subjectId");

-- CreateIndex
CREATE INDEX "StudentAcademicRecord_studentId_idx" ON "StudentAcademicRecord"("studentId");

-- CreateIndex
CREATE INDEX "StudentAcademicRecord_groupId_idx" ON "StudentAcademicRecord"("groupId");

-- CreateIndex
CREATE INDEX "StudentAcademicRecord_subjectId_idx" ON "StudentAcademicRecord"("subjectId");

-- AddForeignKey
ALTER TABLE "StudentAcademicRecord" ADD CONSTRAINT "StudentAcademicRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAcademicRecord" ADD CONSTRAINT "StudentAcademicRecord_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAcademicRecord" ADD CONSTRAINT "StudentAcademicRecord_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAcademicRecord" ADD CONSTRAINT "StudentAcademicRecord_updatedByTeacherId_fkey" FOREIGN KEY ("updatedByTeacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
