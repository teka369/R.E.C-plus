"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
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

export default function RecoverySchedulePage() {
  const [scheduleUrl, setScheduleUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const blob = await recoverySettingsApi.getScheduleBlob();
      setScheduleUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setScheduleUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setError("No hay horario cargado actualmente");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
    return () => {
      setScheduleUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [loadSchedule]);

  const onUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setMessage(null);
      setError(null);
      await recoverySettingsApi.uploadSchedule(selectedFile);
      await loadSchedule();
      setSelectedFile(null);
      setMessage("Horario cargado correctamente");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo cargar el archivo"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="sec-page space-y-5">
      <div className="sec-hero">
        <div>
          <h1 className="sec-title">Horario de Recuperación</h1>
          <p className="sec-subtitle">Publica y actualiza el archivo oficial para consulta por parte de docentes y estudiantes.</p>
        </div>
        <span className="sec-chip">Documento oficial</span>
      </div>

      {message ? <div className="rounded border border-rec-success-border bg-rec-success-bg p-3 text-sm text-rec-success-text">{message}</div> : null}
      {error ? <div className="rounded border border-rec-danger-border bg-rec-danger-bg p-3 text-sm text-rec-danger-text">{error}</div> : null}

      <div className="sec-card p-4 flex flex-col gap-3 max-w-2xl">
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
          className="rounded border border-rec-border-strong px-3 py-2 text-sm"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        />
        <div className="flex items-center gap-2">
          <Button onClick={onUpload} disabled={!selectedFile || uploading}>
            {uploading ? "Subiendo..." : "Subir horario"}
          </Button>
          {scheduleUrl ? (
            <a href={scheduleUrl} download className="text-sm text-rec-info-text underline">
              Descargar archivo actual
            </a>
          ) : null}
        </div>
      </div>

      <div className="sec-card min-h-[400px]">
        {loading ? (
          <div className="p-4 text-sm text-rec-text-muted">Cargando archivo...</div>
        ) : scheduleUrl ? (
          <iframe title="Horario de recuperación" src={scheduleUrl} className="w-full min-h-[600px]" />
        ) : (
          <div className="p-4 text-sm text-rec-text-muted">No hay archivo disponible.</div>
        )}
      </div>
    </section>
  );
}
