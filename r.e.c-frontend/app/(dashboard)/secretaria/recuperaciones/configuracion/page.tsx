"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { recoverySettingsApi } from "@/lib/recoverySettingsApi";

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback;
  }
  return fallback;
}

function toLocalDateTime(iso: string) {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIso(localDateTime: string) {
  return new Date(localDateTime).toISOString();
}

export default function RecoveryConfigPage() {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const config = await recoverySettingsApi.getConfig();
        setStartAt(toLocalDateTime(config.startAt));
        setEndAt(toLocalDateTime(config.endAt));
      } catch {
        setError("No se pudo cargar la configuración actual");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const canSave = useMemo(() => !!startAt && !!endAt && !saving && !loading, [startAt, endAt, saving, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      const saved = await recoverySettingsApi.setConfig({
        startAt: toIso(startAt),
        endAt: toIso(endAt),
      });
      setStartAt(toLocalDateTime(saved.startAt));
      setEndAt(toLocalDateTime(saved.endAt));
      setMessage("Configuración guardada correctamente");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo guardar la configuración"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="p-4 space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">Configuración de recuperaciones</h1>
      <p className="text-sm text-gray-700">Define el periodo oficial de solicitudes y seguimiento de recuperación.</p>

      {message ? <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form className="space-y-3" onSubmit={onSubmit}>
        <Input
          label="Fecha y hora de inicio"
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          disabled={loading || saving}
          required
        />

        <Input
          label="Fecha y hora de fin"
          type="datetime-local"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          disabled={loading || saving}
          required
        />

        <Button type="submit" disabled={!canSave}>
          {saving ? "Guardando..." : "Guardar configuración"}
        </Button>
      </form>
    </section>
  );
}
