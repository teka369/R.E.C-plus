"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/usersApi";

export default function DocenteCambiarContrasenaPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.id) {
      setError("No se pudo identificar al usuario actual");
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim()) {
      setError("Completa todos los campos requeridos");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmación no coincide con la nueva contraseña");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      await usersApi.changeMyPassword({ currentPassword, newPassword });
      setMessage("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("No se pudo actualizar la contraseña. Verifica la contraseña actual.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="p-4 max-w-xl space-y-4">
      <div id="tour-pw-header">
        <h1 className="text-xl font-semibold">Cambiar contraseña</h1>
        <p className="text-sm text-rec-text-muted">Actualiza tu contraseña de acceso al sistema.</p>
      </div>

      {message ? <div className="rounded border border-rec-success-border bg-rec-success-bg p-3 text-sm text-rec-success-text">{message}</div> : null}
      {error ? <div className="rounded border border-rec-danger-border bg-rec-danger-bg p-3 text-sm text-rec-danger-text">{error}</div> : null}

      <form id="tour-pw-form" onSubmit={onSubmit} className="space-y-3 rounded border border-rec-border-default bg-rec-bg-elevated p-4">
        <Field
          label="Contraseña actual"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
        />
        <Field
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
        />
        <Field
          label="Confirmar nueva contraseña"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-rec-primary px-4 py-2 text-sm font-medium text-rec-text-on-media hover:bg-rec-primary-strong disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: "text" | "password";
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-rec-border-strong px-3 py-2 text-sm"
      />
    </label>
  );
}
