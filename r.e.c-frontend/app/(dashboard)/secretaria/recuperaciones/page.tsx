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
  if (ms <= 0) return "N/D";
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
  const isFuture = config ? new Date(config.startAt).getTime() > now : false;
  const isPast = config ? new Date(config.endAt).getTime() < now : false;
  const remaining = config ? Math.max(0, new Date(config.endAt).getTime() - now) : 0;
  const totalDuration = config
    ? new Date(config.endAt).getTime() - new Date(config.startAt).getTime()
    : 0;
  const progress = config && totalDuration > 0
    ? Math.min(100, Math.max(0, ((now - new Date(config.startAt).getTime()) / totalDuration) * 100))
    : 0;

  const statusBg = config?.active
    ? "border-green-300 bg-green-50 text-green-800"
    : isFuture
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : "border-slate-300 bg-slate-50 text-slate-600";

  const barColor = config?.active
    ? remaining < 86400000
      ? "bg-red-500"
      : remaining < 3 * 86400000
        ? "bg-amber-400"
        : "bg-emerald-500"
    : isPast
      ? "bg-slate-400"
      : "bg-blue-400";

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
            {config.active ? "Activo" : isFuture ? "Proximo" : "Finalizado"}
          </span>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-400">Cargando estado del periodo...</p>
        </div>
      )}

      {!loading && config && (
        <div className={`rounded-xl border-2 p-5 ${statusBg}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">
              {config.active
                ? "Periodo activo"
                : isFuture
                  ? "Periodo proximo"
                  : "Periodo finalizado"}
            </h2>
            <Link
              href="/secretaria/recuperaciones/configuracion"
              className="rounded-lg border border-current/30 bg-white/70 px-3 py-1 text-xs font-medium hover:bg-white transition"
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
                <p className={`font-semibold ${remaining < 86400000 ? "text-red-700" : remaining < 3 * 86400000 ? "text-amber-700" : ""}`}>
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

          {config.active && remaining > 0 && (
            <MiniCountdown targetIso={config.endAt} label="Cierra en" />
          )}
          {isFuture && (
            <MiniCountdown targetIso={config.startAt} label="Abre en" />
          )}
          {isPast && (
            <p className="mt-3 text-xs opacity-60">
              Finalizo el {fmtDateTime(config.endAt)}. Ve a Configuracion para abrir un nuevo periodo.
            </p>
          )}

          {config.active && remaining < 86400000 && remaining > 0 && (
            <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              El periodo cierra en menos de 24 horas. Considera extenderlo si es necesario.
            </div>
          )}
          {config.active && remaining >= 86400000 && remaining < 3 * 86400000 && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              El periodo cierra en menos de 3 dias.
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/secretaria/recuperaciones/configuracion"
          prefetch={false}
          className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-xl group-hover:scale-110 transition-transform">
              C
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                Configuracion de periodo
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Countdown en vivo, barra de progreso, botones de activar/desactivar/extender y edicion de fechas.
              </p>
              {!loading && config && (
                <span
                  className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                    config.active
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-slate-300 bg-slate-50 text-slate-500"
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
          className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl group-hover:scale-110 transition-transform">
              H
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 group-hover:text-blue-700 transition">
                Horario de recuperacion
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Sube y actualiza el archivo oficial del horario. Docentes y estudiantes pueden descargarlo desde sus vistas.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}