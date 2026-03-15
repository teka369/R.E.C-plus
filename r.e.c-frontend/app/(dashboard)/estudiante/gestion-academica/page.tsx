"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  performanceApi,
  type GradeEntry,
  type StudentAcademicRecord,
  type StudentAcademicResponse,
} from "@/lib/performanceApi";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBook,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiMinus,
  FiPlus,
  FiTrendingUp,
  FiZap,
} from "react-icons/fi";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function extractPeriodFromLabel(label: string): number | null {
  const match = label.match(/(?:periodo|parcial)\s*(\d+)/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isNaN(n) ? null : n;
}

function getGradePeriod(entry: GradeEntry): number | null {
  return normalizePeriod((entry as { period?: unknown }).period) ?? extractPeriodFromLabel(entry.label);
}

function toNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) return 0;
  return Math.trunc(value);
}

function getPeriodFilterLabel(periodFilter: string): string {
  return periodFilter === "all" ? "Todos los periodos" : `Periodo ${periodFilter}`;
}

function getRecordPeriodAverage(record: StudentAcademicRecord, periodFilter: string): number | null {
  if (periodFilter === "all") {
    return record.notaFinal ?? record.promedioMateria;
  }

  const period = Number(periodFilter);
  const fromJson = parseGradesJson(record.gradesJson)
    .filter((entry) => getGradePeriod(entry) === period)
    .map((entry) => entry.value);

  const jsonAverage = computeAverage(fromJson);
  if (jsonAverage != null) return jsonAverage;

  if (period === 1) return record.parcial1;
  if (period === 2) return record.parcial2;
  if (period === 3) return record.parcial3;
  if (period === 4) return record.parcial4;
  return null;
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

  const period = Number(periodFilter);
  const selected = byPeriod.get(period);
  if (selected) return selected;
  return { justificadas: 0, injustificadas: 0 };
}

function getProgressFromGrades(grades: GradeEntry[]): number {
  if (grades.length === 0) return 0;
  const withValue = grades.filter((grade) => grade.value != null).length;
  return Math.round((withValue / grades.length) * 100);
}

function computeAverage(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (!valid.length) return null;
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EstudianteGestionAcademicaPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentAcademicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  useEffect(() => {
    const run = async () => {
      const studentId = Number(user?.id);
      if (!studentId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await performanceApi.getStudentAcademic(studentId);
        setData(response);
      } catch {
        setError("No se pudo cargar tu gestión académica");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  const records = useMemo(() => data?.records ?? [], [data?.records]);
  const totalAbsences = useMemo(() => {
    if (!records.length) return 0;
    return records.reduce((acc, record) => {
      const abs = getRecordAbsences(record, periodFilter);
      return acc + abs.justificadas + abs.injustificadas;
    }, 0);
  }, [records, periodFilter]);

  const promedioFiltrado = useMemo(
    () => computeAverage(records.map((record) => getRecordPeriodAverage(record, periodFilter))),
    [records, periodFilter],
  );

  const materiasConRegistroFiltradas = useMemo(
    () => records.filter((record) => getRecordPeriodAverage(record, periodFilter) != null).length,
    [records, periodFilter],
  );

  const periodProgress = useMemo(() => {
    if (!records.length) return 0;
    return Math.round((materiasConRegistroFiltradas / records.length) * 100);
  }, [materiasConRegistroFiltradas, records.length]);

  const atRisk =
    data != null &&
    ((promedioFiltrado != null && promedioFiltrado < 3.0) ||
      (periodFilter === "all" && totalAbsences >= 8));

  return (
    <section className="space-y-5">
      {/* ── Header ── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 75% 40%, white 0%, transparent 60%)" }}
        />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiBook className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mi Gestión Académica</h1>
            <p className="text-indigo-100 text-sm mt-0.5">
              Consulta tus notas, simula escenarios y monitorea tu progreso por materia
            </p>
          </div>
        </div>
      </header>

      {loading && (
        <div className="rounded-xl bg-white border border-slate-200 p-6 sm:p-8 text-center text-sm text-slate-500">
          Cargando información académica...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── Alerta de riesgo ── */}
          {atRisk && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Alerta académica</p>
                <p className="text-red-500 text-xs mt-0.5">
                  {periodFilter === "all"
                    ? "Tu promedio o número de inasistencias requieren atención. Habla con tu director de grupo."
                    : "Tu promedio en el periodo seleccionado requiere atención. Habla con tu director de grupo."}
                </p>
              </div>
            </div>
          )}

          {/* ── KPI cards ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <label className="block max-w-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 block">
                Filtro por periodo
              </span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryKpi
              icon={<FiBarChart2 className="w-5 h-5 text-indigo-500" />}
              bg="bg-indigo-50"
              value={
                promedioFiltrado != null
                  ? promedioFiltrado.toFixed(2)
                  : "—"
              }
              label={
                periodFilter === "all"
                  ? "Promedio general"
                  : `Promedio ${getPeriodFilterLabel(periodFilter).toLowerCase()}`
              }
              extra={
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gradeBadgeClass(promedioFiltrado)}`}
                >
                  {gradeLabel(promedioFiltrado)}
                </span>
              }
            />
            <SummaryKpi
              icon={<FiBook className="w-5 h-5 text-blue-500" />}
              bg="bg-blue-50"
              value={String(materiasConRegistroFiltradas)}
              label={
                periodFilter === "all"
                  ? "Materias registradas"
                  : `Materias con notas en ${getPeriodFilterLabel(periodFilter).toLowerCase()}`
              }
              extra={null}
            />
            <SummaryKpi
              icon={<FiTrendingUp className="w-5 h-5 text-emerald-500" />}
              bg="bg-emerald-50"
              value={`${periodProgress}%`}
              label={
                periodFilter === "all"
                  ? "Progreso académico"
                  : `Progreso ${getPeriodFilterLabel(periodFilter).toLowerCase()}`
              }
              extra={
                <span className="text-xs text-slate-400">
                  {materiasConRegistroFiltradas}/{records.length || 0} materias con notas
                </span>
              }
            />
            <SummaryKpi
              icon={<FiCalendar className="w-5 h-5 text-amber-500" />}
              bg="bg-amber-50"
              value={String(totalAbsences)}
              label={
                periodFilter === "all"
                  ? "Inasistencias totales"
                  : `Inasistencias ${getPeriodFilterLabel(periodFilter).toLowerCase()}`
              }
              extra={
                totalAbsences > 0 ? (
                  <span className="text-xs text-slate-400">
                    {records.reduce((acc, record) => acc + getRecordAbsences(record, periodFilter).justificadas, 0)}J /{" "}
                    {records.reduce((acc, record) => acc + getRecordAbsences(record, periodFilter).injustificadas, 0)}I
                  </span>
                ) : null
              }
            />
          </div>

          {/* ── Info del grupo ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white flex-shrink-0">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">
                Grupo asignado
              </p>
              <p className="text-sm font-bold text-slate-800">
                {data.group.grade.nombre} – {data.group.nombre}
              </p>
            </div>
          </div>

          {/* ── Tarjetas por materia ── */}
          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center text-sm text-slate-500">
                Aún no hay registros académicos cargados por tus docentes.
              </div>
            ) : (
              records.map((record) => (
                <StudentSubjectCard key={record.id} record={record} periodFilter={periodFilter} />
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryKpi({
  icon,
  bg,
  value,
  label,
  extra,
}: {
  icon: ReactNode;
  bg: string;
  value: string;
  label: string;
  extra: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
      {extra && <div className="mt-1.5">{extra}</div>}
    </div>
  );
}

// ── Student Subject Card with dynamic grades + simulator ──────────────────────

type SimGrade = { label: string; value: string };

function StudentSubjectCard({
  record,
  periodFilter,
}: {
  record: StudentAcademicRecord;
  periodFilter: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [simMode, setSimMode] = useState(false);
  const [simGrades, setSimGrades] = useState<SimGrade[]>([]);
  const [targetAvg, setTargetAvg] = useState("");

  // Parse real grades from gradesJson if available, else fall back to parcial1-4
  const realGrades: GradeEntry[] = useMemo(() => {
    const fromJson = parseGradesJson(record.gradesJson);
    if (fromJson.length > 0) return fromJson;
    const legacy: GradeEntry[] = [];
    if (record.parcial1 != null) legacy.push({ label: "Parcial 1", value: record.parcial1 });
    if (record.parcial2 != null) legacy.push({ label: "Parcial 2", value: record.parcial2 });
    if (record.parcial3 != null) legacy.push({ label: "Parcial 3", value: record.parcial3 });
    if (record.parcial4 != null) legacy.push({ label: "Parcial 4", value: record.parcial4 });
    return legacy;
  }, [record]);

  const visibleRealGrades = useMemo(() => {
    if (periodFilter === "all") return realGrades;
    const period = Number(periodFilter);
    return realGrades.filter((grade) => getGradePeriod(grade) === period);
  }, [realGrades, periodFilter]);

  // When entering sim mode, clone real grades into editable state
  const enterSimMode = () => {
    setSimGrades(
      visibleRealGrades.map((g) => ({ label: g.label, value: g.value == null ? "" : String(g.value) })),
    );
    setTargetAvg("");
    setSimMode(true);
  };

  const exitSimMode = () => {
    setSimMode(false);
    setSimGrades([]);
    setTargetAvg("");
  };

  const toNum = (v: string) => {
    const n = Number(v.trim());
    return Number.isNaN(n) || v.trim() === "" ? null : n;
  };

  // Computed values
  const realAvg = computeAverage(visibleRealGrades.map((g) => g.value));
  const nota = realAvg;
  const progreso = useMemo(() => {
    if (periodFilter === "all") {
      if (record.progresoMateria != null) return record.progresoMateria;
      return getProgressFromGrades(realGrades);
    }
    return getProgressFromGrades(visibleRealGrades);
  }, [periodFilter, realGrades, record.progresoMateria, visibleRealGrades]);
  const absences = useMemo(
    () => getRecordAbsences(record, periodFilter),
    [record, periodFilter],
  );

  const simValues = simGrades.map((g) => toNum(g.value));
  const simAvg = computeAverage(simValues);

  // "How much do I need?": find the grade needed in 1 new note to reach targetAvg
  const neededGrade = useMemo(() => {
    const target = toNum(targetAvg);
    if (target == null || simGrades.length === 0) return null;
    const vals = simGrades.map((g) => toNum(g.value)).filter((v): v is number => v != null);
    const n = vals.length;
    const needed = target * (n + 1) - vals.reduce((a, b) => a + b, 0);
    return Number(needed.toFixed(2));
  }, [targetAvg, simGrades]);

  const totalAbs = absences.justificadas + absences.injustificadas;

  const iconBg =
    nota == null ? "bg-slate-100" : nota >= 4.0 ? "bg-emerald-100" : nota >= 3.0 ? "bg-amber-100" : "bg-red-100";
  const iconColor =
    nota == null ? "text-slate-400" : nota >= 4.0 ? "text-emerald-600" : nota >= 3.0 ? "text-amber-500" : "text-red-500";
  const notaFinalBg =
    nota == null
      ? "bg-slate-50 border-slate-200"
      : nota >= 4.0
      ? "bg-emerald-50 border-emerald-200"
      : nota >= 3.0
      ? "bg-amber-50 border-amber-200"
      : "bg-red-50 border-red-200";

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
          <p className="text-sm font-semibold text-slate-900">{record.subject.nombre}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
            {nota != null ? (
              <span className={`font-semibold ${gradeColor(nota)}`}>
                {nota.toFixed(2)} · {gradeLabel(nota)}
              </span>
            ) : (
              <span>Sin nota aún</span>
            )}
            {progreso != null && <span>{progreso}% completado</span>}
            {totalAbs > 0 && <span className="text-amber-500">{totalAbs} ausencias</span>}
          </div>
        </div>
        {nota != null && (
          <span
            className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${gradeBadgeClass(nota)}`}
          >
            {gradeLabel(nota)}
          </span>
        )}
        {expanded ? (
          <FiChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <FiChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {/* Barra de progreso */}
      {progreso != null && (
        <div className="h-1 bg-slate-100">
          <div
            className={`h-full transition-all duration-500 ${
              progreso >= 80 ? "bg-emerald-400" : progreso >= 50 ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${Math.min(progreso, 100)}%` }}
          />
        </div>
      )}

      {/* Detalle expandible */}
      {expanded && (
        <div className="px-5 pb-5 pt-4 border-t border-slate-100 space-y-4">
          {/* ── Notas reales ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Mis notas
            </p>
            {visibleRealGrades.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                {periodFilter === "all"
                  ? "Aún no hay notas registradas."
                  : `No hay notas registradas en ${getPeriodFilterLabel(periodFilter).toLowerCase()}.`}
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {visibleRealGrades.map((grade, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center"
                  >
                    <p className="text-xs text-slate-400 mb-1 truncate">{grade.label}</p>
                    <p className={`text-lg font-bold ${gradeColor(grade.value)}`}>
                      {grade.value != null ? Number(grade.value).toFixed(2) : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Nota final + Progreso ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 text-center ${notaFinalBg}`}>
              <p className="text-xs mb-1 text-slate-500">
                {periodFilter === "all"
                  ? "Nota final"
                  : `Promedio ${getPeriodFilterLabel(periodFilter).toLowerCase()}`}
              </p>
              <p className={`text-2xl font-black ${gradeColor(nota)}`}>
                {nota != null ? nota.toFixed(2) : "—"}
              </p>
              <p className={`text-xs font-semibold mt-0.5 ${gradeColor(nota)}`}>
                {gradeLabel(nota)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs text-slate-400 mb-1">Progreso</p>
              <p className="text-2xl font-bold text-slate-700">
                {progreso != null ? `${progreso}%` : "—"}
              </p>
              {progreso != null && (
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progreso >= 80 ? "bg-emerald-400" : progreso >= 50 ? "bg-amber-400" : "bg-red-400"
                    }`}
                    style={{ width: `${Math.min(progreso, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Inasistencias ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Inasistencias{periodFilter !== "all" ? " (globales)" : ""}
            </p>
            {periodFilter !== "all" && (
              <p className="text-xs text-slate-500 mb-2">
                Las inasistencias no se separan por periodo y se muestran como acumulado general de la materia.
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                <p className="text-xs text-slate-400 mb-1">Justificadas</p>
                <p className="text-xl font-bold text-amber-600">
                  {absences.justificadas}
                </p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                <p className="text-xs text-slate-400 mb-1">Injustificadas</p>
                <p className="text-xl font-bold text-red-500">
                  {absences.injustificadas}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-xs text-slate-400 mb-1">Total</p>
                <p
                  className={`text-xl font-bold ${totalAbs >= 5 ? "text-red-500" : "text-slate-700"}`}
                >
                  {totalAbs}
                </p>
              </div>
            </div>
          </div>

          {/* ── Observaciones ── */}
          {record.observaciones && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 mb-1">
                Observaciones del docente
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {record.observaciones}
              </p>
            </div>
          )}

          {/* ── Simulador de notas ── */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <FiZap className="w-4 h-4 text-indigo-500" />
                <p className="text-sm font-semibold text-indigo-700">Simulador de notas</p>
              </div>
              {!simMode ? (
                <button
                  type="button"
                  onClick={enterSimMode}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors"
                >
                  Simular
                </button>
              ) : (
                <button
                  type="button"
                  onClick={exitSimMode}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 transition-colors"
                >
                  Salir del simulador
                </button>
              )}
            </div>

            {simMode && (
              <div className="px-4 pb-4 space-y-4 border-t border-indigo-100 pt-3">
                <p className="text-xs text-indigo-600">
                  Modifica los valores o agrega notas hipotéticas para ver cómo afectaría tu promedio.{" "}
                  <span className="font-semibold">No se guardan cambios.</span>
                </p>

                {/* Lista de notas del simulador */}
                <div className="space-y-2">
                  {simGrades.map((g, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 flex-1 truncate min-w-0">{g.label}</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={5}
                        className={`w-24 rounded-xl border px-3 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors ${
                          toNum(g.value) == null
                            ? "border-slate-200 bg-white"
                            : (toNum(g.value) ?? 0) >= 4.0
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : (toNum(g.value) ?? 0) >= 3.0
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-red-200 bg-red-50 text-red-600"
                        }`}
                        value={g.value}
                        onChange={(e) =>
                          setSimGrades((prev) =>
                            prev.map((item, idx) =>
                              idx === i ? { ...item, value: e.target.value } : item,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSimGrades((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-400"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Agregar nota hipotética */}
                <button
                  type="button"
                  onClick={() =>
                    setSimGrades((prev) => [
                      ...prev,
                      { label: `Nota hipotética ${prev.length + 1}`, value: "" },
                    ])
                  }
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Agregar nota hipotética
                </button>

                {/* Promedio simulado */}
                {simGrades.length > 0 && (
                  <div
                    className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
                      simAvg == null
                        ? "bg-white border-slate-200"
                        : simAvg >= 4.0
                        ? "bg-emerald-50 border-emerald-200"
                        : simAvg >= 3.0
                        ? "bg-amber-50 border-amber-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div>
                      <p className="text-xs text-slate-500">Promedio simulado</p>
                      <p className={`text-2xl font-black mt-0.5 ${gradeColor(simAvg)}`}>
                        {simAvg != null ? simAvg.toFixed(2) : "—"}
                      </p>
                    </div>
                    {simAvg != null && (
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${gradeBadgeClass(simAvg)}`}
                      >
                        {gradeLabel(simAvg)}
                      </span>
                    )}
                  </div>
                )}

                {/* Calculadora: ¿Cuánto necesito? */}
                <div>
                  <p className="text-xs font-semibold text-indigo-700 mb-2">
                    ¿Cuánto necesito en la próxima nota para llegar a…?
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={5}
                      placeholder="Ej: 4.00"
                      className="w-28 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={targetAvg}
                      onChange={(e) => setTargetAvg(e.target.value)}
                    />
                    <span className="text-xs text-slate-500">promedio objetivo</span>
                  </div>
                  {neededGrade != null && (
                    <div
                      className={`mt-2 rounded-xl border px-4 py-2.5 ${
                        neededGrade > 5
                          ? "bg-red-50 border-red-200"
                          : neededGrade < 0
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      {neededGrade > 5 ? (
                        <p className="text-sm text-red-600 font-semibold">
                          No es posible alcanzar {targetAvg} con una sola nota (máximo 5.00).
                        </p>
                      ) : neededGrade < 0 ? (
                        <p className="text-sm text-emerald-600 font-semibold">
                          ¡Ya superaste ese promedio! No necesitas hacer nada más.
                        </p>
                      ) : (
                        <p className="text-sm text-slate-700">
                          Necesitas al menos{" "}
                          <span className={`font-black text-base ${gradeColor(neededGrade)}`}>
                            {neededGrade.toFixed(2)}
                          </span>{" "}
                          en tu próxima nota para llegar a{" "}
                          <span className="font-semibold">{targetAvg}</span>.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Última actualización:{" "}
            {new Date(record.updatedAt).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
