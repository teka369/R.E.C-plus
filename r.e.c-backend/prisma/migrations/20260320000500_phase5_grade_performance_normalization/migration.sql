-- Fase 5: Normalización de GradePerformance
-- Añadir período académico al rendimiento y tabla de estudiantes destacados

-- 1. Añadir academicPeriodId a GradePerformance
ALTER TABLE "GradePerformance" ADD COLUMN "academicPeriodId" INTEGER;
ALTER TABLE "GradePerformance"
  ADD CONSTRAINT "GradePerformance_academicPeriodId_fkey"
  FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "GradePerformance_academicPeriodId_idx"
  ON "GradePerformance"("academicPeriodId");

-- 2. Backfill: vincular al período ACTIVE si existe
UPDATE "GradePerformance" gp
SET "academicPeriodId" = ap.id
FROM "AcademicPeriod" ap
WHERE ap."estado" = 'ACTIVE'
  AND gp."academicPeriodId" IS NULL;

-- 3. Crear tabla PerformanceTopStudent
CREATE TABLE "PerformanceTopStudent" (
    "id"                 SERIAL PRIMARY KEY,
    "gradePerformanceId" INTEGER NOT NULL,
    "fullName"           TEXT NOT NULL,
    "average"            DOUBLE PRECISION NOT NULL,
    "rank"               INTEGER NOT NULL DEFAULT 1,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "PerformanceTopStudent"
  ADD CONSTRAINT "PerformanceTopStudent_gradePerformanceId_fkey"
  FOREIGN KEY ("gradePerformanceId") REFERENCES "GradePerformance"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "PerformanceTopStudent_gradePerformanceId_idx"
  ON "PerformanceTopStudent"("gradePerformanceId");

-- 4. Migrar datos: poblar PerformanceTopStudent desde estudiantesDestacados (texto CSV)
--    Formato almacenado: "Nombre Apellido (promedio), ..."
--    Se hace best-effort: si el parse falla, no se inserta
--    La migración exacta se delega al servicio en el próximo recompute ya que
--    el formato del string no es estructurado de forma determinista.
--    Nota: estudiantesDestacados se mantiene como columna legada (no se elimina).
