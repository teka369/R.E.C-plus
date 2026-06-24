"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import CompetencyBulletin from "@/components/estudiante/CompetencyBulletin";
import {
  performanceApi,
  type AcademicEvaluationGrade,
  type StudentAcademicRecord,
  type StudentAcademicResponse,
  type StudentEvaluationV2,
} from "@/lib/performanceApi";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBook,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiInfo,
  FiMinus,
  FiPlus,
  FiZap,
} from "react-icons/fi";

const COBERTURA_RESUMEN_ESTUDIANTE_TOOLTIP =
  "Porcentaje de tus materias con al menos una nota registrada en el corte seleccionado.";

const COBERTURA_MATERIA_TOOLTIP =
  "100%: esta materia tiene al menos una nota en el corte seleccionado. 0%: aún no hay notas registradas en ese corte.";

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

// ── Normalización evaluaciones (v2 title/grade/weight o v1 titulo/nota) ───────

type NormalizedEval = {
  title: string;
  grade: number;
  weight: number | null;
  termSlot: number | null;
  updatedAt?: string;
};

/** Evaluaciones para boletín COMPETENCY (respeta filtro de corte). */
function mapCompetencyEvaluations(
  record: StudentAcademicRecord,
  termSlotFilter: string,
): Array<{ titulo: string; competencyCategory: string | null; nota: number | null }> {
  const raw = record.evaluaciones ?? [];
  const out: Array<{ titulo: string; competencyCategory: string | null; nota: number | null }> = [];
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    let titulo: string;
    let nota: number | null;
    let termSlot: number | null = null;
    let competencyCategory: string | null = null;

    if ("grade" in e && typeof (e as { grade: unknown }).grade === "number") {
      const v = e as StudentEvaluationV2;
      titulo = v.title;
      nota = v.grade;
      termSlot = typeof v.termSlot === "number" ? v.termSlot : null;
      competencyCategory = v.competencyCategory ?? null;
    } else if ("nota" in e) {
      const v = e as AcademicEvaluationGrade;
      titulo = v.titulo;
      nota = typeof v.nota === "number" ? v.nota : null;
      termSlot =
        typeof v.termSlot === "number"
          ? v.termSlot
          : v.orden >= 1 && v.orden <= 4
            ? v.orden
            : null;
      competencyCategory = v.competencyCategory ?? null;
    } else continue;

    if (termSlotFilter !== "all") {
      const slot = Number(termSlotFilter);
      if (termSlot !== slot) continue;
    }
    out.push({ titulo, competencyCategory, nota });
  }
  return out;
}

function normalizeEvaluations(record: StudentAcademicRecord): NormalizedEval[] {
  const raw = record.evaluaciones ?? [];
  const out: NormalizedEval[] = [];
  for (const e of raw) {
    if (e && typeof e === "object" && "grade" in e && typeof (e as { grade: unknown }).grade === "number") {
      const v = e as StudentEvaluationV2;
      out.push({
        title: v.title,
        grade: v.grade,
        weight: v.weight ?? null,
        termSlot: typeof v.termSlot === "number" ? v.termSlot : null,
        updatedAt: v.updatedAt,
      });
      continue;
    }
    if (e && typeof e === "object" && "nota" in e) {
      const v = e as AcademicEvaluationGrade;
      if (typeof v.nota !== "number") continue;
      out.push({
        title: v.titulo,
        grade: v.nota,
        weight: v.porcentaje,
        termSlot:
          typeof v.termSlot === "number"
            ? v.termSlot
            : v.orden >= 1 && v.orden <= 4
              ? v.orden
              : null,
      });
    }
  }
  return out;
}

function computeAverage(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (!valid.length) return null;
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
}

/** Promedio ponderado si todas las notas tienen peso &gt; 0; si no, simple. */
function averageFromEvals(evals: NormalizedEval[]): number | null {
  if (!evals.length) return null;
  const withW = evals.filter((e) => e.weight != null && e.weight > 0);
  if (withW.length === evals.length) {
    let sum = 0;
    let wsum = 0;
    for (const e of withW) {
      const w = e.weight as number;
      sum += e.grade * w;
      wsum += w;
    }
    if (wsum > 0) return Number((sum / wsum).toFixed(2));
  }
  return computeAverage(evals.map((e) => e.grade));
}

function getRecordAbsences(record: StudentAcademicRecord): { justificadas: number; injustificadas: number } {
  return {
    justificadas: record.inasistenciasJustificadas ?? 0,
    injustificadas: record.inasistenciasInjustificadas ?? 0,
  };
}

function getTermSlotFilterLabel(termSlotFilter: string): string {
  return termSlotFilter === "all" ? "Todos los cortes" : `Corte ${termSlotFilter}`;
}

function getSubjectDisplayAverage(
  record: StudentAcademicRecord,
  termSlotFilter: string,
  evals: NormalizedEval[],
): number | null {
  if (termSlotFilter === "all") {
    return record.notaFinal ?? record.promedioMateria ?? averageFromEvals(evals);
  }
  const slot = Number(termSlotFilter);
  const inSlot = evals.filter((e) => e.termSlot === slot);
  if (inSlot.length > 0) return averageFromEvals(inSlot);
  return record.notaFinal ?? null;
}

function getRecordPeriodAverage(
  record: StudentAcademicRecord,
  termSlotFilter: string,
  evals: NormalizedEval[],
): number | null {
  return getSubjectDisplayAverage(record, termSlotFilter, evals);
}

function groupEvalsBySlot(evals: NormalizedEval[]): Map<number | "none", NormalizedEval[]> {
  const map = new Map<number | "none", NormalizedEval[]>();
  for (const e of evals) {
    const key: number | "none" =
      e.termSlot != null && e.termSlot >= 1 && e.termSlot <= 4 ? e.termSlot : "none";
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}

function formatEvalLine(ev: NormalizedEval): string {
  const parts = [ev.title];
  if (ev.weight != null && ev.weight > 0) {
    parts.push(`${ev.weight}%`);
  }
  parts.push(ev.grade.toFixed(2));
  return parts.join(" — ");
}

function gradeColor(value: number | null | undefined): string {
  if (value == null) return "text-rec-text-subtle";
  if (value >= 4.0) return "text-rec-primary";
  if (value >= 3.0) return "text-rec-warning-text";
  return "text-rec-danger-text";
}

function gradeBadgeClass(value: number | null | undefined): string {
  if (value == null) return "bg-rec-bg-muted text-rec-text-subtle";
  if (value >= 4.0) return "bg-rec-success-bg-muted text-rec-success-text";
  if (value >= 3.0) return "bg-rec-warning-bg text-rec-warning-text";
  return "bg-rec-danger-bg-strong text-rec-danger-text";
}

function gradeLabel(value: number | null | undefined): string {
  if (value == null) return "Sin nota";
  if (value >= 4.0) return "Aprobado";
  if (value >= 3.0) return "Suficiente";
  return "En riesgo";
}

/** Misma regla que en vista docente: evaluación en el corte o nota final (en “todos”). */
function recordCountsForProgress(record: StudentAcademicRecord, termSlotFilter: string): boolean {
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

function subjectCoveragePercent(record: StudentAcademicRecord, termSlotFilter: string): number {
  return recordCountsForProgress(record, termSlotFilter) ? 100 : 0;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EstudianteGestionAcademicaPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentAcademicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termSlotFilter, setTermSlotFilter] = useState<string>("all");

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

  const termSlotsAvailable = useMemo(
    () => data?.termSlotsAvailable ?? data?.simulatorInputs?.termSlotsAvailable ?? [1, 2, 3, 4],
    [data?.termSlotsAvailable, data?.simulatorInputs?.termSlotsAvailable],
  );

  const slotsWithData = useMemo(() => new Set(termSlotsAvailable), [termSlotsAvailable]);

  const gradeScaleMax = data?.simulatorInputs?.gradeScaleMax ?? 5;
  const passingThreshold = data?.simulatorInputs?.passingThreshold ?? 3;

  const recordsWithEvals = useMemo(
    () => records.map((r) => ({ record: r, evals: normalizeEvaluations(r) })),
    [records],
  );

  const totalAbsences = useMemo(() => {
    if (!records.length) return 0;
    return records.reduce((acc, record) => {
      const abs = getRecordAbsences(record);
      return acc + abs.justificadas + abs.injustificadas;
    }, 0);
  }, [records]);

  const promedioFiltrado = useMemo(
    () =>
      computeAverage(
        recordsWithEvals.map(({ record, evals }) => getRecordPeriodAverage(record, termSlotFilter, evals)),
      ),
    [recordsWithEvals, termSlotFilter],
  );

  const materiasConRegistroFiltradas = useMemo(
    () => recordsWithEvals.filter(({ record }) => recordCountsForProgress(record, termSlotFilter)).length,
    [recordsWithEvals, termSlotFilter],
  );

  const periodProgress = useMemo(() => {
    if (!records.length) return 0;
    return Math.round((materiasConRegistroFiltradas / records.length) * 100);
  }, [materiasConRegistroFiltradas, records.length]);

  const atRisk =
    data != null &&
    ((promedioFiltrado != null && promedioFiltrado < passingThreshold) ||
      (termSlotFilter === "all" && totalAbsences >= 8));

  const globalPromedio = data?.summary.promedioGeneral;
  const globalPassing =
    globalPromedio != null && globalPromedio >= passingThreshold;

  const isCompetencyMode = data?.gradingMode === "COMPETENCY";

  return (
    <section className="space-y-5">
      <header
        id="tour-est-ges-header"
        className="rounded-2xl border p-4 sm:p-6 text-rec-text-on-media"
        style={{
          borderColor: "var(--rec-soft)",
          background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-12 h-12 bg-rec-bg-elevated/20 rounded-xl flex items-center justify-center shrink-0">
            <FiBook className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">Mi Gestión Académica</h1>
            <p className="text-sm mt-0.5 text-rec-text-on-media/90">
              Notas por corte, simulador con tu escala institucional y seguimiento por materia.
            </p>
            {data?.academicPeriod != null && (
              <p className="text-sm text-rec-text-on-media/90 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-rec-text-on-media/75">Ciclo académico:</span>
                <span className="font-semibold">{data.academicPeriod.nombre}</span>
                {data.academicPeriod.codigo ? (
                  <span className="text-rec-text-on-media/80">({data.academicPeriod.codigo})</span>
                ) : null}
                {data.academicPeriod.estado === "CLOSED" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rec-bg-elevated/20 text-rec-text-on-media border border-rec-text-on-media/30">
                    Período cerrado
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </header>

      {loading && (
        <div className="rounded-xl bg-rec-bg-elevated border border-rec-border-default p-6 sm:p-8 text-center text-sm text-rec-text-subtle">
          Cargando información académica...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rec-danger-border bg-rec-danger-bg px-4 py-3 text-sm text-rec-danger-text">
          <FiAlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {atRisk && (
            <div className="flex items-start gap-3 rounded-xl bg-rec-danger-bg border border-rec-danger-border px-4 py-3 text-sm text-rec-danger-text">
              <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Alerta académica</p>
                <p className="text-rec-danger-text text-xs mt-0.5">
                  {termSlotFilter === "all"
                    ? "Tu promedio o número de inasistencias requieren atención. Habla con tu director de grupo."
                    : "Tu promedio en el corte seleccionado requiere atención. Habla con tu director de grupo."}
                </p>
              </div>
            </div>
          )}

          <div id="tour-est-ges-controls" className="bg-rec-bg-elevated rounded-2xl border border-rec-border-default shadow-sm p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle mb-2 block">
                  Corte (filtro)
                </span>
                <select
                  className="w-full rounded-xl border border-rec-border-default bg-rec-bg-base px-4 py-2.5 text-sm font-medium text-rec-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--rec-primary)]"
                  value={termSlotFilter}
                  onChange={(e) => setTermSlotFilter(e.target.value)}
                >
                  <option value="all">Todos los cortes</option>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={String(n)}>
                      Corte {n}
                      {slotsWithData.has(n) ? " · con datos" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle mb-2">
                  Ciclo académico
                </p>
                {data.academicPeriod == null ? (
                  <p className="text-sm text-rec-warning-text font-medium">
                    No hay período académico activo. Consulta en Secretaría.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-rec-text-primary">{data.academicPeriod.nombre}</span>
                    {data.academicPeriod.codigo ? (
                      <span className="text-xs text-rec-text-subtle">({data.academicPeriod.codigo})</span>
                    ) : null}
                    {data.academicPeriod.estado === "CLOSED" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rec-warning-bg text-rec-warning-text border border-rec-warning-border">
                        Período cerrado
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-rec-border-subtle pt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-rec-text-muted">
                Escala: <span className="font-semibold text-rec-text-primary">0 – {gradeScaleMax}</span>
              </span>
              <span className="text-rec-text-muted">
                Aprobación: mínimo{" "}
                <span className="font-semibold text-rec-text-primary">{passingThreshold.toFixed(2)}</span>
              </span>
              {globalPassing ? (
                <span className="text-rec-success-text font-semibold flex items-center gap-1">
                  <FiCheckCircle className="w-4 h-4" />
                  ¡Ya tienes promedio aprobatorio!
                </span>
              ) : globalPromedio != null ? (
                <span className="text-rec-text-subtle text-xs">
                  Promedio general actual: {globalPromedio.toFixed(2)}
                </span>
              ) : null}
            </div>
          </div>

          <div id="tour-est-ges-kpis" className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryKpi
              icon={<FiBarChart2 className="w-5 h-5 text-rec-text-secondary" />}
              bg="bg-rec-bg-muted"
              value={promedioFiltrado != null ? promedioFiltrado.toFixed(2) : "—"}
              label={
                termSlotFilter === "all"
                  ? "Promedio general"
                  : `Promedio ${getTermSlotFilterLabel(termSlotFilter).toLowerCase()}`
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
              icon={<FiBook className="w-5 h-5 text-rec-info-text" />}
              bg="bg-rec-info-bg"
              value={String(materiasConRegistroFiltradas)}
              label={
                termSlotFilter === "all"
                  ? "Materias con nota"
                  : `Materias con nota en ${getTermSlotFilterLabel(termSlotFilter).toLowerCase()}`
              }
              extra={null}
            />
            <SummaryKpi
              icon={<FiGrid className="w-5 h-5 text-rec-info-text" />}
              bg="bg-rec-info-bg"
              value={`${periodProgress}%`}
              label={
                termSlotFilter === "all"
                  ? "Cobertura de notas"
                  : `Cobertura ${getTermSlotFilterLabel(termSlotFilter).toLowerCase()}`
              }
              labelTooltip={COBERTURA_RESUMEN_ESTUDIANTE_TOOLTIP}
              extra={
                <span className="text-xs text-rec-text-subtle">
                  {materiasConRegistroFiltradas}/{records.length || 0} materias ·{" "}
                  {getTermSlotFilterLabel(termSlotFilter)}
                </span>
              }
            />
            <SummaryKpi
              icon={<FiCalendar className="w-5 h-5 text-rec-warning-text" />}
              bg="bg-rec-warning-bg"
              value={String(totalAbsences)}
              label="Inasistencias (materia)"
              extra={
                totalAbsences > 0 ? (
                  <span className="text-xs text-rec-text-subtle">
                    {records.reduce((acc, record) => acc + getRecordAbsences(record).justificadas, 0)}J /{" "}
                    {records.reduce((acc, record) => acc + getRecordAbsences(record).injustificadas, 0)}I
                  </span>
                ) : null
              }
            />
          </div>

          <div id="tour-est-ges-grupo" className="bg-rec-bg-elevated rounded-2xl border border-rec-border-default shadow-sm px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--rec-primary)] to-[var(--rec-primary-strong)] flex items-center justify-center text-rec-text-on-media shrink-0">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-rec-text-subtle uppercase font-semibold tracking-wide">Grupo asignado</p>
              <p className="text-sm font-bold text-rec-text-primary">
                {data.group.grade.nombre} – {data.group.nombre}
              </p>
            </div>
          </div>

          <div id="tour-est-ges-materias" className="space-y-3">
            {records.length === 0 ? (
              <div className="bg-rec-bg-elevated rounded-2xl border border-rec-border-default p-6 sm:p-8 text-center text-sm text-rec-text-subtle">
                Aún no hay registros académicos cargados por tus docentes.
              </div>
            ) : isCompetencyMode ? (
              <CompetencyBulletin
                subjects={records.map((record) => ({
                  subjectName: record.subject.nombre,
                  evaluations: mapCompetencyEvaluations(record, termSlotFilter),
                  notaFinal: record.notaFinal,
                  passingThreshold,
                }))}
                competencyWeights={data.competencyWeights ?? {}}
                gradePeriodName={data.academicPeriod?.nombre}
                gradeScaleMax={gradeScaleMax}
              />
            ) : (
              records.map((record) => (
                <StudentSubjectCard
                  key={record.id}
                  record={record}
                  termSlotFilter={termSlotFilter}
                  termSlotsAvailable={termSlotsAvailable}
                  gradeScaleMax={gradeScaleMax}
                  passingThreshold={passingThreshold}
                />
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
  labelTooltip,
}: {
  icon: ReactNode;
  bg: string;
  value: string;
  label: string;
  extra: ReactNode;
  labelTooltip?: string;
}) {
  return (
    <div className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-rec-text-primary">{value}</p>
      <p className="text-xs font-semibold text-rec-text-muted mt-0.5 flex items-center gap-1 flex-wrap">
        <span>{label}</span>
        {labelTooltip ? (
          <InfoTooltip text={labelTooltip}>
            <span
              className="inline-flex rounded-full p-0.5 text-rec-text-subtle hover:text-rec-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--rec-primary)]"
              aria-label="Más información"
            >
              <FiInfo className="w-3.5 h-3.5" />
            </span>
          </InfoTooltip>
        ) : null}
      </p>
      {extra && <div className="mt-1.5">{extra}</div>}
    </div>
  );
}

type SimGrade = { label: string; value: string; weight: string };

function StudentSubjectCard({
  record,
  termSlotFilter,
  termSlotsAvailable,
  gradeScaleMax,
  passingThreshold,
}: {
  record: StudentAcademicRecord;
  termSlotFilter: string;
  termSlotsAvailable: number[];
  gradeScaleMax: number;
  passingThreshold: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [simMode, setSimMode] = useState(false);
  const [simGrades, setSimGrades] = useState<SimGrade[]>([]);

  const evals = useMemo(() => normalizeEvaluations(record), [record]);

  const visibleEvals = useMemo(() => {
    if (termSlotFilter === "all") return evals;
    const slot = Number(termSlotFilter);
    return evals.filter((e) => e.termSlot === slot);
  }, [evals, termSlotFilter]);

  const slotsWithEval = useMemo(() => {
    const s = new Set<number>();
    for (const e of evals) {
      if (e.termSlot != null && e.termSlot >= 1 && e.termSlot <= 4) s.add(e.termSlot);
    }
    return s;
  }, [evals]);

  const pendingSlots = useMemo(
    () => termSlotsAvailable.filter((slot) => !slotsWithEval.has(slot)),
    [termSlotsAvailable, slotsWithEval],
  );

  const enterSimMode = () => {
    setSimGrades(
      visibleEvals.map((g) => ({
        label: g.title,
        value: String(g.grade),
        weight: g.weight != null && g.weight > 0 ? String(g.weight) : "",
      })),
    );
    setSimMode(true);
  };

  const exitSimMode = () => {
    setSimMode(false);
    setSimGrades([]);
  };

  const toNum = (v: string) => {
    const n = Number(v.trim());
    return Number.isNaN(n) || v.trim() === "" ? null : n;
  };

  const nota = getSubjectDisplayAverage(record, termSlotFilter, evals);
  const coberturaPct = subjectCoveragePercent(record, termSlotFilter);
  const absences = getRecordAbsences(record);

  const simParsed = useMemo(() => {
    return simGrades
      .map((g) => ({
        grade: toNum(g.value),
        weight: toNum(g.weight),
      }))
      .filter((x): x is { grade: number; weight: number | null } => x.grade != null);
  }, [simGrades]);

  const simAvg = useMemo(() => {
    if (!simParsed.length) return null;
    const withW = simParsed.filter((x) => x.weight != null && x.weight > 0);
    if (withW.length === simParsed.length) {
      let sum = 0;
      let wsum = 0;
      for (const x of withW) {
        sum += x.grade * (x.weight as number);
        wsum += x.weight as number;
      }
      if (wsum > 0) return Number((sum / wsum).toFixed(2));
    }
    return computeAverage(simParsed.map((x) => x.grade));
  }, [simParsed]);

  const neededOnPending = useMemo(() => {
    const n = evals.length;
    const S = evals.reduce((acc, e) => acc + e.grade, 0);
    const m = pendingSlots.length;
    const T = passingThreshold;
    if (m <= 0) return null;
    const x = (T * (n + m) - S) / m;
    return Number(x.toFixed(2));
  }, [evals, pendingSlots, passingThreshold]);

  const simNeededMessage = useMemo(() => {
    if (!simMode || simGrades.length === 0) return null;
    const n = simParsed.length;
    const S = simParsed.reduce((acc, x) => acc + x.grade, 0);
    const m = pendingSlots.length;
    const T = passingThreshold;
    if (m <= 0) {
      if (simAvg != null && simAvg >= T) return { kind: "ok" as const };
      return { kind: "no_pending" as const };
    }
    const x = (T * (n + m) - S) / m;
    const rounded = Number(x.toFixed(2));
    if (rounded > gradeScaleMax) return { kind: "impossible" as const, x: rounded };
    if (rounded < 0) return { kind: "already" as const };
    return { kind: "need" as const, x: rounded };
  }, [simMode, simGrades.length, simParsed, pendingSlots, passingThreshold, simAvg, gradeScaleMax]);

  const totalAbs = absences.justificadas + absences.injustificadas;

  const iconBg =
    nota == null ? "bg-rec-bg-muted" : nota >= 4.0 ? "bg-rec-success-bg-muted" : nota >= 3.0 ? "bg-rec-warning-bg" : "bg-rec-danger-bg-strong";
  const iconColor =
    nota == null ? "text-rec-text-subtle" : nota >= 4.0 ? "text-rec-primary" : nota >= 3.0 ? "text-rec-warning-text" : "text-rec-danger-text";
  const notaFinalBg =
    nota == null
      ? "bg-rec-bg-base border-rec-border-default"
      : nota >= 4.0
        ? "bg-rec-success-bg border-rec-success-border"
        : nota >= 3.0
          ? "bg-rec-warning-bg border-rec-warning-border"
          : "bg-rec-danger-bg border-rec-danger-border";

  const grouped = groupEvalsBySlot(visibleEvals);
  const slotOrder: Array<number | "none"> = [1, 2, 3, 4, "none"];

  return (
    <div className="bg-rec-bg-elevated rounded-2xl border border-rec-border-default shadow-sm overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-rec-bg-base transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <FiBook className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-rec-text-primary">{record.subject.nombre}</p>
            {record.finalSource === "OVERRIDE" && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rec-bg-muted text-rec-text-secondary border border-rec-border-default">
                Nota ajustada por docente
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-rec-text-subtle flex-wrap">
            {nota != null ? (
              <span className={`font-semibold ${gradeColor(nota)}`}>
                {nota.toFixed(2)} · {gradeLabel(nota)}
              </span>
            ) : (
              <span>Sin nota aún</span>
            )}
            <span className="inline-flex items-center gap-1">
              Cobertura {coberturaPct}%
              <InfoTooltip text={COBERTURA_MATERIA_TOOLTIP}>
                <span
                  className="inline-flex rounded-full p-0.5 text-rec-text-subtle hover:text-rec-text-muted"
                  aria-label="Más información sobre cobertura"
                >
                  <FiInfo className="w-3 h-3" />
                </span>
              </InfoTooltip>
            </span>
            {totalAbs > 0 && <span className="text-rec-warning-text">{totalAbs} ausencias</span>}
          </div>
        </div>
        {nota != null && (
          <span
            className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${gradeBadgeClass(nota)}`}
          >
            {gradeLabel(nota)}
          </span>
        )}
        {expanded ? (
          <FiChevronUp className="w-4 h-4 text-rec-text-subtle shrink-0" />
        ) : (
          <FiChevronDown className="w-4 h-4 text-rec-text-subtle shrink-0" />
        )}
      </button>

      <div className="h-1 bg-rec-bg-muted">
        <div
          className={`h-full transition-all duration-500 ${
            coberturaPct >= 80 ? "bg-[var(--rec-primary)]" : coberturaPct >= 50 ? "bg-rec-chart-amber" : "bg-[var(--rec-danger-text)]"
          }`}
          style={{ width: `${Math.min(coberturaPct, 100)}%` }}
        />
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-4 border-t border-rec-border-subtle space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle mb-2">
              Mis evaluaciones
            </p>
            {visibleEvals.length === 0 ? (
              <p className="text-xs text-rec-text-subtle italic">
                {termSlotFilter === "all"
                  ? "Aún no hay evaluaciones registradas."
                  : `No hay evaluaciones en ${getTermSlotFilterLabel(termSlotFilter).toLowerCase()}.`}
                {record.notaFinal != null && (
                  <span className="block mt-1 text-rec-text-subtle">
                    Nota final registrada: {record.notaFinal.toFixed(2)} (sin detalle por evaluación).
                  </span>
                )}
              </p>
            ) : termSlotFilter === "all" ? (
              <div className="space-y-4">
                {slotOrder.map((slot) => {
                  const list = grouped.get(slot);
                  if (!list?.length) return null;
                  const slotLabel = slot === "none" ? "Sin corte asignado" : `Corte ${slot}`;
                  const slotAvg = averageFromEvals(list);
                  return (
                    <div key={String(slot)} className="rounded-xl border border-rec-border-default bg-rec-bg-base/80 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold uppercase text-rec-text-muted">{slotLabel}</span>
                        {slotAvg != null && (
                          <span className={`text-xs font-semibold ${gradeColor(slotAvg)}`}>
                            Promedio corte: {slotAvg.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1.5">
                        {list.map((ev, i) => (
                          <li
                            key={`${ev.title}-${i}`}
                            className="text-sm text-rec-text-secondary flex flex-wrap justify-between gap-2"
                          >
                            <span className="text-rec-text-muted">{formatEvalLine(ev)}</span>
                            {ev.updatedAt && (
                              <span className="text-[10px] text-rec-text-subtle">
                                {new Date(ev.updatedAt).toLocaleDateString("es-CO")}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul className="space-y-2">
                {visibleEvals.map((ev, i) => (
                  <li
                    key={`${ev.title}-${i}`}
                    className="rounded-xl bg-rec-bg-base border border-rec-border-default px-3 py-2 text-sm text-rec-text-secondary flex flex-wrap justify-between gap-2"
                  >
                    <span>{formatEvalLine(ev)}</span>
                    {ev.updatedAt && (
                      <span className="text-[10px] text-rec-text-subtle">
                        {new Date(ev.updatedAt).toLocaleDateString("es-CO")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 text-center ${notaFinalBg}`}>
              <p className="text-xs mb-1 text-rec-text-subtle">
                {termSlotFilter === "all" ? "Nota final / resumen" : `Promedio ${getTermSlotFilterLabel(termSlotFilter).toLowerCase()}`}
              </p>
              <p className={`text-2xl font-black ${gradeColor(nota)}`}>{nota != null ? nota.toFixed(2) : "—"}</p>
              <p className={`text-xs font-semibold mt-0.5 ${gradeColor(nota)}`}>{gradeLabel(nota)}</p>
              {record.finalSource === "OVERRIDE" && record.finalOverride != null && termSlotFilter === "all" && (
                <p className="text-[10px] text-rec-text-secondary mt-1 font-semibold">
                  Ajuste docente: {record.finalOverride.toFixed(2)}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-rec-bg-base border border-rec-border-default p-3">
              <p className="text-xs text-rec-text-subtle mb-1">Meta aprobación</p>
              <p className="text-2xl font-bold text-rec-text-secondary">{passingThreshold.toFixed(2)}</p>
              <p className="text-[10px] text-rec-text-subtle mt-1">Escala 0 – {gradeScaleMax}</p>
            </div>
          </div>

          {!simMode && neededOnPending != null && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                neededOnPending > gradeScaleMax
                  ? "bg-rec-warning-bg border-rec-warning-border text-rec-warning-text"
                  : neededOnPending < 0
                    ? "bg-rec-success-bg border-rec-success-border text-rec-success-text"
                    : "bg-rec-bg-base border-rec-border-default text-rec-text-secondary"
              }`}
            >
              {neededOnPending > gradeScaleMax ? (
                <p>
                  Con los cortes pendientes ({pendingSlots.length}), alcanzar {passingThreshold.toFixed(2)} podría
                  requerir notas por encima de la escala máxima ({gradeScaleMax}). Habla con tu docente.
                </p>
              ) : neededOnPending < 0 ? (
                <p className="font-semibold">¡Ya tienes promedio aprobatorio en esta materia (vista actual)!</p>
              ) : (
                <p>
                  Necesitas un promedio de al menos{" "}
                  <span className="font-black text-base">{neededOnPending.toFixed(2)}</span> en{" "}
                  {pendingSlots.length === 1
                    ? "la evaluación restante"
                    : `las ${pendingSlots.length} evaluaciones restantes (cortes pendientes)`}{" "}
                  para llegar a <span className="font-semibold">{passingThreshold.toFixed(2)}</span> (promedio simple
                  asumiendo mismas notas en lo pendiente).
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rec-text-subtle mb-2">Inasistencias</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-rec-warning-bg border border-rec-warning-border p-3">
                <p className="text-xs text-rec-text-subtle mb-1">Justificadas</p>
                <p className="text-xl font-bold text-rec-warning-text">{absences.justificadas}</p>
              </div>
              <div className="rounded-xl bg-rec-danger-bg border border-rec-danger-border p-3">
                <p className="text-xs text-rec-text-subtle mb-1">Injustificadas</p>
                <p className="text-xl font-bold text-rec-danger-text">{absences.injustificadas}</p>
              </div>
              <div className="rounded-xl bg-rec-bg-base border border-rec-border-default p-3">
                <p className="text-xs text-rec-text-subtle mb-1">Total</p>
                <p className={`text-xl font-bold ${totalAbs >= 5 ? "text-rec-danger-text" : "text-rec-text-secondary"}`}>{totalAbs}</p>
              </div>
            </div>
          </div>

          {record.observaciones && (
            <div className="rounded-xl bg-rec-info-bg border border-rec-info-border px-4 py-3">
              <p className="text-xs font-semibold text-rec-info-text mb-1">Observaciones del docente</p>
              <p className="text-sm text-rec-text-secondary whitespace-pre-wrap">{record.observaciones}</p>
            </div>
          )}

          <div className="rounded-2xl border border-rec-border-default bg-rec-bg-muted overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <FiZap className="w-4 h-4 text-rec-text-secondary" />
                <p className="text-sm font-semibold text-rec-text-secondary">Simulador (no guarda)</p>
              </div>
              {!simMode ? (
                <button
                  type="button"
                  onClick={enterSimMode}
                  className="text-xs font-semibold text-rec-text-secondary hover:text-rec-text-primary px-3 py-1 rounded-lg bg-rec-bg-elevated hover:bg-rec-bg-subtle transition-colors"
                >
                  Simular
                </button>
              ) : (
                <button
                  type="button"
                  onClick={exitSimMode}
                  className="text-xs font-semibold text-rec-text-subtle hover:text-rec-text-secondary px-3 py-1 rounded-lg bg-rec-bg-elevated hover:bg-rec-bg-base transition-colors"
                >
                  Salir
                </button>
              )}
            </div>

            {simMode && (
              <div className="px-4 pb-4 space-y-4 border-t border-rec-border-default pt-3">
                <p className="text-xs text-rec-text-secondary">
                  Ajusta notas o pesos (%). Escala máxima {gradeScaleMax}. Umbral aprobación {passingThreshold.toFixed(2)}.
                </p>

                <div className="space-y-2">
                  {simGrades.map((g, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-rec-text-muted flex-1 min-w-[100px] truncate">{g.label}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="%"
                        className="w-14 rounded-xl border border-rec-border-default bg-rec-bg-elevated px-2 py-1.5 text-xs text-center"
                        value={g.weight}
                        onChange={(e) =>
                          setSimGrades((prev) =>
                            prev.map((item, idx) => (idx === i ? { ...item, weight: e.target.value } : item)),
                          )
                        }
                      />
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={gradeScaleMax}
                        className={`w-24 rounded-xl border px-3 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--rec-primary)] transition-colors ${
                          toNum(g.value) == null
                            ? "border-rec-border-default bg-rec-bg-elevated"
                            : (toNum(g.value) ?? 0) >= 4.0
                              ? "border-rec-success-border bg-rec-success-bg text-rec-success-text"
                              : (toNum(g.value) ?? 0) >= 3.0
                                ? "border-rec-warning-border bg-rec-warning-bg text-rec-warning-text"
                                : "border-rec-danger-border bg-rec-danger-bg text-rec-danger-text"
                        }`}
                        value={g.value}
                        onChange={(e) =>
                          setSimGrades((prev) =>
                            prev.map((item, idx) => (idx === i ? { ...item, value: e.target.value } : item)),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setSimGrades((prev) => prev.filter((_, idx) => idx !== i))}
                        className="w-7 h-7 rounded-lg bg-rec-bg-elevated hover:bg-rec-danger-bg border border-rec-border-default flex items-center justify-center text-rec-text-subtle hover:text-rec-danger-text"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSimGrades((prev) => [
                      ...prev,
                      { label: `Hipotética ${prev.length + 1}`, value: "", weight: "" },
                    ])
                  }
                  className="flex items-center gap-1 text-xs font-semibold text-rec-text-secondary hover:text-rec-text-primary"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Agregar nota hipotética
                </button>

                {simGrades.length > 0 && (
                  <div
                    className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
                      simAvg == null
                        ? "bg-rec-bg-elevated border-rec-border-default"
                        : simAvg >= passingThreshold
                          ? "bg-rec-success-bg border-rec-success-border"
                          : "bg-rec-danger-bg border-rec-danger-border"
                    }`}
                  >
                    <div>
                      <p className="text-xs text-rec-text-subtle">Promedio simulado</p>
                      <p className={`text-2xl font-black mt-0.5 ${gradeColor(simAvg)}`}>
                        {simAvg != null ? simAvg.toFixed(2) : "—"}
                      </p>
                    </div>
                    {simAvg != null && (
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${gradeBadgeClass(simAvg)}`}>
                        {gradeLabel(simAvg)}
                      </span>
                    )}
                  </div>
                )}

                {simNeededMessage && (
                  <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated px-3 py-2 text-sm">
                    {simNeededMessage.kind === "ok" && (
                      <p className="text-rec-success-text font-semibold">¡Ya tienes promedio aprobatorio en el simulador!</p>
                    )}
                    {simNeededMessage.kind === "no_pending" && (
                      <p className="text-rec-text-muted">
                        No hay cortes pendientes en esta materia; sube las notas mostradas o habla con tu docente.
                      </p>
                    )}
                    {simNeededMessage.kind === "already" && (
                      <p className="text-rec-success-text font-semibold">
                        Con esta simulación ya superas el mínimo para aprobar.
                      </p>
                    )}
                    {simNeededMessage.kind === "impossible" && (
                      <p className="text-rec-warning-text">
                        Harían falta ~{simNeededMessage.x.toFixed(2)} de promedio en lo pendiente, por encima del máximo (
                        {gradeScaleMax}). Revisa estrategia con tu docente.
                      </p>
                    )}
                    {simNeededMessage.kind === "need" && (
                      <p className="text-rec-text-secondary">
                        Necesitas ~<span className="font-black">{simNeededMessage.x.toFixed(2)}</span> de promedio en{" "}
                        {pendingSlots.length === 1 ? "la evaluación restante" : "las evaluaciones restantes"} para
                        alcanzar {passingThreshold.toFixed(2)} (aprox., promedio simple).
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-rec-text-subtle">
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
