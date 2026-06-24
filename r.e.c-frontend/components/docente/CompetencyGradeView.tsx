"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiLoader, FiPlus, FiXCircle } from "react-icons/fi";
import { academicApi } from "@/lib/academicApi";
import { performanceApi, type UpsertStudentAcademicInput } from "@/lib/performanceApi";
import type { StudentAcademicRecord } from "@/lib/performanceApi";
import {
  COMPETENCY_LABELS,
  COMPETENCY_ORDER,
  computeCompetencyFinal,
} from "@/lib/competencyConfig";

function gradeFromEval(ev: unknown): number | undefined {
  if (!ev || typeof ev !== "object") return undefined;
  if ("grade" in ev && typeof (ev as { grade: unknown }).grade === "number") {
    return (ev as { grade: number }).grade;
  }
  if ("nota" in ev && typeof (ev as { nota: unknown }).nota === "number") {
    return (ev as { nota: number }).nota;
  }
  return undefined;
}

function evaluationIdFromEval(ev: unknown): number | undefined {
  if (!ev || typeof ev !== "object") return undefined;
  const o = ev as { evaluationId?: unknown; id?: unknown };
  if (typeof o.evaluationId === "number") return o.evaluationId;
  if (typeof o.id === "number") return o.id;
  return undefined;
}

export interface CompetencyGradeViewProps {
  offeringId: number;
  groupId: number;
  subjectId: number;
  subjectName: string;
  students: Array<{ id: number; name: string }>;
  competencyWeights: Record<string, number>;
  existingEvaluations: Array<{
    id: number;
    titulo: string;
    competencyCategory: string | null;
    porcentaje: number | null;
    orden: number;
  }>;
  /** Notas iniciales por estudiante y evaluación (desde overview). */
  initialGradesByStudent?: Record<number, Record<number, number>>;
  /** Evaluaciones por estudiante (para hidratar sin pasar mapa plano). */
  studentRecords?: Array<{
    studentId: number;
    record?: StudentAcademicRecord;
  }>;
  /** Deshabilita edición (sin asignación o período cerrado). */
  disabled?: boolean;
  onSaved?: () => void;
}

export default function CompetencyGradeView({
  offeringId,
  groupId,
  subjectId,
  subjectName,
  students,
  competencyWeights,
  existingEvaluations,
  initialGradesByStudent,
  studentRecords,
  disabled = false,
  onSaved,
}: CompetencyGradeViewProps) {
  const [activeCat, setActiveCat] = useState<string>(COMPETENCY_ORDER[0]);
  const [draftTitle, setDraftTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [evals, setEvals] = useState(existingEvaluations);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [rowStatus, setRowStatus] = useState<
    Record<number, "idle" | "saving" | "ok" | "error">
  >({});

  const gradesRef = useRef(grades);
  useEffect(() => {
    gradesRef.current = grades;
  }, [grades]);

  const recordByStudentId = useMemo(() => {
    const m: Record<number, StudentAcademicRecord | undefined> = {};
    for (const row of studentRecords ?? []) {
      m[row.studentId] = row.record;
    }
    return m;
  }, [studentRecords]);

  useEffect(() => {
    setEvals(existingEvaluations);
  }, [existingEvaluations]);

  const hydrateKey = useMemo(
    () =>
      `${offeringId}|${existingEvaluations.map((e) => e.id).join(",")}|${students.map((s) => s.id).join(",")}`,
    [offeringId, existingEvaluations, students],
  );

  useEffect(() => {
    const next: Record<string, string> = {};
    const byStudent =
      initialGradesByStudent ??
      (() => {
        const m: Record<number, Record<number, number>> = {};
        if (!studentRecords?.length) return m;
        for (const row of studentRecords) {
          const rec = row.record;
          if (!rec?.evaluaciones?.length) continue;
          const inner: Record<number, number> = {};
          for (const ev of rec.evaluaciones) {
            const id = evaluationIdFromEval(ev);
            const g = gradeFromEval(ev);
            if (id != null && g != null) inner[id] = g;
          }
          m[row.studentId] = inner;
        }
        return m;
      })();

    for (const s of students) {
      const byEv = byStudent[s.id] ?? {};
      for (const ev of existingEvaluations) {
        const g = byEv[ev.id];
        if (g != null) next[`${s.id}:${ev.id}`] = String(g);
      }
    }
    setGrades(next);
  }, [hydrateKey, initialGradesByStudent, studentRecords, students, existingEvaluations]);

  const evalsByCat = useMemo(() => {
    const m: Record<string, typeof evals> = {};
    for (const c of COMPETENCY_ORDER) m[c] = [];
    for (const e of evals) {
      const cat = e.competencyCategory;
      if (cat && m[cat]) m[cat].push(e);
    }
    return m;
  }, [evals]);

  const getCell = (studentId: number, evalId: number) =>
    grades[`${studentId}:${evalId}`] ?? "";

  const setCell = (studentId: number, evalId: number, raw: string) => {
    const k = `${studentId}:${evalId}`;
    setGrades((prev) => ({ ...prev, [k]: raw }));
  };

  const parseGrade = (s: string): number | null => {
    const t = s.trim();
    if (t === "") return null;
    const n = Number(t);
    if (Number.isNaN(n)) return null;
    return Math.min(5, Math.max(0, Math.round(n * 10) / 10));
  };

  function buildPayloadForStudent(
    studentId: number,
    g: Record<string, string>,
  ): UpsertStudentAcademicInput {
    const evaluations = evals.map((ev) => ({
      evaluationId: ev.id,
      title: ev.titulo,
      type: "PARCIAL",
      grade: parseGrade(g[`${studentId}:${ev.id}`] ?? ""),
    }));
    const rec = recordByStudentId[studentId];
    return {
      evaluations,
      inasistenciasJustificadas: rec?.inasistenciasJustificadas ?? 0,
      inasistenciasInjustificadas: rec?.inasistenciasInjustificadas ?? 0,
      observaciones: rec?.observaciones ?? undefined,
      progresoMateria: rec?.progresoMateria ?? undefined,
    };
  }

  const saveStudentRow = async (studentId: number) => {
    if (disabled) return;
    setRowStatus((s) => ({ ...s, [studentId]: "saving" }));
    try {
      await performanceApi.upsertStudentAcademic(
        groupId,
        studentId,
        subjectId,
        buildPayloadForStudent(studentId, gradesRef.current),
      );
      setRowStatus((s) => ({ ...s, [studentId]: "ok" }));
      onSaved?.();
      setTimeout(() => {
        setRowStatus((s) => ({ ...s, [studentId]: "idle" }));
      }, 2000);
    } catch {
      setRowStatus((s) => ({ ...s, [studentId]: "error" }));
    }
  };

  const studentCategoryAverages = useMemo(() => {
    const out: Record<number, Record<string, number | null>> = {};
    for (const s of students) {
      const byCat: Record<string, number[]> = {};
      for (const c of COMPETENCY_ORDER) byCat[c] = [];
      for (const ev of evals) {
        const cat = ev.competencyCategory;
        if (!cat) continue;
        const g = parseGrade(getCell(s.id, ev.id));
        if (g != null) {
          if (!byCat[cat]) byCat[cat] = [];
          byCat[cat].push(g);
        }
      }
      const av: Record<string, number | null> = {};
      for (const c of COMPETENCY_ORDER) {
        const arr = byCat[c] ?? [];
        av[c] = arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
      }
      out[s.id] = av;
    }
    return out;
  }, [students, evals, grades]);

  const studentFinals = useMemo(() => {
    const out: Record<number, number | null> = {};
    for (const s of students) {
      const parts: Array<{ nota: number; competencyCategory: string | null }> = [];
      for (const ev of evals) {
        const g = parseGrade(getCell(s.id, ev.id));
        if (g != null) parts.push({ nota: g, competencyCategory: ev.competencyCategory });
      }
      out[s.id] = computeCompetencyFinal(parts, competencyWeights);
    }
    return out;
  }, [students, evals, grades, competencyWeights]);

  const groupCategoryAvgs = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const c of COMPETENCY_ORDER) {
      const vals: number[] = [];
      for (const s of students) {
        const v = studentCategoryAverages[s.id]?.[c];
        if (v != null) vals.push(v);
      }
      out[c] = vals.length
        ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
        : null;
    }
    return out;
  }, [students, studentCategoryAverages]);

  const addEvaluation = async (category: string) => {
    if (disabled) return;
    const title = draftTitle.trim();
    if (!title) return;
    const maxOrden = evals.length ? Math.max(...evals.map((e) => e.orden)) : 0;
    setAdding(true);
    try {
      const created = await academicApi.createEvaluation(offeringId, {
        titulo: title,
        tipo: "PARCIAL",
        orden: maxOrden + 1,
        competencyCategory: category,
      });
      setEvals((prev) => [
        ...prev,
        {
          id: created.id,
          titulo: created.titulo,
          competencyCategory: created.competencyCategory ?? category,
          porcentaje: created.porcentaje,
          orden: created.orden,
        },
      ]);
      setDraftTitle("");
      onSaved?.();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-4 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-rec-text-primary">{subjectName}</h3>
        <p className="text-xs text-rec-text-muted">Modo competencias · oferta #{offeringId}</p>
      </div>

      {/* SECCIÓN A */}
      <div>
        <p className="text-sm font-medium text-rec-text-primary mb-2">Evaluaciones por categoría</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMPETENCY_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                activeCat === c
                  ? "border-[color:var(--rec-primary)] text-rec-text-primary bg-rec-bg-base"
                  : "border-rec-border-default text-rec-text-muted hover:bg-rec-bg-base"
              }`}
              style={
                activeCat === c
                  ? { boxShadow: `inset 0 0 0 1px ${COMPETENCY_LABELS[c]?.color ?? "transparent"}` }
                  : undefined
              }
            >
              <span style={{ color: COMPETENCY_LABELS[c]?.color }} className="mr-1">
                ●
              </span>
              {COMPETENCY_LABELS[c]?.label ?? c}
              <span className="ml-1 text-rec-text-subtle">
                ({competencyWeights[c] ?? 0}%)
              </span>
            </button>
          ))}
        </div>

        <div
          className="rounded-xl border border-rec-border-default p-4 bg-rec-bg-base"
          style={{ borderLeftWidth: 4, borderLeftColor: COMPETENCY_LABELS[activeCat]?.color }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-semibold text-rec-text-primary">
              {COMPETENCY_LABELS[activeCat]?.label ?? activeCat}
              <span className="ml-2 text-xs font-normal text-rec-text-muted">
                Peso institucional: {competencyWeights[activeCat] ?? 0}%
              </span>
            </h4>
          </div>
          {(evalsByCat[activeCat] ?? []).length === 0 ? (
            <p className="text-sm text-rec-text-muted py-2">Sin evaluaciones en esta categoría</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {(evalsByCat[activeCat] ?? [])
                .slice()
                .sort((a, b) => a.orden - b.orden)
                .map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-center justify-between gap-2 text-sm text-rec-text-secondary border-b border-rec-border-subtle pb-2 last:border-0"
                  >
                    <span>{ev.titulo}</span>
                    <span className="text-xs text-rec-text-muted">orden {ev.orden}</span>
                  </li>
                ))}
            </ul>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-[180px]">
              <span className="text-xs text-rec-text-muted block mb-1">Nueva evaluación</span>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Título"
                disabled={disabled}
                className="w-full rounded-lg border border-rec-border-default bg-rec-bg-elevated px-3 py-2 text-sm text-rec-text-primary disabled:opacity-60"
              />
            </label>
            <button
              type="button"
              disabled={disabled || adding || !draftTitle.trim()}
              onClick={() => void addEvaluation(activeCat)}
              className="inline-flex items-center gap-1 rounded-lg bg-[color:var(--rec-primary)] px-3 py-2 text-sm font-medium text-rec-text-on-media disabled:opacity-50"
            >
              <FiPlus className="h-4 w-4" />
              Agregar evaluación
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN C */}
      <div>
        <p className="text-sm font-medium text-rec-text-primary mb-2">Resumen por categoría (grupo)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMPETENCY_ORDER.map((c) => {
            const avg = groupCategoryAvgs[c];
            const pct = avg != null ? (avg / 5) * 100 : 0;
            return (
              <div key={c} className="rounded-xl border border-rec-border-default p-3 bg-rec-bg-base">
                <p className="text-xs font-medium text-rec-text-secondary mb-1">
                  {COMPETENCY_LABELS[c]?.label} ({competencyWeights[c] ?? 0}%)
                </p>
                <p className="text-sm font-bold text-rec-text-primary mb-2">
                  {avg != null ? `${avg.toFixed(1)} promedio grupo` : "—"}
                </p>
                <div className="h-2 rounded-full bg-rec-bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: COMPETENCY_LABELS[c]?.color ?? "var(--rec-primary)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN B */}
      <div>
        <p className="text-sm font-medium text-rec-text-primary mb-2">Notas por estudiante</p>
        <div className="overflow-x-auto rounded-xl border border-rec-border-default">
          <table className="w-full min-w-[720px] text-sm border-collapse">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-10 bg-rec-bg-elevated border-b border-r border-rec-border-default px-3 py-2 text-left text-xs font-semibold text-rec-text-muted"
                >
                  Estudiante
                </th>
                {COMPETENCY_ORDER.map((c) => {
                  const catEvals = (evalsByCat[c] ?? []).slice().sort((a, b) => a.orden - b.orden);
                  if (catEvals.length === 0) {
                    return (
                      <th
                        key={c}
                        colSpan={1}
                        className="border-b border-rec-border-default px-2 py-2 text-center text-xs font-semibold text-rec-text-muted"
                        style={{ backgroundColor: `${COMPETENCY_LABELS[c]?.color}18` }}
                      >
                        {COMPETENCY_LABELS[c]?.label}
                      </th>
                    );
                  }
                  return (
                    <th
                      key={c}
                      colSpan={catEvals.length + 1}
                      className="border-b border-rec-border-default px-1 py-2 text-center text-xs font-semibold text-rec-text-primary"
                      style={{ backgroundColor: `${COMPETENCY_LABELS[c]?.color}22` }}
                    >
                      {COMPETENCY_LABELS[c]?.label}
                    </th>
                  );
                })}
                <th
                  rowSpan={2}
                  className="border-b border-rec-border-default px-2 py-2 text-center text-xs font-semibold text-rec-text-primary bg-rec-bg-base"
                >
                  Nota final
                </th>
              </tr>
              <tr>
                {COMPETENCY_ORDER.map((c) => {
                  const catEvals = (evalsByCat[c] ?? []).slice().sort((a, b) => a.orden - b.orden);
                  if (catEvals.length === 0) {
                    return (
                      <th
                        key={`${c}-empty`}
                        className="border-b border-rec-border-default px-1 py-1 text-[10px] text-rec-text-muted"
                      >
                        —
                      </th>
                    );
                  }
                  return (
                    <React.Fragment key={`${c}-sub`}>
                      {catEvals.map((ev) => (
                        <th
                          key={ev.id}
                          className="border-b border-rec-border-default px-1 py-1 text-[10px] font-medium text-rec-text-secondary max-w-[100px]"
                          style={{ backgroundColor: `${COMPETENCY_LABELS[c]?.color}12` }}
                        >
                          <span className="line-clamp-2">{ev.titulo}</span>
                        </th>
                      ))}
                      <th
                        className="border-b border-rec-border-default px-1 py-1 text-[10px] font-semibold text-rec-text-primary"
                        style={{ backgroundColor: `${COMPETENCY_LABELS[c]?.color}30` }}
                      >
                        Prom. {COMPETENCY_LABELS[c]?.label?.slice(0, 4)}.
                      </th>
                    </React.Fragment>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-rec-border-subtle hover:bg-rec-bg-base/80">
                  <td className="sticky left-0 z-10 bg-rec-bg-elevated border-r border-rec-border-default px-3 py-2 font-medium text-rec-text-primary whitespace-nowrap">
                    {s.name}
                  </td>
                  {COMPETENCY_ORDER.map((c) => {
                    const catEvals = (evalsByCat[c] ?? []).slice().sort((a, b) => a.orden - b.orden);
                    if (catEvals.length === 0) {
                      return (
                        <td key={`${s.id}-${c}-empty`} className="px-1 py-1 text-center text-rec-text-muted">
                          —
                        </td>
                      );
                    }
                    return (
                      <React.Fragment key={`${s.id}-${c}-cells`}>
                        {catEvals.map((ev) => (
                          <td key={ev.id} className="px-1 py-1 align-middle text-center">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              step={0.1}
                              value={getCell(s.id, ev.id)}
                              onChange={(e) => setCell(s.id, ev.id, e.target.value)}
                              onBlur={() => void saveStudentRow(s.id)}
                              disabled={disabled}
                              className="w-16 rounded border border-rec-border-default bg-rec-bg-elevated px-1 py-1 text-center text-sm text-rec-text-primary disabled:opacity-60"
                            />
                          </td>
                        ))}
                        <td className="px-1 py-1 text-center text-xs font-semibold text-rec-text-primary tabular-nums">
                          {studentCategoryAverages[s.id]?.[c] != null
                            ? studentCategoryAverages[s.id][c]!.toFixed(1)
                            : "—"}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="px-2 py-2 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-rec-text-primary tabular-nums">
                        {studentFinals[s.id] != null ? studentFinals[s.id]!.toFixed(2) : "—"}
                      </span>
                      <span className="inline-flex h-4 items-center justify-center">
                        {rowStatus[s.id] === "saving" && (
                          <FiLoader className="h-3.5 w-3.5 animate-spin text-rec-text-muted" />
                        )}
                        {rowStatus[s.id] === "ok" && (
                          <FiCheck className="h-3.5 w-3.5 text-rec-success-text" />
                        )}
                        {rowStatus[s.id] === "error" && (
                          <FiXCircle className="h-3.5 w-3.5 text-rec-danger-text" />
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-rec-text-muted mt-2">
          Escala 0–5. Las notas se guardan al salir de cada fila (después de editar una celda).
        </p>
      </div>
    </div>
  );
}
