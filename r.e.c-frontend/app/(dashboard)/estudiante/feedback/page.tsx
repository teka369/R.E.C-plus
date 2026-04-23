"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  communicationApi,
  type FeedbackDTO,
  type FeedbackEstado,
  type FeedbackTipo,
} from "@/lib/communicationApi";
import { getErrorMessage } from "@/lib/errors";
import { FiArrowRight, FiCheck, FiEye, FiMessageSquare, FiX } from "react-icons/fi";

const TIPO_LABEL: Record<FeedbackTipo, string> = {
  POSITIVA: "Positiva",
  NEGATIVA: "Negativa",
  INFORMATIVA: "Informativa",
  SEGUIMIENTO: "Seguimiento",
};

const TIPO_STYLE: Record<FeedbackTipo, string> = {
  POSITIVA: "bg-rec-success-bg-muted text-rec-success-text border border-rec-success-border",
  NEGATIVA: "bg-rec-danger-bg-strong text-rec-danger-text border border-rec-danger-border",
  INFORMATIVA: "bg-rec-info-bg-strong text-rec-info-text border border-rec-info-border",
  SEGUIMIENTO: "bg-rec-warning-bg text-rec-warning-text border border-rec-warning-border",
};

const TIPO_BORDER: Record<FeedbackTipo, string> = {
  POSITIVA: "border-l-rec-success-border",
  NEGATIVA: "border-l-rec-danger-border",
  INFORMATIVA: "border-l-rec-info-border",
  SEGUIMIENTO: "border-l-rec-warning-border",
};

const ESTADO_STYLE: Record<FeedbackEstado, string> = {
  PENDIENTE: "bg-rec-warning-bg text-rec-warning-text border border-rec-warning-border",
  ATENDIDA: "bg-rec-success-bg-muted text-rec-success-text border border-rec-success-border",
};

export default function FeedbackEstudiantePage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [detailFeedback, setDetailFeedback] = useState<FeedbackDTO | null>(null);

  useEffect(() => {
    const run = async () => {
      const studentId = Number(user?.id);
      if (!studentId) return;
      setLoading(true);
      setError(null);
      try {
        const list = await communicationApi.listFeedbackByStudent(studentId);
        setFeedback(list);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar feedback"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  const filtered = useMemo(() => {
    return feedback.filter((fb) => {
      if (filterTipo && fb.tipo !== filterTipo) return false;
      if (filterEstado && fb.estado !== filterEstado) return false;
      return true;
    });
  }, [feedback, filterTipo, filterEstado]);

  const pendientes = feedback.filter((fb) => fb.estado === "PENDIENTE").length;

  return (
    <>
      {/* Header */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6">
        <div
          id="tour-est-fb-header"
          className="rounded-2xl border p-4 sm:p-6 text-rec-text-on-media"
          style={{
            borderColor: "var(--rec-soft)",
            background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
          }}
        >
          <h1 className="text-2xl font-bold">Feedback &amp; Observaciones</h1>
          <p className="text-rec-text-on-media/90 mt-1 text-sm">
            Consulta la retroalimentación de tus docentes.
          </p>
          {!loading && pendientes > 0 && (
            <p className="mt-3 text-sm bg-rec-bg-elevated/20 inline-block px-3 py-1 rounded-full">
              {pendientes} observaci{pendientes !== 1 ? "ones" : "ón"} pendiente{pendientes !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6">
        {!loading && (
          <>
            <div id="tour-est-fb-resumen">
              {feedback.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["POSITIVA", "NEGATIVA", "INFORMATIVA", "SEGUIMIENTO"] as FeedbackTipo[]).map((tipo) => {
                    const count = feedback.filter((fb) => fb.tipo === tipo).length;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setFilterTipo(filterTipo === tipo ? "" : tipo)}
                        className={`rounded-xl p-3 border text-left transition-all ${
                          filterTipo === tipo
                            ? TIPO_STYLE[tipo] + " ring-2 ring-offset-1 ring-current"
                            : "bg-rec-bg-elevated border-rec-border-default text-rec-text-secondary hover:bg-rec-bg-base"
                        }`}
                      >
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-xs">{TIPO_LABEL[tipo]}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-rec-text-subtle rounded-xl border border-dashed border-rec-border-default bg-rec-bg-base px-4 py-3">
                  Cuando haya observaciones de tus docentes, verás aquí un resumen por tipo (positiva, negativa, informativa, seguimiento).
                </p>
              )}
            </div>
            <div id="tour-est-fb-filtros">
              {feedback.length > 0 ? (
                <div className="bg-rec-bg-elevated border border-rec-border-default rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
                  <select
                    className="border border-rec-border-default rounded-lg px-3 py-2 text-sm bg-rec-bg-base focus:outline-none focus:ring-2 focus:ring-rec-success-border"
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                  >
                    <option value="">Todos los tipos</option>
                    {(Object.keys(TIPO_LABEL) as FeedbackTipo[]).map((t) => (
                      <option key={t} value={t}>
                        {TIPO_LABEL[t]}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border border-rec-border-default rounded-lg px-3 py-2 text-sm bg-rec-bg-base focus:outline-none focus:ring-2 focus:ring-rec-success-border"
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="ATENDIDA">Atendida</option>
                  </select>
                </div>
              ) : (
                <p className="text-xs text-rec-text-subtle rounded-xl border border-dashed border-rec-border-default bg-rec-bg-base px-4 py-3">
                  Los filtros por tipo y estado aparecerán cuando tengas al menos un mensaje en la lista.
                </p>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="bg-rec-danger-bg border border-rec-danger-border rounded-xl p-4 text-sm text-rec-danger-text">{error}</div>
        )}

        <div id="tour-est-fb-lista">
          {loading ? (
            <div className="text-center py-12 text-rec-text-subtle text-sm">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-rec-bg-elevated border border-rec-border-default rounded-xl text-rec-text-subtle text-sm">
              <FiMessageSquare className="w-10 h-10 mx-auto mb-3 text-rec-text-subtle" />
              <p className="font-medium">
                {feedback.length === 0 ? "Sin feedback registrado" : "Sin resultados con este filtro"}
              </p>
              <p className="mt-1">
                {feedback.length === 0
                  ? "Aún no tienes observaciones de tus docentes."
                  : "Prueba otro tipo o estado en los filtros."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-rec-text-subtle font-medium">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </p>
              {filtered.map((fb) => (
              <article
                key={fb.id}
                className={`bg-rec-bg-elevated border border-rec-border-default rounded-xl shadow-sm p-4 border-l-4 ${TIPO_BORDER[fb.tipo]}`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_STYLE[fb.tipo]}`}>
                      {TIPO_LABEL[fb.tipo]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_STYLE[fb.estado]}`}>
                      {fb.estado === "PENDIENTE" ? "Pendiente" : "Atendida"}
                    </span>
                    {fb.createdAt && (
                      <span className="text-xs text-rec-text-subtle">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setDetailFeedback(fb)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rec-success-border text-rec-success-text hover:bg-rec-success-bg text-xs font-medium transition-colors"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                    Ver detalle
                  </button>
                </div>
                <h3 className="font-semibold text-rec-text-primary mt-2">{fb.title}</h3>
                <p className="text-sm text-rec-text-secondary mt-1">{fb.content}</p>
                {((fb.strengths?.items?.length ?? 0) > 0 || (fb.improvements?.items?.length ?? 0) > 0) && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(fb.strengths?.items?.length ?? 0) > 0 && (
                      <div className="bg-rec-success-bg border border-rec-success-border rounded-lg p-3">
                        <p className="text-xs font-semibold text-rec-success-text mb-1.5">Fortalezas</p>
                        <ul className="space-y-1">
                          {fb.strengths!.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-rec-success-text">
                              <FiCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(fb.improvements?.items?.length ?? 0) > 0 && (
                      <div className="bg-rec-warning-bg border border-rec-warning-border rounded-lg p-3">
                        <p className="text-xs font-semibold text-rec-warning-text mb-1.5">Áreas de mejora</p>
                        <ul className="space-y-1">
                          {fb.improvements!.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-rec-warning-text">
                              <FiArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {detailFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rec-text-primary/50 p-4">
          <div className="bg-rec-bg-elevated rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-rec-border-subtle">
              <h2 className="font-semibold text-rec-text-primary">Detalle del feedback</h2>
              <button
                onClick={() => setDetailFeedback(null)}
                className="p-1.5 rounded-lg hover:bg-rec-bg-muted text-rec-text-subtle"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 sm:px-6 py-4 space-y-3 overflow-y-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_STYLE[detailFeedback.tipo]}`}>
                  {TIPO_LABEL[detailFeedback.tipo]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_STYLE[detailFeedback.estado]}`}>
                  {detailFeedback.estado === "PENDIENTE" ? "Pendiente" : "Atendida"}
                </span>
                {detailFeedback.createdAt && (
                  <span className="text-xs text-rec-text-subtle">
                    {new Date(detailFeedback.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-rec-text-primary">{detailFeedback.title}</h3>
              <p className="text-sm text-rec-text-secondary whitespace-pre-wrap">{detailFeedback.content}</p>
              {(detailFeedback.strengths?.items?.length ?? 0) > 0 && (
                <div className="bg-rec-success-bg border border-rec-success-border rounded-lg p-3">
                  <p className="text-xs font-semibold text-rec-success-text mb-1.5">Fortalezas</p>
                  <ul className="space-y-1">
                    {detailFeedback.strengths!.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-rec-success-text">
                        <FiCheck className="w-4 h-4 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(detailFeedback.improvements?.items?.length ?? 0) > 0 && (
                <div className="bg-rec-warning-bg border border-rec-warning-border rounded-lg p-3">
                  <p className="text-xs font-semibold text-rec-warning-text mb-1.5">Áreas de mejora</p>
                  <ul className="space-y-1">
                    {detailFeedback.improvements!.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-rec-warning-text">
                        <FiArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-rec-border-subtle flex justify-end">
              <button
                onClick={() => setDetailFeedback(null)}
                className="px-4 py-2 text-sm bg-rec-primary text-rec-text-on-media rounded-lg hover:bg-rec-primary-strong transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
