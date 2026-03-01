-- CreateTable
CREATE TABLE "GradePerformance" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "promedioGeneral" DOUBLE PRECISION,
    "asistenciaPromedio" DOUBLE PRECISION,
    "aprobacion" DOUBLE PRECISION,
    "mejorAsignatura" TEXT,
    "estudiantesDestacados" TEXT,
    "inasistenciasJustificadas" INTEGER,
    "inasistenciasInjustificadas" INTEGER,
    "porcentajeCursoMayorAsistencia" DOUBLE PRECISION,
    "variacionPromedio" DOUBLE PRECISION,
    "variacionAprobacion" DOUBLE PRECISION,
    "reduccionAusencias" DOUBLE PRECISION,
    "tendenciaGeneral" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradePerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GradePerformance_groupId_key" ON "GradePerformance"("groupId");

-- AddForeignKey
ALTER TABLE "GradePerformance"
ADD CONSTRAINT "GradePerformance_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
