"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import {
  recoveryApi,
  type RecoveryActivity,
  type RecoveryActivityStatus,
  type RecoveryActivityType,
  type RecoveryMessage,
  type RecoveryRequest,
  type RecoveryRequestStatus,
} from "@/lib/recoveryApi";
import { recoverySettingsApi } from "@/lib/recoverySettingsApi";

// Constants

const STATUS_OPTION_LABELS: Record<RecoveryRequestStatus, string> = {
  PENDING: "Pendiente (cierre)",
  APPROVED: "Aceptada (proceso)",
  REJECTED: "Rechazada",
  COMPLETED: "Aprobaste",
};

const STATUS_COLORS: Record<RecoveryRequestStatus, string> = {
  PENDING: "bg-rec-warning-bg text-rec-warning-text border-rec-warning-border",
  APPROVED: "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)] border-[color:var(--rec-soft)]",
  REJECTED: "bg-rec-danger-bg-strong text-rec-danger-text border-rec-danger-border",
  COMPLETED: "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)] border-[color:var(--rec-soft)]",
};

const STATUS_RING: Record<RecoveryRequestStatus, string> = {
  PENDING: "border-rec-warning-border bg-rec-warning-bg",
  APPROVED: "border-[color:var(--rec-primary)] bg-[color:var(--rec-soft)]",
  REJECTED: "border-rec-danger-border bg-rec-danger-bg",
  COMPLETED: "border-[color:var(--rec-primary)] bg-[color:var(--rec-soft)]",
};

const ACTIVITY_TYPE_LABELS: Record<RecoveryActivityType, string> = {
  HOMEWORK: "Tarea",
  EXAM: "Examen",
  PROJECT: "Proyecto",
  PRACTICE: "Práctica",
};

const ACTIVITY_STATUS_LABELS: Record<RecoveryActivityStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  SUBMITTED: "Entregada",
  EVALUATED: "Evaluada",
};

const ACTIVITY_STATUS_COLORS: Record<RecoveryActivityStatus, string> = {
  PENDING: "bg-rec-bg-muted text-rec-text-secondary",
  IN_PROGRESS: "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)]",
  SUBMITTED: "bg-rec-warning-bg text-rec-warning-text",
  EVALUATED: "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)]",
};

const requestStatusOptions: RecoveryRequestStatus[] = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"];
const activityTypeOptions: RecoveryActivityType[] = ["HOMEWORK", "EXAM", "PROJECT", "PRACTICE"];

type DetailTab = "info" | "activities" | "messages";

// Helpers

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
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "--";
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

// Sub-components

function StatusBadge({ status, respondedAt }: { status: RecoveryRequestStatus; respondedAt?: string | null }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {getStatusLabel(status, respondedAt)}
    </span>
  );
}

function ActivityBadge({ status }: { status: RecoveryActivityStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTIVITY_STATUS_COLORS[status]}`}>
      {ACTIVITY_STATUS_LABELS[status]}
    </span>
  );
}

// Main Component

export default function DocenteRecuperacionesPage() {
  const { user } = useAuth();

  // ���� State ����������������������������������������������������������������������������������������������������������������������������������������
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [requests, setRequests] = useState<RecoveryRequest[]>([]);
  const [activities, setActivities] = useState<RecoveryActivity[]>([]);
  const [messages, setMessages] = useState<RecoveryMessage[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
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

  // Request status form
  const [status, setStatus] = useState<RecoveryRequestStatus>("PENDING");
  const [teacherComment, setTeacherComment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [finalScore, setFinalScore] = useState("");

  // Activity form
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityType, setActivityType] = useState<RecoveryActivityType>("HOMEWORK");
  const [activityStartAt, setActivityStartAt] = useState("");
  const [activityDueAt, setActivityDueAt] = useState("");
  const [activityFile, setActivityFile] = useState<File | null>(null);
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  // Message
  const [messageBody, setMessageBody] = useState("");

  // Derived
  const groups = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>();
    assignments.forEach((item) => {
      if (!item.group?.id) return;
      map.set(item.group.id, {
        id: item.group.id,
        label: `${item.group.grade?.nombre ?? item.group.gradeId ?? "Grado"} - ${item.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

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
    }),
    [requests],
  );

  // Loaders
  const loadAssignments = useCallback(async () => {
    const teacherId = Number(user?.id);
    if (!teacherId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await academicApi.listTeacherAssignments(teacherId);
      setAssignments(data);
      setSelectedGroupId((prev) => prev ?? data[0]?.group?.id ?? null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudieron cargar asignaciones"));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadRequestsByGroup = useCallback(async (groupId: number) => {
    setError(null);
    try {
      const data = await recoveryApi.listGroupRequests(groupId);
      setRequests(data);
      setSelectedRequestId((prev) => prev ?? data[0]?.id ?? null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudieron cargar solicitudes"));
      setRequests([]);
      setSelectedRequestId(null);
    }
  }, []);

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

  // Effects
  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

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
    if (!selectedGroupId) {
      setRequests([]);
      setSelectedRequestId(null);
      return;
    }
    loadRequestsByGroup(selectedGroupId);
  }, [selectedGroupId, loadRequestsByGroup]);

  useEffect(() => {
    if (!selectedRequestId) {
      setActivities([]);
      setMessages([]);
      return;
    }
    loadDetail(selectedRequestId);
    const current = requests.find((item) => item.id === selectedRequestId);
    if (current) {
      setStatus(current.status);
      setTeacherComment(current.teacherComment ?? "");
      setDueDate(current.dueDate ? new Date(current.dueDate).toISOString().slice(0, 16) : "");
      setFinalScore(current.finalScore != null ? String(current.finalScore) : "");
    }
  }, [selectedRequestId, requests, loadDetail]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  // Actions
  const onUpdateRequestStatus = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRequestId) return;
    if (periodLoading || !periodActive) { setError("El periodo de recuperación está inactivo."); return; }
    if (status === "COMPLETED" && !finalScore) {
      setError("Para marcar como 'Aprobaste' debes registrar una nota final.");
      return;
    }
    try {
      await recoveryApi.updateRequestStatus(selectedRequestId, {
        status,
        teacherComment: teacherComment.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        finalScore: finalScore ? Number(finalScore) : undefined,
      });
      showSuccess("Estado actualizado correctamente.");
      if (selectedGroupId) await loadRequestsByGroup(selectedGroupId);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo actualizar la solicitud"));
    }
  };

  const onCreateActivity = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRequestId || !activityTitle.trim() || !activityDescription.trim() || !activityDueAt) return;
    if (periodLoading || !periodActive) { setError("El periodo de recuperación está inactivo."); return; }
    try {
      const created = await recoveryApi.createActivity(selectedRequestId, {
        title: activityTitle.trim(),
        description: activityDescription.trim(),
        activityType,
        startAt: activityStartAt ? new Date(activityStartAt).toISOString() : undefined,
        dueAt: new Date(activityDueAt).toISOString(),
      });
      if (activityFile) await recoveryApi.uploadActivityAttachment(created.id, activityFile);
      setActivityTitle(""); setActivityDescription(""); setActivityStartAt(""); setActivityDueAt(""); setActivityFile(null);
      setActivityFormOpen(false);
      showSuccess("Actividad creada correctamente.");
      await loadDetail(selectedRequestId);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo crear la actividad"));
    }
  };

  const onUploadActivityAttachment = async (activityId: number, file: File) => {
    if (periodLoading || !periodActive) { setError("El periodo de recuperación está inactivo."); return; }
    try {
      await recoveryApi.uploadActivityAttachment(activityId, file);
      if (selectedRequestId) await loadDetail(selectedRequestId);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo cargar el adjunto"));
    }
  };

  const onUpdateActivityQuick = async (activityId: number, nextStatus: RecoveryActivityStatus, scoreText: string) => {
    if (periodLoading || !periodActive) { setError("El periodo de recuperación está inactivo."); return; }
    try {
      await recoveryApi.updateActivity(activityId, { status: nextStatus, score: scoreText ? Number(scoreText) : undefined });
      if (selectedRequestId) await loadDetail(selectedRequestId);
      showSuccess("Actividad actualizada.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo actualizar la actividad"));
    }
  };

  const onDeleteRequest = async () => {
    if (!selectedRequestId) return;
    if (periodLoading || !periodActive) { setError("El periodo de recuperación está inactivo."); return; }
    if (!window.confirm("¿Eliminar esta solicitud y todo su historial de actividades y mensajes?")) return;
    try {
      await recoveryApi.deleteRequest(selectedRequestId);
      setActivities([]); setMessages([]);
      if (selectedGroupId) await loadRequestsByGroup(selectedGroupId);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo eliminar la solicitud"));
    }
  };

  const onDeleteActivity = async (activityId: number) => {
    if (periodLoading || !periodActive) { setError("El periodo de recuperación está inactivo."); return; }
    if (!window.confirm("¿Eliminar esta actividad?")) return;
    try {
      await recoveryApi.deleteActivity(activityId);
      if (selectedRequestId) await loadDetail(selectedRequestId);
      showSuccess("Actividad eliminada.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo eliminar la actividad"));
    }
  };

  const onSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRequestId || !messageBody.trim()) return;
    if (periodLoading || !periodActive) { setError("El periodo de recuperación está inactivo."); return; }
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

  // Render
  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        id="tour-rec-header"
        className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border p-4 sm:p-6 text-rec-text-on-media"
        style={{
          borderColor: "var(--rec-soft)",
          background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
        }}
      >
        <div>
          <h1 className="text-2xl font-bold">Recuperaciones</h1>
          <p className="mt-1 text-sm text-rec-text-on-media/90">Gestiona solicitudes, asigna actividades y comunícate con estudiantes.</p>
        </div>
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
      </div>

      {/* Notifications */}
      <div
        id="tour-rec-periodo"
        className="rounded-xl border bg-rec-bg-elevated p-3 space-y-2"
        style={{ borderColor: "var(--rec-soft)" }}
      >
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-rec-text-subtle">Estado del periodo y alertas</p>
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-rec-danger-border bg-rec-danger-bg px-4 py-3 text-sm text-rec-danger-text">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="ml-3 text-base font-bold leading-none hover:text-rec-danger-text">x</button>
          </div>
        )}
        {success && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ border: "1px solid var(--rec-soft)", background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>{success}</div>
        )}
        {!periodLoading && !periodActive && (
          <div className="rounded-lg border border-rec-warning-border bg-rec-warning-bg px-4 py-3 text-sm text-rec-warning-text">
            El periodo de recuperacion esta inactivo. Solo puedes consultar la informacion.
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

      {/* Group selector + KPIs */}
      <div id="tour-rec-panel" className="rounded-xl border bg-rec-bg-elevated p-4" style={{ borderColor: "var(--rec-soft)" }}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-rec-text-subtle">Panel operativo</p>
        <div className="flex flex-wrap items-center gap-4">
          {loading && <span className="text-sm text-rec-text-subtle">Cargando grupos...</span>}
          {!loading && groups.length === 0 && (
            <p className="text-sm text-rec-text-subtle">No tienes grupos asignados.</p>
          )}
          {!loading && groups.length > 0 && (
            <select
              className="rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
              style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
              value={selectedGroupId ?? ""}
              onChange={(e) => {
                setSelectedGroupId(Number(e.target.value) || null);
                setSelectedRequestId(null);
                setStatusFilter("ALL");
              }}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          )}
          {requests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Total", value: kpis.total, color: "text-rec-text-secondary" },
                { label: "Pendiente cierre", value: kpis.pending, color: "text-rec-warning-text" },
                { label: "Aceptadas", value: kpis.approved, color: "text-[color:var(--rec-primary-strong)]" },
                { label: "Aprobaste", value: kpis.completed, color: "text-[color:var(--rec-primary-strong)]" },
                ...(kpis.rejected > 0 ? [{ label: "Rechazadas", value: kpis.rejected, color: "text-rec-danger-text" }] : []),
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-lg border border-rec-border-default bg-rec-bg-elevated px-3 py-1.5 text-center min-w-[56px] sm:min-w-[64px]">
                  <span className={`block text-lg font-bold ${kpi.color}`}>{kpi.value}</span>
                  <span className="text-xs text-rec-text-subtle">{kpi.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main two-column layout */}
      <div id="tour-rec-layout" className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        {/* Left: Request list */}
        <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated">
          <div className="flex items-center justify-between border-b border-rec-border-default px-4 py-3">
            <h2 className="font-semibold text-rec-text-primary">Solicitudes</h2>
            <select
              className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[color:var(--rec-primary)]"
              style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RecoveryRequestStatus | "ALL")}
            >
              <option value="ALL">Todos los estados</option>
              {requestStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {STATUS_OPTION_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-[calc(100vh-300px)] min-h-48 overflow-y-auto p-2 space-y-1.5">
            {filteredRequests.length === 0 && (
              <div className="py-8 text-center text-rec-text-subtle">
                <p className="text-sm font-semibold">Sin datos</p>
                <p className="text-sm">
                  {requests.length === 0 ? "Sin solicitudes en este grupo." : "Sin solicitudes con este filtro."}
                </p>
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
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-rec-text-primary">
                      {item.student
                        ? `${item.student.nombres} ${item.student.apellidos}`
                        : `Estudiante ${item.studentId}`}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-rec-text-subtle">
                      {item.subject?.nombre ?? `Materia ${item.subjectId}`}
                    </p>
                  </div>
                  <StatusBadge status={item.status} respondedAt={item.respondedAt} />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="rounded bg-rec-bg-muted px-1.5 py-0.5 text-xs text-rec-text-muted">
                    {item.type === "RECOVERY" ? "Recuperación" : "Refuerzo"}
                  </span>
                  <span className="text-xs text-rec-text-subtle">{fmtDate(item.requestedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div id="tour-rec-detalle" className="rounded-xl border border-rec-border-default bg-rec-bg-elevated">
          {!selectedRequest ? (
            <div className="flex h-64 items-center justify-center text-rec-text-subtle">
              <div className="text-center">
                <p className="text-sm font-semibold">Sin solicitud seleccionada</p>
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
                      {selectedRequest.student
                        ? `${selectedRequest.student.nombres} ${selectedRequest.student.apellidos}`
                        : `Estudiante ${selectedRequest.studentId}`}
                    </h3>
                    <p className="text-sm text-rec-text-subtle">
                      {selectedRequest.subject?.nombre ?? `Materia ${selectedRequest.subjectId}`}
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
                          ? "text-rec-text-on-media shadow-sm"
                          : "border border-rec-border-default text-rec-text-muted hover:bg-rec-bg-base"
                      }`}
                      style={activeTab === tab ? { background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))" } : undefined}
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
                  <div className="space-y-5">
                    <div className="rounded-lg bg-rec-bg-base p-4 text-sm space-y-3">
                      <div className="flex gap-4 flex-wrap">
                        <div>
                          <p className="text-xs text-rec-text-subtle">Tipo</p>
                          <p className="font-medium text-rec-text-primary">
                            {selectedRequest.type === "RECOVERY" ? "Recuperación" : "Refuerzo"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-rec-text-subtle">Solicitado</p>
                          <p className="font-medium text-rec-text-primary">{fmtDate(selectedRequest.requestedAt)}</p>
                        </div>
                        {selectedRequest.dueDate && (
                          <div>
                            <p className="text-xs text-rec-text-subtle">Fecha límite</p>
                            <p className="font-semibold text-rec-warning-text">{fmtDateTime(selectedRequest.dueDate)}</p>
                          </div>
                        )}
                        {selectedRequest.finalScore != null && (
                          <div className="rounded-lg border border-rec-success-border bg-rec-success-bg px-3 py-2">
                            <p className="text-xs text-rec-success-text">Nota final</p>
                            <p className="text-2xl font-bold text-rec-success-text">{selectedRequest.finalScore}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-rec-text-subtle">Motivo del estudiante</p>
                        <p className="mt-0.5 text-rec-text-secondary whitespace-pre-wrap">{selectedRequest.reason}</p>
                      </div>
                      {selectedRequest.teacherComment && (
                        <div className="rounded-lg border-l-4 px-3 py-2" style={{ borderLeftColor: "var(--rec-primary)", background: "var(--rec-soft)" }}>
                          <p className="text-xs font-semibold" style={{ color: "var(--rec-primary-strong)" }}>Tu comentario actual</p>
                          <p className="mt-0.5 text-rec-text-secondary whitespace-pre-wrap">{selectedRequest.teacherComment}</p>
                        </div>
                      )}
                    </div>

                    <form onSubmit={onUpdateRequestStatus} className="space-y-3">
                      <h4 className="font-medium text-rec-text-primary">Actualizar estado</h4>
                      <div className="rounded-lg px-3 py-2 text-xs" style={{ border: "1px solid var(--rec-soft)", background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
                        Flujo recomendado: primero usa <strong>Aceptada</strong> o <strong>Rechazada</strong> al responder la solicitud.
                        Al final del proceso usa <strong>Pendiente (cierre)</strong> o <strong>Aprobaste</strong>.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setStatus("APPROVED")} className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90" style={{ border: "1px solid var(--rec-soft)", background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>Aceptar</button>
                        <button type="button" onClick={() => setStatus("REJECTED")} className="rounded-lg border border-rec-danger-border bg-rec-danger-bg px-3 py-1.5 text-xs font-semibold text-rec-danger-text hover:bg-rec-danger-bg-strong">Rechazar</button>
                        <button type="button" onClick={() => setStatus("PENDING")} className="rounded-lg border border-rec-warning-border bg-rec-warning-bg px-3 py-1.5 text-xs font-semibold text-rec-warning-text hover:bg-[var(--rec-bg-subtle)]">Pendiente cierre</button>
                        <button type="button" onClick={() => setStatus("COMPLETED")} className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90" style={{ border: "1px solid var(--rec-soft)", background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>Aprobaste</button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-rec-text-muted">Estado</label>
                          <select
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                            style={{ borderColor: "var(--rec-soft)" }}
                            value={status}
                            onChange={(e) => setStatus(e.target.value as RecoveryRequestStatus)}
                          >
                            {requestStatusOptions.map((v) => (
                              <option key={v} value={v}>
                                {STATUS_OPTION_LABELS[v]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-rec-text-muted">Fecha límite</label>
                          <input
                            type="datetime-local"
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                            style={{ borderColor: "var(--rec-soft)" }}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-rec-text-muted">
                            Nota final{status === "COMPLETED" ? " (requerida)" : " (opcional)"}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            placeholder="0.0 - 10.0"
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                            style={{ borderColor: "var(--rec-soft)" }}
                            value={finalScore}
                            onChange={(e) => setFinalScore(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-rec-text-muted">Comentario para el estudiante</label>
                        <textarea
                          className="min-h-20 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                          style={{ borderColor: "var(--rec-soft)" }}
                          placeholder="Escribe un comentario visible para el estudiante"
                          value={teacherComment}
                          onChange={(e) => setTeacherComment(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={disabled}
                          className="rounded-lg px-4 py-2 text-sm font-semibold text-rec-text-on-media shadow-sm hover:opacity-90 disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))" }}
                        >
                          Guardar cambios
                        </button>
                        <button
                          type="button"
                          onClick={onDeleteRequest}
                          disabled={disabled}
                          className="rounded-lg border border-rec-danger-border bg-rec-danger-bg px-4 py-2 text-sm font-semibold text-rec-danger-text hover:bg-rec-danger-bg-strong disabled:opacity-50"
                        >
                          Eliminar solicitud
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ACTIVITIES TAB */}
                {activeTab === "activities" && (
                  <div className="space-y-4">
                    {detailLoading && <p className="text-sm text-rec-text-subtle">Cargando...</p>}
                    {!detailLoading && activities.length === 0 && (
                      <div className="rounded-lg border-2 border-dashed border-rec-border-default p-6 text-center text-rec-text-subtle">
                        <p className="text-sm">Sin actividades asignadas.</p>
                        <p className="text-xs mt-1">Crea la primera actividad para este estudiante.</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {activities.map((item) => (
                        <ActivityItem
                          key={`${item.id}-${item.status}-${item.score ?? "na"}-${item.hasAttachment ? "1" : "0"}`}
                          item={item}
                          onSave={onUpdateActivityQuick}
                          onUpload={onUploadActivityAttachment}
                          onDelete={onDeleteActivity}
                          disabledActions={disabled}
                        />
                      ))}
                    </div>

                    {/* Create activity */}
                    <div className="rounded-lg border border-rec-border-default">
                      <button
                        type="button"
                        onClick={() => setActivityFormOpen((prev) => !prev)}
                        disabled={
                          disabled ||
                          selectedRequest.status === "REJECTED" ||
                          selectedRequest.status === "COMPLETED"
                        }
                        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-rec-text-secondary hover:bg-rec-bg-base disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span>+ Nueva actividad</span>
                        <span className="text-rec-text-subtle">{activityFormOpen ? "Ocultar" : "Mostrar"}</span>
                      </button>
                      {activityFormOpen && (
                        <form onSubmit={onCreateActivity} className="border-t border-rec-border-default p-4 space-y-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-rec-text-muted">Título *</label>
                              <input
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                                style={{ borderColor: "var(--rec-soft)" }}
                                placeholder="Ej: Examen de recuperación Unidad 3"
                                value={activityTitle}
                                onChange={(e) => setActivityTitle(e.target.value)}
                                required
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-rec-text-muted">Descripción *</label>
                              <textarea
                                className="min-h-16 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                                style={{ borderColor: "var(--rec-soft)" }}
                                placeholder="Instrucciones detalladas"
                                value={activityDescription}
                                onChange={(e) => setActivityDescription(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-rec-text-muted">Tipo</label>
                              <select
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                                style={{ borderColor: "var(--rec-soft)" }}
                                value={activityType}
                                onChange={(e) => setActivityType(e.target.value as RecoveryActivityType)}
                              >
                                {activityTypeOptions.map((v) => (
                                  <option key={v} value={v}>
                                    {ACTIVITY_TYPE_LABELS[v]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-rec-text-muted">Fecha límite *</label>
                              <input
                                type="datetime-local"
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                                style={{ borderColor: "var(--rec-soft)" }}
                                value={activityDueAt}
                                onChange={(e) => setActivityDueAt(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-rec-text-muted">Fecha inicio (opcional)</label>
                              <input
                                type="datetime-local"
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                                style={{ borderColor: "var(--rec-soft)" }}
                                value={activityStartAt}
                                onChange={(e) => setActivityStartAt(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-rec-text-muted">Adjunto (opcional)</label>
                              <input
                                type="file"
                                className="w-full rounded-lg border border-rec-border-strong px-3 py-1.5 text-sm"
                                onChange={(e) => setActivityFile(e.target.files?.[0] ?? null)}
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-rec-text-on-media shadow-sm hover:opacity-90"
                            style={{ background: "var(--rec-primary)" }}
                          >
                            Crear actividad
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* MESSAGES TAB */}
                {activeTab === "messages" && (
                  <div className="space-y-3">
                    {detailLoading && <p className="text-sm text-rec-text-subtle">Cargando mensajes...</p>}
                    <div className="max-h-80 overflow-y-auto space-y-2 rounded-lg border border-rec-border-default bg-rec-bg-base p-3">
                      {messages.length === 0 && !detailLoading && (
                        <p className="py-4 text-center text-sm text-rec-text-subtle">Sin mensajes. Inicia la conversación.</p>
                      )}
                      {messages.map((msg) => {
                        const isMe = msg.authorId === Number(user?.id);
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-full sm:max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                isMe
                                  ? "rounded-br-none text-rec-text-on-media"
                                  : "rounded-bl-none border border-rec-border-default bg-rec-bg-elevated text-rec-text-primary"
                              }`}
                              style={isMe ? { background: "var(--rec-primary)" } : undefined}
                            >
                              {!isMe && (
                                <p className="mb-0.5 text-xs font-semibold text-rec-text-subtle">
                                  {msg.author
                                    ? `${msg.author.nombres} ${msg.author.apellidos}`
                                    : `Usuario ${msg.authorId}`}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap">{msg.body}</p>
                              <p className={`mt-0.5 text-xs ${isMe ? "text-rec-text-on-media/75" : "text-rec-text-subtle"}`}>
                                {fmtDateTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <form onSubmit={onSendMessage} className="flex gap-2">
                      <input
                        className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                        style={{ borderColor: "var(--rec-soft)" }}
                        placeholder="Escribe un mensaje..."
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={disabled || !messageBody.trim()}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-rec-text-on-media shadow-sm hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))" }}
                      >
                        Enviar
                      </button>
                    </form>
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

// ���� ActivityItem ����������������������������������������������������������������������������������������������������������������������������

function ActivityItem({
  item,
  onSave,
  onUpload,
  onDelete,
  disabledActions,
}: {
  item: RecoveryActivity;
  onSave: (activityId: number, status: RecoveryActivityStatus, scoreText: string) => Promise<void>;
  onUpload: (activityId: number, file: File) => Promise<void>;
  onDelete: (activityId: number) => Promise<void>;
  disabledActions: boolean;
}) {
  const [status, setStatus] = useState<RecoveryActivityStatus>(item.status);
  const [score, setScore] = useState(item.score != null ? String(item.score) : "");
  const [file, setFile] = useState<File | null>(null);
  const [expanded, setExpanded] = useState(false);

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
            <ActivityBadge status={item.status} />
            <span className="rounded bg-rec-bg-muted px-1.5 py-0.5 text-xs text-rec-text-muted">
              {ACTIVITY_TYPE_LABELS[item.activityType]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-rec-text-subtle">
            Entrega: {fmtDateTime(item.dueAt)}
            {item.score != null ? ` · Nota: ${item.score}` : ""}
            {item.hasAttachment ? " · Adjunto" : ""}
          </p>
        </div>
        <span className="mt-1 text-xs text-rec-text-subtle">{expanded ? "Ocultar" : "Ver"}</span>
      </button>

      {expanded && (
        <div className="border-t border-rec-border-default px-4 py-3 space-y-3">
          <p className="text-sm text-rec-text-secondary">{item.description}</p>
          {item.startAt && <p className="text-xs text-rec-text-subtle">Inicio: {fmtDateTime(item.startAt)}</p>}
          {item.hasAttachment && (
            <a
              href={recoveryApi.getActivityAttachmentUrl(item.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium text-rec-info-text underline"
            >
              Ver adjunto actual
            </a>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-rec-text-subtle">Estado</label>
              <select
                className="rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)" }}
                value={status}
                onChange={(e) => setStatus(e.target.value as RecoveryActivityStatus)}
              >
                {(["PENDING", "IN_PROGRESS", "SUBMITTED", "EVALUATED"] as RecoveryActivityStatus[]).map((v) => (
                  <option key={v} value={v}>
                    {ACTIVITY_STATUS_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-rec-text-subtle">
                Nota{status === "EVALUATED" ? " (requerida)" : " (opcional)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="0-10"
                className="w-24 rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)" }}
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>
            <button
              type="button"
              disabled={disabledActions}
              onClick={() => onSave(item.id, status, score)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rec-text-on-media shadow-sm hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--rec-primary)" }}
            >
              Guardar
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              className="text-xs"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={disabledActions || !file}
              onClick={() => {
                if (file) { void onUpload(item.id, file).then(() => setFile(null)); }
              }}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-rec-text-secondary hover:bg-rec-bg-base disabled:opacity-50"
              style={{ borderColor: "var(--rec-soft)" }}
            >
              Adjuntar archivo
            </button>
            <button
              type="button"
              disabled={disabledActions}
              onClick={() => onDelete(item.id)}
              className="rounded-lg border border-rec-danger-border bg-rec-danger-bg px-3 py-1.5 text-xs font-medium text-rec-danger-text hover:bg-rec-danger-bg-strong disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

