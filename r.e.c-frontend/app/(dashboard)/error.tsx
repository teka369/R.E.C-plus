"use client";

import { useEffect, useMemo } from "react";

function isChunkOrAssetLoadError(message: string): boolean {
  return /Failed to load chunk|Loading chunk \d+ failed|ChunkLoadError|chunk.*404|Importing a module script failed/i.test(
    message,
  );
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunkIssue = useMemo(
    () => isChunkOrAssetLoadError(error?.message ?? ""),
    [error?.message],
  );

  useEffect(() => {
    console.error("[R.E.C Dashboard] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-rec-danger-border bg-rec-bg-elevated p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rec-danger-bg">
          <svg
            className="h-7 w-7 text-rec-danger-text"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-rec-text-primary">
          {chunkIssue ? "Actualización del sitio" : "Error en el panel"}
        </h1>
        <p className="mt-2 text-sm text-rec-text-muted">
          {chunkIssue
            ? "Suele pasar tras publicar una nueva versión: el navegador pide archivos antiguos que ya no están en el servidor. Recarga la página completa (o borra la caché del sitio) para obtener la versión actual."
            : "No se pudo cargar esta sección. Intenta de nuevo."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-rec-text-subtle">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {chunkIssue && (
            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="rounded-xl bg-[color:var(--rec-primary)] px-6 py-3 text-sm font-semibold text-rec-text-on-media transition hover:bg-[color:var(--rec-primary-strong)]"
            >
              Recargar página
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${
              chunkIssue
                ? "border border-rec-border-default bg-rec-bg-elevated text-rec-text-primary hover:bg-rec-bg-base"
                : "bg-[color:var(--rec-primary)] text-rec-text-on-media hover:bg-[color:var(--rec-primary-strong)]"
            }`}
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
