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
  POSITIVA: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  NEGATIVA: "bg-red-100 text-red-800 border border-red-200",
  INFORMATIVA: "bg-blue-100 text-blue-800 border border-blue-200",
  SEGUIMIENTO: "bg-amber-100 text-amber-800 border border-amber-200",
};

const TIPO_BORDER: Record<FeedbackTipo, string> = {
  POSITIVA: "border-l-emerald-400",
  NEGATIVA: "border-l-red-400",
  INFORMATIVA: "border-l-blue-400",
  SEGUIMIENTO: "border-l-amber-400",
};

const ESTADO_STYLE: Record<FeedbackEstado, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800 border border-amber-200",
  ATENDIDA: "bg-emerald-100 text-emerald-800 border border-emerald-200",
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
          className="rounded-2xl border p-4 sm:p-6 text-white"
          style={{
            borderColor: "var(--rec-soft)",
            background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
          }}
        >
          <h1 className="text-2xl font-bold">Feedback &amp; Observaciones</h1>
          <p className="text-white/90 mt-1 text-sm">
            Consulta la retroalimentación de tus docentes.
          </p>
          {!loading && pendientes > 0 && (
            <p className="mt-3 text-sm bg-white/20 inline-block px-3 py-1 rounded-full">
              {pendientes} observaci{pendientes !== 1 ? "ones" : "ón"} pendiente{pendientes !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6">
        {/* Summary chips */}
        {!loading && feedback.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["POSITIVA", "NEGATIVA", "INFORMATIVA", "SEGUIMIENTO"] as FeedbackTipo[]).map((tipo) => {
              const count = feedback.filter((fb) => fb.tipo === tipo).length;
              return (
                <button
                  key={tipo}
                  onClick={() => setFilterTipo(filterTipo === tipo ? "" : tipo)}
                  className={`rounded-xl p-3 border text-left transition-all ${
                    filterTipo === tipo
                      ? TIPO_STYLE[tipo] + " ring-2 ring-offset-1 ring-current"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs">{TIPO_LABEL[tipo]}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        {!loading && feedback.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {(Object.keys(TIPO_LABEL) as FeedbackTipo[]).map((t) => (
                <option key={t} value={t}>{TIPO_LABEL[t]}</option>
              ))}
            </select>
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ATENDIDA">Atendida</option>
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
            <FiMessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Sin feedback registrado</p>
            <p className="mt-1">Aún no tienes observaciones de tus docentes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </p>
            {filtered.map((fb) => (
              <article
                key={fb.id}
                className={`bg-white border border-slate-200 rounded-xl shadow-sm p-4 border-l-4 ${TIPO_BORDER[fb.tipo]}`}
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
                      <span className="text-xs text-slate-400">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setDetailFeedback(fb)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-medium transition-colors"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                    Ver detalle
                  </button>
                </div>
                <h3 className="font-semibold text-slate-900 mt-2">{fb.title}</h3>
                <p className="text-sm text-slate-700 mt-1">{fb.content}</p>
                {((fb.strengths?.items?.length ?? 0) > 0 || (fb.improvements?.items?.length ?? 0) > 0) && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(fb.strengths?.items?.length ?? 0) > 0 && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-emerald-800 mb-1.5">Fortalezas</p>
                        <ul className="space-y-1">
                          {fb.strengths!.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-700">
                              <FiCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(fb.improvements?.items?.length ?? 0) > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1.5">Áreas de mejora</p>
                        <ul className="space-y-1">
                          {fb.improvements!.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
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

      {detailFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Detalle del feedback</h2>
              <button
                onClick={() => setDetailFeedback(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
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
                  <span className="text-xs text-slate-400">
                    {new Date(detailFeedback.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{detailFeedback.title}</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{detailFeedback.content}</p>
              {(detailFeedback.strengths?.items?.length ?? 0) > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-emerald-800 mb-1.5">Fortalezas</p>
                  <ul className="space-y-1">
                    {detailFeedback.strengths!.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-emerald-700">
                        <FiCheck className="w-4 h-4 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(detailFeedback.improvements?.items?.length ?? 0) > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-1.5">Áreas de mejora</p>
                  <ul className="space-y-1">
                    {detailFeedback.improvements!.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-amber-700">
                        <FiArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDetailFeedback(null)}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
