"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import { performanceApi } from "@/lib/performanceApi";

function toText(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

function toNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default function LigasDocentePage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [promedioGeneral, setPromedioGeneral] = useState("");
  const [asistenciaPromedio, setAsistenciaPromedio] = useState("");
  const [aprobacion, setAprobacion] = useState("");
  const [mejorAsignatura, setMejorAsignatura] = useState("");
  const [estudiantesDestacados, setEstudiantesDestacados] = useState("");
  const [tendenciaGeneral, setTendenciaGeneral] = useState("");

  const groups = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; label: string }>();
    assignments.forEach((item) => {
      if (!item.group?.id) return;
      map.set(item.group.id, {
        id: item.group.id,
        nombre: item.group.nombre,
        label: `${item.group.grade?.nombre ?? "Grado"} - ${item.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

  const selectedGroup = useMemo(
    () => groups.find((item) => item.id === Number(selectedGroupId)) ?? null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    const run = async () => {
      const teacherId = Number(user?.id);
      if (!teacherId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await academicApi.listTeacherAssignments(teacherId);
        setAssignments(data);
        const firstGroup = data[0]?.group;
        if (firstGroup?.id) setSelectedGroupId(String(firstGroup.id));
      } catch {
        setError("No se pudieron cargar tus asignaciones");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!selectedGroup) return;
      try {
        const perf = await performanceApi.getByGroup(selectedGroup.id);
        setPromedioGeneral(toText(perf?.promedioGeneral));
        setAsistenciaPromedio(toText(perf?.asistenciaPromedio));
        setAprobacion(toText(perf?.aprobacion));
        setMejorAsignatura(perf?.mejorAsignatura ?? "");
        setEstudiantesDestacados(perf?.estudiantesDestacados ?? "");
        setTendenciaGeneral(perf?.tendenciaGeneral ?? "");
      } catch {
        setError("No se pudo cargar las ligas del grupo");
      }
    };
    void run();
  }, [selectedGroup]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGroup?.nombre) return;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      await performanceApi.upsertByGrade(selectedGroup.nombre, {
        promedioGeneral: toNumber(promedioGeneral),
        asistenciaPromedio: toNumber(asistenciaPromedio),
        aprobacion: toNumber(aprobacion),
        mejorAsignatura: mejorAsignatura.trim() || undefined,
        estudiantesDestacados: estudiantesDestacados.trim() || undefined,
        tendenciaGeneral: tendenciaGeneral.trim() || undefined,
      });
      setMessage("Ligas actualizadas");
    } catch {
      setError("No se pudo guardar las ligas");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Ligas de grupos</h1>
        <p className="text-sm text-gray-700">Gestiona métricas de desempeño por grupo.</p>
      </header>

      {loading ? <p className="text-sm text-gray-600">Cargando…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {!loading ? (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="block text-xs text-gray-500">Grupo</label>
            <select
              className="mt-1 w-full max-w-md border rounded p-2 text-sm"
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          {selectedGroupId ? (
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded p-4 bg-white">
              <InputField label="Promedio general" value={promedioGeneral} onChange={setPromedioGeneral} type="number" />
              <InputField label="Asistencia promedio (%)" value={asistenciaPromedio} onChange={setAsistenciaPromedio} type="number" />
              <InputField label="Aprobación (%)" value={aprobacion} onChange={setAprobacion} type="number" />
              <InputField label="Mejor asignatura" value={mejorAsignatura} onChange={setMejorAsignatura} />
              <InputField label="Estudiantes destacados" value={estudiantesDestacados} onChange={setEstudiantesDestacados} />
              <InputField label="Tendencia general" value={tendenciaGeneral} onChange={setTendenciaGeneral} />

              <button
                disabled={saving}
                className="md:col-span-2 px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar ligas"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-600">No tienes grupos asignados.</p>
          )}
        </>
      ) : null}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type={type}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}