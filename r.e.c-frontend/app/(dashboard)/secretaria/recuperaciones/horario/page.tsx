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
    <section className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Horario de recuperación</h1>
      <p className="text-sm text-gray-700">Sube el archivo oficial para consulta de docentes y estudiantes.</p>

      {message ? <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="flex flex-col gap-3 max-w-xl">
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        />
        <div className="flex items-center gap-2">
          <Button onClick={onUpload} disabled={!selectedFile || uploading}>
            {uploading ? "Subiendo..." : "Subir horario"}
          </Button>
          {scheduleUrl ? (
            <a href={scheduleUrl} download className="text-sm text-blue-700 underline">
              Descargar archivo actual
            </a>
          ) : null}
        </div>
      </div>

      <div className="border rounded bg-white min-h-[400px]">
        {loading ? (
          <div className="p-4 text-sm text-gray-600">Cargando archivo...</div>
        ) : scheduleUrl ? (
          <iframe title="Horario de recuperación" src={scheduleUrl} className="w-full min-h-[600px]" />
        ) : (
          <div className="p-4 text-sm text-gray-600">No hay archivo disponible.</div>
        )}
      </div>
    </section>
  );
}
