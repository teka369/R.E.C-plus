-- DropColumn plan from Institution
ALTER TABLE "Institution"
DROP COLUMN IF EXISTS "plan";

-- DropType InstitutionPlan if unused
DROP TYPE IF EXISTS "InstitutionPlan";
