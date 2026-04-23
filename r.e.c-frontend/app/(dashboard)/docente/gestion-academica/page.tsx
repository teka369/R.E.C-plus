"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import CompetencyGradeView from "@/components/docente/CompetencyGradeView";
import { academicApi, type GroupOfferingRow, type TeacherAssignment } from "@/lib/academicApi";
import {
  performanceApi,
  type AcademicEvaluationGrade,
  type GroupAcademicOverview,
  type StudentAcademicRecord,
  type StudentEvaluationV2,
  type UpsertStudentAcademicInput,
} from "@/lib/performanceApi";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBook,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiInfo,
  FiMinus,
  FiPlus,
  FiSave,
  FiUsers,
  FiX,
} from "react-icons/fi";

const COBERTURA_GRUPO_TOOLTIP =
  "Porcentaje de estudiantes con al menos una nota registrada en el período seleccionado.";

const COBERTURA_ESTUDIANTE_TOOLTIP =
  "Porcentaje de materias con al menos una nota registrada en el período seleccionado (respecto al total de materias asignadas al docente en este grupo).";

function InfoTooltip({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex"
        aria-label={text}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-30 top-full mt-2 w-64 rounded-xl border border-rec-border-default bg-rec-bg-elevated px-3 py-2 text-xs text-rec-text-secondary shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type PeriodAbsenceEntry = {
  justificadas: string;
  injustificadas: string;
};

type PeriodAbsenceMap = Record<number, PeriodAbsenceEntry>;

const PERIOD_NUMBERS = [1, 2, 3, 4] as const;

type EvaluationEditorRow = {
  clientId: string;
  evaluationId?: number;
  title: string;
  termSlot: number | null;
  weight: string;
  grade: string;
};

type RemovedPersistedEvaluation = { evaluationId: number; title: string };

type SubjectFormState = {
  evaluations: EvaluationEditorRow[];
  removedPersisted: RemovedPersistedEvaluation[];
  periodAbsences: PeriodAbsenceMap;
  observaciones: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function newClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function computeAverage(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (!valid.length) return null;
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
}

function toNum(value: string): number | undefined {
  const t = value.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isNaN(n) ? undefined : n;
}

function toNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) return 0;
  return Math.trunc(value);
}

function createEmptyPeriodAbsenceMap(): PeriodAbsenceMap {
  return {
    1: { justificadas: "0", injustificadas: "0" },
    2: { justificadas: "0", injustificadas: "0" },
    3: { justificadas: "0", injustificadas: "0" },
    4: { justificadas: "0", injustificadas: "0" },
  };
}

function buildPeriodAbsenceMapFromTotals(
  fallbackJustified: number,
  fallbackUnjustified: number,
): PeriodAbsenceMap {
  const map = createEmptyPeriodAbsenceMap();
  if (fallbackJustified > 0 || fallbackUnjustified > 0) {
    map[1] = {
      justificadas: String(fallbackJustified),
      injustificadas: String(fallbackUnjustified),
    };
  }
  return map;
}

function getAbsenceTotalsFromMap(map: PeriodAbsenceMap): {
  justificadas: number;
  injustificadas: number;
} {
  return PERIOD_NUMBERS.reduce(
    (acc, period) => {
      const entry = map[period];
      acc.justificadas += toNonNegativeInt(Number(entry.justificadas));
      acc.injustificadas += toNonNegativeInt(Number(entry.injustificadas));
      return acc;
    },
    { justificadas: 0, injustificadas: 0 },
  );
}

function fromRecord(record: StudentAcademicRecord | undefined): SubjectFormState {
  const evals = record?.evaluaciones ?? [];
  const evaluations: EvaluationEditorRow[] = evals.map((e) => {
    if (e && typeof e === "object" && "grade" in e && typeof (e as { grade: unknown }).grade === "number") {
      const v = e as StudentEvaluationV2;
      return {
        clientId: newClientId(),
        evaluationId: v.evaluationId,
        title: v.title,
        termSlot:
          typeof v.termSlot === "number" && v.termSlot >= 1 && v.termSlot <= 4 ? v.termSlot : null,
        weight: v.weight == null ? "" : String(v.weight),
        grade: String(v.grade),
      };
    }
    const v = e as AcademicEvaluationGrade;
    return {
      clientId: newClientId(),
      evaluationId: v.evaluationId,
      title: v.titulo,
      termSlot:
        typeof v.termSlot === "number" && v.termSlot >= 1 && v.termSlot <= 4 ? v.termSlot : null,
      weight: v.porcentaje == null ? "" : String(v.porcentaje),
      grade: typeof v.nota === "number" ? String(v.nota) : "",
    };
  });

  return {
    evaluations,
    removedPersisted: [],
    periodAbsences: buildPeriodAbsenceMapFromTotals(
      record?.inasistenciasJustificadas ?? 0,
      record?.inasistenciasInjustificadas ?? 0,
    ),
    observaciones: record?.observaciones ?? "",
  };
}

function gradeColor(value: number | null | undefined): string {
  if (value == null) return "text-rec-text-subtle";
  if (value >= 4.0) return "text-[color:var(--rec-primary)]";
  if (value >= 3.0) return "text-rec-warning-text";
  return "text-rec-danger-text";
}

function gradeBadgeClass(value: number | null | undefined): string {
  if (value == null) return "bg-rec-bg-muted text-rec-text-subtle";
  if (value >= 4.0) return "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)]";
  if (value >= 3.0) return "bg-rec-warning-bg text-rec-warning-text";
  return "bg-rec-danger-bg-strong text-rec-danger-text";
}

function gradeLabel(value: number | null | undefined): string {
  if (value == null) return "Sin nota";
  if (value >= 4.0) return "Aprobado";
  if (value >= 3.0) return "Suficiente";
  return "En riesgo";
}

function getRecordAbsences(record: StudentAcademicRecord): {
  justificadas: number;
  injustificadas: number;
} {
  return {
    justificadas: record.inasistenciasJustificadas ?? 0,
    injustificadas: record.inasistenciasInjustificadas ?? 0,
  };
}

function getStudentAbsenceTotals(records: StudentAcademicRecord[]): {
  justificadas: number;
  injustificadas: number;
  total: number;
} {
  const totals = records.reduce(
    (acc, record) => {
      const abs = getRecordAbsences(record);
      acc.justificadas += abs.justificadas;
      acc.injustificadas += abs.injustificadas;
      return acc;
    },
    { justificadas: 0, injustificadas: 0 },
  );
  return { ...totals, total: totals.justificadas + totals.injustificadas };
}

function getTermSlotFilterLabel(termSlotFilter: string): string {
  return termSlotFilter === "all" ? "Todos los períodos" : `Período ${termSlotFilter}`;
}

function filterEvalNotesBySlot(
  evaluaciones: StudentAcademicRecord["evaluaciones"],
  slot: number,
): number[] {
  if (!evaluaciones?.length) return [];
  const out: number[] = [];
  for (const e of evaluaciones) {
    if (e && typeof e === "object" && "grade" in e && typeof (e as { grade: unknown }).grade === "number") {
      const v = e as StudentEvaluationV2;
      if (v.termSlot === slot) out.push(v.grade);
    } else if (e && typeof e === "object" && "nota" in e) {
      const v = e as AcademicEvaluationGrade;
      const ts =
        typeof v.termSlot === "number"
          ? v.termSlot
          : v.orden >= 1 && v.orden <= 4
            ? v.orden
            : null;
      if (ts === slot && typeof v.nota === "number") out.push(v.nota);
    }
  }
  return out;
}

function getRecordPeriodAverage(record: StudentAcademicRecord, termSlotFilter: string): number | null {
  if (termSlotFilter === "all") {
    return record.notaFinal ?? record.promedioMateria;
  }
  const slot = Number(termSlotFilter);
  const notes = filterEvalNotesBySlot(record.evaluaciones, slot);
  if (notes.length > 0) return computeAverage(notes);
  return null;
}

function getStudentAverageForFilter(
  records: StudentAcademicRecord[],
  termSlotFilter: string,
): number | null {
  return computeAverage(records.map((r) => getRecordPeriodAverage(r, termSlotFilter)));
}

function filterRecordsForTeacher(
  records: StudentAcademicRecord[],
  subjectIds: Set<number>,
): StudentAcademicRecord[] {
  if (subjectIds.size === 0) return [];
  return records.filter((r) => subjectIds.has(r.subjectId));
}

function recordCountsForProgress(
  record: StudentAcademicRecord,
  termSlotFilter: string,
): boolean {
  if (termSlotFilter === "all") {
    return (record.evaluaciones?.length ?? 0) > 0 || record.notaFinal != null;
  }
  const slot = Number(termSlotFilter);
  const evals = record.evaluaciones;
  if (!evals?.length) return false;
  for (const e of evals) {
    if (e && typeof e === "object" && "grade" in e && typeof (e as { grade: unknown }).grade === "number") {
      const v = e as StudentEvaluationV2;
      if (v.termSlot === slot) return true;
    } else if (e && typeof e === "object" && "nota" in e) {
      const v = e as AcademicEvaluationGrade;
      const ts =
        typeof v.termSlot === "number"
          ? v.termSlot
          : v.orden >= 1 && v.orden <= 4
            ? v.orden
            : null;
      if (ts === slot && typeof v.nota === "number") return true;
    }
  }
  return false;
}

function resolveCannotSaveGradesReason(overview: GroupAcademicOverview | null): string | null {
  const ap = overview?.academicPeriod;
  if (ap == null) return "No hay período académico activo. Contacta a Secretaría.";
  if (ap.estado === "CLOSED") return "No puedes editar notas en un período cerrado.";
  if (ap.estado !== "ACTIVE") return "No hay período académico activo. Contacta a Secretaría.";
  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocenteGestionAcademicaPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [overview, setOverview] = useState<GroupAcademicOverview | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingSubjectId, setSavingSubjectId] = useState<number | null>(null);
  const [termSlotFilter, setTermSlotFilter] = useState<string>("all");
  const [groupOfferings, setGroupOfferings] = useState<GroupOfferingRow[] | null>(null);

  const groups = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>();
    assignments.forEach((item) => {
      if (!item.group?.id) return;
      map.set(item.group.id, {
        id: item.group.id,
        label: `${item.group.grade?.nombre ?? "Grado"} – ${item.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

  const subjectIdsAssignedToTeacher = useMemo(() => {
    const groupId = Number(selectedGroupId);
    if (!groupId) return new Set<number>();
    return new Set(
      assignments
        .filter((item) => item.group.id === groupId)
        .map((item) => item.subject.id),
    );
  }, [assignments, selectedGroupId]);

  /** Solo materias que el docente tiene asignadas en el grupo seleccionado (no todas las del grupo). */
  const subjectsForTeacher = useMemo(() => {
    if (!overview?.subjects?.length) return [];
    const ids = subjectIdsAssignedToTeacher;
    return overview.subjects.filter((s) => ids.has(s.id));
  }, [overview?.subjects, subjectIdsAssignedToTeacher]);

  const slotsWithData = useMemo(() => {
    const raw = overview?.termSlotsAvailable;
    return new Set<number>(raw?.length ? raw : [1, 2, 3, 4]);
  }, [overview?.termSlotsAvailable]);

  const cannotSaveGradesReason = useMemo(() => resolveCannotSaveGradesReason(overview), [overview]);

  const isCompetencyMode = overview?.gradingMode === "COMPETENCY";

  const offeringBySubjectId = useMemo(() => {
    const m = new Map<number, GroupOfferingRow>();
    for (const row of groupOfferings ?? []) {
      m.set(row.subjectId, row);
    }
    return m;
  }, [groupOfferings]);

  const passingThreshold = overview?.stats?.passingThreshold ?? 3;

  const selectedStudent = useMemo(() => {
    const id = Number(selectedStudentId);
    if (!id || !overview) return null;
    return overview.students.find((item) => item.student.id === id) ?? null;
  }, [overview, selectedStudentId]);

  const selectedStudentAverage = useMemo(() => {
    if (!selectedStudent) return null;
    const recs = filterRecordsForTeacher(selectedStudent.records, subjectIdsAssignedToTeacher);
    return getStudentAverageForFilter(recs, termSlotFilter);
  }, [selectedStudent, termSlotFilter, subjectIdsAssignedToTeacher]);

  const groupStats = useMemo(() => {
    if (!overview) return null;
    const stats = overview.stats;
    if (!stats) return null;
    const enRiesgo = overview.students.filter((s) => {
      const recs = filterRecordsForTeacher(s.records, subjectIdsAssignedToTeacher);
      const avg = getStudentAverageForFilter(recs, termSlotFilter);
      return avg != null && avg < stats.passingThreshold;
    }).length;
    return {
      total: stats.totalStudents,
      promedio: stats.groupAverage,
      pctAprobados: Math.round(stats.approvalRate),
      aprobados: stats.approvedCount,
      enRiesgo,
      coverage: stats.coverageCount,
    };
  }, [overview, termSlotFilter, subjectIdsAssignedToTeacher]);

  /** Cobertura: con "todos los períodos" usa el conteo canónico del backend; con período N, cuenta en frontend. */
  const groupCoverageDisplay = useMemo(() => {
    if (!overview?.stats) return { count: 0, pct: 0 };
    const total = overview.stats.totalStudents;
    if (total === 0) return { count: 0, pct: 0 };
    if (termSlotFilter === "all") {
      const count = overview.stats.coverageCount;
      return { count, pct: Math.round((count / total) * 100) };
    }
    const count = overview.students.filter((s) =>
      filterRecordsForTeacher(s.records, subjectIdsAssignedToTeacher).some((r) =>
        recordCountsForProgress(r, termSlotFilter),
      ),
    ).length;
    return { count, pct: Math.round((count / total) * 100) };
  }, [overview, termSlotFilter, subjectIdsAssignedToTeacher]);

  useEffect(() => {
    const run = async () => {
      const teacherId = Number(user?.id);
      if (!teacherId) return;
      try {
        setLoadingAssignments(true);
        setError(null);
        const list = await academicApi.listTeacherAssignments(teacherId);
        setAssignments(list);
        const firstGroup = list[0]?.group;
        if (firstGroup?.id) setSelectedGroupId(String(firstGroup.id));
      } catch {
        setError("No se pudieron cargar tus grupos asignados");
      } finally {
        setLoadingAssignments(false);
      }
    };
    void run();
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      const groupId = Number(selectedGroupId);
      if (!groupId) {
        setOverview(null);
        setSelectedStudentId("");
        setGroupOfferings(null);
        return;
      }
      try {
        setLoadingOverview(true);
        setError(null);
        const data = await performanceApi.getGroupAcademicOverview(groupId);
        setOverview(data);
        const first = data.students[0]?.student;
        setSelectedStudentId(first ? String(first.id) : "");
      } catch {
        setError("No se pudo cargar la gestión académica del grupo");
      } finally {
        setLoadingOverview(false);
      }
    };
    void run();
  }, [selectedGroupId]);

  useEffect(() => {
    const groupId = Number(selectedGroupId);
    if (!groupId || !overview) {
      setGroupOfferings(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await academicApi.listGroupOfferings(groupId, overview.academicPeriod?.id);
        if (!cancelled) setGroupOfferings(rows);
      } catch {
        if (!cancelled) setGroupOfferings([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId, overview]);

  const saveSubject = async (subjectId: number, form: SubjectFormState, event: FormEvent) => {
    event.preventDefault();
    const groupId = Number(selectedGroupId);
    const studentId = Number(selectedStudentId);
    if (!groupId || !studentId) return;

    const block = resolveCannotSaveGradesReason(overview);
    if (block) {
      setError(block);
      return;
    }

    const totals = getAbsenceTotalsFromMap(form.periodAbsences);
    const evaluationPayload = [
      ...form.evaluations.map((ev) => ({
        evaluationId: ev.evaluationId,
        title: ev.title.trim() || "Evaluación",
        type: "PARCIAL",
        termSlot: ev.termSlot ?? undefined,
        weight: toNum(ev.weight),
        grade: toNum(ev.grade) ?? null,
      })),
      ...form.removedPersisted.map((r) => ({
        evaluationId: r.evaluationId,
        title: r.title.trim() || "Evaluación",
        type: "PARCIAL",
        grade: null as null,
      })),
    ];

    const payload: UpsertStudentAcademicInput = {
      evaluations: evaluationPayload,
      inasistenciasJustificadas: totals.justificadas,
      inasistenciasInjustificadas: totals.injustificadas,
      observaciones: form.observaciones.trim() || undefined,
    };

    try {
      setSavingSubjectId(subjectId);
      setError(null);
      setMessage(null);
      await performanceApi.upsertStudentAcademic(groupId, studentId, subjectId, payload);
      const refreshed = await performanceApi.getGroupAcademicOverview(groupId);
      setOverview(refreshed);
      setMessage("Gestión académica actualizada correctamente");
      setTimeout(() => setMessage(null), 3500);
    } catch {
      setError("No se pudo guardar la gestión académica para esa materia");
    } finally {
      setSavingSubjectId(null);
    }
  };

  return (
    <section className="space-y-5">
      <header
        id="tour-ges-header"
        className="relative overflow-hidden rounded-2xl p-4 sm:p-6 text-rec-text-on-media shadow-lg"
        style={{ background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 75% 40%, color-mix(in srgb, var(--rec-bg-elevated) 95%, transparent) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-12 h-12 bg-rec-bg-elevated/20 rounded-xl flex items-center justify-center shrink-0">
            <FiBook className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">Gestión Académica</h1>
            <p className="text-sm mt-0.5 text-rec-text-on-media/85">
              Evaluaciones por período, inasistencias y observaciones por estudiante y materia (API v2)
            </p>
            {overview?.academicPeriod != null && (
              <p className="text-sm text-rec-text-on-media/90 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-rec-text-on-media/75">Ciclo académico:</span>
                <span className="font-semibold">{overview.academicPeriod.nombre}</span>
                {overview.academicPeriod.codigo ? (
                  <span className="text-rec-text-on-media/80">({overview.academicPeriod.codigo})</span>
                ) : null}
                {overview.academicPeriod.estado === "CLOSED" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rec-bg-elevated/20 text-rec-text-on-media border border-rec-text-on-media/30">
                    Período cerrado
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </header>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
          <FiCheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
          <button type="button" className="ml-auto" onClick={() => setMessage(null)}>
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rec-danger-border bg-rec-danger-bg px-4 py-3 text-sm text-rec-danger-text">
          <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button type="button" className="ml-auto" onClick={() => setError(null)}>
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {loadingAssignments && (
        <div className="rounded-xl bg-rec-bg-elevated border border-rec-border-default p-6 sm:p-8 text-center text-sm text-rec-text-subtle">
          Cargando grupos asignados...
        </div>
      )}

      {!loadingAssignments && groups.length === 0 && (
        <div className="rounded-xl bg-rec-bg-elevated border border-rec-border-default p-6 sm:p-8 text-center text-sm text-rec-text-subtle">
          No tienes grupos asignados para gestionar información académica.
        </div>
      )}

      {!loadingAssignments && groups.length > 0 && (
        <>
          <div id="tour-ges-controls" className="bg-rec-bg-elevated rounded-2xl border border-rec-border-default shadow-sm p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle mb-2 block">
                  Grupo activo
                </span>
                <select
                  className="w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-rec-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                  style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle mb-2 block">
                  Período (filtro)
                </span>
                <select
                  className="w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-rec-text-primary focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                  style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                  value={termSlotFilter}
                  onChange={(e) => setTermSlotFilter(e.target.value)}
                >
                  <option value="all">Todos los períodos</option>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={String(n)}>
                      Período {n}
                      {slotsWithData.has(n) ? " · con datos" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!loadingOverview && overview && (
              <div className="border-t border-rec-border-subtle pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle mb-2">
                  Ciclo académico
                </p>
                {overview.academicPeriod == null ? (
                  <p className="text-sm text-rec-warning-text font-medium">
                    No hay período académico activo. Contacta a Secretaría.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-rec-text-primary">
                      {overview.academicPeriod.nombre}
                    </span>
                    {overview.academicPeriod.codigo ? (
                      <span className="text-xs text-rec-text-subtle">({overview.academicPeriod.codigo})</span>
                    ) : null}
                    {overview.academicPeriod.estado === "CLOSED" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rec-warning-bg text-rec-warning-text border border-rec-warning-border">
                        Período cerrado
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {groupStats && !loadingOverview && (
            <div id="tour-ges-kpis" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatKpi
                icon={<FiUsers className="w-5 h-5 text-[color:var(--rec-primary)]" />}
                bg="bg-[color:var(--rec-soft)]"
                value={String(groupStats.total)}
                label="Estudiantes"
                sub="en el grupo"
              />
              <StatKpi
                icon={<FiBarChart2 className="w-5 h-5 text-[color:var(--rec-primary-strong)]" />}
                bg="bg-[color:var(--rec-soft)]"
                value={groupStats.promedio != null ? groupStats.promedio.toFixed(2) : "—"}
                label="Promedio grupo"
                sub="solo estudiantes con al menos una nota registrada"
              />
              <StatKpi
                icon={<FiCheckCircle className="w-5 h-5 text-[color:var(--rec-primary)]" />}
                bg="bg-[color:var(--rec-soft)]"
                value={`${groupStats.pctAprobados}%`}
                label="Tasa de aprobación"
                sub={`${groupStats.aprobados} de ${groupStats.total} estudiantes`}
              />
              <StatKpi
                icon={<FiGrid className="w-5 h-5 text-rec-info-text" />}
                bg="bg-rec-info-bg"
                value={`${groupCoverageDisplay.pct}%`}
                label="Cobertura"
                labelTooltip={COBERTURA_GRUPO_TOOLTIP}
                sub={`${groupCoverageDisplay.count}/${groupStats.total} estudiantes · ${getTermSlotFilterLabel(termSlotFilter)}`}
              />
              <StatKpi
                icon={<FiAlertTriangle className="w-5 h-5 text-rec-danger-text" />}
                bg="bg-rec-danger-bg"
                value={String(groupStats.enRiesgo)}
                label="En riesgo"
                sub={`bajo umbral ${passingThreshold.toFixed(1)} en el filtro actual`}
              />
            </div>
          )}

          {loadingOverview && (
            <div className="rounded-xl bg-rec-bg-elevated border border-rec-border-default p-6 sm:p-8 text-center text-sm text-rec-text-subtle">
              Cargando gestión académica del grupo...
            </div>
          )}

          {!loadingOverview && overview && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <aside id="tour-ges-estudiantes" className="lg:col-span-1">
                <div className="bg-rec-bg-elevated rounded-2xl border border-rec-border-default shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-rec-bg-base border-b border-rec-border-default">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle">
                      Estudiantes ({overview.students.length})
                    </h2>
                  </div>
                  <ul className="divide-y divide-rec-border-subtle max-h-[600px] overflow-y-auto">
                    {overview.students.map((item) => {
                      const isSelected = String(item.student.id) === selectedStudentId;
                      const recordsDocente = filterRecordsForTeacher(
                        item.records,
                        subjectIdsAssignedToTeacher,
                      );
                      const totalAbs = getStudentAbsenceTotals(recordsDocente).total;
                      const studentAvg = getStudentAverageForFilter(recordsDocente, termSlotFilter);
                      const atRisk =
                        (studentAvg != null && studentAvg < passingThreshold) ||
                        (termSlotFilter === "all" && totalAbs >= 8);
                      return (
                        <li key={item.student.id}>
                          <button
                            type="button"
                            className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                              isSelected
                                ? "bg-[color:var(--rec-soft)] border-l-4 border-[color:var(--rec-primary)]"
                                : "border-l-4 border-transparent hover:bg-rec-bg-base"
                            }`}
                            onClick={() => setSelectedStudentId(String(item.student.id))}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-rec-text-on-media text-xs font-bold flex-shrink-0"
                              style={{
                                background:
                                  "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
                              }}
                            >
                              {item.student.apellidos.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-rec-text-primary truncate">
                                {item.student.apellidos}, {item.student.nombres}
                              </p>
                              <p className="text-xs text-rec-text-subtle">
                                {totalAbs > 0
                                  ? `${totalAbs} inasistencias en la materia`
                                  : "Sin inasistencias"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                              <span className={`text-sm font-bold ${gradeColor(studentAvg)}`}>
                                {studentAvg != null ? studentAvg.toFixed(2) : "—"}
                              </span>
                              {atRisk && <FiAlertTriangle className="w-3 h-3 text-rec-danger-text" />}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>

              <div id="tour-ges-detalle" className="lg:col-span-2 space-y-4">
                {selectedStudent ? (
                  <>
                    <StudentSummaryCard
                      student={selectedStudent.student}
                      promedioGeneral={selectedStudentAverage}
                      records={filterRecordsForTeacher(
                        selectedStudent.records,
                        subjectIdsAssignedToTeacher,
                      )}
                      subjectsTotal={subjectsForTeacher.length}
                      termSlotFilter={termSlotFilter}
                      passingThreshold={passingThreshold}
                    />
                    <div className="space-y-3">
                      {subjectsForTeacher.length === 0 ? (
                        <div className="rounded-xl border border-rec-border-default bg-rec-bg-base px-4 py-3 text-sm text-rec-text-muted">
                          No tienes materias asignadas para este grupo en tus asignaciones docentes.
                        </div>
                      ) : isCompetencyMode && groupOfferings === null ? (
                        <div className="rounded-xl border border-rec-border-default bg-rec-bg-base px-4 py-3 text-sm text-rec-text-muted">
                          Cargando ofertas académicas del grupo…
                        </div>
                      ) : (
                        subjectsForTeacher.map((subject) => {
                          const record = selectedStudent.records.find((r) => r.subjectId === subject.id);
                          const editable = subjectIdsAssignedToTeacher.has(subject.id);
                          const offering = offeringBySubjectId.get(subject.id);
                          const weights =
                            offering?.competencyWeights ?? overview.competencyWeights ?? {};

                          if (isCompetencyMode) {
                            if (!offering) {
                              return (
                                <div
                                  key={`${selectedStudent.student.id}-${subject.id}-no-offering`}
                                  className="rounded-xl border border-rec-warning-border bg-rec-warning-bg px-4 py-3 text-sm text-rec-warning-text"
                                >
                                  No hay oferta académica activa para «{subject.nombre}» en este período.
                                </div>
                              );
                            }
                            return (
                              <CompetencyGradeView
                                key={`${selectedStudent.student.id}-${subject.id}-${offering.id}`}
                                offeringId={offering.id}
                                groupId={Number(selectedGroupId)}
                                subjectId={subject.id}
                                subjectName={subject.nombre}
                                students={overview.students.map((s) => ({
                                  id: s.student.id,
                                  name: `${s.student.apellidos}, ${s.student.nombres}`,
                                }))}
                                competencyWeights={weights}
                                existingEvaluations={offering.academicEvaluations.map((e) => ({
                                  id: e.id,
                                  titulo: e.titulo,
                                  competencyCategory: e.competencyCategory ?? null,
                                  porcentaje: e.porcentaje,
                                  orden: e.orden,
                                }))}
                                studentRecords={overview.students.map((s) => ({
                                  studentId: s.student.id,
                                  record: s.records.find((r) => r.subjectId === subject.id),
                                }))}
                                disabled={!editable || !!cannotSaveGradesReason}
                                onSaved={async () => {
                                  const gid = Number(selectedGroupId);
                                  if (!gid) return;
                                  try {
                                    const data = await performanceApi.getGroupAcademicOverview(gid);
                                    setOverview(data);
                                    const rows = await academicApi.listGroupOfferings(
                                      gid,
                                      data.academicPeriod?.id,
                                    );
                                    setGroupOfferings(rows);
                                  } catch {
                                    /* noop */
                                  }
                                }}
                              />
                            );
                          }

                          return (
                            <SubjectEditor
                              key={`${selectedStudent.student.id}-${subject.id}-${record?.updatedAt ?? "new"}`}
                              subjectName={subject.nombre}
                              subjectId={subject.id}
                              initialValue={fromRecord(record)}
                              disabled={!editable}
                              saving={savingSubjectId === subject.id}
                              termSlotFilter={termSlotFilter}
                              cannotSaveGradesReason={cannotSaveGradesReason}
                              recordFinal={{
                                notaFinal: record?.notaFinal ?? null,
                                finalSource: record?.finalSource ?? null,
                                finalOverride: record?.finalOverride ?? null,
                              }}
                              onSave={saveSubject}
                            />
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-rec-bg-elevated rounded-2xl border border-rec-border-default p-10 text-center text-sm text-rec-text-subtle">
                    Selecciona un estudiante para ver su gestión académica.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatKpi({
  icon,
  bg,
  value,
  label,
  sub,
  labelTooltip,
}: {
  icon: ReactNode;
  bg: string;
  value: string;
  label: string;
  sub: string;
  labelTooltip?: string;
}) {
  return (
    <div className="rounded-2xl border bg-rec-bg-elevated p-4 shadow-sm" style={{ borderColor: "var(--rec-soft)" }}>
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold" style={{ color: "var(--rec-title)" }}>
        {value}
      </p>
      <p
        className="text-xs font-semibold mt-0.5 flex items-center gap-1 flex-wrap"
        style={{ color: "var(--rec-primary-strong)" }}
      >
        <span>{label}</span>
        {labelTooltip ? (
          <InfoTooltip text={labelTooltip}>
            <span
              className="inline-flex rounded-full p-0.5 text-rec-text-subtle hover:text-rec-text-muted focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
              aria-label="Más información"
            >
              <FiInfo className="w-3.5 h-3.5" />
            </span>
          </InfoTooltip>
        ) : null}
      </p>
      <p className="text-xs text-rec-text-subtle">{sub}</p>
    </div>
  );
}

function StudentSummaryCard({
  student,
  promedioGeneral,
  records,
  subjectsTotal,
  termSlotFilter,
  passingThreshold,
}: {
  student: { id: number; nombres: string; apellidos: string; email: string };
  promedioGeneral: number | null;
  records: StudentAcademicRecord[];
  subjectsTotal: number;
  termSlotFilter: string;
  passingThreshold: number;
}) {
  const absences = getStudentAbsenceTotals(records);
  const totalJust = absences.justificadas;
  const totalInjust = absences.injustificadas;
  const totalAbs = absences.total;
  const materiasConRegistro = records.filter((r) =>
    recordCountsForProgress(r, termSlotFilter),
  ).length;
  const pctProgreso =
    subjectsTotal > 0 ? Math.round((materiasConRegistro / subjectsTotal) * 100) : 0;
  const atRisk =
    (promedioGeneral != null && promedioGeneral < passingThreshold) ||
    (termSlotFilter === "all" && totalAbs >= 8);

  return (
    <div className="bg-rec-bg-elevated rounded-2xl border border-rec-border-default shadow-sm p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--rec-primary)] to-[var(--rec-primary-strong)] flex items-center justify-center text-rec-text-on-media text-lg font-black flex-shrink-0">
            {student.apellidos.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-rec-text-subtle uppercase tracking-wide font-semibold">
              Estudiante seleccionado
            </p>
            <h2 className="text-lg font-bold text-rec-text-primary">
              {student.nombres} {student.apellidos}
            </h2>
            <p className="text-sm text-rec-text-subtle">{student.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-3xl font-black ${gradeColor(promedioGeneral)}`}>
            {promedioGeneral != null ? promedioGeneral.toFixed(2) : "—"}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${gradeBadgeClass(promedioGeneral)}`}
          >
            {gradeLabel(promedioGeneral)}
          </span>
        </div>
      </div>

      {atRisk && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-rec-danger-bg border border-rec-danger-border px-3 py-2.5 text-xs text-rec-danger-text">
          <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">Estudiante en riesgo académico</span>
          <span className="text-rec-danger-text hidden sm:inline"> — requiere atención especial</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-rec-bg-base px-3 py-3">
          <p className="text-xl font-bold text-rec-text-primary">
            {materiasConRegistro}
            <span className="text-sm font-normal text-rec-text-subtle">/{subjectsTotal}</span>
          </p>
          <p className="text-xs text-rec-text-subtle mt-0.5">
            {termSlotFilter === "all" ? "Materias con notas" : `Con nota en ${getTermSlotFilterLabel(termSlotFilter)}`}
          </p>
        </div>
        <div className="rounded-xl bg-rec-warning-bg px-3 py-3">
          <p className="text-xl font-bold text-rec-warning-text">{totalJust}</p>
          <p className="text-xs text-rec-text-subtle mt-0.5">Inas. justificadas</p>
        </div>
        <div className="rounded-xl bg-rec-danger-bg px-3 py-3">
          <p className="text-xl font-bold text-rec-danger-text">{totalInjust}</p>
          <p className="text-xs text-rec-text-subtle mt-0.5">Inas. injustificadas</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-rec-text-subtle mb-1.5 items-center gap-2">
          <span className="flex items-center gap-1 min-w-0">
            <span className="truncate">
              {termSlotFilter === "all"
                ? "Cobertura de notas (materias asignadas)"
                : `Cobertura en ${getTermSlotFilterLabel(termSlotFilter)}`}
            </span>
            <InfoTooltip text={COBERTURA_ESTUDIANTE_TOOLTIP}>
              <span
                className="inline-flex shrink-0 rounded-full p-0.5 text-rec-text-subtle hover:text-rec-text-muted"
                aria-label="Más información sobre cobertura"
              >
                <FiInfo className="w-3.5 h-3.5" />
              </span>
            </InfoTooltip>
          </span>
          <span className="shrink-0 font-medium text-rec-text-muted">{pctProgreso}%</span>
        </div>
        <div className="h-2 bg-rec-bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--rec-primary)] to-[var(--rec-primary-strong)] rounded-full transition-all duration-500"
            style={{ width: `${pctProgreso}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SubjectEditor({
  subjectId,
  subjectName,
  initialValue,
  disabled,
  saving,
  termSlotFilter,
  cannotSaveGradesReason,
  recordFinal,
  onSave,
}: {
  subjectId: number;
  subjectName: string;
  initialValue: SubjectFormState;
  disabled: boolean;
  saving: boolean;
  termSlotFilter: string;
  cannotSaveGradesReason: string | null;
  recordFinal: {
    notaFinal: number | null;
    finalSource: string | null | undefined;
    finalOverride: number | null | undefined;
  };
  onSave: (subjectId: number, form: SubjectFormState, event: FormEvent) => Promise<void>;
}) {
  const [form, setForm] = useState<SubjectFormState>(initialValue);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setForm(initialValue);
  }, [initialValue]);

  const visibleEvaluations = useMemo(() => {
    return form.evaluations.filter((ev) => {
      if (termSlotFilter === "all") return true;
      return ev.termSlot === Number(termSlotFilter);
    });
  }, [form.evaluations, termSlotFilter]);

  const scopedForAverage = useMemo(() => {
    return termSlotFilter === "all" ? form.evaluations : visibleEvaluations;
  }, [form.evaluations, termSlotFilter, visibleEvaluations]);

  const gradeValuesScoped = scopedForAverage.map((e) => toNum(e.grade) ?? null);
  const autoPromedioScoped = computeAverage(gradeValuesScoped);

  const gradeValuesAll = form.evaluations.map((e) => toNum(e.grade) ?? null);
  const autoPromedioAll = computeAverage(gradeValuesAll);

  const headerPreview =
    termSlotFilter === "all" ? autoPromedioAll : (autoPromedioScoped ?? autoPromedioAll);

  const termFromFilter = termSlotFilter === "all" ? null : Number(termSlotFilter);
  const currentPeriodAbsences =
    termFromFilter != null ? form.periodAbsences[termFromFilter] : null;
  const totals = getAbsenceTotalsFromMap(form.periodAbsences);
  const totalAbs = totals.justificadas + totals.injustificadas;
  const periodAbsJustified = currentPeriodAbsences
    ? toNonNegativeInt(Number(currentPeriodAbsences.justificadas))
    : 0;
  const periodAbsUnjustified = currentPeriodAbsences
    ? toNonNegativeInt(Number(currentPeriodAbsences.injustificadas))
    : 0;
  const periodAbsTotal = periodAbsJustified + periodAbsUnjustified;
  const canEditPeriodAbsences = !disabled && termFromFilter != null;

  const iconBg =
    headerPreview == null
      ? "bg-rec-bg-muted"
      : headerPreview >= 4.0
        ? "bg-rec-success-bg-muted"
        : headerPreview >= 3.0
          ? "bg-rec-warning-bg"
          : "bg-rec-danger-bg-strong";

  const iconColor =
    headerPreview == null
      ? "text-rec-text-subtle"
      : headerPreview >= 4.0
        ? "text-rec-primary"
        : headerPreview >= 3.0
          ? "text-rec-warning-text"
          : "text-rec-danger-text";

  const updateEvaluation = (clientId: string, patch: Partial<EvaluationEditorRow>) => {
    setForm((prev) => ({
      ...prev,
      evaluations: prev.evaluations.map((e) => (e.clientId === clientId ? { ...e, ...patch } : e)),
    }));
  };

  const removeRow = (row: EvaluationEditorRow) => {
    const persistedId = row.evaluationId;
    if (persistedId != null) {
      setForm((prev) => ({
        ...prev,
        removedPersisted: [
          ...prev.removedPersisted,
          { evaluationId: persistedId, title: row.title || "Evaluación" },
        ],
        evaluations: prev.evaluations.filter((e) => e.clientId !== row.clientId),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        evaluations: prev.evaluations.filter((e) => e.clientId !== row.clientId),
      }));
    }
  };

  const addEvaluation = () => {
    const defaultSlot = termSlotFilter === "all" ? 1 : Number(termSlotFilter);
    const slot =
      defaultSlot >= 1 && defaultSlot <= 4 ? (defaultSlot as 1 | 2 | 3 | 4) : 1;
    setForm((prev) => ({
      ...prev,
      evaluations: [
        ...prev.evaluations,
        {
          clientId: newClientId(),
          title: "Nueva evaluación",
          termSlot: slot,
          weight: "",
          grade: "",
        },
      ],
    }));
  };

  const showSaveBlock = !disabled && cannotSaveGradesReason != null;

  return (
    <div className="bg-rec-bg-elevated rounded-2xl border border-rec-border-default shadow-sm overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-rec-bg-base transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <FiBook className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-rec-text-primary">{subjectName}</span>
            {disabled && (
              <InfoTooltip text="No estás asignado para calificar esta materia en este grupo. Contacta a Secretaría.">
                <span className="text-xs px-2 py-0.5 rounded-full bg-rec-warning-bg text-rec-warning-text">
                  Solo lectura
                </span>
              </InfoTooltip>
            )}
            {recordFinal.finalSource === "OVERRIDE" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rec-bg-muted text-rec-text-secondary border border-rec-border-default">
                Nota ajustada
              </span>
            )}
            {form.evaluations.length > 0 && (
              <span className="text-xs text-rec-text-subtle">
                {termSlotFilter === "all"
                  ? `${form.evaluations.length} evaluación(es)`
                  : `${visibleEvaluations.length} en ${getTermSlotFilterLabel(termSlotFilter)}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-rec-text-subtle flex-wrap">
            {headerPreview != null ? (
              <span className={`font-semibold ${gradeColor(headerPreview)}`}>
                {headerPreview.toFixed(2)} · {gradeLabel(headerPreview)}
              </span>
            ) : null}
            {termFromFilter != null ? (
              periodAbsTotal > 0 ? (
                <span className="text-rec-warning-text">
                  {periodAbsTotal} ausencias en {getTermSlotFilterLabel(termSlotFilter)}
                </span>
              ) : (
                <span className="text-rec-text-subtle">
                  Sin ausencias en {getTermSlotFilterLabel(termSlotFilter)}
                </span>
              )
            ) : totalAbs > 0 ? (
              <span className="text-rec-warning-text">{totalAbs} ausencias</span>
            ) : null}
            {headerPreview == null && form.evaluations.length === 0 && (
              <span>Sin evaluaciones aún</span>
            )}
          </div>
        </div>
        {headerPreview != null && (
          <span
            className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${gradeBadgeClass(headerPreview)}`}
          >
            {gradeLabel(headerPreview)}
          </span>
        )}
        {expanded ? (
          <FiChevronUp className="w-4 h-4 text-rec-text-subtle flex-shrink-0" />
        ) : (
          <FiChevronDown className="w-4 h-4 text-rec-text-subtle flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <form
          onSubmit={(e) => void onSave(subjectId, form, e)}
          className="px-5 pb-5 pt-4 border-t border-rec-border-subtle space-y-5"
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle">
                Evaluaciones (escala 0–5)
              </p>
              {!disabled && (
                <button
                  type="button"
                  onClick={addEvaluation}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-rec-border-default bg-rec-bg-base text-rec-text-secondary hover:bg-rec-bg-muted"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Nueva evaluación
                </button>
              )}
            </div>

            {visibleEvaluations.length === 0 && (
              <p className="text-xs text-rec-text-subtle italic mb-2">
                {termSlotFilter === "all"
                  ? "No hay evaluaciones. Añade una con el botón superior o guarda desde otro período."
                  : `No hay evaluaciones en ${getTermSlotFilterLabel(termSlotFilter)}.`}
              </p>
            )}

            <div className="space-y-2">
              {visibleEvaluations.map((ev) => (
                <div key={ev.clientId} className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-rec-bg-muted text-rec-text-muted whitespace-nowrap">
                    {ev.termSlot != null ? `Período ${ev.termSlot}` : "Sin período"}
                  </span>
                  <select
                    className="w-28 rounded-xl border px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)] disabled:opacity-60"
                    style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                    value={ev.termSlot ?? ""}
                    onChange={(e) =>
                      updateEvaluation(ev.clientId, {
                        termSlot: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    disabled={disabled}
                  >
                    <option value="">Sin período</option>
                    <option value="1">Período 1</option>
                    <option value="2">Período 2</option>
                    <option value="3">Período 3</option>
                    <option value="4">Período 4</option>
                  </select>
                  <input
                    type="text"
                    className="flex-1 min-w-[120px] rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)] disabled:opacity-60"
                    style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                    placeholder="Título de la evaluación"
                    value={ev.title}
                    onChange={(e) => updateEvaluation(ev.clientId, { title: e.target.value })}
                    disabled={disabled}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-16 rounded-xl border px-2 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)] disabled:opacity-60"
                    style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
                    placeholder="%"
                    title="Peso (opcional)"
                    value={ev.weight}
                    onChange={(e) => updateEvaluation(ev.clientId, { weight: e.target.value })}
                    disabled={disabled}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={5}
                    className={`w-24 rounded-xl border px-3 py-2 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)] disabled:opacity-60 transition-colors ${
                      toNum(ev.grade) == null
                        ? "border-rec-border-default bg-rec-bg-base"
                        : (toNum(ev.grade) ?? 0) >= 4.0
                          ? "border-rec-success-border bg-rec-success-bg text-rec-success-text"
                          : (toNum(ev.grade) ?? 0) >= 3.0
                            ? "border-rec-warning-border bg-rec-warning-bg text-rec-warning-text"
                            : "border-rec-danger-border bg-rec-danger-bg text-rec-danger-text"
                    }`}
                    placeholder="Nota"
                    value={ev.grade}
                    onChange={(e) => updateEvaluation(ev.clientId, { grade: e.target.value })}
                    disabled={disabled}
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeRow(ev)}
                      className="w-8 h-8 rounded-xl bg-rec-danger-bg hover:bg-rec-danger-bg-strong border border-rec-danger-border flex items-center justify-center text-rec-danger-text flex-shrink-0"
                      title="Quitar evaluación"
                    >
                      <FiMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {scopedForAverage.length > 1 && autoPromedioScoped != null && (
              <div
                className={`mt-3 rounded-xl px-4 py-3 flex items-center justify-between border ${
                  autoPromedioScoped >= 4.0
                    ? "bg-rec-success-bg border-rec-success-border"
                    : autoPromedioScoped >= 3.0
                      ? "bg-rec-warning-bg border-rec-warning-border"
                      : "bg-rec-danger-bg border-rec-danger-border"
                }`}
              >
                <div>
                  <p className="text-xs text-rec-text-subtle">
                    {termSlotFilter === "all"
                      ? "Promedio simple (vista actual)"
                      : `Promedio del ${getTermSlotFilterLabel(termSlotFilter)}`}
                  </p>
                  <p className={`text-xl font-black mt-0.5 ${gradeColor(autoPromedioScoped)}`}>
                    {autoPromedioScoped.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle mb-1">
              Nota final (servidor)
            </p>
            <div
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                recordFinal.notaFinal == null
                  ? "border-rec-border-default bg-rec-bg-base text-rec-text-subtle"
                  : recordFinal.notaFinal >= 4.0
                    ? "border-rec-success-border bg-rec-success-bg text-rec-success-text"
                    : recordFinal.notaFinal >= 3.0
                      ? "border-rec-warning-border bg-rec-warning-bg text-rec-warning-text"
                      : "border-rec-danger-border bg-rec-danger-bg text-rec-danger-text"
              }`}
            >
              {recordFinal.finalSource === "OVERRIDE" &&
              recordFinal.finalOverride != null &&
              !Number.isNaN(recordFinal.finalOverride) ? (
                <span className="flex flex-wrap items-center gap-2">
                  Nota ajustada: {recordFinal.finalOverride.toFixed(2)}
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rec-bg-muted text-rec-text-secondary">
                    OVERRIDE
                  </span>
                </span>
              ) : recordFinal.finalSource === "COMPUTED" && recordFinal.notaFinal != null ? (
                <span>Promedio calculado: {recordFinal.notaFinal.toFixed(2)}</span>
              ) : recordFinal.notaFinal != null ? (
                <span>Nota final: {recordFinal.notaFinal.toFixed(2)}</span>
              ) : (
                <span className="text-rec-text-subtle">Sin nota final (sin evaluaciones o registro legacy)</span>
              )}
            </div>
            <p className="text-[11px] text-rec-text-subtle mt-1">
              El valor definitivo lo calcula el backend al guardar (ponderado si hay pesos).
            </p>
            {termSlotFilter !== "all" && recordFinal.notaFinal != null && (
              <p className="text-[11px] text-rec-text-subtle mt-1">
                Nota final de la materia: {recordFinal.notaFinal.toFixed(2)} (todos los períodos)
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle mb-2">
              Inasistencias en esta materia
            </p>
            {termFromFilter == null && (
              <p className="text-xs text-rec-text-subtle mb-2">
                Selecciona un período para editar inasistencias por período (1–4).
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-rec-text-subtle mb-1 block">Justificadas</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full rounded-xl border border-rec-warning-border bg-rec-warning-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)] disabled:opacity-60"
                  value={
                    termFromFilter != null
                      ? form.periodAbsences[termFromFilter]?.justificadas ?? "0"
                      : String(totals.justificadas)
                  }
                  onChange={(e) =>
                    setForm((prev) => {
                      if (termFromFilter == null) return prev;
                      return {
                        ...prev,
                        periodAbsences: {
                          ...prev.periodAbsences,
                          [termFromFilter]: {
                            ...prev.periodAbsences[termFromFilter],
                            justificadas: e.target.value,
                          },
                        },
                      };
                    })
                  }
                  disabled={!canEditPeriodAbsences}
                />
              </div>
              <div>
                <label className="text-xs text-rec-text-subtle mb-1 block">Injustificadas</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full rounded-xl border border-rec-danger-border bg-rec-danger-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rec-danger-text)] disabled:opacity-60"
                  value={
                    termFromFilter != null
                      ? form.periodAbsences[termFromFilter]?.injustificadas ?? "0"
                      : String(totals.injustificadas)
                  }
                  onChange={(e) =>
                    setForm((prev) => {
                      if (termFromFilter == null) return prev;
                      return {
                        ...prev,
                        periodAbsences: {
                          ...prev.periodAbsences,
                          [termFromFilter]: {
                            ...prev.periodAbsences[termFromFilter],
                            injustificadas: e.target.value,
                          },
                        },
                      };
                    })
                  }
                  disabled={!canEditPeriodAbsences}
                />
              </div>
            </div>
            {(termFromFilter != null ? periodAbsTotal : totalAbs) > 0 && (
              <p className="text-xs mt-1.5 text-rec-text-subtle">
                Total {termFromFilter != null ? `en ${getTermSlotFilterLabel(termSlotFilter)}` : "general"}:{" "}
                <span
                  className={
                    (termFromFilter != null ? periodAbsTotal : totalAbs) >= 5
                      ? "font-bold text-rec-danger-text"
                      : "font-semibold text-rec-warning-text"
                  }
                >
                  {termFromFilter != null ? periodAbsTotal : totalAbs} inasistencias
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-rec-text-subtle mb-1.5 block">Observaciones pedagógicas</label>
            <textarea
              className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)] disabled:opacity-60"
              style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
              rows={2}
              placeholder="Observaciones sobre el desempeño del estudiante en esta materia..."
              value={form.observaciones}
              onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
              disabled={disabled}
            />
          </div>

          {showSaveBlock && (
            <p className="text-sm text-rec-warning-text bg-rec-warning-bg border border-rec-warning-border rounded-xl px-3 py-2">
              {cannotSaveGradesReason}
            </p>
          )}

          {!disabled && (
            <button
              type="submit"
              disabled={saving || showSaveBlock}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-rec-text-on-media hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
              style={{ background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))" }}
            >
              <FiSave className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
