"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { communicationApi, type FeedbackDTO } from "@/lib/communicationApi";
import { getErrorMessage } from "@/lib/errors";

export default function FeedbackEstudiantePage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const studentId = Number(user?.id);
      if (!studentId) return;
      setLoading(true);
      setError(null);
      try {
        const list = await communicationApi.listFeedbackByStudent(studentId);
        setFeedback(list);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar feedback"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Feedback</h1>
        <p className="text-slate-600">Consulta tu avance, comentarios y sugerencias de los docentes.</p>
      </header>

      {loading ? <p className="text-sm text-gray-600">Cargando…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="space-y-3">
        {feedback.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-900">{item.title}</div>
              {item.createdAt ? (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-700">{item.content}</p>
            {item.strengths?.items?.length ? (
              <p className="mt-2 text-xs text-emerald-700">Fortalezas: {item.strengths.items.join(", ")}</p>
            ) : null}
            {item.improvements?.items?.length ? (
              <p className="mt-1 text-xs text-amber-700">Mejoras: {item.improvements.items.join(", ")}</p>
            ) : null}
          </div>
        ))}
        {!loading && feedback.length === 0 ? <p className="text-sm text-gray-600">Aún no tienes feedback registrado.</p> : null}
      </section>
    </div>
  );
}