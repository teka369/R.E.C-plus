-- Fase 1 de normalizacion academica.
-- Cambios aditivos para introducir el contexto temporal sin romper el modelo actual.

-- 1. Catalogo de periodos academicos.
CREATE TYPE "AcademicPeriodType" AS ENUM ('TERM', 'RECOVERY', 'INTERSESSION');
CREATE TYPE "AcademicPeriodStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'PROMOTED', 'REPEATING', 'CLOSED');

CREATE TABLE "AcademicPeriod" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "AcademicPeriodType" NOT NULL DEFAULT 'TERM',
    "estado" "AcademicPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "fechaCierre" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicPeriod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicPeriod_codigo_key" ON "AcademicPeriod"("codigo");

-- 2. Periodo legado para enlazar los datos existentes.
INSERT INTO "AcademicPeriod" (
    "nombre",
    "codigo",
    "tipo",
    "estado",
    "fechaInicio",
    "fechaFin",
    "fechaCierre"
)
VALUES (
    'Periodo lectivo legado',
    'LEGACY-2026',
    'TERM',
    'ACTIVE',
    DATE '2026-01-01',
    DATE '2026-12-31',
    NULL
)
ON CONFLICT ("codigo") DO NOTHING;

-- 3. Extensiones aditivas a StudentGroup.
ALTER TABLE "StudentGroup"
ADD COLUMN "academicPeriodId" INTEGER,
ADD COLUMN "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "endedAt" TIMESTAMP(3);

UPDATE "StudentGroup"
SET "academicPeriodId" = ap."id"
FROM "AcademicPeriod" ap
WHERE ap."codigo" = 'LEGACY-2026'
  AND "StudentGroup"."academicPeriodId" IS NULL;

ALTER TABLE "StudentGroup"
ADD CONSTRAINT "StudentGroup_academicPeriodId_fkey"
FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "StudentGroup_studentId_academicPeriodId_idx"
ON "StudentGroup"("studentId", "academicPeriodId");

CREATE INDEX "StudentGroup_groupId_academicPeriodId_idx"
ON "StudentGroup"("groupId", "academicPeriodId");

-- 4. Extensiones aditivas a GroupSubject.
ALTER TABLE "GroupSubject"
ADD COLUMN "academicPeriodId" INTEGER,
ADD COLUMN "weeklyHours" INTEGER,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "GroupSubject"
SET "academicPeriodId" = ap."id"
FROM "AcademicPeriod" ap
WHERE ap."codigo" = 'LEGACY-2026'
  AND "GroupSubject"."academicPeriodId" IS NULL;

ALTER TABLE "GroupSubject"
ADD CONSTRAINT "GroupSubject_academicPeriodId_fkey"
FOREIGN KEY ("academicPeriodId") REFERENCES "AcademicPeriod"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "GroupSubject_academicPeriodId_idx"
ON "GroupSubject"("academicPeriodId");