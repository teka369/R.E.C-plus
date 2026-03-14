"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import { performanceApi, type GradePerformance } from "@/lib/performanceApi";
import {
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiEdit2,
  FiPlus,
  FiSave,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";

function toText(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

function toNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

type FormState = {
  promedioGeneral: string;
  asistenciaPromedio: string;
  aprobacion: string;
  mejorAsignatura: string;
  estudiantesDestacados: string;
  inasistenciasJustificadas: string;
  inasistenciasInjustificadas: string;
  porcentajeCursoMayorAsistencia: string;
  variacionPromedio: string;
  variacionAprobacion: string;
  reduccionAusencias: string;
  tendenciaGeneral: string;
};

const EMPTY_FORM: FormState = {
  promedioGeneral: "",
  asistenciaPromedio: "",
  aprobacion: "",
  mejorAsignatura: "",
  estudiantesDestacados: "",
  inasistenciasJustificadas: "",
  inasistenciasInjustificadas: "",
  porcentajeCursoMayorAsistencia: "",
  variacionPromedio: "",
  variacionAprobacion: "",
  reduccionAusencias: "",
  tendenciaGeneral: "",
};

function toFormState(stats: GradePerformance | null): FormState {
  if (!stats) return { ...EMPTY_FORM };
  return {
    promedioGeneral: toText(stats.promedioGeneral),
    asistenciaPromedio: toText(stats.asistenciaPromedio),
    aprobacion: toText(stats.aprobacion),
    mejorAsignatura: stats.mejorAsignatura ?? "",
    estudiantesDestacados: stats.estudiantesDestacados ?? "",
    inasistenciasJustificadas: toText(stats.inasistenciasJustificadas),
    inasistenciasInjustificadas: toText(stats.inasistenciasInjustificadas),
    porcentajeCursoMayorAsistencia: toText(stats.porcentajeCursoMayorAsistencia),
    variacionPromedio: toText(stats.variacionPromedio),
    variacionAprobacion: toText(stats.variacionAprobacion),
    reduccionAusencias: toText(stats.reduccionAusencias),
    tendenciaGeneral: stats.tendenciaGeneral ?? "",
  };
}

function toPayload(form: FormState) {
  return {
    promedioGeneral: toNumber(form.promedioGeneral),
    asistenciaPromedio: toNumber(form.asistenciaPromedio),
    aprobacion: toNumber(form.aprobacion),
    mejorAsignatura: form.mejorAsignatura.trim() || undefined,
    estudiantesDestacados: form.estudiantesDestacados.trim() || undefined,
    inasistenciasJustificadas: toNumber(form.inasistenciasJustificadas),
    inasistenciasInjustificadas: toNumber(form.inasistenciasInjustificadas),
    porcentajeCursoMayorAsistencia: toNumber(form.porcentajeCursoMayorAsistencia),
    variacionPromedio: toNumber(form.variacionPromedio),
    variacionAprobacion: toNumber(form.variacionAprobacion),
    reduccionAusencias: toNumber(form.reduccionAusencias),
    tendenciaGeneral: form.tendenciaGeneral.trim() || undefined,
  };
}

function valueOrNA(value: number | string | null | undefined, suffix = "") {
  if (value == null || value === "") return "N/A";
  return `${value}${suffix}`;
}

type RankingRow = {
  groupId: number;
  groupName: string;
  gradeName: string;
  score: number;
  hasStats: boolean;
  promedioGeneral: number | null;
  asistenciaPromedio: number | null;
  aprobacion: number | null;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function computeLeagueScore(stats: GradePerformance | null) {
  if (!stats) return 0;
  const promBase = clamp(((stats.promedioGeneral ?? 0) / 5) * 100);
  const asistencia = clamp(stats.asistenciaPromedio ?? 0);
  const aprobacion = clamp(stats.aprobacion ?? 0);
  const reduccionAusencias = clamp(stats.reduccionAusencias ?? 0);
  return Number((promBase * 0.45 + asistencia * 0.25 + aprobacion * 0.25 + reduccionAusencias * 0.05).toFixed(1));
}

export default function LigasDocentePage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [stats, setStats] = useState<GradePerformance | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingRow[]>([]);

  const groups = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; label: string; gradeId: number | null; gradeName: string }>();
    assignments.forEach((item) => {
      if (!item.group?.id) return;
      map.set(item.group.id, {
        id: item.group.id,
        nombre: item.group.nombre,
        gradeId: item.group.grade?.id ?? item.group.gradeId ?? null,
        gradeName: item.group.grade?.nombre ?? "Grado",
        label: `${item.group.grade?.nombre ?? "Grado"} - ${item.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

  const selectedGroup = useMemo(
    () => groups.find((item) => item.id === Number(selectedGroupId)) ?? null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    const run = async () => {
      const teacherId = Number(user?.id);
      if (!teacherId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await academicApi.listTeacherAssignments(teacherId);
        setAssignments(data);
        const firstGroup = data[0]?.group;
        if (firstGroup?.id) setSelectedGroupId(String(firstGroup.id));
      } catch {
        setError("No se pudieron cargar tus asignaciones");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!selectedGroup) return;
      try {
        setError(null);
        const perf = await performanceApi.getByGroup(selectedGroup.id);
        setStats(perf);
        setForm(toFormState(perf));
      } catch {
        setError("No se pudo cargar las ligas del grupo");
      }
    };
    void run();
  }, [selectedGroup]);

  useEffect(() => {
    const run = async () => {
      if (!selectedGroup?.gradeId) {
        setRanking([]);
        return;
      }
      try {
        setLoadingRanking(true);
        const allGroups = await academicApi.listGroups();
        const sameGradeGroups = allGroups.filter((group) => group.gradeId === selectedGroup.gradeId);
        const performanceRows = await Promise.all(
          sameGradeGroups.map(async (group) => {
            const perf = await performanceApi.getByGroup(group.id).catch(() => null);
            const score = computeLeagueScore(perf);
            return {
              groupId: group.id,
              groupName: group.nombre,
              gradeName: group.grade?.nombre ?? selectedGroup.gradeName,
              score,
              hasStats: perf !== null,
              promedioGeneral: perf?.promedioGeneral ?? null,
              asistenciaPromedio: perf?.asistenciaPromedio ?? null,
              aprobacion: perf?.aprobacion ?? null,
            } satisfies RankingRow;
          }),
        );

        performanceRows.sort((a, b) => b.score - a.score || a.groupName.localeCompare(b.groupName, "es", { sensitivity: "base" }));
        setRanking(performanceRows);
      } catch {
        setRanking([]);
      } finally {
        setLoadingRanking(false);
      }
    };
    void run();
  }, [selectedGroup]);

  const currentIndex = useMemo(() => ranking.findIndex((item) => item.groupId === Number(selectedGroupId)), [ranking, selectedGroupId]);
  const currentPosition = currentIndex >= 0 ? currentIndex + 1 : null;
  const leaderScore = ranking[0]?.score ?? null;
  const currentScore = currentIndex >= 0 ? ranking[currentIndex].score : null;
  const gapToLeader = leaderScore != null && currentScore != null ? Number((leaderScore - currentScore).toFixed(1)) : null;

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditorOpen(true);
  };

  const openEdit = () => {
    setForm(toFormState(stats));
    setEditorOpen(true);
  };

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGroup?.nombre) return;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      await performanceApi.upsertByGrade(selectedGroup.nombre, toPayload(form));
      const perf = await performanceApi.getByGroup(selectedGroup.id);
      setStats(perf);
      setForm(toFormState(perf));
      setMessage("Reporte actualizado correctamente");
      setEditorOpen(false);
    } catch {
      setError("No se pudo guardar el reporte del grupo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Ligas 2.0 · Reporte por Grupo</h1>
            <p className="text-emerald-100 mt-1 text-sm">
              Estadisticas completas de rendimiento, asistencia y comparativo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-lg text-sm font-medium shadow hover:bg-emerald-50 transition-colors"
              disabled={!selectedGroupId}
            >
              <FiPlus className="w-4 h-4" /> Crear
            </button>
            <button
              onClick={openEdit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-lg text-sm font-medium shadow hover:bg-emerald-50 transition-colors disabled:opacity-50"
              disabled={!selectedGroupId || !stats}
            >
              <FiEdit2 className="w-4 h-4" /> Editar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <label className="block text-xs font-medium text-slate-500 mb-1">Grupo</label>
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            value={selectedGroupId}
            onChange={(event) => setSelectedGroupId(event.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? <p className="text-sm text-slate-600">Cargando…</p> : null}
        {error ? <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">{message}</div> : null}

        {!loading && !selectedGroupId ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
            No tienes grupos asignados.
          </div>
        ) : null}

        {!loading && selectedGroupId ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                <p className="text-xs text-slate-500">Posición en el grado</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {currentPosition ? `#${currentPosition}` : "N/A"}
                </p>
                <p className="text-xs text-slate-500 mt-1">de {ranking.length || 0} grupos</p>
              </article>
              <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                <p className="text-xs text-slate-500">Puntaje global</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {currentScore != null ? currentScore.toFixed(1) : "N/A"}
                </p>
                <p className="text-xs text-slate-500 mt-1">escala de 0 a 100</p>
              </article>
              <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                <p className="text-xs text-slate-500">Brecha con el líder</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {gapToLeader != null ? `${gapToLeader.toFixed(1)} pts` : "N/A"}
                </p>
                <p className="text-xs text-slate-500 mt-1">menos es mejor</p>
              </article>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Rendimiento Academico"
                icon={<FiBarChart2 className="w-5 h-5 text-indigo-600" />}
                iconWrap="bg-indigo-100"
                items={[
                  { label: "Promedio General", value: valueOrNA(stats?.promedioGeneral) },
                  { label: "Porcentaje de Aprobacion", value: valueOrNA(stats?.aprobacion, "%") },
                  { label: "Mejor Asignatura", value: valueOrNA(stats?.mejorAsignatura) },
                  { label: "Estudiantes Destacados", value: valueOrNA(stats?.estudiantesDestacados) },
                ]}
              />
              <StatCard
                title="Asistencia"
                icon={<FiCalendar className="w-5 h-5 text-emerald-600" />}
                iconWrap="bg-emerald-100"
                items={[
                  { label: "Asistencia Promedio", value: valueOrNA(stats?.asistenciaPromedio, "%") },
                  { label: "Inasistencias Justificadas", value: valueOrNA(stats?.inasistenciasJustificadas) },
                  { label: "Inasistencias Injustificadas", value: valueOrNA(stats?.inasistenciasInjustificadas) },
                  {
                    label: "Curso con Mayor Asistencia",
                    value: valueOrNA(stats?.porcentajeCursoMayorAsistencia, "%"),
                  },
                ]}
              />
              <StatCard
                title="Comparativo"
                icon={<FiTrendingUp className="w-5 h-5 text-amber-600" />}
                iconWrap="bg-amber-100"
                items={[
                  { label: "Variacion en Promedio", value: valueOrNA(stats?.variacionPromedio) },
                  { label: "Variacion en Aprobacion", value: valueOrNA(stats?.variacionAprobacion, "%") },
                  { label: "Reduccion de Ausencias", value: valueOrNA(stats?.reduccionAusencias, "%") },
                  { label: "Tendencia General", value: valueOrNA(stats?.tendenciaGeneral) },
                ]}
              />
            </div>

            <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Clasificación del grado</h3>
                  <p className="text-xs text-slate-500">Comparativo entre grupos del mismo grado</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                  <FiAward className="w-3.5 h-3.5" /> Ranking 2.0
                </span>
              </div>

              {loadingRanking ? (
                <p className="text-sm text-slate-500">Calculando clasificación…</p>
              ) : ranking.length === 0 ? (
                <p className="text-sm text-slate-500">Sin datos suficientes para clasificación.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-3">#</th>
                        <th className="py-2 pr-3">Grupo</th>
                        <th className="py-2 pr-3">Puntaje</th>
                        <th className="py-2 pr-3">Promedio</th>
                        <th className="py-2 pr-3">Aprobación</th>
                        <th className="py-2">Asistencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((row, index) => {
                        const isCurrent = row.groupId === Number(selectedGroupId);
                        return (
                          <tr key={row.groupId} className={`border-b border-slate-100 ${isCurrent ? "bg-emerald-50/70" : ""}`}>
                            <td className="py-2 pr-3 font-semibold text-slate-800">#{index + 1}</td>
                            <td className="py-2 pr-3 text-slate-700">
                              {row.groupName}
                              {isCurrent ? <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Tu grupo</span> : null}
                            </td>
                            <td className="py-2 pr-3 font-semibold text-emerald-700">{row.score.toFixed(1)}</td>
                            <td className="py-2 pr-3 text-slate-700">{valueOrNA(row.promedioGeneral)}</td>
                            <td className="py-2 pr-3 text-slate-700">{valueOrNA(row.aprobacion, "%")}</td>
                            <td className="py-2 text-slate-700">{valueOrNA(row.asistenciaPromedio, "%")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            {!stats ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
                Aun no hay reporte registrado para este grupo. Usa el boton Crear para cargarlo.
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">
                {stats ? "Editar Reporte del Grupo" : "Crear Reporte del Grupo"}
              </h2>
              <button onClick={() => setEditorOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form id="ligas-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Rendimiento Academico</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InputField label="Promedio general" value={form.promedioGeneral} onChange={(v) => setField("promedioGeneral", v)} type="number" />
                  <InputField label="Aprobacion (%)" value={form.aprobacion} onChange={(v) => setField("aprobacion", v)} type="number" />
                  <InputField label="Mejor asignatura" value={form.mejorAsignatura} onChange={(v) => setField("mejorAsignatura", v)} />
                  <InputField label="Estudiantes destacados" value={form.estudiantesDestacados} onChange={(v) => setField("estudiantesDestacados", v)} />
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Asistencia</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InputField label="Asistencia promedio (%)" value={form.asistenciaPromedio} onChange={(v) => setField("asistenciaPromedio", v)} type="number" />
                  <InputField
                    label="Curso con mayor asistencia (%)"
                    value={form.porcentajeCursoMayorAsistencia}
                    onChange={(v) => setField("porcentajeCursoMayorAsistencia", v)}
                    type="number"
                  />
                  <InputField
                    label="Inasistencias justificadas"
                    value={form.inasistenciasJustificadas}
                    onChange={(v) => setField("inasistenciasJustificadas", v)}
                    type="number"
                  />
                  <InputField
                    label="Inasistencias injustificadas"
                    value={form.inasistenciasInjustificadas}
                    onChange={(v) => setField("inasistenciasInjustificadas", v)}
                    type="number"
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700">Comparativo</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InputField
                    label="Variacion en promedio"
                    value={form.variacionPromedio}
                    onChange={(v) => setField("variacionPromedio", v)}
                    type="number"
                  />
                  <InputField
                    label="Variacion en aprobacion (%)"
                    value={form.variacionAprobacion}
                    onChange={(v) => setField("variacionAprobacion", v)}
                    type="number"
                  />
                  <InputField
                    label="Reduccion de ausencias (%)"
                    value={form.reduccionAusencias}
                    onChange={(v) => setField("reduccionAusencias", v)}
                    type="number"
                  />
                  <InputField label="Tendencia general" value={form.tendenciaGeneral} onChange={(v) => setField("tendenciaGeneral", v)} />
                </div>
              </fieldset>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="ligas-form"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <FiSave className="w-4 h-4" />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function StatCard({
  title,
  icon,
  iconWrap,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  iconWrap: string;
  items: { label: string; value: string }[];
}) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full ${iconWrap} flex items-center justify-center`}>{icon}</div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
            <span className="text-xs text-slate-500">{item.label}</span>
            <span className="text-sm font-semibold text-slate-800 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}