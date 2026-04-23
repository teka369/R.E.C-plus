"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiList, FiPieChart } from "react-icons/fi";
import Button from "@/components/ui/Button";
import { academicApi } from "@/lib/academicApi";

const CAT_KEYS = [
  "COGNITIVE",
  "PROCEDURAL",
  "ATTITUDINAL",
  "SELF_EVAL",
  "CO_EVAL",
] as const;

const CAT_LABELS: Record<(typeof CAT_KEYS)[number], string> = {
  COGNITIVE: "Cognitivo",
  PROCEDURAL: "Procedimental",
  ATTITUDINAL: "Actitudinal",
  SELF_EVAL: "Autoevaluación",
  CO_EVAL: "Coevaluación",
};

const DEFAULT_WEIGHTS: Record<(typeof CAT_KEYS)[number], number> = {
  COGNITIVE: 30,
  PROCEDURAL: 30,
  ATTITUDINAL: 30,
  SELF_EVAL: 5,
  CO_EVAL: 5,
};

export default function GradingPolicyConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gradingMode, setGradingMode] = useState<"SIMPLE" | "COMPETENCY">("SIMPLE");
  const [weights, setWeights] = useState<Record<(typeof CAT_KEYS)[number], number>>({
    ...DEFAULT_WEIGHTS,
  });
  const [flash, setFlash] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFlash(null);
    try {
      const data = await academicApi.getGradingPolicy();
      setGradingMode(data.gradingMode === "COMPETENCY" ? "COMPETENCY" : "SIMPLE");
      const w = { ...DEFAULT_WEIGHTS };
      for (const k of CAT_KEYS) {
        if (typeof data.competencyWeights?.[k] === "number") {
          w[k] = data.competencyWeights[k];
        }
      }
      setWeights(w);
    } catch {
      setFlash({ tone: "error", message: "No se pudo cargar la política de calificación." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(
    () => CAT_KEYS.reduce((s, k) => s + (weights[k] ?? 0), 0),
    [weights],
  );

  const sumOk = Math.round(total) === 100;

  const setWeight = (key: (typeof CAT_KEYS)[number], raw: number) => {
    setWeights((prev) => {
      const next = { ...prev };
      const othersSum = CAT_KEYS.filter((k) => k !== key).reduce((s, k) => s + prev[k], 0);
      const max = Math.max(0, 100 - othersSum);
      next[key] = Math.max(0, Math.min(Math.round(raw), max));
      return next;
    });
  };

  async function onSave() {
    setSaving(true);
    setFlash(null);
    try {
      if (gradingMode === "COMPETENCY" && !sumOk) {
        setFlash({ tone: "error", message: "La suma de pesos debe ser exactamente 100%." });
        return;
      }
      await academicApi.updateGradingPolicy({
        gradingMode,
        ...(gradingMode === "COMPETENCY"
          ? {
              competencyWeights: CAT_KEYS.reduce(
                (acc, k) => {
                  acc[k] = weights[k];
                  return acc;
                },
                {} as Record<string, number>,
              ),
            }
          : {}),
      });
      setFlash({ tone: "ok", message: "Configuración guardada correctamente." });
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      setFlash({
        tone: "error",
        message: msg || "No se pudo guardar. Intenta de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  }

  const saveDisabled =
    saving || (gradingMode === "COMPETENCY" && !sumOk) || loading;

  return (
    <div className="sec-card border border-rec-border-default bg-rec-bg-elevated p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-rec-text-primary">Modelo de Calificación</h3>
        <p className="mt-1 text-sm text-rec-text-muted">
          Define si el colegio usa notas por evaluaciones con pesos libres o por competencias.
        </p>
      </div>

      {flash && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            flash.tone === "ok"
              ? "bg-rec-success-bg text-rec-success-text"
              : "bg-rec-danger-bg text-rec-danger-text"
          }`}
        >
          {flash.message}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-rec-text-muted">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setGradingMode("SIMPLE")}
              className={`flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                gradingMode === "SIMPLE"
                  ? "border-rec-primary bg-rec-bg-base shadow-sm ring-1 ring-rec-primary/30"
                  : "border-rec-border-default bg-rec-bg-base hover:border-rec-border-strong"
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rec-bg-muted text-rec-primary">
                  <FiList className="h-5 w-5" aria-hidden />
                </span>
                {gradingMode === "SIMPLE" && (
                  <span className="rounded-full bg-rec-primary/15 px-2 py-0.5 text-xs font-medium text-rec-primary">
                    Modo actual
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-rec-text-primary">Evaluación Simple</p>
                <p className="mt-1 text-sm text-rec-text-secondary">
                  El profesor ingresa evaluaciones libres con pesos individuales. Ideal para colegios con estructura de
                  notas tradicional.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setGradingMode("COMPETENCY")}
              className={`flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                gradingMode === "COMPETENCY"
                  ? "border-rec-primary bg-rec-bg-base shadow-sm ring-1 ring-rec-primary/30"
                  : "border-rec-border-default bg-rec-bg-base hover:border-rec-border-strong"
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rec-bg-muted text-rec-primary">
                  <FiPieChart className="h-5 w-5" aria-hidden />
                </span>
                {gradingMode === "COMPETENCY" && (
                  <span className="rounded-full bg-rec-primary/15 px-2 py-0.5 text-xs font-medium text-rec-primary">
                    Modo actual
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-rec-text-primary">Evaluación por Competencias</p>
                <p className="mt-1 text-sm text-rec-text-secondary">
                  Las notas se organizan por categorías: Cognitivo, Procedimental, Actitudinal, Autoevaluación y
                  Coevaluación.
                </p>
              </div>
            </button>
          </div>

          {gradingMode === "COMPETENCY" && (
            <div className="space-y-4 rounded-xl border border-rec-border-default bg-rec-bg-base p-4">
              <p className="text-sm font-medium text-rec-text-primary">Pesos por competencia (%)</p>
              <p className="text-xs text-rec-text-muted">Ajusta los valores; la suma debe ser 100%.</p>
              <div className="space-y-4">
                {CAT_KEYS.map((key) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <label className="text-rec-text-secondary" htmlFor={`w-${key}`}>
                        {CAT_LABELS[key]}
                      </label>
                      <span className="tabular-nums font-medium text-rec-text-primary">{weights[key]}%</span>
                    </div>
                    <input
                      id={`w-${key}`}
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={weights[key]}
                      onChange={(e) => setWeight(key, Number(e.target.value))}
                      className="h-2 w-full cursor-pointer accent-rec-primary"
                    />
                  </div>
                ))}
              </div>
              <p
                className={`text-sm font-semibold tabular-nums ${
                  sumOk ? "text-rec-success-text" : "text-rec-danger-text"
                }`}
              >
                Total: {total}%
                {!sumOk ? " — debe sumar 100%" : ""}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void onSave()} disabled={saveDisabled}>
              {saving ? "Guardando…" : "Guardar configuración"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
