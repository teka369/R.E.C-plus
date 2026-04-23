/** Etiquetas y orden de categorías de competencias (alineado con backend Prisma). */

export const COMPETENCY_LABELS: Record<string, { label: string; color: string }> = {
  COGNITIVE: { label: "Cognitivo", color: "#4F8EF7" },
  PROCEDURAL: { label: "Procedimental", color: "#34C48B" },
  ATTITUDINAL: { label: "Actitudinal", color: "#F7A94F" },
  SELF_EVAL: { label: "Autoevaluación", color: "#A78BFA" },
  CO_EVAL: { label: "Coevaluación", color: "#F472B6" },
};

export const COMPETENCY_ORDER = [
  "COGNITIVE",
  "PROCEDURAL",
  "ATTITUDINAL",
  "SELF_EVAL",
  "CO_EVAL",
] as const;

export type CompetencyCategoryKey = (typeof COMPETENCY_ORDER)[number];

/**
 * Misma lógica que `computeCompetencyFinal` en el backend (performance.service.ts):
 * promedio simple por categoría → solo categorías con al menos una nota →
 * suma ponderada con pesos institucionales renormalizados sobre el total de pesos de esas categorías.
 */
export function computeCompetencyFinal(
  grades: Array<{ nota: number; competencyCategory: string | null }>,
  weights: Record<string, number>,
): number | null {
  const categories = [...COMPETENCY_ORDER];
  const categoryAverages: Record<string, number | null> = {};
  for (const cat of categories) {
    const catGrades = grades.filter((g) => g.competencyCategory === cat);
    if (catGrades.length === 0) {
      categoryAverages[cat] = null;
      continue;
    }
    const avg = catGrades.reduce((sum, g) => sum + g.nota, 0) / catGrades.length;
    categoryAverages[cat] = Number(avg.toFixed(2));
  }
  const filledCategories = categories.filter((c) => categoryAverages[c] !== null);
  if (filledCategories.length === 0) return null;
  const totalWeight = filledCategories.reduce((sum, c) => sum + (weights[c] ?? 0), 0);
  if (totalWeight === 0) return null;
  const weighted = filledCategories.reduce(
    (sum, c) => sum + (categoryAverages[c]! * (weights[c] ?? 0)) / totalWeight,
    0,
  );
  return Number(weighted.toFixed(2));
}
