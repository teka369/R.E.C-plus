"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { recoverySettingsApi, type RecoveryConfig } from "@/lib/recoverySettingsApi";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "N/D";
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

function MiniCountdown({ targetIso, label }: { targetIso: string; label: string }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, new Date(targetIso).getTime() - nowMs);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  if (remaining === 0) return null;
  return (
    <div className="mt-3 rounded-lg border border-current/20 bg-current/5 px-3 py-2 text-xs">
      <span className="font-medium opacity-70">{label}: </span>
      <span className="font-bold tabular-nums">
        {days > 0 ? `${days}d ` : ""}
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}

export default function SecretariaRecuperacionesPage() {
  const [config, setConfig] = useState<RecoveryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    recoverySettingsApi
      .getConfig()
      .then(setConfig)
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const now = nowMs;
  const hasDateWindow =
    config != null && config.startAt != null && config.endAt != null;

  const startMs =
    config != null && config.startAt != null
      ? new Date(config.startAt).getTime()
      : NaN;
  const endMs =
    config != null && config.endAt != null
      ? new Date(config.endAt).getTime()
      : NaN;

  const isFuture =
    hasDateWindow && !Number.isNaN(startMs) && startMs > now;
  const isPast = hasDateWindow && !Number.isNaN(endMs) && endMs < now;
  const remaining =
    hasDateWindow && !Number.isNaN(endMs)
      ? Math.max(0, endMs - now)
      : 0;
  const totalDuration =
    hasDateWindow && !Number.isNaN(startMs) && !Number.isNaN(endMs)
      ? endMs - startMs
      : 0;
  const progress =
    hasDateWindow && totalDuration > 0 && !Number.isNaN(startMs)
      ? Math.min(
          100,
          Math.max(0, ((now - startMs) / totalDuration) * 100),
        )
      : 0;

  const periodInactive = !!config && !config.active;

  const heroStatusLabel = !config
    ? null
    : config.active
      ? "Activo"
      : !hasDateWindow
        ? "Sin configurar"
        : isFuture
          ? "Proximo"
          : "Finalizado";

  const statusBg = config?.active
    ? "border-rec-success-border bg-rec-success-bg text-rec-success-text"
    : !hasDateWindow
      ? "border-rec-border-strong bg-rec-bg-base text-rec-text-muted"
      : isFuture
        ? "border-rec-info-border bg-rec-info-bg text-rec-info-text"
        : "border-rec-border-strong bg-rec-bg-base text-rec-text-muted";

  const barColor = config?.active
    ? remaining < 86400000
      ? "bg-rec-danger-solid"
      : remaining < 3 * 86400000
        ? "bg-rec-chart-amber"
        : "bg-rec-primary"
    : isPast
      ? "bg-rec-text-subtle"
      : "bg-[var(--rec-info-text)]";

  return (
    <section className="sec-page space-y-6">
      <div className="sec-hero">
        <div>
          <h1 className="sec-title">Recuperaciones</h1>
          <p className="sec-subtitle">
            Administra el periodo de recuperaciones, configura fechas y gestiona el horario oficial.
          </p>
        </div>
        {!loading && config && (
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusBg}`}>
            {heroStatusLabel}
          </span>
        )}
      </div>

      {!loading && periodInactive && (
        <div
          role="status"
          className="rounded-xl border border-rec-warning-border bg-rec-warning-bg px-4 py-3 text-sm text-rec-warning-text"
        >
          <p className="font-semibold">No hay período de recuperaciones activo</p>
          <p className="mt-1 text-xs opacity-90">
            Puedes definir fechas desde{" "}
            <Link
              href="/secretaria/recuperaciones/configuracion"
              className="font-medium underline underline-offset-2"
            >
              Configuración
            </Link>
            .
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-5">
          <p className="text-sm text-rec-text-subtle">Cargando estado del periodo...</p>
        </div>
      )}

      {!loading && config && (
        <div className={`rounded-xl border-2 p-5 ${statusBg}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">
              {config.active
                ? "Periodo activo"
                : !hasDateWindow
                  ? "Sin periodo configurado"
                  : isFuture
                    ? "Periodo proximo"
                    : "Periodo finalizado"}
            </h2>
            <Link
              href="/secretaria/recuperaciones/configuracion"
              className="rounded-lg border border-current/30 bg-rec-bg-elevated/70 px-3 py-1 text-xs font-medium hover:bg-rec-bg-elevated transition"
            >
              Gestionar
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs opacity-60">Inicio</p>
              <p className="font-medium">{fmtDateTime(config.startAt)}</p>
            </div>
            <div>
              <p className="text-xs opacity-60">Fin</p>
              <p className="font-medium">{fmtDateTime(config.endAt)}</p>
            </div>
            <div>
              <p className="text-xs opacity-60">Duracion total</p>
              <p className="font-medium">{fmtDuration(totalDuration)}</p>
            </div>
            {config.active && (
              <div>
                <p className="text-xs opacity-60">Restante</p>
                <p className={`font-semibold ${remaining < 86400000 ? "text-rec-danger-text" : remaining < 3 * 86400000 ? "text-rec-warning-text" : ""}`}>
                  {fmtDuration(remaining)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs opacity-50">
              <span>{Math.round(progress)}% completado</span>
              <span>
                {config.active
                  ? `${Math.round(100 - progress)}% restante`
                  : isPast
                    ? "Finalizado"
                    : "Sin iniciar"}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/10">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {config.active && remaining > 0 && config.endAt != null && (
            <MiniCountdown targetIso={config.endAt} label="Cierra en" />
          )}
          {isFuture && config.startAt != null && (
            <MiniCountdown targetIso={config.startAt} label="Abre en" />
          )}
          {isPast && (
            <p className="mt-3 text-xs opacity-60">
              Finalizo el {fmtDateTime(config.endAt)}. Ve a Configuracion para abrir un nuevo periodo.
            </p>
          )}

          {config.active && remaining < 86400000 && remaining > 0 && (
            <div className="mt-3 rounded-lg border border-rec-danger-border bg-rec-danger-bg px-3 py-2 text-xs font-semibold text-rec-danger-text">
              El periodo cierra en menos de 24 horas. Considera extenderlo si es necesario.
            </div>
          )}
          {config.active && remaining >= 86400000 && remaining < 3 * 86400000 && (
            <div className="mt-3 rounded-lg border border-rec-warning-border bg-rec-warning-bg px-3 py-2 text-xs text-rec-warning-text">
              El periodo cierra en menos de 3 dias.
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/secretaria/recuperaciones/configuracion"
          prefetch={false}
          className="group rounded-xl border border-rec-border-default bg-rec-bg-elevated p-5 transition hover:border-rec-success-border hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rec-success-bg-muted text-xl group-hover:scale-110 transition-transform">
              C
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-rec-text-primary group-hover:text-rec-success-text transition">
                Configuracion de periodo
              </h2>
              <p className="mt-0.5 text-xs text-rec-text-subtle">
                Countdown en vivo, barra de progreso, botones de activar/desactivar/extender y edicion de fechas.
              </p>
              {!loading && config && (
                <span
                  className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                    config.active
                      ? "border-rec-success-border bg-rec-success-bg text-rec-success-text"
                      : "border-rec-border-strong bg-rec-bg-base text-rec-text-subtle"
                  }`}
                >
                  {config.active ? "Activo" : "Inactivo"}
                </span>
              )}
            </div>
          </div>
        </Link>

        <Link
          href="/secretaria/recuperaciones/horario"
          prefetch={false}
          className="group rounded-xl border border-rec-border-default bg-rec-bg-elevated p-5 transition hover:border-rec-info-border hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rec-info-bg-strong text-xl group-hover:scale-110 transition-transform">
              H
            </div>
            <div>
              <h2 className="font-semibold text-rec-text-primary group-hover:text-rec-info-text transition">
                Horario de recuperacion
              </h2>
              <p className="mt-0.5 text-xs text-rec-text-subtle">
                Sube y actualiza el archivo oficial del horario. Docentes y estudiantes pueden descargarlo desde sus vistas.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
