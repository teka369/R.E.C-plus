"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi } from "@/lib/academicApi";
import { performanceApi, type GradePerformance, type GradeRankingRow } from "@/lib/performanceApi";
import { getErrorMessage } from "@/lib/errors";
import { FiAward, FiBarChart2, FiCalendar, FiTrendingUp } from "react-icons/fi";

function valueOrNA(value: number | string | null | undefined, suffix = "") {
  if (value == null || value === "") return "N/A";
  return `${value}${suffix}`;
}

type RankingRow = {
} & GradeRankingRow;

export default function EstudianteLigasPage() {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState<string>("");
  const [gradeName, setGradeName] = useState<string>("");
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null);
  const [stats, setStats] = useState<GradePerformance | null>(null);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const studentId = Number(user?.id);
      if (!studentId) return;
      setLoading(true);
      setError(null);
      try {
        const studentGroup = await academicApi.getStudentGroup(studentId);
        setGroupName(studentGroup?.group.nombre ?? "");
        setGradeName(studentGroup?.group.grade?.nombre ?? "");
        setCurrentGroupId(studentGroup?.group.id ?? null);

        const groupId = studentGroup?.group.id;
        const gradeId = studentGroup?.group.grade?.id;
        if (!groupId) {
          setStats(null);
          setRanking([]);
          return;
        }

        const report = await performanceApi.getByGroup(groupId);
        setStats(report);

        if (!gradeId) {
          setRanking([]);
        } else {
          setLoadingRanking(true);
          const performanceRows = await performanceApi.getGradeRanking(gradeId);
          setRanking(performanceRows);
          setLoadingRanking(false);
        }
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar el reporte de ligas"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  const currentIndex = ranking.findIndex((item) => item.groupId === currentGroupId);
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

  return (
    <>
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6">
        <div
          id="tour-est-lig-header"
          className="rounded-2xl border p-4 sm:p-6 text-rec-text-on-media"
          style={{
            borderColor: "var(--rec-soft)",
            background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
          }}
        >
          <h1 className="text-2xl font-bold">Ligas</h1>
          <p className="text-rec-text-on-media/90 mt-1 text-sm">
            Vista general de rendimiento, asistencia y comparativo de tu grupo.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6">
        <div className="bg-rec-info-bg border border-rec-info-border rounded-xl p-4 text-xs text-rec-info-text">
          Este ranking se calcula automáticamente con datos reales de gestión académica y módulos relacionados.
        </div>

        <div id="tour-est-lig-grupo" className="bg-rec-bg-elevated border border-rec-border-default rounded-xl p-4 shadow-sm">
          <p className="text-sm text-rec-text-secondary">
            <span className="font-semibold">Grupo:</span> {groupName || "N/A"}
            {gradeName ? <span> · <span className="font-semibold">Grado:</span> {gradeName}</span> : null}
          </p>
        </div>

        {loading ? <p className="text-sm text-rec-text-muted">Cargando…</p> : null}
        {error ? <div className="bg-rec-danger-bg border border-rec-danger-border rounded-xl p-4 text-sm text-rec-danger-text">{error}</div> : null}

        {!loading && !error && (
          <>
            <div id="tour-est-lig-posicion" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
                <p className="text-xs text-rec-text-subtle">Posición de tu grupo</p>
                <p className="text-2xl font-bold text-rec-text-primary mt-1">
                  {currentPosition ? `#${currentPosition}` : "N/A"}
                </p>
                <p className="text-xs text-rec-text-subtle mt-1">de {ranking.length || 0} grupos</p>
              </article>
              <article className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
                <p className="text-xs text-rec-text-subtle">Puntaje global</p>
                <p className="text-2xl font-bold text-rec-success-text mt-1">
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

            <div id="tour-est-lig-stats" className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                icon={<FiCalendar className="w-5 h-5 text-rec-primary" />}
                iconWrap="bg-rec-success-bg-muted"
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

            <article id="tour-est-lig-trazabilidad" className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-rec-text-primary">Trazabilidad del puntaje</h3>
                  <p className="text-xs text-rec-text-subtle">Detalle del cálculo automático del score para tu grupo.</p>
                </div>
                <span className="text-xs font-semibold text-rec-success-text bg-rec-success-bg rounded-md px-2 py-1">
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
                            <td className="py-2 font-semibold text-rec-success-text">{row.contribution.toFixed(2)}</td>
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
                    <div className="rounded-lg border border-rec-success-border bg-rec-success-bg px-3 py-2 text-rec-success-text">
                      Temarios activos: {valueOrNA(stats.derivedSignals?.activeSyllabusRate, "%")}
                    </div>
                  </div>
                </>
              )}
            </article>

            <article className="bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-rec-text-primary">Tabla de clasificación del grado</h3>
                  <p className="text-xs text-rec-text-subtle">Quién va ganando entre los grupos de tu grado</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rec-success-bg text-rec-success-text text-xs font-medium">
                  <FiAward className="w-3.5 h-3.5" /> Liga escolar
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
                        const isCurrent = row.groupId === currentGroupId;
                        return (
                          <tr key={row.groupId} className={`border-b border-rec-border-subtle ${isCurrent ? "bg-rec-success-bg/70" : ""}`}>
                            <td className="py-2 pr-3 font-semibold text-rec-text-primary">#{index + 1}</td>
                            <td className="py-2 pr-3 text-rec-text-secondary">
                              {row.groupName}
                              {isCurrent ? <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-rec-success-bg-muted text-rec-success-text">Tu grupo</span> : null}
                            </td>
                            <td className="py-2 pr-3 font-semibold text-rec-success-text">{row.score.toFixed(1)}</td>
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
                Aún no hay datos suficientes para calcular la liga de tu grupo.
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
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