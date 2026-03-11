"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { performanceApi, type StudentAcademicResponse } from "@/lib/performanceApi";

function formatNumber(value: number | null | undefined) {
  return value == null ? "—" : value.toFixed(2);
}

export default function EstudianteGestionAcademicaPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentAcademicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const studentId = Number(user?.id);
      if (!studentId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await performanceApi.getStudentAcademic(studentId);
        setData(response);
      } catch {
        setError("No se pudo cargar tu gestión académica");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [user?.id]);

  const records = useMemo(() => data?.records ?? [], [data?.records]);

  const totalProgress = useMemo(() => {
    const values = records
      .map((item) => item.progresoMateria)
      .filter((value): value is number => typeof value === "number");
    if (values.length === 0) return null;
    return values.reduce((acc, item) => acc + item, 0) / values.length;
  }, [records]);

  return (
    <section className="p-4 space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Gestión académica</h1>
        <p className="text-sm text-slate-600">Consulta tu rendimiento detallado por materia, notas e inasistencias.</p>
      </header>

      {loading ? <p className="text-sm text-slate-600">Cargando información académica...</p> : null}
      {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {!loading && data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card title="Grupo" value={`${data.group.grade.nombre} - ${data.group.nombre}`} />
            <Card title="Promedio general" value={formatNumber(data.summary.promedioGeneral)} />
            <Card title="Materias registradas" value={String(data.summary.materiasConRegistro)} />
            <Card title="Progreso promedio" value={totalProgress == null ? "—" : `${totalProgress.toFixed(1)}%`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card title="Inasistencias justificadas" value={String(data.summary.inasistenciasJustificadas)} />
            <Card title="Inasistencias injustificadas" value={String(data.summary.inasistenciasInjustificadas)} />
          </div>

          <div className="space-y-3">
            {records.length === 0 ? (
              <p className="text-sm text-slate-600">Aún no hay registros académicos cargados por tus docentes.</p>
            ) : (
              records.map((record) => (
                <article key={record.id} className="rounded border border-slate-200 bg-white p-4 space-y-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{record.subject.nombre}</h2>
                    <p className="text-xs text-slate-500">Actualizado: {new Date(record.updatedAt).toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                    <Metric label="Parcial 1" value={formatNumber(record.parcial1)} />
                    <Metric label="Parcial 2" value={formatNumber(record.parcial2)} />
                    <Metric label="Parcial 3" value={formatNumber(record.parcial3)} />
                    <Metric label="Parcial 4" value={formatNumber(record.parcial4)} />
                    <Metric label="Promedio" value={formatNumber(record.promedioMateria)} />
                    <Metric label="Nota final" value={formatNumber(record.notaFinal)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <Metric label="Progreso" value={record.progresoMateria == null ? "—" : `${record.progresoMateria}%`} />
                    <Metric label="Inasist. justificadas" value={String(record.inasistenciasJustificadas)} />
                    <Metric label="Inasist. injustificadas" value={String(record.inasistenciasInjustificadas)} />
                  </div>

                  {record.observaciones ? (
                    <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      <p className="font-medium text-slate-900">Observaciones</p>
                      <p className="mt-1 whitespace-pre-wrap">{record.observaciones}</p>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
