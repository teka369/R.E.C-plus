"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type GroupSubject } from "@/lib/academicApi";
import {
  recoveryApi,
  type RecoveryActivity,
  type RecoveryMessage,
  type RecoveryRequest,
  type RecoveryRequestType,
} from "@/lib/recoveryApi";
import { recoverySettingsApi } from "@/lib/recoverySettingsApi";

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  COMPLETED: "Completada",
};

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

export default function EstudianteRecuperacionesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RecoveryRequest[]>([]);
  const [subjects, setSubjects] = useState<GroupSubject[]>([]);
  const [activities, setActivities] = useState<RecoveryActivity[]>([]);
  const [messages, setMessages] = useState<RecoveryMessage[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodActive, setPeriodActive] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(true);

  const [subjectId, setSubjectId] = useState<string>("");
  const [requestType, setRequestType] = useState<RecoveryRequestType>("RECOVERY");
  const [reason, setReason] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) ?? null,
    [requests, selectedRequestId],
  );

  const loadMain = useCallback(async () => {
    const studentId = Number(user?.id);
    if (!studentId) return;

    setLoading(true);
    setError(null);
    try {
      const [myRequests, mySubjects] = await Promise.all([
        recoveryApi.listMyRequests(),
        academicApi.listStudentSubjects(studentId).catch(() => []),
      ]);

      setRequests(myRequests);
      setSubjects(mySubjects);
      setSelectedRequestId((prev) => prev ?? myRequests[0]?.id ?? null);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo cargar recuperaciones"));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
    loadMain();
  }, [loadMain]);

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
    if (!selectedRequestId) {
      setActivities([]);
      setMessages([]);
      return;
    }
    loadDetail(selectedRequestId);
  }, [selectedRequestId, loadDetail]);

  const onCreateRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }

    const parsedSubjectId = Number(subjectId);
    if (!parsedSubjectId || reason.trim().length < 10) {
      setError("Selecciona materia y escribe un motivo de mínimo 10 caracteres.");
      return;
    }

    try {
      await recoveryApi.createRequest({
        subjectId: parsedSubjectId,
        type: requestType,
        reason: reason.trim(),
      });
      setReason("");
      await loadMain();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo crear la solicitud"));
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

  const onDeleteMyRequest = async () => {
    if (!selectedRequestId) return;
    if (periodLoading || !periodActive) {
      setError("El periodo de recuperación está inactivo.");
      return;
    }
    if (!window.confirm("¿Eliminar esta solicitud de recuperación?")) return;

    try {
      await recoveryApi.deleteRequest(selectedRequestId);
      setActivities([]);
      setMessages([]);
      await loadMain();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo eliminar la solicitud"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">Recuperaciones</h1>
        <p className="mt-2 text-slate-600">Crea solicitudes, revisa actividades y sigue los mensajes con tu docente.</p>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!periodLoading && !periodActive && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El periodo de recuperación está inactivo. Las acciones de edición quedan bloqueadas.
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Nueva solicitud</h2>
        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3" onSubmit={onCreateRequest}>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
          >
            <option value="">Selecciona materia</option>
            {subjects.map((item) => (
              <option key={item.id} value={item.subject.id}>
                {item.subject.nombre}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={requestType}
            onChange={(event) => setRequestType(event.target.value as RecoveryRequestType)}
          >
            <option value="RECOVERY">Recuperación</option>
            <option value="REINFORCEMENT">Refuerzo</option>
          </select>

          <button
            type="submit"
            disabled={periodLoading || !periodActive}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Enviar solicitud
          </button>

          <textarea
            className="md:col-span-3 min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Describe por qué necesitas la recuperación"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </form>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Mis solicitudes</h2>
          </div>
          <div className="max-h-[28rem] overflow-y-auto p-3">
            {loading && <p className="px-2 py-3 text-sm text-slate-500">Cargando...</p>}
            {!loading && requests.length === 0 && (
              <p className="px-2 py-3 text-sm text-slate-500">Aún no tienes solicitudes.</p>
            )}
            <div className="space-y-2">
              {requests.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedRequestId(item.id)}
                  className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${selectedRequestId === item.id ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900">{item.subject?.nombre ?? `Materia ${item.subjectId}`}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{statusLabels[item.status] ?? item.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.reason}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Actividades</h3>
            {selectedRequest ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={onDeleteMyRequest}
                  disabled={periodLoading || !periodActive}
                  className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  Eliminar solicitud
                </button>
              </div>
            ) : null}
            {!selectedRequest && <p className="mt-2 text-sm text-slate-500">Selecciona una solicitud.</p>}
            {selectedRequest && activities.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">Sin actividades registradas.</p>
            )}
            <div className="mt-3 space-y-3">
              {activities.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-slate-600">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Tipo: {item.activityType} · Estado: {item.status} · Entrega: {new Date(item.dueAt).toLocaleString()}
                    {item.score != null ? ` · Nota: ${item.score}` : ""}
                  </p>
                  {item.hasAttachment ? (
                    <a
                      href={recoveryApi.getActivityAttachmentUrl(item.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-blue-700 underline"
                    >
                      Descargar adjunto
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
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
          </div>
        </section>
      </div>
    </div>
  );
}
