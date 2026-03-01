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

const requestStatusOptions: RecoveryRequestStatus[] = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"];
const activityTypeOptions: RecoveryActivityType[] = ["HOMEWORK", "EXAM", "PROJECT", "PRACTICE"];

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

export default function DocenteRecuperacionesPage() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [requests, setRequests] = useState<RecoveryRequest[]>([]);
  const [activities, setActivities] = useState<RecoveryActivity[]>([]);
  const [messages, setMessages] = useState<RecoveryMessage[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodActive, setPeriodActive] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(true);

  const [status, setStatus] = useState<RecoveryRequestStatus>("PENDING");
  const [teacherComment, setTeacherComment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [finalScore, setFinalScore] = useState("");

  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityType, setActivityType] = useState<RecoveryActivityType>("HOMEWORK");
  const [activityStartAt, setActivityStartAt] = useState("");
  const [activityDueAt, setActivityDueAt] = useState("");
  const [activityFile, setActivityFile] = useState<File | null>(null);

  const [messageBody, setMessageBody] = useState("");

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

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) ?? null,
    [requests, selectedRequestId],
  );

  const loadAssignments = useCallback(async () => {
    const teacherId = Number(user?.id);
    if (!teacherId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await academicApi.listTeacherAssignments(teacherId);
      setAssignments(data);
      const firstGroupId = data[0]?.group?.id ?? null;
      setSelectedGroupId((prev) => prev ?? firstGroupId);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudieron cargar asignaciones"));
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
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudieron cargar solicitudes"));
      setRequests([]);
      setSelectedRequestId(null);
    }
  }, []);

  const loadDetail = useCallback(async (requestId: number) => {
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
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    const run = async () => {
      try {
        const config = await recoverySettingsApi.getConfig();
        setPeriodActive(config.active);
      } catch {
        setPeriodActive(true);
      } finally {
        setPeriodLoading(false);
      }
    };
    run();
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

  const onUpdateRequestStatus = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRequestId) return;
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }

    try {
      await recoveryApi.updateRequestStatus(selectedRequestId, {
        status,
        teacherComment: teacherComment.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        finalScore: finalScore ? Number(finalScore) : undefined,
      });
      if (selectedGroupId) {
        await loadRequestsByGroup(selectedGroupId);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo actualizar la solicitud"));
    }
  };

  const onCreateActivity = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRequestId || !activityTitle.trim() || !activityDescription.trim() || !activityDueAt) return;
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }

    try {
      const created = await recoveryApi.createActivity(selectedRequestId, {
        title: activityTitle.trim(),
        description: activityDescription.trim(),
        activityType,
        startAt: activityStartAt ? new Date(activityStartAt).toISOString() : undefined,
        dueAt: new Date(activityDueAt).toISOString(),
      });

      if (activityFile) {
        await recoveryApi.uploadActivityAttachment(created.id, activityFile);
      }

      setActivityTitle("");
      setActivityDescription("");
      setActivityStartAt("");
      setActivityDueAt("");
      setActivityFile(null);
      await loadDetail(selectedRequestId);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo crear la actividad"));
    }
  };

  const onUploadActivityAttachment = async (activityId: number, file: File) => {
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }

    try {
      await recoveryApi.uploadActivityAttachment(activityId, file);
      if (selectedRequestId) await loadDetail(selectedRequestId);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo cargar el adjunto"));
    }
  };

  const onUpdateActivityQuick = async (activityId: number, nextStatus: RecoveryActivityStatus, scoreText: string) => {
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }

    try {
      await recoveryApi.updateActivity(activityId, {
        status: nextStatus,
        score: scoreText ? Number(scoreText) : undefined,
      });
      if (selectedRequestId) await loadDetail(selectedRequestId);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo actualizar la actividad"));
    }
  };

  const onDeleteRequest = async () => {
    if (!selectedRequestId) return;
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }
    if (!window.confirm("¿Eliminar esta solicitud y todo su historial de actividades/mensajes?")) return;

    try {
      await recoveryApi.deleteRequest(selectedRequestId);
      setActivities([]);
      setMessages([]);
      if (selectedGroupId) {
        await loadRequestsByGroup(selectedGroupId);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo eliminar la solicitud"));
    }
  };

  const onDeleteActivity = async (activityId: number) => {
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }
    if (!window.confirm("¿Eliminar esta actividad?")) return;

    try {
      await recoveryApi.deleteActivity(activityId);
      if (selectedRequestId) await loadDetail(selectedRequestId);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo eliminar la actividad"));
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
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo enviar el mensaje"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">Recuperaciones</h1>
        <p className="mt-2 text-slate-600">Administra solicitudes por grupo, actividades y mensajes con estudiantes.</p>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!periodLoading && !periodActive && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El periodo de recuperación está inactivo. Las acciones de edición quedan bloqueadas.
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Grupo</h2>
        {loading && <p className="mt-2 text-sm text-slate-500">Cargando asignaciones...</p>}
        {!loading && groups.length === 0 && <p className="mt-2 text-sm text-slate-500">No tienes grupos asignados.</p>}
        {groups.length > 0 && (
          <select
            className="mt-3 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={selectedGroupId ?? ""}
            onChange={(event) => {
              const value = Number(event.target.value);
              setSelectedGroupId(value || null);
              setSelectedRequestId(null);
            }}
          >
            {groups.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Solicitudes del grupo</h2>
          </div>
          <div className="max-h-[28rem] overflow-y-auto p-3">
            {requests.length === 0 && <p className="px-2 py-3 text-sm text-slate-500">Sin solicitudes registradas.</p>}
            <div className="space-y-2">
              {requests.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedRequestId(item.id)}
                  className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${selectedRequestId === item.id ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <p className="font-medium text-slate-900">
                    {item.student ? `${item.student.nombres} ${item.student.apellidos}` : `Estudiante ${item.studentId}`}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{item.subject?.nombre ?? `Materia ${item.subjectId}`}</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.reason}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Estado de solicitud</h3>
            {!selectedRequest && <p className="mt-2 text-sm text-slate-500">Selecciona una solicitud.</p>}
            {selectedRequest && (
              <form className="mt-3 space-y-3" onSubmit={onUpdateRequestStatus}>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as RecoveryRequestStatus)}
                >
                  {requestStatusOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Nota final"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={finalScore}
                  onChange={(event) => setFinalScore(event.target.value)}
                />
                <textarea
                  className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Comentario del docente"
                  value={teacherComment}
                  onChange={(event) => setTeacherComment(event.target.value)}
                />
                <button
                  type="submit"
                  disabled={periodLoading || !periodActive}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Guardar estado
                </button>
                <button
                  type="button"
                  onClick={onDeleteRequest}
                  disabled={periodLoading || !periodActive}
                  className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Eliminar solicitud
                </button>
              </form>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Nueva actividad</h3>
            <form className="mt-3 grid grid-cols-1 gap-2" onSubmit={onCreateActivity}>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Título"
                value={activityTitle}
                onChange={(event) => setActivityTitle(event.target.value)}
              />
              <textarea
                className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Descripción"
                value={activityDescription}
                onChange={(event) => setActivityDescription(event.target.value)}
              />
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={activityType}
                onChange={(event) => setActivityType(event.target.value as RecoveryActivityType)}
              >
                {activityTypeOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={activityStartAt}
                onChange={(event) => setActivityStartAt(event.target.value)}
              />
              <input
                type="datetime-local"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={activityDueAt}
                onChange={(event) => setActivityDueAt(event.target.value)}
              />
              <input
                type="file"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                onChange={(event) => setActivityFile(event.target.files?.[0] ?? null)}
              />
              <button
                type="submit"
                disabled={periodLoading || !periodActive}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                Crear actividad
              </button>
            </form>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Actividades</h3>
          {!selectedRequest && <p className="mt-2 text-sm text-slate-500">Selecciona una solicitud.</p>}
          {selectedRequest && activities.length === 0 && <p className="mt-2 text-sm text-slate-500">Sin actividades.</p>}
          <div className="mt-3 space-y-3">
            {activities.map((item) => (
              <ActivityItem
                key={`${item.id}-${item.status}-${item.score ?? "na"}-${item.hasAttachment ? "with" : "without"}`}
                item={item}
                onSave={onUpdateActivityQuick}
                onUpload={onUploadActivityAttachment}
                onDelete={onDeleteActivity}
                disabledActions={periodLoading || !periodActive}
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Mensajes</h3>
          {!selectedRequest && <p className="mt-2 text-sm text-slate-500">Selecciona una solicitud.</p>}
          {selectedRequest && (
            <>
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
                {messages.length === 0 && <p className="text-sm text-slate-500">Sin mensajes.</p>}
                {messages.map((item) => (
                  <div key={item.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-medium text-slate-800">
                      {item.author ? `${item.author.nombres} ${item.author.apellidos}` : `Usuario ${item.authorId}`}
                    </p>
                    <p className="text-slate-700">{item.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={onSendMessage} className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Escribe un mensaje"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                />
                <button
                  type="submit"
                  disabled={periodLoading || !periodActive}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  Enviar
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

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

  return (
    <div className="rounded-md border border-slate-200 p-3 text-sm">
      <p className="font-medium text-slate-900">{item.title}</p>
      <p className="mt-1 text-slate-600">{item.description}</p>
      <p className="mt-1 text-xs text-slate-500">{item.activityType} · Entrega {new Date(item.dueAt).toLocaleString()}</p>
      {item.hasAttachment ? (
        <a
          href={recoveryApi.getActivityAttachmentUrl(item.id)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs font-medium text-blue-700 underline"
        >
          Ver adjunto actual
        </a>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          value={status}
          onChange={(event) => setStatus(event.target.value as RecoveryActivityStatus)}
        >
          <option value="PENDING">PENDING</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="EVALUATED">EVALUATED</option>
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Score"
          className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs"
          value={score}
          onChange={(event) => setScore(event.target.value)}
        />
        <button
          type="button"
          disabled={disabledActions}
          onClick={() => onSave(item.id, status, score)}
          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
        >
          Guardar
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="file"
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={disabledActions}
          onClick={() => {
            if (file) onUpload(item.id, file);
          }}
          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
        >
          Subir adjunto
        </button>
        <button
          type="button"
          disabled={disabledActions}
          onClick={() => onDelete(item.id)}
          className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
