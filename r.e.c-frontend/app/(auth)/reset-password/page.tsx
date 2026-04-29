"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/errors";

const STORAGE_KEY = "rec_password_reset_token";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromStorage = sessionStorage.getItem(STORAGE_KEY);
    if (fromStorage) {
      setToken(fromStorage);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Ingresa el token de recuperación que recibiste por correo o tras verificar tu código.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token: token.trim(),
        password,
        confirmPassword: confirm,
      });
      setDone(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al restablecer la contraseña"));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="rec-auth-shell min-h-screen">
        <Navbar />
        <section className="mx-auto max-w-md px-4 py-12">
          <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated p-6 shadow-[0_22px_55px_-35px_color-mix(in_srgb,var(--rec-primary-strong)_50%,transparent)] md:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--rec-soft)]">
              <span className="text-xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-[color:var(--rec-title)]">Contraseña actualizada</h1>
            <p className="mt-3 text-sm text-rec-text-muted">
              Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--rec-primary)] px-5 py-3 text-sm font-semibold text-rec-text-on-media transition hover:bg-[color:var(--rec-primary-strong)]"
              >
                Estudiantes y Docentes
              </Link>
              <Link
                href="/acceso-secretaria"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated px-5 py-3 text-sm font-semibold text-[color:var(--rec-title)] transition hover:bg-rec-bg-base"
              >
                Secretaría / Admin
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rec-auth-shell min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated p-6 shadow-[0_22px_55px_-35px_color-mix(in_srgb,var(--rec-primary-strong)_50%,transparent)] md:p-8">
          <h1 className="text-2xl font-bold text-[color:var(--rec-title)]">Nueva contraseña</h1>
          <p className="mt-2 text-sm text-rec-text-muted">
            Pega el <strong>token de recuperación</strong> del correo (o el que obtuviste al verificar tu código
            institucional). Luego elige una contraseña nueva de al menos 8 caracteres.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <label className="text-sm font-semibold text-rec-text-secondary" htmlFor="reset-token">
              Token de recuperación
            </label>
            <input
              id="reset-token"
              type="text"
              className="rounded-xl border border-rec-border-strong px-4 py-3 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
              placeholder="Pega el token completo aquí"
              autoComplete="off"
              spellCheck={false}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />

            <label className="text-sm font-semibold text-rec-text-secondary" htmlFor="new-password">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-rec-border-strong px-4 py-3 pr-24 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-rec-text-muted transition hover:bg-rec-bg-muted"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <label className="text-sm font-semibold text-rec-text-secondary" htmlFor="confirm-password">
              Confirmar contraseña
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              className="rounded-xl border border-rec-border-strong px-4 py-3 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-xl border border-rec-danger-border bg-rec-danger-bg px-3 py-2 text-sm text-rec-danger-text">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="mt-1 rounded-xl bg-[color:var(--rec-primary)] px-4 py-3 text-sm font-semibold text-rec-text-on-media transition hover:bg-[color:var(--rec-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>

          <Link
            href="/forgot-password"
            className="mt-5 inline-block text-sm font-semibold text-[color:var(--rec-primary)] hover:underline"
          >
            ← Volver a recuperar contraseña
          </Link>
        </div>
      </section>
    </main>
  );
}
