"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ESTUDIANTE_TOUR_MODULES } from "@/lib/estudianteTour/modules";
import { useEstudianteTourOptional } from "./EstudianteTourProvider";

export default function EstudianteTourToolbar() {
  const ctx = useEstudianteTourOptional();
  const router = useRouter();

  const nextSuggested = useMemo(() => {
    if (!ctx) return null;
    return ESTUDIANTE_TOUR_MODULES.find((m) => !ctx.progress[m.id]) ?? null;
  }, [ctx]);

  if (!ctx) return null;

  const {
    progress,
    percentComplete,
    completedCount,
    totalModules,
    currentModule,
    guideBarVisible,
    replayCurrentModuleTour,
    muted,
    setMuted,
  } = ctx;

  if (!guideBarVisible) return null;

  return (
    <div className="estudiante-tour-toolbar rounded-2xl border border-rec-border-default bg-rec-bg-elevated/95 px-3 py-2.5 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rec-text-subtle">Guía estudiante</p>
            <span className="text-[11px] font-bold tabular-nums text-rec-success-text">
              {completedCount}/{totalModules} · {percentComplete}%
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-rec-bg-muted"
            role="progressbar"
            aria-valuenow={percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso de guías por sección"
          >
            <div
              className="h-full rounded-full bg-rec-primary transition-[width] duration-500 ease-out"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {ESTUDIANTE_TOUR_MODULES.map((m) => {
              const done = Boolean(progress[m.id]);
              const active = currentModule?.id === m.id;
              return (
                <Link
                  key={m.id}
                  href={m.path}
                  prefetch={false}
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                    done
                      ? "bg-rec-success-bg text-rec-success-text ring-1 ring-rec-success-border"
                      : "bg-rec-bg-muted text-rec-text-muted hover:bg-rec-bg-subtle"
                  } ${active ? "ring-2 ring-rec-primary ring-offset-1 ring-offset-rec-bg-elevated" : ""}`}
                  title={m.label}
                >
                  {m.shortLabel}
                </Link>
              );
            })}
          </div>
          {nextSuggested && !progress[nextSuggested.id] && (
            <p className="mt-1.5 text-[11px] text-rec-text-subtle">
              Sugerencia: abre{" "}
              <button
                type="button"
                onClick={() => router.push(nextSuggested.path)}
                className="font-semibold text-rec-success-text underline decoration-rec-success-border underline-offset-2 hover:opacity-90"
              >
                {nextSuggested.label}
              </button>{" "}
              para la guía de esa sección.
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="rounded-xl border border-rec-border-default bg-rec-bg-base px-3 py-2 text-xs font-medium text-rec-text-secondary transition hover:bg-rec-bg-muted"
            title={muted ? "Activar voz de la guía" : "Silenciar voz"}
          >
            {muted ? "Activar voz" : "Silenciar voz"}
          </button>
          <button
            type="button"
            onClick={() => replayCurrentModuleTour()}
            disabled={!currentModule}
            className="rounded-xl bg-rec-primary px-3 py-2 text-xs font-semibold text-rec-text-on-primary shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ver guía otra vez
          </button>
        </div>
      </div>
    </div>
  );
}
