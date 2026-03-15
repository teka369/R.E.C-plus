"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type GroupSubject } from "@/lib/academicApi";
import {
  recoveryApi,
  type RecoveryActivity,
  type RecoveryActivityStatus,
  type RecoveryMessage,
  type RecoveryRequest,
  type RecoveryRequestStatus,
  type RecoveryRequestType,
} from "@/lib/recoveryApi";
import { recoverySettingsApi } from "@/lib/recoverySettingsApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTION_LABELS: Record<RecoveryRequestStatus, string> = {
  PENDING: "Pendiente (cierre)",
  APPROVED: "Aceptada (proceso)",
  REJECTED: "Rechazada",
  COMPLETED: "Aprobaste",
};

const STATUS_COLORS: Record<RecoveryRequestStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_RING: Record<RecoveryRequestStatus, string> = {
  PENDING: "border-amber-300 bg-amber-50",
  APPROVED: "border-blue-300 bg-blue-50",
  REJECTED: "border-red-300 bg-red-50",
  COMPLETED: "border-green-300 bg-green-50",
};

const ACTIVITY_STATUS_LABELS: Record<RecoveryActivityStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  SUBMITTED: "Entregada",
  EVALUATED: "Evaluada",
};

const ACTIVITY_STATUS_COLORS: Record<RecoveryActivityStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  EVALUATED: "bg-green-100 text-green-700",
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  HOMEWORK: "Tarea",
  EXAM: "Examen",
  PROJECT: "Proyecto",
  PRACTICE: "Práctica",
};

type DetailTab = "info" | "activities" | "messages";
const requestStatusOptions: RecoveryRequestStatus[] = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
    const maybeMessage = (error as { message?: string }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: RecoveryRequestStatus, respondedAt?: string | null) {
  if (status === "PENDING") return respondedAt ? "Pendiente (cierre)" : "Pendiente de revision";
  if (status === "APPROVED") return "Aceptada";
  if (status === "REJECTED") return "Rechazada";
  return "Aprobaste";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status, respondedAt }: { status: RecoveryRequestStatus; respondedAt?: string | null }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {getStatusLabel(status, respondedAt)}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EstudianteRecuperacionesPage() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── State ────────────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<RecoveryRequest[]>([]);
  const [subjects, setSubjects] = useState<GroupSubject[]>([]);
  const [activities, setActivities] = useState<RecoveryActivity[]>([]);
  const [messages, setMessages] = useState<RecoveryMessage[]>([]);

  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<RecoveryRequestStatus | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<DetailTab>("info");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [periodActive, setPeriodActive] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodEndAt, setPeriodEndAt] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [showForm, setShowForm] = useState(false);

  // New request form
  const [subjectId, setSubjectId] = useState<string>("");
  const [requestType, setRequestType] = useState<RecoveryRequestType>("RECOVERY");
  const [reason, setReason] = useState("");

  // Message form
  const [messageBody, setMessageBody] = useState("");

  // ── Derived ──────────────────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    if (statusFilter === "ALL") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) ?? null,
    [requests, selectedRequestId],
  );

  const kpis = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "PENDING").length,
      approved: requests.filter((r) => r.status === "APPROVED").length,
      completed: requests.filter((r) => r.status === "COMPLETED").length,
      rejected: requests.filter((r) => r.status === "REJECTED").length,
      avgScore: (() => {
        const scored = requests.filter((r) => r.finalScore != null);
        if (!scored.length) return null;
        return (scored.reduce((a, r) => a + (r.finalScore ?? 0), 0) / scored.length).toFixed(1);
      })(),
    }),
    [requests],
  );

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadMain = useCallback(async () => {
    const studentId = Number(user?.id);
    if (!studentId) return;

    setLoading(true);
    setError(null);
    try {
      const [myRequests, mySubjects] = await Promise.all([
        recoveryApi.listMyRequests(),
        academicApi.listStudentSubjects(studentId).catch(() => [] as GroupSubject[]),
      ]);

      setRequests(myRequests);
      setSubjects(mySubjects);
      setSelectedRequestId((prev) => prev ?? myRequests[0]?.id ?? null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo cargar recuperaciones"));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadDetail = useCallback(async (requestId: number) => {
    setDetailLoading(true);
    try {
      const [activityList, messageList] = await Promise.all([
        recoveryApi.listActivities(requestId),
        recoveryApi.listMessages(requestId),
      ]);
      setActivities(activityList);
      setMessages(messageList);
    } catch {
      setActivities([]);
      setMessages([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadMain();
  }, [loadMain]);

  useEffect(() => {
    const run = async () => {
      try {
        const config = await recoverySettingsApi.getConfig();
        setPeriodActive(config.active);
        setPeriodEndAt(config.endAt ?? null);
      } catch {
        setPeriodActive(true);
        setPeriodEndAt(null);
      } finally {
        setPeriodLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedRequestId) {
      setActivities([]);
      setMessages([]);
      return;
    }
    loadDetail(selectedRequestId);
  }, [selectedRequestId, loadDetail]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (activeTab === "messages") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const onCreateRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }

    const parsedSubjectId = Number(subjectId);
    if (!parsedSubjectId || reason.trim().length < 10) {
      setError("Selecciona una materia y escribe un motivo de al menos 10 caracteres.");
      return;
    }

    try {
      setError(null);
      await recoveryApi.createRequest({
        subjectId: parsedSubjectId,
        type: requestType,
        reason: reason.trim(),
      });
      setReason("");
      setSubjectId("");
      setShowForm(false);
      showSuccess("Solicitud enviada correctamente.");
      await loadMain();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo crear la solicitud"));
    }
  };

  const onDeleteMyRequest = async () => {
    if (!selectedRequestId) return;
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }
    if (selectedRequest?.status !== "PENDING") {
      setError("Solo puedes eliminar solicitudes en estado Pendiente.");
      return;
    }
    if (!window.confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer.")) return;

    try {
      await recoveryApi.deleteRequest(selectedRequestId);
      setActivities([]);
      setMessages([]);
      showSuccess("Solicitud eliminada.");
      await loadMain();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo eliminar la solicitud"));
    }
  };

  const onSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRequestId || !messageBody.trim()) return;
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }

    try {
      await recoveryApi.createMessage(selectedRequestId, { body: messageBody.trim() });
      setMessageBody("");
      await loadDetail(selectedRequestId);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo enviar el mensaje"));
    }
  };

  const disabled = periodLoading || !periodActive;
  const periodRemainingMs = periodEndAt ? Math.max(0, new Date(periodEndAt).getTime() - nowMs) : 0;
  const periodDays = Math.floor(periodRemainingMs / 86400000);
  const periodHours = Math.floor((periodRemainingMs % 86400000) / 3600000);
  const periodMinutes = Math.floor((periodRemainingMs % 3600000) / 60000);
  const periodSeconds = Math.floor((periodRemainingMs % 60000) / 1000);
  const periodCountdown = periodActive && periodRemainingMs > 0
    ? `${periodDays}d ${String(periodHours).padStart(2, "0")}:${String(periodMinutes).padStart(2, "0")}:${String(periodSeconds).padStart(2, "0")}`
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recuperaciones</h1>
          <p className="mt-1 text-sm text-slate-500">Solicita recuperaciones, revisa tus actividades y comunícate con tu docente.</p>
        </div>
        <div className="flex items-center gap-3">
          {!periodLoading && (
            <div className="flex flex-col items-end gap-1">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${periodActive ? "border-green-300 bg-green-50 text-green-700" : "border-amber-300 bg-amber-50 text-amber-700"}`}
              >
                Periodo {periodActive ? "activo" : "inactivo"}
              </span>
              {periodCountdown && (
                <span className="text-xs font-mono text-slate-500">Cierra en: {periodCountdown}</span>
              )}
            </div>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowForm((p) => !p)}
            className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition"
          >
            {showForm ? "Cancelar" : "+ Nueva solicitud"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-3 text-base font-bold leading-none hover:text-red-900">✕</button>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
      )}
      {!periodLoading && !periodActive && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ El periodo de recuperación está inactivo. Solo puedes consultar la información.
        </div>
      )}
      {!periodLoading && periodActive && periodRemainingMs > 0 && periodRemainingMs <= 86400000 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          El periodo de recuperacion cierra en menos de 24 horas.
        </div>
      )}
      {!periodLoading && periodActive && periodRemainingMs > 86400000 && periodRemainingMs <= 259200000 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El periodo de recuperacion termina en menos de 3 dias.
        </div>
      )}

      {/* New request form */}
      {showForm && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="mb-3 font-semibold text-emerald-900">Nueva solicitud de recuperación</h2>
          <form onSubmit={onCreateRequest} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Materia *</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                >
                  <option value="">Selecciona una materia</option>
                  {subjects.map((item) => (
                    <option key={item.id} value={item.subject.id}>
                      {item.subject.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Tipo de solicitud</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as RecoveryRequestType)}
                >
                  <option value="RECOVERY">Recuperación</option>
                  <option value="REINFORCEMENT">Refuerzo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Motivo de la solicitud * (mín. 10 caracteres)</label>
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Explica por qué necesitas recuperación en esta materia..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <p className="mt-0.5 text-xs text-slate-400">{reason.length} caracteres</p>
            </div>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
            >
              Enviar solicitud
            </button>
          </form>
        </div>
      )}

      {/* KPIs */}
      {requests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Total", value: kpis.total, color: "text-slate-700" },
            { label: "Pendiente cierre", value: kpis.pending, color: "text-amber-700" },
            { label: "Aceptadas", value: kpis.approved, color: "text-blue-700" },
            { label: "Aprobaste", value: kpis.completed, color: "text-green-700" },
            ...(kpis.rejected > 0 ? [{ label: "Rechazadas", value: kpis.rejected, color: "text-red-700" }] : []),
            ...(kpis.avgScore != null ? [{ label: "Promedio nota", value: kpis.avgScore, color: "text-purple-700" }] : []),
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center min-w-[56px] sm:min-w-[70px]">
              <span className={`block text-lg font-bold ${kpi.color}`}>{kpi.value}</span>
              <span className="text-xs text-slate-500">{kpi.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* Left: Request list */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Mis solicitudes</h2>
            <select
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RecoveryRequestStatus | "ALL")}
            >
              <option value="ALL">Todas</option>
              {requestStatusOptions.map((s) => (
                <option key={s} value={s}>{STATUS_OPTION_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="max-h-[calc(100vh-300px)] min-h-48 overflow-y-auto p-2 space-y-1.5">
            {loading && <p className="py-8 text-center text-sm text-slate-400">Cargando...</p>}
            {!loading && filteredRequests.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <p className="text-2xl mb-1">📋</p>
                <p className="text-sm">
                  {requests.length === 0
                    ? "Aún no tienes solicitudes."
                    : "Sin solicitudes con este filtro."}
                </p>
                {requests.length === 0 && periodActive && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="mt-2 text-xs font-medium text-emerald-600 underline"
                  >
                    Crear primera solicitud
                  </button>
                )}
              </div>
            )}
            {filteredRequests.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedRequestId(item.id);
                  setActiveTab("info");
                }}
                className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition-all ${
                  selectedRequestId === item.id
                    ? `${STATUS_RING[item.status]} border-2`
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900 truncate">
                    {item.subject?.nombre ?? `Materia ${item.subjectId}`}
                  </p>
                  <StatusBadge status={item.status} respondedAt={item.respondedAt} />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {item.type === "RECOVERY" ? "Recuperación" : "Refuerzo"}
                  </span>
                  <span className="text-xs text-slate-400">{fmtDate(item.requestedAt)}</span>
                </div>
                {item.finalScore != null && (
                  <p className="mt-1 text-xs font-semibold text-green-700">Nota final: {item.finalScore}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="rounded-xl border border-slate-200 bg-white">
          {!selectedRequest ? (
            <div className="flex h-64 items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm">Selecciona una solicitud para ver el detalle</p>
              </div>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {selectedRequest.subject?.nombre ?? `Materia ${selectedRequest.subjectId}`}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedRequest.type === "RECOVERY" ? "Recuperación" : "Refuerzo"} · Solicitado {fmtDate(selectedRequest.requestedAt)}
                    </p>
                  </div>
                  <StatusBadge status={selectedRequest.status} respondedAt={selectedRequest.respondedAt} />
                </div>
                {/* Tabs */}
                <div className="mt-3 flex gap-1 flex-wrap">
                  {(["info", "activities", "messages"] as DetailTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                        activeTab === tab
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {tab === "info"
                        ? "Detalle"
                        : tab === "activities"
                          ? `Actividades${activities.length ? ` (${activities.length})` : ""}`
                          : `Mensajes${messages.length ? ` (${messages.length})` : ""}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="p-5">

                {/* INFO TAB */}
                {activeTab === "info" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700">
                      Flujo de estado: el docente primero <strong>acepta o rechaza</strong> tu solicitud.
                      Al final del proceso te deja en <strong>pendiente de cierre</strong> o <strong>aprobaste</strong>.
                    </div>
                    <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-3">
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Estado</p>
                          <StatusBadge status={selectedRequest.status} respondedAt={selectedRequest.respondedAt} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Tipo</p>
                          <p className="font-medium text-slate-800">
                            {selectedRequest.type === "RECOVERY" ? "Recuperación" : "Refuerzo"}
                          </p>
                        </div>
                        {selectedRequest.dueDate && (
                          <div>
                            <p className="text-xs text-slate-500">Fecha límite</p>
                            <p className="font-semibold text-amber-700">{fmtDateTime(selectedRequest.dueDate)}</p>
                          </div>
                        )}
                        {selectedRequest.finalScore != null && (
                          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-center">
                            <p className="text-xs text-green-600">Nota final</p>
                            <p className="text-2xl font-bold text-green-700">{selectedRequest.finalScore}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Tu motivo</p>
                        <p className="mt-0.5 text-slate-700 whitespace-pre-wrap">{selectedRequest.reason}</p>
                      </div>
                    </div>

                    {selectedRequest.teacherComment && (
                      <div className="rounded-lg border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3">
                        <p className="text-xs font-semibold text-emerald-700 mb-1">
                          Comentario del docente
                          {selectedRequest.teacher
                            ? ` — ${selectedRequest.teacher.nombres} ${selectedRequest.teacher.apellidos}`
                            : ""}
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRequest.teacherComment}</p>
                      </div>
                    )}

                    {selectedRequest.status === "REJECTED" && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm font-medium text-red-700">Tu solicitud fue rechazada.</p>
                        <p className="text-xs text-red-600 mt-0.5">
                          {selectedRequest.teacherComment
                            ? "Consulta el comentario del docente arriba."
                            : "Puedes comunicarte con tu docente en la pestaña Mensajes."}
                        </p>
                      </div>
                    )}

                    {selectedRequest.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={onDeleteMyRequest}
                        disabled={disabled}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Eliminar solicitud pendiente
                      </button>
                    )}
                  </div>
                )}

                {/* ACTIVITIES TAB */}
                {activeTab === "activities" && (
                  <div className="space-y-3">
                    {detailLoading && <p className="text-sm text-slate-500">Cargando...</p>}
                    {!detailLoading && activities.length === 0 && (
                      <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-slate-400">
                        <p className="text-2xl mb-1">📝</p>
                        <p className="text-sm">Aún no hay actividades asignadas.</p>
                        <p className="text-xs mt-1">El docente las publicará cuando apruebe tu solicitud.</p>
                      </div>
                    )}
                    {activities.map((item) => (
                      <ActivityCard key={item.id} item={item} />
                    ))}
                  </div>
                )}

                {/* MESSAGES TAB */}
                {activeTab === "messages" && (
                  <div className="space-y-3">
                    {detailLoading && <p className="text-sm text-slate-500">Cargando mensajes...</p>}
                    <div className="max-h-80 overflow-y-auto space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      {messages.length === 0 && !detailLoading && (
                        <p className="py-4 text-center text-sm text-slate-400">Sin mensajes. Puedes escribirle a tu docente.</p>
                      )}
                      {messages.map((msg) => {
                        const isMe = msg.authorId === Number(user?.id);
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-full sm:max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                isMe
                                  ? "rounded-br-none bg-emerald-600 text-white"
                                  : "rounded-bl-none border border-slate-200 bg-white text-slate-800"
                              }`}
                            >
                              {!isMe && (
                                <p className="mb-0.5 text-xs font-semibold text-slate-500">
                                  {msg.author
                                    ? `${msg.author.nombres} ${msg.author.apellidos}`
                                    : `Docente ${msg.authorId}`}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap">{msg.body}</p>
                              <p className={`mt-0.5 text-xs ${isMe ? "text-emerald-200" : "text-slate-400"}`}>
                                {fmtDateTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    {selectedRequest.status !== "REJECTED" && selectedRequest.status !== "COMPLETED" && (
                      <form onSubmit={onSendMessage} className="flex gap-2">
                        <input
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          placeholder="Escribe un mensaje a tu docente..."
                          value={messageBody}
                          onChange={(e) => setMessageBody(e.target.value)}
                          disabled={disabled}
                        />
                        <button
                          type="submit"
                          disabled={disabled || !messageBody.trim()}
                          className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                        >
                          Enviar
                        </button>
                      </form>
                    )}
                    {(selectedRequest.status === "REJECTED" || selectedRequest.status === "COMPLETED") && (
                      <p className="text-center text-xs text-slate-400">Esta solicitud ya está cerrada.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ActivityCard ──────────────────────────────────────────────────────────────

function ActivityCard({ item }: { item: RecoveryActivity }) {
  const [expanded, setExpanded] = useState(false);

  const overdue =
    item.status !== "EVALUATED" &&
    item.status !== "SUBMITTED" &&
    new Date(item.dueAt) < new Date();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900">{item.title}</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITY_STATUS_COLORS[item.status]}`}>
              {ACTIVITY_STATUS_LABELS[item.status]}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
              {ACTIVITY_TYPE_LABELS[item.activityType] ?? item.activityType}
            </span>
            {overdue && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                Vencida
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Entrega: {fmtDateTime(item.dueAt)}
            {item.score != null ? ` · Nota: ${item.score}` : ""}
            {item.hasAttachment ? " · 📎 Adjunto" : ""}
          </p>
        </div>
        <span className="mt-1 text-xs text-slate-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 px-4 py-3 space-y-2">
          <p className="text-sm text-slate-700">{item.description}</p>
          {item.startAt && <p className="text-xs text-slate-500">Inicio: {fmtDateTime(item.startAt)}</p>}
          {item.score != null && (
            <div className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5">
              <span className="text-xs text-green-600">Nota obtenida:</span>
              <span className="text-lg font-bold text-green-700">{item.score}</span>
            </div>
          )}
          {item.hasAttachment && (
            <a
              href={recoveryApi.getActivityAttachmentUrl(item.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium text-blue-600 underline"
            >
              📎 Ver adjunto del docente
            </a>
          )}
        </div>
      )}
    </div>
  );
}
