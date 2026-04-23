"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import { performanceApi, type GradePerformance, type GradeRankingRow } from "@/lib/performanceApi";
import {
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiRefreshCcw,
  FiTrendingUp,
} from "react-icons/fi";
import { getErrorMessage } from "@/lib/errors";

function valueOrNA(value: number | string | null | undefined, suffix = "") {
  if (value == null || value === "") return "N/A";
  return `${value}${suffix}`;
}

export default function LigasDocentePage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [stats, setStats] = useState<GradePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ranking, setRanking] = useState<GradeRankingRow[]>([]);

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

  const loadCurrentGroupStats = async (groupId: number) => {
    const perf = await performanceApi.getByGroup(groupId);
    setStats(perf);
  };

  const loadGradeRanking = async (gradeId: number) => {
    setLoadingRanking(true);
    try {
      const rows = await performanceApi.getGradeRanking(gradeId);
      setRanking(rows);
    } finally {
      setLoadingRanking(false);
    }
  };

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
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudieron cargar tus asignaciones"));
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
        await Promise.all([
          loadCurrentGroupStats(selectedGroup.id),
          selectedGroup.gradeId ? loadGradeRanking(selectedGroup.gradeId) : Promise.resolve(),
        ]);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar las ligas del grupo"));
      }
    };
    void run();
  }, [selectedGroup]);

  const currentIndex = useMemo(() => ranking.findIndex((item) => item.groupId === Number(selectedGroupId)), [ranking, selectedGroupId]);
  const currentPosition = currentIndex >= 0 ? currentIndex + 1 : null;
  const leaderScore = ranking[0]?.score ?? null;
  const currentScore = currentIndex >= 0 ? ranking[currentIndex].score : null;
  const gapToLeader = leaderScore != null && currentScore != null ? Number((leaderScore - currentScore).toFixed(1)) : null;

  const traceRows = stats?.scoreBreakdown
    ? [
        {
          key: "Promedio",
          raw: stats.scoreBreakdown.promedio.raw,
          normalized: stats.scoreBreakdown.promedio.normalized,
          weight: stats.scoreBreakdown.promedio.weight,
          contribution: stats.scoreBreakdown.promedio.contribution,
        },
        {
          key: "Asistencia",
          raw: stats.scoreBreakdown.asistencia.raw,
          normalized: stats.scoreBreakdown.asistencia.normalized,
          weight: stats.scoreBreakdown.asistencia.weight,
          contribution: stats.scoreBreakdown.asistencia.contribution,
        },
        {
          key: "Aprobación",
          raw: stats.scoreBreakdown.aprobacion.raw,
          normalized: stats.scoreBreakdown.aprobacion.normalized,
          weight: stats.scoreBreakdown.aprobacion.weight,
          contribution: stats.scoreBreakdown.aprobacion.contribution,
        },
        {
          key: "Recuperación de ausencias",
          raw: stats.scoreBreakdown.recuperacionAusencias.raw,
          normalized: stats.scoreBreakdown.recuperacionAusencias.normalized,
          weight: stats.scoreBreakdown.recuperacionAusencias.weight,
          contribution: stats.scoreBreakdown.recuperacionAusencias.contribution,
        },
      ]
    : [];

  const onRefresh = async () => {
    if (!selectedGroup) return;
    try {
      setRefreshing(true);
      setError(null);
      await Promise.all([
        loadCurrentGroupStats(selectedGroup.id),
        selectedGroup.gradeId ? loadGradeRanking(selectedGroup.gradeId) : Promise.resolve(),
      ]);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo refrescar el reporte"));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-0 pb-6">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6">
        <div
          id="tour-lig-header"
          className="rounded-2xl border p-4 sm:p-6 text-rec-text-on-media"
          style={{
            borderColor: "var(--rec-soft)",
            background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Ligas</h1>
              <p className="text-rec-text-on-media/90 mt-1 text-sm">
                Estadísticas automáticas basadas en gestión académica, recuperaciones y recursos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rec-bg-elevated rounded-lg text-sm font-medium shadow hover:opacity-90 transition-colors"
                style={{ color: "var(--rec-primary-strong)" }}
                disabled={!selectedGroupId}
              >
                <FiRefreshCcw className="w-4 h-4" /> {refreshing ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6">
        <div
          id="tour-lig-selector"
          className="bg-rec-bg-elevated rounded-xl p-4 shadow-sm space-y-3"
          style={{ border: "1px solid var(--rec-soft)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--rec-title)" }}>Panel de consulta</p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-rec-text-subtle mb-1">Grupo</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
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
            <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
              Ranking automático por desempeño académico
            </div>
          </div>
        </div>

        {loading ? <p className="text-sm text-rec-text-muted">Cargando…</p> : null}
        {error ? <div className="bg-rec-danger-bg border border-rec-danger-border rounded-xl p-4 text-sm text-rec-danger-text">{error}</div> : null}
        <div className="rounded-xl p-4 text-xs" style={{ background: "var(--rec-soft)", border: "1px solid var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
          Los valores de Ligas se calculan automáticamente con datos reales del sistema. No se editan manualmente desde esta vista.
        </div>

        {!loading && !selectedGroupId ? (
          <div className="text-center py-12 bg-rec-bg-elevated border border-rec-border-default rounded-xl text-rec-text-subtle text-sm">
            No tienes grupos asignados.
          </div>
        ) : null}

        {!loading && selectedGroupId ? (
          <>
            <div id="tour-lig-metricas" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
                <p className="text-xs text-rec-text-subtle">Posición en el grado</p>
                <p className="text-2xl font-bold text-rec-text-primary mt-1">
                  {currentPosition ? `#${currentPosition}` : "N/A"}
                </p>
                <p className="text-xs text-rec-text-subtle mt-1">de {ranking.length || 0} grupos</p>
              </article>
              <article className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
                <p className="text-xs text-rec-text-subtle">Puntaje global</p>
                <p className="text-2xl font-bold mt-1" style={{ color: "var(--rec-primary-strong)" }}>
                  {currentScore != null ? currentScore.toFixed(1) : "N/A"}
                </p>
                <p className="text-xs text-rec-text-subtle mt-1">escala de 0 a 100</p>
              </article>
              <article className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
                <p className="text-xs text-rec-text-subtle">Brecha con el líder</p>
                <p className="text-2xl font-bold text-rec-warning-text mt-1">
                  {gapToLeader != null ? `${gapToLeader.toFixed(1)} pts` : "N/A"}
                </p>
                <p className="text-xs text-rec-text-subtle mt-1">menos es mejor</p>
              </article>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Rendimiento Academico"
                icon={<FiBarChart2 className="w-5 h-5 text-rec-info-text" />}
                iconWrap="bg-rec-info-bg"
                items={[
                  { label: "Promedio General", value: valueOrNA(stats?.promedioGeneral) },
                  { label: "Porcentaje de Aprobacion", value: valueOrNA(stats?.aprobacion, "%") },
                  { label: "Mejor Asignatura", value: valueOrNA(stats?.mejorAsignatura) },
                  { label: "Estudiantes Destacados", value: valueOrNA(stats?.estudiantesDestacados) },
                ]}
              />
              <StatCard
                title="Asistencia"
                icon={<FiCalendar className="w-5 h-5" style={{ color: "var(--rec-primary-strong)" }} />}
                iconWrap="bg-[color:var(--rec-soft)]"
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
                icon={<FiTrendingUp className="w-5 h-5 text-rec-warning-text" />}
                iconWrap="bg-rec-warning-bg"
                items={[
                  { label: "Variacion en Promedio", value: valueOrNA(stats?.variacionPromedio) },
                  { label: "Variacion en Aprobacion", value: valueOrNA(stats?.variacionAprobacion, "%") },
                  { label: "Reduccion de Ausencias", value: valueOrNA(stats?.reduccionAusencias, "%") },
                  { label: "Tendencia General", value: valueOrNA(stats?.tendenciaGeneral) },
                ]}
              />
            </div>

            <article className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-rec-text-primary">Trazabilidad del puntaje</h3>
                  <p className="text-xs text-rec-text-subtle">Cómo se construye el score total de la liga para este grupo.</p>
                </div>
                <span className="text-xs font-semibold rounded-md px-2 py-1" style={{ color: "var(--rec-primary-strong)", background: "var(--rec-soft)" }}>
                  Total {valueOrNA(stats?.scoreBreakdown?.total)}
                </span>
              </div>

              {!stats?.scoreBreakdown ? (
                <p className="text-sm text-rec-text-subtle">Sin desglose disponible aún.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-rec-text-subtle border-b border-rec-border-default">
                          <th className="py-2 pr-3">Factor</th>
                          <th className="py-2 pr-3">Dato base</th>
                          <th className="py-2 pr-3">Normalizado</th>
                          <th className="py-2 pr-3">Peso</th>
                          <th className="py-2">Aporte</th>
                        </tr>
                      </thead>
                      <tbody>
                        {traceRows.map((row) => (
                          <tr key={row.key} className="border-b border-rec-border-subtle">
                            <td className="py-2 pr-3 font-medium text-rec-text-secondary">{row.key}</td>
                            <td className="py-2 pr-3 text-rec-text-secondary">{row.raw.toFixed(2)}</td>
                            <td className="py-2 pr-3 text-rec-text-secondary">{row.normalized.toFixed(2)}</td>
                            <td className="py-2 pr-3 text-rec-text-secondary">{(row.weight * 100).toFixed(0)}%</td>
                            <td className="py-2 font-semibold" style={{ color: "var(--rec-primary-strong)" }}>{row.contribution.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border border-rec-info-border bg-rec-info-bg px-3 py-2 text-rec-info-text">
                      Cierre recuperaciones: {valueOrNA(stats.derivedSignals?.recoveryCompletionRate, "%")}
                    </div>
                    <div className="rounded-lg border border-rec-warning-border bg-rec-warning-bg px-3 py-2 text-rec-warning-text">
                      Recursos por materia: {valueOrNA(stats.derivedSignals?.resourcesPerSubject)}
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ border: "1px solid var(--rec-soft)", background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
                      Temarios activos: {valueOrNA(stats.derivedSignals?.activeSyllabusRate, "%")}
                    </div>
                  </div>
                </>
              )}
            </article>

            <article className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-rec-text-primary">Clasificación del grado</h3>
                  <p className="text-xs text-rec-text-subtle">Comparativo entre grupos del mismo grado</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
                  <FiAward className="w-3.5 h-3.5" /> Ranking 2.0
                </span>
              </div>

              {loadingRanking ? (
                <p className="text-sm text-rec-text-subtle">Calculando clasificación…</p>
              ) : ranking.length === 0 ? (
                <p className="text-sm text-rec-text-subtle">Sin datos suficientes para clasificación.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-rec-text-subtle border-b border-rec-border-default">
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
                          <tr key={row.groupId} className={`border-b border-rec-border-subtle ${isCurrent ? "" : ""}`} style={isCurrent ? { background: "var(--rec-soft)" } : undefined}>
                            <td className="py-2 pr-3 font-semibold text-rec-text-primary">#{index + 1}</td>
                            <td className="py-2 pr-3 text-rec-text-secondary">
                              {row.groupName}
                              {isCurrent ? <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded" style={{ background: "white", color: "var(--rec-primary-strong)" }}>Tu grupo</span> : null}
                            </td>
                            <td className="py-2 pr-3 font-semibold" style={{ color: "var(--rec-primary-strong)" }}>{row.score.toFixed(1)}</td>
                            <td className="py-2 pr-3 text-rec-text-secondary">{valueOrNA(row.promedioGeneral)}</td>
                            <td className="py-2 pr-3 text-rec-text-secondary">{valueOrNA(row.aprobacion, "%")}</td>
                            <td className="py-2 text-rec-text-secondary">{valueOrNA(row.asistenciaPromedio, "%")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            {!stats ? (
              <div className="bg-rec-bg-elevated border border-rec-border-default rounded-xl p-5 text-sm text-rec-text-muted">
                Aún no hay datos suficientes para calcular la liga de este grupo.
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
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
    <article className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full ${iconWrap} flex items-center justify-center`}>{icon}</div>
        <h3 className="text-sm font-semibold text-rec-text-primary">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2 border-b border-rec-border-subtle pb-2 last:border-b-0 last:pb-0">
            <span className="text-xs text-rec-text-subtle">{item.label}</span>
            <span className="text-sm font-semibold text-rec-text-primary text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}