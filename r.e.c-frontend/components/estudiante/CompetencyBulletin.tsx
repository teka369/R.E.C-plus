"use client";

import { useMemo } from "react";
import {
  COMPETENCY_LABELS,
  COMPETENCY_ORDER,
  computeCompetencyFinal,
} from "@/lib/competencyConfig";

export interface CompetencyBulletinProps {
  subjects: Array<{
    subjectName: string;
    evaluations: Array<{
      titulo: string;
      competencyCategory: string | null;
      nota: number | null;
    }>;
    notaFinal: number | null;
    passingThreshold: number;
  }>;
  competencyWeights: Record<string, number>;
  gradePeriodName?: string;
  /** Escala máxima de notas (por defecto 5.0). */
  gradeScaleMax?: number;
}

function averageInCategory(
  evaluations: CompetencyBulletinProps["subjects"][number]["evaluations"],
  category: string,
): number | null {
  const nums = evaluations
    .filter((e) => e.competencyCategory === category && e.nota != null && !Number.isNaN(e.nota))
    .map((e) => e.nota as number);
  if (!nums.length) return null;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
}

function finalChipClass(nota: number | null, threshold: number): string {
  if (nota == null) {
    return "border border-rec-border-default bg-rec-bg-muted text-rec-text-subtle";
  }
  if (nota >= threshold) {
    return "border border-rec-success-border bg-rec-success-bg-muted text-rec-success-text";
  }
  return "border border-rec-danger-border bg-rec-danger-bg text-rec-danger-text";
}

export default function CompetencyBulletin({
  subjects,
  competencyWeights,
  gradePeriodName,
  gradeScaleMax = 5,
}: CompetencyBulletinProps) {
  const scale = gradeScaleMax > 0 ? gradeScaleMax : 5;

  return (
    <div className="space-y-4">
      {gradePeriodName ? (
        <p className="text-sm text-rec-text-muted">
          Boletín por competencias
          <span className="text-rec-text-primary font-semibold"> · {gradePeriodName}</span>
        </p>
      ) : (
        <p className="text-sm font-semibold text-rec-text-primary">Boletín por competencias</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subjects.map((subject, index) => (
          <SubjectCompetencyCard
            key={`${subject.subjectName}-${index}`}
            subject={subject}
            competencyWeights={competencyWeights}
            gradeScaleMax={scale}
          />
        ))}
      </div>
    </div>
  );
}

function SubjectCompetencyCard({
  subject,
  competencyWeights,
  gradeScaleMax,
}: {
  subject: CompetencyBulletinProps["subjects"][number];
  competencyWeights: Record<string, number>;
  gradeScaleMax: number;
}) {
  const { subjectName, evaluations, notaFinal, passingThreshold } = subject;

  const gradesForFinal = useMemo(
    () =>
      evaluations
        .filter((e) => e.nota != null && !Number.isNaN(e.nota))
        .map((e) => ({
          nota: e.nota as number,
          competencyCategory: e.competencyCategory,
        })),
    [evaluations],
  );

  const computedFinal = useMemo(
    () => computeCompetencyFinal(gradesForFinal, competencyWeights),
    [gradesForFinal, competencyWeights],
  );

  const displayFinal = notaFinal ?? computedFinal;

  const footerLines = useMemo(() => {
    const filled = COMPETENCY_ORDER.filter((cat) => averageInCategory(evaluations, cat) != null);
    if (filled.length === 0) return [];
    const totalW = filled.reduce((sum, c) => sum + (competencyWeights[c] ?? 0), 0);
    if (totalW <= 0) return [];
    return filled.map((cat) => {
      const avg = averageInCategory(evaluations, cat)!;
      const w = competencyWeights[cat] ?? 0;
      const factor = w / totalW;
      const contrib = avg * factor;
      const label = COMPETENCY_LABELS[cat]?.label ?? cat;
      return {
        key: cat,
        text: `${label} (${w}%): ${avg.toFixed(1)} × ${factor.toFixed(2)} = ${contrib.toFixed(2)}`,
      };
    });
  }, [evaluations, competencyWeights]);

  return (
    <article
      className="rounded-2xl border p-5 shadow-sm flex flex-col gap-4"
      style={{
        background: "var(--rec-surface)",
        borderColor: "var(--rec-border-default)",
      }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-rec-text-primary leading-tight">{subjectName}</h2>
          <p className="text-xs text-rec-text-muted mt-1">Calificación por competencias</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold tabular-nums ${finalChipClass(displayFinal, passingThreshold)}`}
        >
          Nota final: {displayFinal != null ? displayFinal.toFixed(2) : "—"}
        </span>
      </header>

      <div className="flex flex-col gap-3">
        {COMPETENCY_ORDER.map((cat) => {
          const meta = COMPETENCY_LABELS[cat];
          const inCat = evaluations.filter((e) => e.competencyCategory === cat);
          const avg = averageInCategory(evaluations, cat);
          const w = competencyWeights[cat] ?? 0;
          const hasEvals = inCat.length > 0;
          const pct = avg != null ? Math.min(100, Math.max(0, (avg / gradeScaleMax) * 100)) : 0;

          if (!hasEvals) {
            return (
              <div
                key={cat}
                className="rounded-xl border border-dashed border-rec-border-subtle bg-rec-bg-muted/40 px-3 py-2.5 text-sm text-rec-text-muted"
              >
                <span className="font-medium text-rec-text-subtle">{meta?.label ?? cat}</span>
                <span className="mx-2">·</span>
                Sin evaluaciones
              </div>
            );
          }

          return (
            <div
              key={cat}
              className="rounded-xl border border-rec-border-subtle bg-rec-bg-base/80 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: meta?.color }} />
                <span className="font-semibold text-rec-text-primary">{meta?.label ?? cat}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rec-bg-muted text-rec-text-secondary border border-rec-border-subtle">
                  {w}%
                </span>
                <span className="text-sm text-rec-text-secondary ml-auto tabular-nums">
                  Promedio: {avg != null ? avg.toFixed(1) : "—"}
                </span>
              </div>
              <ul className="space-y-1 text-sm text-rec-text-secondary mb-2">
                {inCat.map((ev, i) => (
                  <li key={`${ev.titulo}-${i}`} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">{ev.titulo}</span>
                    <span className="font-semibold text-rec-text-primary tabular-nums shrink-0">
                      {ev.nota != null ? ev.nota.toFixed(1) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="h-2 rounded-full bg-rec-bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: meta?.color ?? "var(--rec-primary)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {(footerLines.length > 0 || displayFinal != null) && (
        <footer className="border-t border-rec-border-subtle pt-3 space-y-1.5 text-xs text-rec-text-secondary">
          {footerLines.map((line) => (
            <p key={line.key} className="font-mono tabular-nums leading-relaxed">
              {line.text}
            </p>
          ))}
          <p className="text-sm font-bold text-rec-text-primary pt-1">
            Nota final: {displayFinal != null ? displayFinal.toFixed(2) : "—"}
          </p>
        </footer>
      )}
    </article>
  );
}
