"use client";
import React, { useEffect, useMemo, useState } from "react";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import {
  academicApi,
  type Grade,
  type Group,
  type GroupStudentDTO,
  type PromoteGradePayload,
  type PromotionSummary,
} from "@/lib/academicApi";

type GroupMap = {
  students: GroupStudentDTO[];
  repeaters: Record<number, boolean>;
  targetGroupId: string;
  loaded: boolean;
};

type PromotionProgress = { current: number; total: number } | null;

export default function SecretariaPromocionesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sourceGradeId, setSourceGradeId] = useState<string>("");
  const [targetGradeId, setTargetGradeId] = useState<string>("");
  const [sourceGroups, setSourceGroups] = useState<Group[]>([]);
  const [targetGroups, setTargetGroups] = useState<Group[]>([]);
  const [groupMap, setGroupMap] = useState<Record<number, GroupMap>>({});
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState<{ summary: PromotionSummary[] } | null>(
    null,
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());
  const [promotionProgress, setPromotionProgress] = useState<PromotionProgress>(null);

  useEffect(() => {
    academicApi.listGrades().then((gs) => setGrades(gs.map((g) => ({ id: g.id, nombre: g.nombre }))));
  }, []);

  useEffect(() => {
    const sid = Number(sourceGradeId);
    if (!sid) {
      setSourceGroups([]);
      setGroupMap({});
      setSelectedGroupIds(new Set());
      return;
    }
    academicApi.listGrades().then((gs) => {
      const grade = gs.find((g) => g.id === sid);
      const groups = grade?.groups ?? [];
      setSourceGroups(groups);
      setGroupMap({});
      setSelectedGroupIds(new Set());
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
    if (selectedGroupIds.size === 0) return false;
    // Cada grupo seleccionado debe tener grupo destino seleccionado
    return Array.from(selectedGroupIds).every((gid) => !!groupMap[gid]?.targetGroupId);
  }, [sourceGradeId, targetGradeId, selectedGroupIds, groupMap]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(null);
    setPromotionProgress(null);
    try {
      const selectedGroups = sourceGroups.filter((g) => selectedGroupIds.has(g.id));
      const payload: PromoteGradePayload = {
        sourceGradeId: Number(sourceGradeId),
        targetGradeId: Number(targetGradeId),
        mappings: selectedGroups.map((g) => {
          const gm = groupMap[g.id];
          const repeatIds = Object.entries(gm.repeaters)
            .filter(([, v]) => v)
            .map(([id]) => Number(id));
          return {
            sourceGroupId: g.id,
            targetGroupId: Number(gm.targetGroupId),
            repeatStudentIds: repeatIds,
          };
        }),
      };
      // Simular progreso si hay múltiples grupos
      if (selectedGroups.length > 1) {
        setPromotionProgress({ current: 0, total: selectedGroups.length });
        const progressInterval = setInterval(() => {
          setPromotionProgress((prev) => {
            if (!prev) return null;
            return { ...prev, current: Math.min(prev.current + 1, prev.total - 1) };
          });
        }, 150);
        const res = await academicApi.promoteGrade(payload);
        clearInterval(progressInterval);
        setPromotionProgress({ current: selectedGroups.length, total: selectedGroups.length });
        setResult({ summary: res.summary });
        setTimeout(() => setPromotionProgress(null), 1000);
      } else {
        const res = await academicApi.promoteGrade(payload);
        setResult({ summary: res.summary });
      }
    } catch {
      // noop; se podría mostrar error
    } finally {
      setSubmitting(false);
    }
  }

  async function onPreview() {
    if (!canSubmit) return;
    setPreviewing(true);
    setResult(null);
    setPromotionProgress(null);
    try {
      const selectedGroups = sourceGroups.filter((g) => selectedGroupIds.has(g.id));
      const payload: PromoteGradePayload = {
        sourceGradeId: Number(sourceGradeId),
        targetGradeId: Number(targetGradeId),
        mappings: selectedGroups.map((g) => {
          const gm = groupMap[g.id];
          const repeatIds = Object.entries(gm.repeaters)
            .filter(([, v]) => v)
            .map(([id]) => Number(id));
          return {
            sourceGroupId: g.id,
            targetGroupId: Number(gm.targetGroupId),
            repeatStudentIds: repeatIds,
          };
        }),
      };
      const res = await academicApi.promoteGradePreview(payload);
      setResult({ summary: res.summary });
    } catch {
      // opcional: mostrar error
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <section className="sec-page space-y-6">
      <div className="sec-hero">
        <div>
          <h2 className="sec-title">Promoción de Grado</h2>
          <p className="sec-subtitle">Simula, valida y ejecuta promociones por grupo con control explícito de estudiantes repetidores.</p>
        </div>
        <span className="sec-chip">Cierre de periodo</span>
      </div>

      <div className="sec-toolbar">
        <div className="sec-flow-nav">
          <span className="sec-flow-link">1. Origen/Destino</span>
          <span className="sec-flow-link">2. Mapeo de grupos</span>
          <span className="sec-flow-link">3. Simulación</span>
          <span className="sec-flow-link">4. Confirmación</span>
        </div>
        <span className="sec-muted">Primero simula, luego confirma la promoción para evitar errores operativos</span>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="sec-card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Grado origen" options={[{ label: "Seleccione", value: "" }, ...gradeOptions]} value={sourceGradeId} onChange={(e) => setSourceGradeId(e.target.value)} />
          <Select label="Grado destino" options={[{ label: "Seleccione", value: "" }, ...gradeOptions]} value={targetGradeId} onChange={(e) => setTargetGradeId(e.target.value)} />
        </div>

        {sourceGroups.length > 0 && (
          <div className="sec-card p-4 space-y-4">
            <div className="sec-toolbar">
              <h3 className="font-medium">Mapeo de grupos y selección de repetidores</h3>
              <div className="sec-toolbar-group">
                <Button variant="secondary" size="sm" onClick={() => setSelectedGroupIds(new Set(sourceGroups.map((g) => g.id)))} disabled={selectedGroupIds.size === sourceGroups.length}>Seleccionar todos</Button>
                <Button variant="secondary" size="sm" onClick={() => setSelectedGroupIds(new Set())} disabled={selectedGroupIds.size === 0}>Limpiar selección</Button>
                {selectedGroupIds.size > 0 && <span className="text-xs text-rec-text-muted">Seleccionados: {selectedGroupIds.size}/{sourceGroups.length}</span>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm sec-table">
                <thead className="bg-rec-bg-muted">
                  <tr>
                    <th className="p-2 text-left" style={{ width: "32px" }}>Sel.</th>
                    <th className="p-2 text-left">Grupo origen</th>
                    <th className="p-2 text-left">Grupo destino</th>
                    <th className="p-2 text-left">Estudiantes (marca los que repiten)</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceGroups.map((g) => {
                    const gm = groupMap[g.id];
                    const isSelected = selectedGroupIds.has(g.id);
                    return (
                      <tr key={g.id} className={`border-t border-rec-border-default align-top ${isSelected ? "bg-rec-success-bg" : ""}`}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedGroupIds((prev) => {
                                const next = new Set(prev);
                                if (checked) {
                                  next.add(g.id);
                                } else {
                                  next.delete(g.id);
                                }
                                return next;
                              });
                            }}
                          />
                        </td>
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
                                <span>{s.nombres} {s.apellidos} — {s.codigo}</span>
                              </label>
                            ))}
                            {(gm?.students || []).length === 0 && <p className="text-xs text-rec-text-muted">Sin estudiantes en el grupo</p>}
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

        <div className="sec-toolbar">
          {promotionProgress && (
            <div className="flex-1 border rounded p-2 bg-rec-success-bg">
              <div className="text-xs font-medium mb-1">Procesando: {promotionProgress.current}/{promotionProgress.total}</div>
              <div className="w-full border rounded overflow-hidden" style={{ height: "4px" }}>
                <div className="bg-rec-primary" style={{ width: `${(promotionProgress.current / promotionProgress.total) * 100}%`, height: "100%", transition: "width 0.3s" }} />
              </div>
            </div>
          )}
          <div className="sec-toolbar-group">
            <Button type="button" disabled={!canSubmit || previewing} onClick={onPreview}>{previewing ? "Simulando..." : "Simular"}</Button>
            <Button type="submit" disabled={!canSubmit || submitting || !result}>{submitting ? `Promocionando (${selectedGroupIds.size})...` : `Confirmar y Promocionar (${selectedGroupIds.size})`}</Button>
          </div>
        </div>

        {result && (
          <div className="sec-card p-3 space-y-3">
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
                  <div className="text-sm text-rec-text-secondary">
                    <span className="mr-4">Total promovidos: {totalPromoted}</span>
                    <span className="mr-4">Total repiten: {totalRepeat}</span>
                    <span className="mr-4">Total estudiantes: {totalStudents}</span>
                    <span className="">% promoción: {pct}%</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-rec-border-default text-sm">
                      <thead className="bg-rec-bg-muted">
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
                            <tr key={idx} className="border-t border-rec-border-default">
                              <td className="p-2">{r.sourceGroupName || nameById[r.sourceGroupId] || `Grupo ${r.sourceGroupId}`}</td>
                              <td className="p-2">{r.targetGroupName || nameById[r.targetGroupId] || `Grupo ${r.targetGroupId}`}</td>
                              <td className="p-2">{r.promotedCount}</td>
                              <td className="p-2">{r.repeatCount}</td>
                              <td className="p-2">{r.beforeCount ?? '-'}</td>
                              <td className="p-2">{r.afterCount ?? '-'}</td>
                              <td className="p-2">{groupPct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-sm text-rec-text-secondary mt-2">
                    {result.summary.map((r, idx) => {
                      const gm = groupMap[r.sourceGroupId];
                      const nameByStudentId = new Map<number, string>((gm?.students || []).map((s) => [s.id, `${s.nombres} ${s.apellidos}`]));
                      const promotedList = r.promotedStudentIds || [];
                      const repeatList = r.repeatStudentIds || [];
                      return (
                        <div key={`detail-${idx}`} className="border-t border-rec-border-default pt-2 mt-2">
                          <div className="font-medium">Detalle {(r.sourceGroupName || nameById[r.sourceGroupId])} → {(r.targetGroupName || nameById[r.targetGroupId])}</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <div className="text-rec-text-muted">Promovidos ({promotedList.length})</div>
                              <ul className="list-disc pl-5">
                                {promotedList.length === 0 ? <li className="text-rec-text-subtle">Ninguno</li> : promotedList.map((id) => <li key={id}>{nameByStudentId.get(id) || `ID ${id}`}</li>)}
                              </ul>
                            </div>
                            <div>
                              <div className="text-rec-text-muted">Repiten ({repeatList.length})</div>
                              <ul className="list-disc pl-5">
                                {repeatList.length === 0 ? <li className="text-rec-text-subtle">Ninguno</li> : repeatList.map((id) => <li key={id}>{nameByStudentId.get(id) || `ID ${id}`}</li>)}
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