"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { recoverySettingsApi, type RecoveryConfig } from "@/lib/recoverySettingsApi";

// -- Helpers --

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const r = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const m = r?.data?.message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string") return m;
    const msg = (error as { message?: string }).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

function toLocalDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toIso(local: string): string {
  return new Date(local).toISOString();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "N/D";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

// -- Countdown Hook --

function useCountdown(targetIso: string | null) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = targetIso ? Math.max(0, new Date(targetIso).getTime() - nowMs) : 0;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return { remaining, days, hours, minutes, seconds, now: nowMs };
}

// -- CountdownDisplay --

function CountdownDisplay({
  days,
  hours,
  minutes,
  seconds,
  label,
  color,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <div className="flex items-end gap-2">
        {days > 0 && (
          <div className="text-center">
            <span className="text-3xl font-bold tabular-nums">{pad(days)}</span>
            <p className="text-xs opacity-60">dias</p>
          </div>
        )}
        <div className="text-center">
          <span className="text-3xl font-bold tabular-nums">{pad(hours)}</span>
          <p className="text-xs opacity-60">horas</p>
        </div>
        <span className="mb-4 text-2xl font-bold opacity-40">:</span>
        <div className="text-center">
          <span className="text-3xl font-bold tabular-nums">{pad(minutes)}</span>
          <p className="text-xs opacity-60">min</p>
        </div>
        <span className="mb-4 text-2xl font-bold opacity-40">:</span>
        <div className="text-center">
          <span className="text-3xl font-bold tabular-nums">{pad(seconds)}</span>
          <p className="text-xs opacity-60">seg</p>
        </div>
      </div>
    </div>
  );
}

// -- Main Component --

export default function RecoveryConfigPage() {
  const [config, setConfig] = useState<RecoveryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [extendEndAt, setExtendEndAt] = useState("");

  const hasDateWindow =
    config != null && config.startAt != null && config.endAt != null;

  const countdownTarget = useMemo(() => {
    if (!config || !hasDateWindow) return null;
    const now = Date.now();
    const start = new Date(config.startAt!).getTime();
    if (config.active) return config.endAt;
    if (start > now) return config.startAt;
    return null;
  }, [config, hasDateWindow]);

  const { remaining, days, hours, minutes, seconds, now } = useCountdown(countdownTarget);

  const progress = useMemo(() => {
    if (!config || !hasDateWindow) return 0;
    const start = new Date(config.startAt!).getTime();
    const end = new Date(config.endAt!).getTime();
    const total = end - start;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, ((now - start) / total) * 100));
  }, [config, hasDateWindow, now]);

  const totalDuration =
    config && hasDateWindow
      ? new Date(config.endAt!).getTime() - new Date(config.startAt!).getTime()
      : NaN;

  const isFuture =
    !!config && hasDateWindow && new Date(config.startAt!).getTime() > now;
  const isPast =
    !!config && hasDateWindow && new Date(config.endAt!).getTime() < now;

  const statusLabel = !config
    ? ""
    : config.active
      ? "Activo"
      : !hasDateWindow
        ? "Sin configurar"
        : isFuture
          ? "Proximo"
          : "Finalizado";

  const statusColor = config?.active
    ? "border-rec-success-border bg-rec-success-bg text-rec-success-text"
    : !hasDateWindow
      ? "border-rec-border-strong bg-rec-bg-base text-rec-text-muted"
      : isFuture
        ? "border-rec-info-border bg-rec-info-bg text-rec-info-text"
        : "border-rec-border-strong bg-rec-bg-base text-rec-text-muted";

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recoverySettingsApi.getConfig();
      setConfig(data);
      setEditStartAt(data.startAt != null ? toLocalDateTime(data.startAt) : "");
      setEditEndAt(data.endAt != null ? toLocalDateTime(data.endAt) : "");
    } catch {
      setError("No se pudo cargar la configuracion");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4500);
  };

  const onSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStartAt || !editEndAt) return;
    if (new Date(editEndAt) <= new Date(editStartAt)) {
      setError("La fecha de fin debe ser posterior a la de inicio.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const saved = await recoverySettingsApi.setConfig({
        startAt: toIso(editStartAt),
        endAt: toIso(editEndAt),
      });
      setConfig(saved);
      setEditStartAt(saved.startAt != null ? toLocalDateTime(saved.startAt) : "");
      setEditEndAt(saved.endAt != null ? toLocalDateTime(saved.endAt) : "");
      setShowEditForm(false);
      showMsg("Configuracion guardada. El periodo se activara automaticamente en la fecha de inicio.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo guardar la configuracion"));
    } finally {
      setSaving(false);
    }
  };

  const onDeactivate = async () => {
    if (!config) return;
    if (config.startAt == null || config.endAt == null) {
      setError("No hay fechas de periodo para desactivar. Define fechas primero.");
      return;
    }
    const endNow = new Date(Date.now() - 5000).toISOString();
    try {
      setSaving(true);
      setError(null);
      const saved = await recoverySettingsApi.setConfig({
        startAt: config.startAt,
        endAt: endNow,
      });
      setConfig(saved);
      setEditStartAt(saved.startAt != null ? toLocalDateTime(saved.startAt) : "");
      setEditEndAt(saved.endAt != null ? toLocalDateTime(saved.endAt) : "");
      setConfirmDeactivate(false);
      showMsg("Periodo desactivado. Docentes y estudiantes ya no pueden crear ni modificar solicitudes.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo desactivar el periodo"));
    } finally {
      setSaving(false);
    }
  };

  const onActivateNow = async () => {
    if (!config) return;
    const nowIso = new Date().toISOString();
    const newEndStr: string =
      config.endAt == null || new Date(config.endAt).getTime() < Date.now()
        ? new Date(Date.now() + 7 * 86400000).toISOString()
        : config.endAt;
    try {
      setSaving(true);
      setError(null);
      const saved = await recoverySettingsApi.setConfig({
        startAt: nowIso,
        endAt: newEndStr,
      });
      setConfig(saved);
      setEditStartAt(saved.startAt != null ? toLocalDateTime(saved.startAt) : "");
      setEditEndAt(saved.endAt != null ? toLocalDateTime(saved.endAt) : "");
      showMsg("Periodo activado. Docentes y estudiantes ya pueden operar.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo activar el periodo"));
    } finally {
      setSaving(false);
    }
  };

  const onExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendEndAt || !config) return;
    if (config.startAt == null) {
      setError("No hay fecha de inicio. Usa Editar fechas para definir el periodo.");
      return;
    }
    if (new Date(extendEndAt) <= new Date()) {
      setError("La nueva fecha de fin debe ser en el futuro.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const saved = await recoverySettingsApi.setConfig({
        startAt: config.startAt,
        endAt: toIso(extendEndAt),
      });
      setConfig(saved);
      setEditEndAt(saved.endAt != null ? toLocalDateTime(saved.endAt) : "");
      setExtendEndAt("");
      setShowExtendForm(false);
      showMsg("Periodo extendido correctamente.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "No se pudo extender el periodo"));
    } finally {
      setSaving(false);
    }
  };

  const titleTone = config?.active
    ? "text-rec-success-text"
    : !hasDateWindow
      ? "text-rec-text-muted"
      : isFuture
        ? "text-rec-info-text"
        : "text-rec-text-muted";

  return (
    <section className="sec-page space-y-6">
      <div className="sec-hero">
        <div>
          <h1 className="sec-title">Configuración de Recuperaciones</h1>
          <p className="sec-subtitle">
            Gestiona el periodo oficial: fechas, activacion y estado en tiempo real.
          </p>
        </div>
        {!loading && config && (
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusColor}`}>
            {statusLabel === "Activo"
              ? "● Activo"
              : statusLabel === "Sin configurar"
                ? "○ Sin configurar"
                : statusLabel === "Proximo"
                  ? "◷ Próximo"
                  : "○ Finalizado"}
          </span>
        )}
      </div>

      {!loading && config && !config.active && (
        <div
          role="status"
          className="rounded-xl border border-rec-warning-border bg-rec-warning-bg px-4 py-3 text-sm text-rec-warning-text"
        >
          <p className="font-semibold">No hay período de recuperaciones activo</p>
          <p className="mt-1 text-xs opacity-90">
            Define fechas con <strong>Editar fechas</strong> o <strong>Activar ahora</strong> para habilitar docentes y estudiantes.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-rec-danger-border bg-rec-danger-bg px-4 py-3 text-sm text-rec-danger-text">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-3 font-bold hover:text-rec-danger-text">
            x
          </button>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-rec-success-border bg-rec-success-bg px-4 py-3 text-sm text-rec-success-text">
          {success}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-8 text-center text-sm text-rec-text-subtle">
          Cargando configuracion...
        </div>
      )}

      {!loading && config && (
        <>
          <div
            className={`rounded-xl border-2 p-5 ${
              config.active
                ? "border-rec-success-border bg-rec-success-bg"
                : !hasDateWindow
                  ? "border-rec-border-strong bg-rec-bg-base"
                  : isFuture
                    ? "border-rec-info-border bg-rec-info-bg"
                    : "border-rec-border-strong bg-rec-bg-base"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={`text-lg font-bold ${titleTone}`}>
                  {config.active
                    ? "Periodo activo — operaciones habilitadas"
                    : !hasDateWindow
                      ? "Sin periodo configurado — define fechas para continuar"
                      : isFuture
                        ? "Periodo proximo — aun no ha comenzado"
                        : "Periodo finalizado — acceso de solo lectura"}
                </p>
                <p className="mt-0.5 text-sm opacity-70">
                  {config.active
                    ? "Docentes y estudiantes pueden crear y gestionar solicitudes de recuperacion."
                    : !hasDateWindow
                      ? "Aun no hay ventana de recuperaciones para este periodo academico activo."
                      : isFuture
                        ? "El sistema se activara automaticamente en la fecha de inicio."
                        : "No se pueden crear nuevas solicitudes. Considera abrir un nuevo periodo."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.active && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setExtendEndAt(editEndAt);
                        setShowExtendForm(true);
                        setShowEditForm(false);
                        setConfirmDeactivate(false);
                      }}
                      disabled={saving || !hasDateWindow}
                      className="rounded-lg border border-rec-info-border bg-rec-bg-elevated px-3 py-1.5 text-sm font-medium text-rec-info-text hover:bg-rec-info-bg disabled:opacity-50 transition"
                    >
                      Extender periodo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeactivate(true);
                        setShowEditForm(false);
                        setShowExtendForm(false);
                      }}
                      disabled={saving || !hasDateWindow}
                      className="rounded-lg border border-rec-danger-border bg-rec-bg-elevated px-3 py-1.5 text-sm font-medium text-rec-danger-text hover:bg-rec-danger-bg disabled:opacity-50 transition"
                    >
                      Desactivar
                    </button>
                  </>
                )}
                {!config.active && (
                  <button
                    type="button"
                    onClick={onActivateNow}
                    disabled={saving}
                    className="rec-gradient-primary-action rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm disabled:opacity-50 transition"
                  >
                    {saving ? "Activando..." : "Activar ahora"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm((p) => !p);
                    setShowExtendForm(false);
                    setConfirmDeactivate(false);
                  }}
                  disabled={saving}
                  className="rounded-lg border border-rec-border-strong bg-rec-bg-elevated px-3 py-1.5 text-sm font-medium text-rec-text-secondary hover:bg-rec-bg-base disabled:opacity-50 transition"
                >
                  Editar fechas
                </button>
              </div>
            </div>

            {countdownTarget && remaining > 0 && (
              <div className="mt-4">
                <CountdownDisplay
                  days={days}
                  hours={hours}
                  minutes={minutes}
                  seconds={seconds}
                  label={config.active ? "Tiempo restante del periodo" : "Comienza en"}
                  color={
                    config.active
                      ? remaining < 86400000
                        ? "border-rec-danger-border bg-rec-danger-bg text-rec-danger-text"
                        : remaining < 3 * 86400000
                          ? "border-rec-warning-border bg-rec-warning-bg text-rec-warning-text"
                          : "border-rec-success-border bg-rec-bg-elevated text-rec-success-text"
                      : "border-rec-info-border bg-rec-bg-elevated text-rec-info-text"
                  }
                />
              </div>
            )}
            {isPast && (
              <div className="mt-4 rounded-lg border border-rec-border-default bg-rec-bg-elevated px-4 py-3 text-sm text-rec-text-subtle">
                Este periodo finalizo el {fmtDateTime(config.endAt)}. Usa Activar ahora o Editar fechas para abrir un nuevo periodo.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-5">
            <h2 className="mb-4 text-sm font-semibold text-rec-text-secondary">Progreso del periodo</h2>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-rec-bg-base px-3 py-2 text-center">
                <p className="text-lg font-bold text-rec-text-primary">{Math.round(progress)}%</p>
                <p className="text-xs text-rec-text-subtle">Completado</p>
              </div>
              <div className="rounded-lg bg-rec-bg-base px-3 py-2 text-center">
                <p className="text-lg font-bold text-rec-text-primary">{fmtDuration(totalDuration)}</p>
                <p className="text-xs text-rec-text-subtle">Duracion total</p>
              </div>
              <div className="rounded-lg bg-rec-bg-base px-3 py-2 text-center">
                <p className="text-lg font-bold text-rec-text-primary">
                  {hasDateWindow
                    ? fmtDuration(Math.max(0, now - new Date(config.startAt!).getTime()))
                    : "—"}
                </p>
                <p className="text-xs text-rec-text-subtle">Transcurrido</p>
              </div>
              <div className="rounded-lg bg-rec-bg-base px-3 py-2 text-center">
                <p className={`text-lg font-bold ${remaining > 0 ? "text-rec-success-text" : "text-rec-text-subtle"}`}>
                  {remaining > 0 ? fmtDuration(remaining) : "--"}
                </p>
                <p className="text-xs text-rec-text-subtle">Restante</p>
              </div>
            </div>

            <div className="relative h-4 overflow-hidden rounded-full bg-rec-bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  config.active
                    ? remaining < 86400000
                      ? "bg-rec-danger-solid"
                      : remaining < 3 * 86400000
                        ? "bg-rec-chart-amber"
                        : "bg-rec-primary"
                    : !hasDateWindow
                      ? "bg-rec-text-muted"
                      : isPast
                        ? "bg-rec-text-subtle"
                        : "bg-[var(--rec-info-text)]"
                }`}
                style={{ width: `${progress}%` }}
              />
              {progress > 2 && progress < 98 && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-rec-bg-elevated/80"
                  style={{ left: `${progress}%` }}
                />
              )}
            </div>

            <div className="mt-2 flex justify-between text-xs text-rec-text-subtle">
              <span>Inicio: {hasDateWindow ? fmtDateTime(config.startAt) : "—"}</span>
              <span>Fin: {hasDateWindow ? fmtDateTime(config.endAt) : "—"}</span>
            </div>
          </div>

          {confirmDeactivate && (
            <div className="rounded-xl border-2 border-rec-danger-border bg-rec-danger-bg p-5">
              <h3 className="mb-1 font-semibold text-rec-danger-text">Confirmar desactivacion</h3>
              <p className="mb-4 text-sm text-rec-danger-text">
                Al desactivar el periodo, los docentes y estudiantes no podran crear solicitudes,
                asignar actividades ni enviar mensajes. Solo podran consultar el historial.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDeactivate}
                  disabled={saving}
                  className="rec-gradient-danger-action rounded-lg px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-50"
                >
                  {saving ? "Desactivando..." : "Si, desactivar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeactivate(false)}
                  className="rounded-lg border border-rec-border-strong bg-rec-bg-elevated px-4 py-2 text-sm font-medium text-rec-text-secondary hover:bg-rec-bg-base"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {showExtendForm && (
            <div className="rounded-xl border-2 border-rec-info-border bg-rec-info-bg p-5">
              <h3 className="mb-1 font-semibold text-rec-info-text">Extender periodo</h3>
              <p className="mb-3 text-sm text-rec-info-text">
                Define una nueva fecha de fin. El inicio no cambiara ({fmtDateTime(config.startAt)}).
              </p>
              <form onSubmit={onExtend} className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-rec-info-text">
                    Nueva fecha y hora de fin
                  </label>
                  <input
                    type="datetime-local"
                    value={extendEndAt}
                    onChange={(e) => setExtendEndAt(e.target.value)}
                    required
                    className="rounded-lg border border-rec-info-border bg-rec-bg-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rec-info-text)]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || !extendEndAt}
                    className="rec-gradient-info-action rounded-lg px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Confirmar extension"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExtendForm(false)}
                    className="rounded-lg border border-rec-border-strong bg-rec-bg-elevated px-4 py-2 text-sm font-medium text-rec-text-secondary hover:bg-rec-bg-base"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {showEditForm && (
            <div className="rounded-xl border-2 border-rec-border-strong bg-rec-bg-elevated p-5">
              <h3 className="mb-1 font-semibold text-rec-text-primary">Editar fechas del periodo</h3>
              <p className="mb-4 text-sm text-rec-text-subtle">
                Modifica el inicio y el fin. El sistema activara o desactivara el acceso automaticamente.
              </p>
              <form onSubmit={onSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-rec-text-muted">Fecha y hora de inicio</label>
                    <input
                      type="datetime-local"
                      value={editStartAt}
                      onChange={(e) => setEditStartAt(e.target.value)}
                      required
                      disabled={saving}
                      className="w-full rounded-lg border border-rec-border-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rec-primary disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-rec-text-muted">Fecha y hora de fin</label>
                    <input
                      type="datetime-local"
                      value={editEndAt}
                      onChange={(e) => setEditEndAt(e.target.value)}
                      required
                      disabled={saving}
                      className="w-full rounded-lg border border-rec-border-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rec-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                {editStartAt && editEndAt && new Date(editEndAt) > new Date(editStartAt) && (
                  <div className="rounded-lg bg-rec-bg-base px-4 py-2 text-sm text-rec-text-muted">
                    Duracion del nuevo periodo:{" "}
                    <strong>
                      {fmtDuration(new Date(editEndAt).getTime() - new Date(editStartAt).getTime())}
                    </strong>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || !editStartAt || !editEndAt}
                    className="rec-gradient-primary-action rounded-lg px-5 py-2 text-sm font-semibold shadow-sm disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar configuracion"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="rounded-lg border border-rec-border-strong bg-rec-bg-elevated px-4 py-2 text-sm font-medium text-rec-text-secondary hover:bg-rec-bg-base"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-5">
            <h2 className="mb-3 text-sm font-semibold text-rec-text-secondary">Impacto del estado del periodo</h2>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-rec-success-border bg-rec-success-bg px-4 py-3">
                <p className="mb-1 font-semibold text-rec-success-text">Cuando esta ACTIVO</p>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-rec-success-text">
                  <li>Estudiantes pueden crear nuevas solicitudes</li>
                  <li>Docentes pueden aprobar, rechazar y gestionar</li>
                  <li>Se pueden asignar actividades y enviar mensajes</li>
                  <li>El horario de recuperaciones es accesible</li>
                </ul>
              </div>
              <div className="rounded-lg border border-rec-border-default bg-rec-bg-base px-4 py-3">
                <p className="mb-1 font-semibold text-rec-text-secondary">Cuando esta INACTIVO</p>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-rec-text-muted">
                  <li>No se pueden crear nuevas solicitudes</li>
                  <li>No se pueden modificar solicitudes existentes</li>
                  <li>Solo se permite consultar el historial</li>
                  <li>El boton Nueva solicitud aparece deshabilitado</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
