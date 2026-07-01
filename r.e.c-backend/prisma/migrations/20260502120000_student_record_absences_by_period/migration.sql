-- Add absences tracking per academic period
ALTER TABLE "StudentAcademicRecord" ADD COLUMN "absencesByPeriod" JSONB;
