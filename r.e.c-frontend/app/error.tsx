"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[R.E.C] Unhandled error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f0f8f3_0%,_#f8fbf9_40%,_#ffffff_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <svg
            className="h-7 w-7 text-red-500"
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
        <h1 className="text-xl font-bold text-slate-900">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-slate-400">
            Ref: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-[color:var(--rec-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--rec-primary-strong)]"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
