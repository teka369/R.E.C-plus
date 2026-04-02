-- ============================================================
-- FASE 2C – Defensa en profundidad: triggers de integridad tenant
-- 
-- Contexto: Los modelos hoja (Feedback, StudyMaterial, etc.) no tienen
-- institutionId directo. Las FK a Group existen, pero PostgreSQL no permite
-- CHECK constraints entre tablas. Esta migración añade triggers BEFORE INSERT/UPDATE
-- que verifican que todos los actores de una fila pertenecen a la misma institución.
--
-- Estrategia: función genérica reutilizable + trigger por modelo crítico.
-- Impacto en rendimiento: mínimo (3 lookups de PK por escritura en Feedback/StudyMaterial).
-- ============================================================

-- ── Función de validación para Feedback ───────────────────────────────────────
-- Verifica: teacher.institutionId == group.institutionId
--       AND student.institutionId == group.institutionId
CREATE OR REPLACE FUNCTION check_feedback_tenant()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_group_institution  INT;
  v_teacher_institution INT;
  v_student_institution INT;
BEGIN
  SELECT "institutionId" INTO v_group_institution
    FROM "Group" WHERE id = NEW."groupId";

  SELECT "institutionId" INTO v_teacher_institution
    FROM "User"  WHERE id = NEW."teacherId";

  SELECT "institutionId" INTO v_student_institution
    FROM "User"  WHERE id = NEW."studentId";

  IF v_teacher_institution IS DISTINCT FROM v_group_institution THEN
    RAISE EXCEPTION
      'Tenant violation: teacher (institutionId=%) does not belong to group institution (%).',
      v_teacher_institution, v_group_institution
      USING ERRCODE = 'P0001';
  END IF;

  IF v_student_institution IS DISTINCT FROM v_group_institution THEN
    RAISE EXCEPTION
      'Tenant violation: student (institutionId=%) does not belong to group institution (%).',
      v_student_institution, v_group_institution
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_feedback_tenant ON "Feedback";
CREATE TRIGGER trg_feedback_tenant
  BEFORE INSERT OR UPDATE ON "Feedback"
  FOR EACH ROW EXECUTE FUNCTION check_feedback_tenant();


-- ── Función de validación para StudyMaterial ──────────────────────────────────
-- Verifica: teacher.institutionId == group.institutionId
CREATE OR REPLACE FUNCTION check_study_material_tenant()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_group_institution   INT;
  v_teacher_institution INT;
BEGIN
  SELECT "institutionId" INTO v_group_institution
    FROM "Group" WHERE id = NEW."groupId";

  SELECT "institutionId" INTO v_teacher_institution
    FROM "User"  WHERE id = NEW."teacherId";

  IF v_teacher_institution IS DISTINCT FROM v_group_institution THEN
    RAISE EXCEPTION
      'Tenant violation: teacher (institutionId=%) does not belong to group institution (%).',
      v_teacher_institution, v_group_institution
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_study_material_tenant ON "StudyMaterial";
CREATE TRIGGER trg_study_material_tenant
  BEFORE INSERT OR UPDATE ON "StudyMaterial"
  FOR EACH ROW EXECUTE FUNCTION check_study_material_tenant();


-- ── Función de validación para RecoveryRequest ────────────────────────────────
-- Verifica: teacher.institutionId == group.institutionId
--       AND student.institutionId == group.institutionId
CREATE OR REPLACE FUNCTION check_recovery_request_tenant()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_group_institution   INT;
  v_teacher_institution INT;
  v_student_institution INT;
BEGIN
  SELECT "institutionId" INTO v_group_institution
    FROM "Group" WHERE id = NEW."groupId";

  SELECT "institutionId" INTO v_teacher_institution
    FROM "User"  WHERE id = NEW."teacherId";

  SELECT "institutionId" INTO v_student_institution
    FROM "User"  WHERE id = NEW."studentId";

  IF v_teacher_institution IS DISTINCT FROM v_group_institution THEN
    RAISE EXCEPTION
      'Tenant violation: teacher (institutionId=%) does not belong to group institution (%).',
      v_teacher_institution, v_group_institution
      USING ERRCODE = 'P0001';
  END IF;

  IF v_student_institution IS DISTINCT FROM v_group_institution THEN
    RAISE EXCEPTION
      'Tenant violation: student (institutionId=%) does not belong to group institution (%).',
      v_student_institution, v_group_institution
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recovery_request_tenant ON "RecoveryRequest";
CREATE TRIGGER trg_recovery_request_tenant
  BEFORE INSERT OR UPDATE ON "RecoveryRequest"
  FOR EACH ROW EXECUTE FUNCTION check_recovery_request_tenant();


-- ── Función de validación para WeeklyScheduleEntry ────────────────────────────
-- Verifica: teacher.institutionId == group.institutionId
CREATE OR REPLACE FUNCTION check_schedule_entry_tenant()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_group_institution   INT;
  v_teacher_institution INT;
BEGIN
  SELECT "institutionId" INTO v_group_institution
    FROM "Group" WHERE id = NEW."groupId";

  SELECT "institutionId" INTO v_teacher_institution
    FROM "User"  WHERE id = NEW."teacherId";

  IF v_teacher_institution IS DISTINCT FROM v_group_institution THEN
    RAISE EXCEPTION
      'Tenant violation: teacher (institutionId=%) does not belong to group institution (%).',
      v_teacher_institution, v_group_institution
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schedule_entry_tenant ON "WeeklyScheduleEntry";
CREATE TRIGGER trg_schedule_entry_tenant
  BEFORE INSERT OR UPDATE ON "WeeklyScheduleEntry"
  FOR EACH ROW EXECUTE FUNCTION check_schedule_entry_tenant();
