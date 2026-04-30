"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecoveryChat } from "@/hooks/useRecoveryChat";
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
  PENDING: "bg-rec-warning-bg text-rec-warning-text border-rec-warning-border",
  APPROVED: "bg-rec-info-bg-strong text-rec-info-text border-rec-info-border",
  REJECTED: "bg-rec-danger-bg-strong text-rec-danger-text border-rec-danger-border",
  COMPLETED: "bg-rec-success-bg text-rec-success-text border-rec-success-border",
};

const STATUS_RING: Record<RecoveryRequestStatus, string> = {
  PENDING: "border-rec-warning-border bg-rec-warning-bg",
  APPROVED: "border-rec-info-border bg-rec-info-bg",
  REJECTED: "border-rec-danger-border bg-rec-danger-bg",
  COMPLETED: "border-rec-success-border bg-rec-success-bg",
};

const ACTIVITY_STATUS_LABELS: Record<RecoveryActivityStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  SUBMITTED: "Entregada",
  EVALUATED: "Evaluada",
};

const ACTIVITY_STATUS_COLORS: Record<RecoveryActivityStatus, string> = {
  PENDING: "bg-rec-bg-muted text-rec-text-muted",
  IN_PROGRESS: "bg-rec-info-bg-strong text-rec-info-text",
  SUBMITTED: "bg-rec-warning-bg text-rec-warning-text",
  EVALUATED: "bg-rec-success-bg text-rec-success-text",
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
  const [initialMessages, setInitialMessages] = useState<RecoveryMessage[]>([]);

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
  const { messages, sendMessage, isConnected } = useRecoveryChat(selectedRequestId, initialMessages);

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
      const activityList = await recoveryApi.listActivities(requestId);
      setActivities(activityList);
    } catch {
      setActivities([]);
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
      setInitialMessages([]);
      return;
    }
    loadDetail(selectedRequestId);
    recoveryApi
      .listMessages(selectedRequestId)
      .then((data) => setInitialMessages(data))
      .catch(() => setInitialMessages([]));
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
      setInitialMessages([]);
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
      sendMessage(messageBody);
      setMessageBody("");
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
      <div
        id="tour-est-rec-header"
        className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border p-4 sm:p-6 text-rec-text-on-media"
        style={{
          borderColor: "var(--rec-soft)",
          background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
        }}
      >
        <div>
          <h1 className="text-2xl font-bold">Recuperaciones</h1>
          <p className="mt-1 text-sm text-rec-text-on-media/90">Solicita recuperaciones, revisa tus actividades y comunícate con tu docente.</p>
        </div>
        <div className="flex items-center gap-3">
          {!periodLoading && (
            <div className="flex flex-col items-end gap-1">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${periodActive ? "text-rec-text-on-media" : "border-rec-warning-border bg-rec-warning-bg text-rec-warning-text"}`}
                style={periodActive ? { borderColor: "var(--rec-border-default)", background: "var(--rec-glass-bg)" } : undefined}
              >
                Periodo {periodActive ? "activo" : "inactivo"}
              </span>
              {periodCountdown && (
                <span className="text-xs font-mono text-rec-text-on-media/85">Cierra en: {periodCountdown}</span>
              )}
            </div>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowForm((p) => !p)}
            className="rounded-lg bg-gradient-to-r from-[var(--rec-primary)] to-[var(--rec-primary-strong)] px-4 py-2 text-sm font-semibold text-rec-text-on-media shadow-sm hover:from-[var(--rec-primary-strong)] hover:to-[var(--rec-primary-strong)] disabled:opacity-50 transition"
          >
            {showForm ? "Cancelar" : "+ Nueva solicitud"}
          </button>
        </div>
      </div>

      <div id="tour-est-rec-avisos" className="space-y-3">
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-rec-danger-border bg-rec-danger-bg px-4 py-3 text-sm text-rec-danger-text">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="ml-3 text-base font-bold leading-none hover:text-rec-danger-text">✕</button>
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-rec-success-border bg-rec-success-bg px-4 py-3 text-sm text-rec-success-text">{success}</div>
        )}
        {!periodLoading && !periodActive && (
          <div className="rounded-lg border border-rec-warning-border bg-rec-warning-bg px-4 py-3 text-sm text-rec-warning-text">
            ⚠️ El periodo de recuperación está inactivo. Solo puedes consultar la información.
          </div>
        )}
        {!periodLoading && periodActive && periodRemainingMs > 0 && periodRemainingMs <= 86400000 && (
          <div className="rounded-lg border border-rec-danger-border bg-rec-danger-bg px-4 py-3 text-sm text-rec-danger-text">
            El periodo de recuperacion cierra en menos de 24 horas.
          </div>
        )}
        {!periodLoading && periodActive && periodRemainingMs > 86400000 && periodRemainingMs <= 259200000 && (
          <div className="rounded-lg border border-rec-warning-border bg-rec-warning-bg px-4 py-3 text-sm text-rec-warning-text">
            El periodo de recuperacion termina en menos de 3 dias.
          </div>
        )}
      </div>

      <div id="tour-est-rec-form">
      {showForm && (
        <div className="rounded-xl border border-rec-success-border bg-rec-success-bg p-5">
          <h2 className="mb-3 font-semibold text-rec-text-primary">Nueva solicitud de recuperación</h2>
          <form onSubmit={onCreateRequest} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-rec-text-muted">Materia *</label>
                <select
                  className="w-full rounded-lg border border-rec-border-strong bg-rec-bg-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rec-primary"
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
                <label className="mb-1 block text-xs font-medium text-rec-text-muted">Tipo de solicitud</label>
                <select
                  className="w-full rounded-lg border border-rec-border-strong bg-rec-bg-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rec-primary"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as RecoveryRequestType)}
                >
                  <option value="RECOVERY">Recuperación</option>
                  <option value="REINFORCEMENT">Refuerzo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-rec-text-muted">Motivo de la solicitud * (mín. 10 caracteres)</label>
              <textarea
                className="min-h-20 w-full rounded-lg border border-rec-border-strong bg-rec-bg-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rec-primary"
                placeholder="Explica por qué necesitas recuperación en esta materia..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <p className="mt-0.5 text-xs text-rec-text-subtle">{reason.length} caracteres</p>
            </div>
            <button
              type="submit"
              disabled={disabled}
              className="rounded-lg bg-gradient-to-r from-[var(--rec-primary)] to-[var(--rec-primary-strong)] px-5 py-2 text-sm font-semibold text-rec-text-on-media shadow-sm hover:from-[var(--rec-primary-strong)] hover:to-[var(--rec-primary-strong)] disabled:opacity-50"
            >
              Enviar solicitud
            </button>
          </form>
        </div>
      )}
      </div>

      <div id="tour-est-rec-kpis">
        {requests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Total", value: kpis.total, color: "text-rec-text-secondary" },
              { label: "Pendiente cierre", value: kpis.pending, color: "text-rec-warning-text" },
              { label: "Aceptadas", value: kpis.approved, color: "text-rec-info-text" },
              { label: "Aprobaste", value: kpis.completed, color: "text-rec-success-text" },
              ...(kpis.rejected > 0 ? [{ label: "Rechazadas", value: kpis.rejected, color: "text-rec-danger-text" }] : []),
              ...(kpis.avgScore != null ? [{ label: "Promedio nota", value: kpis.avgScore, color: "text-rec-text-secondary" }] : []),
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-rec-border-default bg-rec-bg-elevated px-3 py-1.5 text-center min-w-[56px] sm:min-w-[70px]">
                <span className={`block text-lg font-bold ${kpi.color}`}>{kpi.value}</span>
                <span className="text-xs text-rec-text-subtle">{kpi.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div id="tour-est-rec-layout" className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* Left: Request list */}
        <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated">
          <div className="flex items-center justify-between border-b border-rec-border-default px-4 py-3">
            <h2 className="font-semibold text-rec-text-primary">Mis solicitudes</h2>
            <select
              className="rounded-md border border-rec-border-default bg-rec-bg-base px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-rec-primary"
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
            {loading && <p className="py-8 text-center text-sm text-rec-text-subtle">Cargando...</p>}
            {!loading && filteredRequests.length === 0 && (
              <div className="py-8 text-center text-rec-text-subtle">
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
                    className="mt-2 text-xs font-medium text-rec-primary underline"
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
                    : "border-rec-border-subtle hover:border-rec-border-default hover:bg-rec-bg-base"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-rec-text-primary truncate">
                    {item.subject?.nombre ?? `Materia ${item.subjectId}`}
                  </p>
                  <StatusBadge status={item.status} respondedAt={item.respondedAt} />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded bg-rec-bg-muted px-1.5 py-0.5 text-xs text-rec-text-muted">
                    {item.type === "RECOVERY" ? "Recuperación" : "Refuerzo"}
                  </span>
                  <span className="text-xs text-rec-text-subtle">{fmtDate(item.requestedAt)}</span>
                </div>
                {item.finalScore != null && (
                  <p className="mt-1 text-xs font-semibold text-rec-success-text">Nota final: {item.finalScore}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated">
          {!selectedRequest ? (
            <div className="flex h-64 items-center justify-center text-rec-text-subtle">
              <div className="text-center">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm">Selecciona una solicitud para ver el detalle</p>
              </div>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="border-b border-rec-border-default px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-rec-text-primary">
                      {selectedRequest.subject?.nombre ?? `Materia ${selectedRequest.subjectId}`}
                    </h3>
                    <p className="text-sm text-rec-text-subtle">
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
                          ? "bg-gradient-to-r from-[var(--rec-primary)] to-[var(--rec-primary-strong)] text-rec-text-on-media shadow-sm"
                          : "border border-rec-border-default text-rec-text-muted hover:bg-rec-bg-base"
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
                    <div className="rounded-lg border border-rec-info-border bg-rec-info-bg px-4 py-2 text-xs text-rec-info-text">
                      Flujo de estado: el docente primero <strong>acepta o rechaza</strong> tu solicitud.
                      Al final del proceso te deja en <strong>pendiente de cierre</strong> o <strong>aprobaste</strong>.
                    </div>
                    <div className="rounded-lg bg-rec-bg-base p-4 text-sm space-y-3">
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-rec-text-subtle">Estado</p>
                          <StatusBadge status={selectedRequest.status} respondedAt={selectedRequest.respondedAt} />
                        </div>
                        <div>
                          <p className="text-xs text-rec-text-subtle">Tipo</p>
                          <p className="font-medium text-rec-text-primary">
                            {selectedRequest.type === "RECOVERY" ? "Recuperación" : "Refuerzo"}
                          </p>
                        </div>
                        {selectedRequest.dueDate && (
                          <div>
                            <p className="text-xs text-rec-text-subtle">Fecha límite</p>
                            <p className="font-semibold text-rec-warning-text">{fmtDateTime(selectedRequest.dueDate)}</p>
                          </div>
                        )}
                        {selectedRequest.finalScore != null && (
                          <div className="rounded-lg border border-rec-success-border bg-rec-success-bg px-4 py-2 text-center">
                            <p className="text-xs text-rec-success-text">Nota final</p>
                            <p className="text-2xl font-bold text-rec-success-text">{selectedRequest.finalScore}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-rec-text-subtle">Tu motivo</p>
                        <p className="mt-0.5 text-rec-text-secondary whitespace-pre-wrap">{selectedRequest.reason}</p>
                      </div>
                    </div>

                    {selectedRequest.teacherComment && (
                      <div className="rounded-lg border-l-4 border-rec-success-border bg-rec-success-bg px-4 py-3">
                        <p className="text-xs font-semibold text-rec-success-text mb-1">
                          Comentario del docente
                          {selectedRequest.teacher
                            ? ` — ${selectedRequest.teacher.nombres} ${selectedRequest.teacher.apellidos}`
                            : ""}
                        </p>
                        <p className="text-sm text-rec-text-secondary whitespace-pre-wrap">{selectedRequest.teacherComment}</p>
                      </div>
                    )}

                    {selectedRequest.status === "REJECTED" && (
                      <div className="rounded-lg border border-rec-danger-border bg-rec-danger-bg px-4 py-3">
                        <p className="text-sm font-medium text-rec-danger-text">Tu solicitud fue rechazada.</p>
                        <p className="text-xs text-rec-danger-text mt-0.5">
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
                        className="rounded-lg border border-rec-danger-border bg-rec-danger-bg px-4 py-2 text-sm font-semibold text-rec-danger-text hover:bg-rec-danger-bg-strong disabled:opacity-50"
                      >
                        Eliminar solicitud pendiente
                      </button>
                    )}
                  </div>
                )}

                {/* ACTIVITIES TAB */}
                {activeTab === "activities" && (
                  <div className="space-y-3">
                    {detailLoading && <p className="text-sm text-rec-text-subtle">Cargando...</p>}
                    {!detailLoading && activities.length === 0 && (
                      <div className="rounded-lg border-2 border-dashed border-rec-border-default p-6 text-center text-rec-text-subtle">
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
                    <div className="flex items-center gap-2 text-xs text-rec-text-subtle">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${isConnected ? "bg-rec-success-text" : "bg-rec-text-subtle"}`}
                      />
                      {isConnected ? "Conectado en tiempo real" : "Sin conexión en tiempo real"}
                    </div>
                    {detailLoading && <p className="text-sm text-rec-text-subtle">Cargando mensajes...</p>}
                    <div className="max-h-80 overflow-y-auto space-y-2 rounded-lg border border-rec-border-default bg-rec-bg-base p-3">
                      {messages.length === 0 && !detailLoading && (
                        <p className="py-4 text-center text-sm text-rec-text-subtle">Sin mensajes. Puedes escribirle a tu docente.</p>
                      )}
                      {messages.map((msg) => {
                        const isMe = msg.authorId === Number(user?.id);
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-full sm:max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                isMe
                                  ? "rounded-br-none bg-rec-primary text-rec-text-on-media"
                                  : "rounded-bl-none border border-rec-border-default bg-rec-bg-elevated text-rec-text-primary"
                              }`}
                            >
                              {!isMe && (
                                <p className="mb-0.5 text-xs font-semibold text-rec-text-subtle">
                                  {msg.author
                                    ? `${msg.author.nombres} ${msg.author.apellidos}`
                                    : `Docente ${msg.authorId}`}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap">{msg.body}</p>
                              <p className={`mt-0.5 text-xs ${isMe ? "text-rec-success-text" : "text-rec-text-subtle"}`}>
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
                          className="flex-1 rounded-lg border border-rec-border-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rec-primary"
                          placeholder="Escribe un mensaje a tu docente..."
                          value={messageBody}
                          onChange={(e) => setMessageBody(e.target.value)}
                          disabled={disabled}
                        />
                        <button
                          type="submit"
                          disabled={disabled || !messageBody.trim()}
                          className="rounded-lg bg-gradient-to-r from-[var(--rec-primary)] to-[var(--rec-primary-strong)] px-4 py-2 text-sm font-semibold text-rec-text-on-media shadow-sm hover:from-[var(--rec-primary-strong)] hover:to-[var(--rec-primary-strong)] disabled:opacity-50"
                        >
                          Enviar
                        </button>
                      </form>
                    )}
                    {(selectedRequest.status === "REJECTED" || selectedRequest.status === "COMPLETED") && (
                      <p className="text-center text-xs text-rec-text-subtle">Esta solicitud ya está cerrada.</p>
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
    <div className="overflow-hidden rounded-lg border border-rec-border-default bg-rec-bg-elevated">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-rec-bg-base"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-rec-text-primary">{item.title}</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITY_STATUS_COLORS[item.status]}`}>
              {ACTIVITY_STATUS_LABELS[item.status]}
            </span>
            <span className="rounded bg-rec-bg-muted px-1.5 py-0.5 text-xs text-rec-text-muted">
              {ACTIVITY_TYPE_LABELS[item.activityType] ?? item.activityType}
            </span>
            {overdue && (
              <span className="rounded-full bg-rec-danger-bg-strong px-2 py-0.5 text-xs font-semibold text-rec-danger-text">
                Vencida
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-rec-text-subtle">
            Entrega: {fmtDateTime(item.dueAt)}
            {item.score != null ? ` · Nota: ${item.score}` : ""}
            {item.hasAttachment ? " · 📎 Adjunto" : ""}
          </p>
        </div>
        <span className="mt-1 text-xs text-rec-text-subtle">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-rec-border-default px-4 py-3 space-y-2">
          <p className="text-sm text-rec-text-secondary">{item.description}</p>
          {item.startAt && <p className="text-xs text-rec-text-subtle">Inicio: {fmtDateTime(item.startAt)}</p>}
          {item.score != null && (
            <div className="inline-flex items-center gap-1 rounded-lg border border-rec-success-border bg-rec-success-bg px-3 py-1.5">
              <span className="text-xs text-rec-success-text">Nota obtenida:</span>
              <span className="text-lg font-bold text-rec-success-text">{item.score}</span>
            </div>
          )}
          {item.hasAttachment && (
            <a
              href={recoveryApi.getActivityAttachmentUrl(item.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium text-rec-info-text underline"
            >
              📎 Ver adjunto del docente
            </a>
          )}
        </div>
      )}
    </div>
  );
}
