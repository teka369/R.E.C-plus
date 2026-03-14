"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import {
  performanceApi,
  type GradeEntry,
  type GroupAcademicOverview,
  type StudentAcademicRecord,
  type UpsertStudentAcademicInput,
} from "@/lib/performanceApi";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBook,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiMinus,
  FiPlus,
  FiSave,
  FiUsers,
  FiX,
} from "react-icons/fi";

// ── Types ─────────────────────────────────────────────────────────────────────

type GradeFormEntry = { label: string; value: string; period: number | null };

type PeriodAbsenceEntry = {
  justificadas: string;
  injustificadas: string;
};

type PeriodAbsenceMap = Record<number, PeriodAbsenceEntry>;

const PERIOD_NUMBERS = [1, 2, 3, 4] as const;

type SubjectFormState = {
  grades: GradeFormEntry[];
  periodAbsences: PeriodAbsenceMap;
  observaciones: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeAverage(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (!valid.length) return null;
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
}

function parseGradesJson(raw: string | null): GradeEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as GradeEntry[];
  } catch { /* ignore */ }
  return [];
}

function normalizePeriod(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value < 1 || value > 4) return null;
  return Math.trunc(value);
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

function buildPeriodAbsenceMapFromGrades(
  grades: GradeEntry[],
  fallbackJustified: number,
  fallbackUnjustified: number,
): PeriodAbsenceMap {
  const map = createEmptyPeriodAbsenceMap();
  let hasPeriodAbsences = false;

  for (const grade of grades) {
    const period = getGradePeriod(grade);
    if (!period || !(period in map)) continue;

    const justified = toNonNegativeInt(
      (grade as { inasistenciasJustificadas?: unknown }).inasistenciasJustificadas,
    );
    const unjustified = toNonNegativeInt(
      (grade as { inasistenciasInjustificadas?: unknown }).inasistenciasInjustificadas,
    );

    if (justified > 0 || unjustified > 0) hasPeriodAbsences = true;

    map[period] = {
      justificadas: String(justified),
      injustificadas: String(unjustified),
    };
  }

  if (!hasPeriodAbsences && (fallbackJustified > 0 || fallbackUnjustified > 0)) {
    // Compatibilidad con datos legacy: cuando no existe detalle por periodo,
    // se conserva el acumulado previo en periodo 1 hasta que se reclasifique.
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
  const existingGrades = parseGradesJson(record?.gradesJson ?? null);
  let grades: GradeFormEntry[];
  if (existingGrades.length > 0) {
    grades = existingGrades.map((g) => ({
      label: g.label,
      value: g.value == null ? "" : String(g.value),
      period:
        normalizePeriod((g as { period?: unknown }).period) ??
        extractPeriodFromLabel(g.label),
    }));
  } else {
    const legacy: GradeFormEntry[] = [];
    if (record?.parcial1 != null)
      legacy.push({ label: "Parcial 1", value: String(record.parcial1), period: 1 });
    if (record?.parcial2 != null)
      legacy.push({ label: "Parcial 2", value: String(record.parcial2), period: 2 });
    if (record?.parcial3 != null)
      legacy.push({ label: "Parcial 3", value: String(record.parcial3), period: 3 });
    if (record?.parcial4 != null)
      legacy.push({ label: "Parcial 4", value: String(record.parcial4), period: 4 });
    grades = legacy.length > 0 ? legacy : [{ label: "Parcial 1", value: "", period: 1 }];
  }

  const periodAbsences = buildPeriodAbsenceMapFromGrades(
    existingGrades,
    record?.inasistenciasJustificadas ?? 0,
    record?.inasistenciasInjustificadas ?? 0,
  );

  return {
    grades,
    periodAbsences,
    observaciones: record?.observaciones ?? "",
  };
}

function gradeColor(value: number | null | undefined): string {
  if (value == null) return "text-slate-400";
  if (value >= 4.0) return "text-emerald-600";
  if (value >= 3.0) return "text-amber-500";
  return "text-red-500";
}

function gradeBadgeClass(value: number | null | undefined): string {
  if (value == null) return "bg-slate-100 text-slate-500";
  if (value >= 4.0) return "bg-emerald-100 text-emerald-700";
  if (value >= 3.0) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
}

function gradeLabel(value: number | null | undefined): string {
  if (value == null) return "Sin nota";
  if (value >= 4.0) return "Aprobado";
  if (value >= 3.0) return "Suficiente";
  return "En riesgo";
}

function getRecordAbsences(record: StudentAcademicRecord, periodFilter: string): {
  justificadas: number;
  injustificadas: number;
} {
  const grades = parseGradesJson(record.gradesJson);
  const byPeriod = new Map<number, { justificadas: number; injustificadas: number }>();

  for (const grade of grades) {
    const period = getGradePeriod(grade);
    if (!period) continue;
    byPeriod.set(period, {
      justificadas: toNonNegativeInt(
        (grade as { inasistenciasJustificadas?: unknown }).inasistenciasJustificadas,
      ),
      injustificadas: toNonNegativeInt(
        (grade as { inasistenciasInjustificadas?: unknown }).inasistenciasInjustificadas,
      ),
    });
  }

  if (periodFilter === "all") {
    if (byPeriod.size > 0) {
      let justificadas = 0;
      let injustificadas = 0;
      byPeriod.forEach((item) => {
        justificadas += item.justificadas;
        injustificadas += item.injustificadas;
      });
      return { justificadas, injustificadas };
    }

    return {
      justificadas: record.inasistenciasJustificadas ?? 0,
      injustificadas: record.inasistenciasInjustificadas ?? 0,
    };
  }

  const selected = byPeriod.get(Number(periodFilter));
  if (selected) return selected;
  return { justificadas: 0, injustificadas: 0 };
}

function getStudentAbsenceTotals(
  records: StudentAcademicRecord[],
  periodFilter: string,
): { justificadas: number; injustificadas: number; total: number } {
  const totals = records.reduce(
    (acc, record) => {
      const abs = getRecordAbsences(record, periodFilter);
      acc.justificadas += abs.justificadas;
      acc.injustificadas += abs.injustificadas;
      return acc;
    },
    { justificadas: 0, injustificadas: 0 },
  );

  return {
    ...totals,
    total: totals.justificadas + totals.injustificadas,
  };
}

function extractPeriodFromLabel(label: string): number | null {
  const match = label.match(/(?:periodo|parcial)\s*(\d+)/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isNaN(n) ? null : n;
}

function getLabelForNewGrade(existing: GradeFormEntry[], periodFilter: string): string {
  if (periodFilter === "all") {
    const defaultPeriod = 1;
    const inPeriod = existing.filter((g) => g.period === defaultPeriod).length;
    return inPeriod === 0
      ? `Periodo ${defaultPeriod}`
      : `Periodo ${defaultPeriod} - Nota ${inPeriod + 1}`;
  }

  const targetPeriod = Number(periodFilter);
  const inSamePeriod = existing.filter(
    (grade) => extractPeriodFromLabel(grade.label) === targetPeriod,
  ).length;

  if (inSamePeriod === 0) return `Periodo ${targetPeriod}`;
  return `Periodo ${targetPeriod} - Nota ${inSamePeriod + 1}`;
}

function getPeriodFilterLabel(periodFilter: string): string {
  return periodFilter === "all" ? "Todos los periodos" : `Periodo ${periodFilter}`;
}

function getGradePeriod(entry: GradeEntry): number | null {
  return normalizePeriod((entry as { period?: unknown }).period) ?? extractPeriodFromLabel(entry.label);
}

function averageFromEntries(entries: GradeEntry[]): number | null {
  return computeAverage(entries.map((entry) => entry.value));
}

function getRecordPeriodAverage(record: StudentAcademicRecord, periodFilter: string): number | null {
  if (periodFilter === "all") {
    return record.notaFinal ?? record.promedioMateria;
  }

  const period = Number(periodFilter);
  const fromJson = parseGradesJson(record.gradesJson).filter((entry) => getGradePeriod(entry) === period);
  const jsonAverage = averageFromEntries(fromJson);
  if (jsonAverage != null) return jsonAverage;

  if (period === 1) return record.parcial1;
  if (period === 2) return record.parcial2;
  if (period === 3) return record.parcial3;
  if (period === 4) return record.parcial4;
  return null;
}

function getStudentAverageForFilter(records: StudentAcademicRecord[], periodFilter: string): number | null {
  return computeAverage(records.map((record) => getRecordPeriodAverage(record, periodFilter)));
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
  const [periodFilter, setPeriodFilter] = useState<string>("all");

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

  const selectedStudent = useMemo(() => {
    const id = Number(selectedStudentId);
    if (!id || !overview) return null;
    return overview.students.find((item) => item.student.id === id) ?? null;
  }, [overview, selectedStudentId]);

  const selectedStudentAverage = useMemo(() => {
    if (!selectedStudent) return null;
    return getStudentAverageForFilter(selectedStudent.records, periodFilter);
  }, [selectedStudent, periodFilter]);

  const groupStats = useMemo(() => {
    if (!overview || overview.students.length === 0) return null;
    const total = overview.students.length;
    const promedios = overview.students
      .map((s) => getStudentAverageForFilter(s.records, periodFilter))
      .filter((x): x is number => x != null);
    const promedio = promedios.length
      ? Number((promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2))
      : null;
    const aprobados = overview.students.filter(
      (s) => (getStudentAverageForFilter(s.records, periodFilter) ?? 0) >= 3.0,
    ).length;
    const pctAprobados = Math.round((aprobados / total) * 100);
    const enRiesgo = overview.students.filter(
      (s) => {
        const avg = getStudentAverageForFilter(s.records, periodFilter);
        return avg != null && avg < 3.0;
      },
    ).length;
    return { total, promedio, pctAprobados, aprobados, enRiesgo };
  }, [overview, periodFilter]);

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

  const saveSubject = async (subjectId: number, form: SubjectFormState, event: FormEvent) => {
    event.preventDefault();
    const groupId = Number(selectedGroupId);
    const studentId = Number(selectedStudentId);
    if (!groupId || !studentId) return;

    const gradesForJson: GradeEntry[] = form.grades
      .filter((g) => g.label.trim() !== "")
      .map((g, index) => {
        const period = g.period ?? extractPeriodFromLabel(g.label) ?? 1;
        const fallbackLabel = `Periodo ${period} - Nota ${index + 1}`;
        const absences = form.periodAbsences[period] ?? {
          justificadas: "0",
          injustificadas: "0",
        };
        return {
          label: g.label.trim() || fallbackLabel,
          value: toNum(g.value) ?? null,
          period,
          inasistenciasJustificadas: toNonNegativeInt(Number(absences.justificadas)),
          inasistenciasInjustificadas: toNonNegativeInt(Number(absences.injustificadas)),
        };
      });

    const autoPromedio = computeAverage(gradesForJson.map((g) => g.value));
    const notaFinalValue = autoPromedio ?? undefined;
    const totals = getAbsenceTotalsFromMap(form.periodAbsences);

    const payload: UpsertStudentAcademicInput = {
      gradesJson: gradesForJson.length > 0 ? JSON.stringify(gradesForJson) : undefined,
      notaFinal: notaFinalValue,
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
    <section className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-5">
      {/* ── Header ── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 75% 40%, white 0%, transparent 60%)" }}
        />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiBook className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gestión Académica</h1>
            <p className="text-blue-100 text-sm mt-0.5">
              Registra notas personalizadas, inasistencias y observaciones por estudiante y materia
            </p>
          </div>
        </div>
      </header>

      {/* ── Alertas ── */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <FiCheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
          <button className="ml-auto" onClick={() => setMessage(null)}>
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button className="ml-auto" onClick={() => setError(null)}>
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {loadingAssignments && (
        <div className="rounded-xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
          Cargando grupos asignados...
        </div>
      )}

      {!loadingAssignments && groups.length === 0 && (
        <div className="rounded-xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
          No tienes grupos asignados para gestionar información académica.
        </div>
      )}

      {!loadingAssignments && groups.length > 0 && (
        <>
          {/* ── Selector de grupo ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 block">
                  Grupo activo
                </span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 block">
                  Filtro por periodo
                </span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                >
                  <option value="all">Todos los periodos</option>
                  <option value="1">Periodo 1</option>
                  <option value="2">Periodo 2</option>
                  <option value="3">Periodo 3</option>
                  <option value="4">Periodo 4</option>
                </select>
              </label>
            </div>
          </div>

          {/* ── KPIs del grupo ── */}
          {groupStats && !loadingOverview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatKpi
                icon={<FiUsers className="w-5 h-5 text-blue-500" />}
                bg="bg-blue-50"
                value={String(groupStats.total)}
                label="Estudiantes"
                sub="en el grupo"
              />
              <StatKpi
                icon={<FiBarChart2 className="w-5 h-5 text-indigo-500" />}
                bg="bg-indigo-50"
                value={groupStats.promedio != null ? groupStats.promedio.toFixed(2) : "—"}
                label="Promedio grupo"
                sub="nota promedio general"
              />
              <StatKpi
                icon={<FiCheckCircle className="w-5 h-5 text-emerald-500" />}
                bg="bg-emerald-50"
                value={`${groupStats.pctAprobados}%`}
                label="Tasa de aprobación"
                sub={`${groupStats.aprobados} de ${groupStats.total}`}
              />
              <StatKpi
                icon={<FiAlertTriangle className="w-5 h-5 text-red-400" />}
                bg="bg-red-50"
                value={String(groupStats.enRiesgo)}
                label="En riesgo"
                sub="requieren atención"
              />
            </div>
          )}

          {loadingOverview && (
            <div className="rounded-xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
              Cargando gestión académica del grupo...
            </div>
          )}

          {!loadingOverview && overview && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              {/* Lista de estudiantes */}
              <aside className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estudiantes ({overview.students.length})
                    </h2>
                  </div>
                  <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {overview.students.map((item) => {
                      const isSelected = String(item.student.id) === selectedStudentId;
                      const totalAbs = getStudentAbsenceTotals(item.records, periodFilter).total;
                      const studentAvg = getStudentAverageForFilter(item.records, periodFilter);
                      const atRisk =
                              (studentAvg != null && studentAvg < 3.0) ||
                              (periodFilter === "all" && totalAbs >= 8);
                      return (
                        <li key={item.student.id}>
                          <button
                            className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                              isSelected
                                ? "bg-blue-50 border-l-4 border-blue-500"
                                : "border-l-4 border-transparent hover:bg-slate-50"
                            }`}
                            onClick={() => setSelectedStudentId(String(item.student.id))}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {item.student.apellidos.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {item.student.apellidos}, {item.student.nombres}
                              </p>
                              <p className="text-xs text-slate-400">
                                {totalAbs > 0
                                  ? `${totalAbs} inasistencias${periodFilter !== "all" ? ` (${getPeriodFilterLabel(periodFilter)})` : ""}`
                                  : "Sin inasistencias"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                <span className={`text-sm font-bold ${gradeColor(studentAvg)}`}>
                                  {studentAvg != null ? studentAvg.toFixed(2) : "—"}
                              </span>
                              {atRisk && <FiAlertTriangle className="w-3 h-3 text-red-400" />}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>

              {/* Detalle del estudiante */}
              <div className="lg:col-span-2 space-y-4">
                {selectedStudent ? (
                  <>
                    <StudentSummaryCard
                      student={selectedStudent.student}
                      promedioGeneral={selectedStudentAverage}
                      records={selectedStudent.records}
                      subjectsTotal={overview.subjects.length}
                      periodFilter={periodFilter}
                    />
                    <div className="space-y-3">
                      {overview.subjects.map((subject) => {
                        const record = selectedStudent.records.find(
                          (r) => r.subjectId === subject.id,
                        );
                        const editable = subjectIdsAssignedToTeacher.has(subject.id);
                        return (
                          <SubjectEditor
                            key={`${selectedStudent.student.id}-${subject.id}-${record?.updatedAt ?? "new"}`}
                            subjectName={subject.nombre}
                            subjectId={subject.id}
                            initialValue={fromRecord(record)}
                            disabled={!editable}
                            saving={savingSubjectId === subject.id}
                            periodFilter={periodFilter}
                            onSave={saveSubject}
                          />
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
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
}: {
  icon: ReactNode;
  bg: string;
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function StudentSummaryCard({
  student,
  promedioGeneral,
  records,
  subjectsTotal,
  periodFilter,
}: {
  student: { id: number; nombres: string; apellidos: string; email: string };
  promedioGeneral: number | null;
  records: StudentAcademicRecord[];
  subjectsTotal: number;
  periodFilter: string;
}) {
  const absences = getStudentAbsenceTotals(records, periodFilter);
  const totalJust = absences.justificadas;
  const totalInjust = absences.injustificadas;
  const totalAbs = absences.total;
  const materiasConRegistro = records.filter((r) => {
    const hasGrades = parseGradesJson(r.gradesJson).length > 0;
    return hasGrades || r.parcial1 != null || r.notaFinal != null;
  }).length;
  const pctProgreso = subjectsTotal > 0 ? Math.round((materiasConRegistro / subjectsTotal) * 100) : 0;
  const atRisk =
    (promedioGeneral != null && promedioGeneral < 3.0) ||
    (periodFilter === "all" && totalAbs >= 8);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
            {student.apellidos.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
              Estudiante seleccionado
            </p>
            <h2 className="text-lg font-bold text-slate-900">
              {student.nombres} {student.apellidos}
            </h2>
            <p className="text-sm text-slate-400">{student.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-3xl font-black ${gradeColor(promedioGeneral)}`}>
            {promedioGeneral != null ? promedioGeneral.toFixed(2) : "—"}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${gradeBadgeClass(promedioGeneral)}`}>
            {gradeLabel(promedioGeneral)}
          </span>
        </div>
      </div>

      {atRisk && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-600">
          <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">Estudiante en riesgo académico</span>
          <span className="text-red-400 hidden sm:inline"> — requiere atención especial</span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-xl font-bold text-slate-800">
            {materiasConRegistro}
            <span className="text-sm font-normal text-slate-400">/{subjectsTotal}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Materias registradas</p>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-3">
          <p className="text-xl font-bold text-amber-600">{totalJust}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Inas. justificadas{periodFilter !== "all" ? " (globales)" : ""}
          </p>
        </div>
        <div className="rounded-xl bg-red-50 px-3 py-3">
          <p className="text-xl font-bold text-red-500">{totalInjust}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Inas. injustificadas{periodFilter !== "all" ? " (globales)" : ""}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>
            {periodFilter === "all"
              ? "Progreso de registro de notas"
              : `Progreso en ${getPeriodFilterLabel(periodFilter)}`}
          </span>
          <span>{pctProgreso}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
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
  periodFilter,
  onSave,
}: {
  subjectId: number;
  subjectName: string;
  initialValue: SubjectFormState;
  disabled: boolean;
  saving: boolean;
  periodFilter: string;
  onSave: (subjectId: number, form: SubjectFormState, event: FormEvent) => Promise<void>;
}) {
  const [form, setForm] = useState<SubjectFormState>(initialValue);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setForm(initialValue);
  }, [initialValue]);

  const visibleGrades = useMemo(
    () =>
      form.grades
        .map((grade, index) => ({ grade, index }))
        .filter(({ grade }) => {
          if (periodFilter === "all") return true;
          const period = grade.period ?? extractPeriodFromLabel(grade.label);
          return period === Number(periodFilter);
        }),
    [form.grades, periodFilter],
  );

  const scopedGrades = useMemo(
    () =>
      periodFilter === "all"
        ? form.grades
        : visibleGrades.map(({ grade }) => grade),
    [form.grades, visibleGrades, periodFilter],
  );

  const gradeValues = scopedGrades.map((grade) => toNum(grade.value) ?? null);
  const autoPromedio = computeAverage(gradeValues);
  const promedioGlobal = computeAverage(
    form.grades.map((grade) => toNum(grade.value) ?? null),
  );
  const notaFinalDisplayed = autoPromedio;
  const periodFromFilter = periodFilter === "all" ? null : Number(periodFilter);
  const currentPeriodAbsences =
    periodFromFilter != null ? form.periodAbsences[periodFromFilter] : null;
  const totals = getAbsenceTotalsFromMap(form.periodAbsences);
  const totalAbs = totals.justificadas + totals.injustificadas;
  const periodAbsJustified = currentPeriodAbsences
    ? toNonNegativeInt(Number(currentPeriodAbsences.justificadas))
    : 0;
  const periodAbsUnjustified = currentPeriodAbsences
    ? toNonNegativeInt(Number(currentPeriodAbsences.injustificadas))
    : 0;
  const periodAbsTotal = periodAbsJustified + periodAbsUnjustified;
  const canEditPeriodAbsences = !disabled && periodFromFilter != null;

  const iconBg =
    notaFinalDisplayed == null
      ? "bg-slate-100"
      : notaFinalDisplayed >= 4.0
      ? "bg-emerald-100"
      : notaFinalDisplayed >= 3.0
      ? "bg-amber-100"
      : "bg-red-100";

  const iconColor =
    notaFinalDisplayed == null
      ? "text-slate-400"
      : notaFinalDisplayed >= 4.0
      ? "text-emerald-600"
      : notaFinalDisplayed >= 3.0
      ? "text-amber-500"
      : "text-red-500";

  const addGrade = () =>
    setForm((prev) => ({
      ...prev,
      grades: [
        ...prev.grades,
        {
          label: getLabelForNewGrade(prev.grades, periodFilter),
          value: "",
          period: periodFilter === "all" ? 1 : Number(periodFilter),
        },
      ],
    }));

  const removeGrade = (index: number) =>
    setForm((prev) => ({
      ...prev,
      grades: prev.grades.filter((_, i) => i !== index),
    }));

  const updateGrade = (
    index: number,
    field: "label" | "value" | "period",
    val: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      grades: prev.grades.map((g, i) =>
        i === index
          ? {
              ...g,
              [field]: field === "period" ? (val ? Number(val) : null) : val,
            }
          : g,
      ),
    }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Cabecera */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <FiBook className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{subjectName}</span>
            {disabled && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Solo lectura
              </span>
            )}
            {form.grades.length > 0 && (
              <span className="text-xs text-slate-400">
                {periodFilter === "all"
                  ? `${form.grades.length} nota(s)`
                  : `${visibleGrades.length} nota(s) en ${getPeriodFilterLabel(periodFilter)}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
            {notaFinalDisplayed != null ? (
              <span className={`font-semibold ${gradeColor(notaFinalDisplayed)}`}>
                {notaFinalDisplayed.toFixed(2)} · {gradeLabel(notaFinalDisplayed)}
              </span>
            ) : null}
            {periodFromFilter != null ? (
              periodAbsTotal > 0 ? (
                <span className="text-amber-500">
                  {periodAbsTotal} ausencias en {getPeriodFilterLabel(periodFilter)}
                </span>
              ) : (
                <span className="text-slate-400">Sin ausencias en {getPeriodFilterLabel(periodFilter)}</span>
              )
            ) : totalAbs > 0 ? (
              <span className="text-amber-500">{totalAbs} ausencias</span>
            ) : null}
            {notaFinalDisplayed == null && form.grades.length === 0 && (
              <span>Sin registros aún</span>
            )}
          </div>
        </div>
        {notaFinalDisplayed != null && (
          <span
            className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${gradeBadgeClass(notaFinalDisplayed)}`}
          >
            {gradeLabel(notaFinalDisplayed)}
          </span>
        )}
        {expanded ? (
          <FiChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <FiChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <form
          onSubmit={(e) => void onSave(subjectId, form, e)}
          className="px-5 pb-5 pt-4 border-t border-slate-100 space-y-5"
        >
          {/* ── Notas dinámicas ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Notas (escala 0–5)
              </p>
              {!disabled && (
                <button
                  type="button"
                  onClick={addGrade}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Agregar nota
                </button>
              )}
            </div>

            {form.grades.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                No hay notas.{!disabled ? " Haz clic en «Agregar nota»." : ""}
              </p>
            )}

            {visibleGrades.length === 0 && (
              <p className="text-xs text-slate-400 italic mb-2">
                No hay notas visibles para el periodo seleccionado.
              </p>
            )}

            <div className="space-y-2">
              {visibleGrades.map(({ grade, index }) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
                    value={grade.period ?? ""}
                    onChange={(e) => updateGrade(index, "period", e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">Sin periodo</option>
                    <option value="1">Periodo 1</option>
                    <option value="2">Periodo 2</option>
                    <option value="3">Periodo 3</option>
                    <option value="4">Periodo 4</option>
                  </select>
                  <input
                    type="text"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
                    placeholder="Ej: Parcial 1, Periodo 2, Quiz..."
                    value={grade.label}
                    onChange={(e) => updateGrade(index, "label", e.target.value)}
                    disabled={disabled}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={5}
                    className={`w-24 rounded-xl border px-3 py-2 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60 transition-colors ${
                      toNum(grade.value) == null
                        ? "border-slate-200 bg-slate-50"
                        : (toNum(grade.value) ?? 0) >= 4.0
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : (toNum(grade.value) ?? 0) >= 3.0
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }`}
                    placeholder="0.00"
                    value={grade.value}
                    onChange={(e) => updateGrade(index, "value", e.target.value)}
                    disabled={disabled}
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeGrade(index)}
                      className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center text-red-400 flex-shrink-0"
                    >
                      <FiMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Promedio calculado automáticamente */}
            {scopedGrades.length > 1 && (
              <div
                className={`mt-3 rounded-xl px-4 py-3 flex items-center justify-between ${
                  autoPromedio == null
                    ? "bg-slate-50 border border-slate-200"
                    : autoPromedio >= 4.0
                    ? "bg-emerald-50 border border-emerald-200"
                    : autoPromedio >= 3.0
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div>
                  <p className="text-xs text-slate-500">
                    {periodFilter === "all"
                      ? "Promedio automático"
                      : `Promedio automático de ${getPeriodFilterLabel(periodFilter)}`}
                  </p>
                  <p className={`text-xl font-black mt-0.5 ${gradeColor(autoPromedio)}`}>
                    {autoPromedio != null ? autoPromedio.toFixed(2) : "—"}
                  </p>
                </div>
                {autoPromedio != null && (
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${gradeBadgeClass(autoPromedio)}`}
                  >
                    {gradeLabel(autoPromedio)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Nota final automatica ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
              {periodFilter === "all"
                ? "Nota final (automática)"
                : `Promedio de ${getPeriodFilterLabel(periodFilter)} (automático)`}
            </p>
            <div
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                notaFinalDisplayed == null
                  ? "border-slate-200 bg-slate-50 text-slate-500"
                  : notaFinalDisplayed >= 4.0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : notaFinalDisplayed >= 3.0
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {notaFinalDisplayed != null ? notaFinalDisplayed.toFixed(2) : "Sin notas para calcular"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {periodFilter === "all"
                ? "Se calcula automáticamente con todas las notas registradas y no es editable."
                : `Vista filtrada en ${getPeriodFilterLabel(periodFilter)}. La nota final general al guardar se calcula con todos los periodos.`}
            </p>
            {periodFilter !== "all" && promedioGlobal != null && (
              <p className="text-[11px] text-slate-500 mt-1">
                Nota final general actual: {promedioGlobal.toFixed(2)}
              </p>
            )}
          </div>

          {/* ── Inasistencias ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Inasistencias en esta materia
            </p>
            {periodFromFilter == null && (
              <p className="text-xs text-slate-500 mb-2">
                Selecciona un periodo para editar inasistencias individuales por periodo.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Justificadas</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60"
                  value={
                    periodFromFilter != null
                      ? form.periodAbsences[periodFromFilter]?.justificadas ?? "0"
                      : String(totals.justificadas)
                  }
                  onChange={(e) =>
                    setForm((prev) => {
                      if (periodFromFilter == null) return prev;
                      return {
                        ...prev,
                        periodAbsences: {
                          ...prev.periodAbsences,
                          [periodFromFilter]: {
                            ...prev.periodAbsences[periodFromFilter],
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
                <label className="text-xs text-slate-500 mb-1 block">Injustificadas</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-60"
                  value={
                    periodFromFilter != null
                      ? form.periodAbsences[periodFromFilter]?.injustificadas ?? "0"
                      : String(totals.injustificadas)
                  }
                  onChange={(e) =>
                    setForm((prev) => {
                      if (periodFromFilter == null) return prev;
                      return {
                        ...prev,
                        periodAbsences: {
                          ...prev.periodAbsences,
                          [periodFromFilter]: {
                            ...prev.periodAbsences[periodFromFilter],
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
            {(periodFromFilter != null ? periodAbsTotal : totalAbs) > 0 && (
              <p className="text-xs mt-1.5 text-slate-500">
                Total {periodFromFilter != null ? `en ${getPeriodFilterLabel(periodFilter)}` : "general"}:{" "}
                <span
                  className={
                    (periodFromFilter != null ? periodAbsTotal : totalAbs) >= 5
                      ? "font-bold text-red-500"
                      : "font-semibold text-amber-500"
                  }
                >
                  {periodFromFilter != null ? periodAbsTotal : totalAbs} inasistencias
                </span>
                {(periodFromFilter != null ? periodAbsTotal : totalAbs) >= 5 && (
                  <span className="ml-1 text-red-400"> — nivel de alerta</span>
                )}
              </p>
            )}
          </div>

          {/* ── Observaciones ── */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Observaciones pedagógicas</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              rows={2}
              placeholder="Observaciones sobre el desempeño del estudiante en esta materia..."
              value={form.observaciones}
              onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
              disabled={disabled}
            />
          </div>

          {!disabled && (
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm"
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
