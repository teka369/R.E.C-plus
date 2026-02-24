"use client";
import React, { useEffect, useMemo, useState } from "react";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { academicApi, type Grade, type Group, type GroupStudentDTO } from "@/lib/academicApi";

type GroupMap = {
  students: GroupStudentDTO[];
  repeaters: Record<number, boolean>;
  targetGroupId: string;
  loaded: boolean;
};

export default function SecretariaPromocionesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sourceGradeId, setSourceGradeId] = useState<string>("");
  const [targetGradeId, setTargetGradeId] = useState<string>("");
  const [sourceGroups, setSourceGroups] = useState<Group[]>([]);
  const [targetGroups, setTargetGroups] = useState<Group[]>([]);
  const [groupMap, setGroupMap] = useState<Record<number, GroupMap>>({});
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState<{ summary: { sourceGroupId: number; targetGroupId: number; promotedCount: number; repeatCount: number }[] } | null>(null);

  useEffect(() => {
    academicApi.listGrades().then((gs) => setGrades(gs.map((g) => ({ id: g.id, nombre: g.nombre }))));
  }, []);

  useEffect(() => {
    const sid = Number(sourceGradeId);
    if (!sid) {
      setSourceGroups([]);
      setGroupMap({});
      return;
    }
    academicApi.listGrades().then((gs) => {
      const grade = gs.find((g) => g.id === sid);
      const groups = grade?.groups ?? [];
      setSourceGroups(groups);
      setGroupMap({});
      // Cargar estudiantes por grupo origen
      (async () => {
        const map: Record<number, GroupMap> = {};
        for (const g of groups) {
          try {
            const students = await academicApi.listGroupStudents(g.id);
            map[g.id] = { students, repeaters: {}, targetGroupId: "", loaded: true };
          } catch {
            map[g.id] = { students: [], repeaters: {}, targetGroupId: "", loaded: false };
          }
        }
        setGroupMap(map);
      })();
    });
  }, [sourceGradeId]);

  useEffect(() => {
    const tid = Number(targetGradeId);
    if (!tid) {
      setTargetGroups([]);
      return;
    }
    academicApi.listGrades().then((gs) => {
      const grade = gs.find((g) => g.id === tid);
      setTargetGroups(grade?.groups ?? []);
    });
  }, [targetGradeId]);

  const gradeOptions = useMemo(() => grades.map((g) => ({ label: g.nombre, value: String(g.id) })), [grades]);
  const targetGroupOptions = useMemo(() => targetGroups.map((g) => ({ label: `${g.nombre}`, value: String(g.id) })), [targetGroups]);

  

  const canSubmit = useMemo(() => {
    const sid = Number(sourceGradeId);
    const tid = Number(targetGradeId);
    if (!sid || !tid || sid === tid) return false;
    if (sourceGroups.length === 0) return false;
    // Cada grupo origen debe tener grupo destino seleccionado
    return sourceGroups.every((g) => !!groupMap[g.id]?.targetGroupId);
  }, [sourceGradeId, targetGradeId, sourceGroups, groupMap]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        sourceGradeId: Number(sourceGradeId),
        targetGradeId: Number(targetGradeId),
        mappings: sourceGroups.map((g) => {
          const gm = groupMap[g.id];
          const repeatIds = Object.entries(gm.repeaters)
            .filter(([_, v]) => v)
            .map(([id]) => Number(id));
          return {
            sourceGroupId: g.id,
            targetGroupId: Number(gm.targetGroupId),
            repeatStudentIds: repeatIds,
          };
        }),
      };
      const res = await academicApi.promoteGrade(payload as any);
      setResult({ summary: res.summary });
    } catch (err) {
      // noop; se podría mostrar error
    } finally {
      setSubmitting(false);
    }
  }

  async function onPreview() {
    if (!canSubmit) return;
    setPreviewing(true);
    setResult(null);
    try {
      const payload = {
        sourceGradeId: Number(sourceGradeId),
        targetGradeId: Number(targetGradeId),
        mappings: sourceGroups.map((g) => {
          const gm = groupMap[g.id];
          const repeatIds = Object.entries(gm.repeaters)
            .filter(([_, v]) => v)
            .map(([id]) => Number(id));
          return {
            sourceGroupId: g.id,
            targetGroupId: Number(gm.targetGroupId),
            repeatStudentIds: repeatIds,
          };
        }),
      };
      const res = await academicApi.promoteGradePreview(payload as any);
      setResult({ summary: res.summary });
    } catch {
      // opcional: mostrar error
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <section className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Promoción de Grado</h2>
      <p className="text-sm text-gray-600">Selecciona grado de origen y destino, define el grupo de destino y marca estudiantes que repiten.</p>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Grado origen" options={[{ label: "Seleccione", value: "" }, ...gradeOptions]} value={sourceGradeId} onChange={(e) => setSourceGradeId(e.target.value)} />
          <Select label="Grado destino" options={[{ label: "Seleccione", value: "" }, ...gradeOptions]} value={targetGradeId} onChange={(e) => setTargetGradeId(e.target.value)} />
        </div>

        {sourceGroups.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Mapeo de grupos y selección de repetidores</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Grupo origen</th>
                    <th className="p-2 text-left">Grupo destino</th>
                    <th className="p-2 text-left">Estudiantes (marca los que repiten)</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceGroups.map((g) => {
                    const gm = groupMap[g.id];
                    return (
                      <tr key={g.id} className="border-t border-gray-200 align-top">
                        <td className="p-2">{g.nombre}</td>
                        <td className="p-2">
                          <Select
                            label=""
                            options={[{ label: "Seleccione", value: "" }, ...targetGroupOptions]}
                            value={gm?.targetGroupId || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGroupMap((m) => ({ ...m, [g.id]: { ...(m[g.id] || { students: [], repeaters: {}, loaded: false }), targetGroupId: val } }));
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <div className="space-y-1">
                            {(gm?.students || []).map((s) => (
                              <label key={s.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!gm?.repeaters[s.id]}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setGroupMap((m) => ({
                                      ...m,
                                      [g.id]: {
                                        ...(m[g.id] || { students: [], repeaters: {}, targetGroupId: "", loaded: false }),
                                        repeaters: { ...(m[g.id]?.repeaters || {}), [s.id]: checked },
                                      },
                                    }));
                                  }}
                                />
                                <span>{s.nombres} {s.apellidos} — {s.documento_identidad}</span>
                              </label>
                            ))}
                            {(gm?.students || []).length === 0 && <p className="text-xs text-gray-600">Sin estudiantes en el grupo</p>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="button" disabled={!canSubmit || previewing} onClick={onPreview}>{previewing ? "Simulando..." : "Simular"}</Button>
          <Button type="submit" disabled={!canSubmit || submitting || !result}>{submitting ? "Promocionando..." : "Confirmar y Promocionar"}</Button>
        </div>

        {result && (
          <div className="border rounded p-3 space-y-3">
            <h4 className="font-medium">Resumen de simulación</h4>
            {(() => {
              const totalPromoted = result.summary.reduce((acc, s) => acc + s.promotedCount, 0);
              const totalRepeat = result.summary.reduce((acc, s) => acc + s.repeatCount, 0);
              const totalStudents = totalPromoted + totalRepeat;
              const pct = totalStudents > 0 ? Math.round((totalPromoted / totalStudents) * 100) : 0;
              const nameById: Record<number, string> = {};
              sourceGroups.forEach((g) => (nameById[g.id] = g.nombre));
              targetGroups.forEach((g) => (nameById[g.id] = g.nombre));
              return (
                <>
                  <div className="text-sm text-gray-700">
                    <span className="mr-4">Total promovidos: {totalPromoted}</span>
                    <span className="mr-4">Total repiten: {totalRepeat}</span>
                    <span className="mr-4">Total estudiantes: {totalStudents}</span>
                    <span className="">% promoción: {pct}%</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Origen</th>
                          <th className="p-2 text-left">Destino</th>
                          <th className="p-2 text-left">Promovidos</th>
                          <th className="p-2 text-left">Repiten</th>
                          <th className="p-2 text-left">Antes</th>
                          <th className="p-2 text-left">Después</th>
                          <th className="p-2 text-left">% Promoción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.summary.map((r, idx) => {
                          const groupTotal = r.promotedCount + r.repeatCount;
                          const groupPct = groupTotal > 0 ? Math.round((r.promotedCount / groupTotal) * 100) : 0;
                          return (
                            <tr key={idx} className="border-t border-gray-200">
                              <td className="p-2">{(r as any).sourceGroupName || nameById[r.sourceGroupId] || `Grupo ${r.sourceGroupId}`}</td>
                              <td className="p-2">{(r as any).targetGroupName || nameById[r.targetGroupId] || `Grupo ${r.targetGroupId}`}</td>
                              <td className="p-2">{r.promotedCount}</td>
                              <td className="p-2">{r.repeatCount}</td>
                              <td className="p-2">{(r as any).beforeCount ?? '-'}</td>
                              <td className="p-2">{(r as any).afterCount ?? '-'}</td>
                              <td className="p-2">{groupPct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-sm text-gray-700 mt-2">
                    {result.summary.map((r, idx) => {
                      const gm = groupMap[r.sourceGroupId];
                      const nameByStudentId = new Map<number, string>((gm?.students || []).map((s) => [s.id, `${s.nombres} ${s.apellidos}`]));
                      const promotedList = ((r as any).promotedStudentIds || []) as number[];
                      const repeatList = ((r as any).repeatStudentIds || []) as number[];
                      return (
                        <div key={`detail-${idx}`} className="border-t border-gray-200 pt-2 mt-2">
                          <div className="font-medium">Detalle {((r as any).sourceGroupName || nameById[r.sourceGroupId])} → {((r as any).targetGroupName || nameById[r.targetGroupId])}</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <div className="text-gray-600">Promovidos ({promotedList.length})</div>
                              <ul className="list-disc pl-5">
                                {promotedList.length === 0 ? <li className="text-gray-500">Ninguno</li> : promotedList.map((id) => <li key={id}>{nameByStudentId.get(id) || `ID ${id}`}</li>)}
                              </ul>
                            </div>
                            <div>
                              <div className="text-gray-600">Repiten ({repeatList.length})</div>
                              <ul className="list-disc pl-5">
                                {repeatList.length === 0 ? <li className="text-gray-500">Ninguno</li> : repeatList.map((id) => <li key={id}>{nameByStudentId.get(id) || `ID ${id}`}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </form>
    </section>
  );
}