"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { academicApi, type Group } from "@/lib/academicApi";
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

export default function SecretariaPerformancePage() {
  const [groups, setGroups] = useState<(Group & { grade?: { nombre: string } })[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [promedioGeneral, setPromedioGeneral] = useState("");
  const [asistenciaPromedio, setAsistenciaPromedio] = useState("");
  const [aprobacion, setAprobacion] = useState("");
  const [mejorAsignatura, setMejorAsignatura] = useState("");
  const [estudiantesDestacados, setEstudiantesDestacados] = useState("");
  const [inasistenciasJustificadas, setInasistenciasJustificadas] = useState("");
  const [inasistenciasInjustificadas, setInasistenciasInjustificadas] = useState("");
  const [porcentajeCursoMayorAsistencia, setPorcentajeCursoMayorAsistencia] = useState("");
  const [variacionPromedio, setVariacionPromedio] = useState("");
  const [variacionAprobacion, setVariacionAprobacion] = useState("");
  const [reduccionAusencias, setReduccionAusencias] = useState("");
  const [tendenciaGeneral, setTendenciaGeneral] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((item) => item.id === Number(selectedGroupId)) ?? null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await academicApi.listGroups();
        setGroups(data);
        if (data[0]) setSelectedGroupId(String(data[0].id));
      } catch {
        setError("No se pudieron cargar los grupos");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedGroup) return;
      try {
        setError(null);
        const perf = await performanceApi.getByGroup(selectedGroup.id);
        setPromedioGeneral(toText(perf?.promedioGeneral));
        setAsistenciaPromedio(toText(perf?.asistenciaPromedio));
        setAprobacion(toText(perf?.aprobacion));
        setMejorAsignatura(perf?.mejorAsignatura ?? "");
        setEstudiantesDestacados(perf?.estudiantesDestacados ?? "");
        setInasistenciasJustificadas(toText(perf?.inasistenciasJustificadas));
        setInasistenciasInjustificadas(toText(perf?.inasistenciasInjustificadas));
        setPorcentajeCursoMayorAsistencia(toText(perf?.porcentajeCursoMayorAsistencia));
        setVariacionPromedio(toText(perf?.variacionPromedio));
        setVariacionAprobacion(toText(perf?.variacionAprobacion));
        setReduccionAusencias(toText(perf?.reduccionAusencias));
        setTendenciaGeneral(perf?.tendenciaGeneral ?? "");
      } catch {
        setError("No se pudieron cargar las estadísticas del grupo");
      }
    };
    run();
  }, [selectedGroup]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGroup?.nombre) return;

    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      await performanceApi.upsertByGrade(selectedGroup.nombre, {
        promedioGeneral: toNumber(promedioGeneral),
        asistenciaPromedio: toNumber(asistenciaPromedio),
        aprobacion: toNumber(aprobacion),
        mejorAsignatura: mejorAsignatura.trim() || undefined,
        estudiantesDestacados: estudiantesDestacados.trim() || undefined,
        inasistenciasJustificadas: toNumber(inasistenciasJustificadas),
        inasistenciasInjustificadas: toNumber(inasistenciasInjustificadas),
        porcentajeCursoMayorAsistencia: toNumber(porcentajeCursoMayorAsistencia),
        variacionPromedio: toNumber(variacionPromedio),
        variacionAprobacion: toNumber(variacionAprobacion),
        reduccionAusencias: toNumber(reduccionAusencias),
        tendenciaGeneral: tendenciaGeneral.trim() || undefined,
      });
      setMessage("Rendimiento guardado correctamente");
    } catch {
      setError("No se pudo guardar el rendimiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="p-4 space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">Rendimiento académico</h1>
      <p className="text-sm text-gray-700">Gestiona métricas de desempeño por grupo.</p>

      {message ? <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="max-w-sm">
        <label className="mb-1 block text-sm font-medium">Grupo</label>
        <select
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          disabled={loading}
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {(group.grade?.nombre ?? "Grado") + " - " + group.nombre}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded p-4 bg-white">
        <InputNumber label="Promedio general" value={promedioGeneral} setValue={setPromedioGeneral} />
        <InputNumber label="Asistencia promedio (%)" value={asistenciaPromedio} setValue={setAsistenciaPromedio} />
        <InputNumber label="Aprobación (%)" value={aprobacion} setValue={setAprobacion} />
        <InputText label="Mejor asignatura" value={mejorAsignatura} setValue={setMejorAsignatura} />
        <InputText label="Estudiantes destacados" value={estudiantesDestacados} setValue={setEstudiantesDestacados} />
        <InputNumber label="Inasistencias justificadas" value={inasistenciasJustificadas} setValue={setInasistenciasJustificadas} />
        <InputNumber label="Inasistencias injustificadas" value={inasistenciasInjustificadas} setValue={setInasistenciasInjustificadas} />
        <InputNumber label="% curso mayor asistencia" value={porcentajeCursoMayorAsistencia} setValue={setPorcentajeCursoMayorAsistencia} />
        <InputNumber label="Variación promedio" value={variacionPromedio} setValue={setVariacionPromedio} />
        <InputNumber label="Variación aprobación" value={variacionAprobacion} setValue={setVariacionAprobacion} />
        <InputNumber label="Reducción ausencias" value={reduccionAusencias} setValue={setReduccionAusencias} />
        <InputText label="Tendencia general" value={tendenciaGeneral} setValue={setTendenciaGeneral} />

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={!selectedGroupId || saving || loading}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar rendimiento"}
          </button>
        </div>
      </form>
    </section>
  );
}

function InputNumber({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return <InputText label={label} value={value} setValue={setValue} type="number" />;
}

function InputText({
  label,
  value,
  setValue,
  type = "text",
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type={type}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </label>
  );
}
