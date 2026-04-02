"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/errors";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token) {
      setError("Enlace inválido. Solicita uno nuevo desde 'Olvidé mi contraseña'.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al restablecer la contraseña"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-white p-6 shadow-[0_22px_55px_-35px_rgba(19,52,35,0.5)] md:p-8">
        <h1 className="text-2xl font-bold text-[color:var(--rec-title)]">Enlace inválido</h1>
        <p className="mt-3 text-sm text-slate-600">
          Este enlace no contiene un token válido. Solicita uno nuevo.
        </p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-block text-sm font-semibold text-[color:var(--rec-primary)] hover:underline"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-white p-6 shadow-[0_22px_55px_-35px_rgba(19,52,35,0.5)] md:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--rec-soft)]">
          <span className="text-xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-[color:var(--rec-title)]">Contraseña actualizada</h1>
        <p className="mt-3 text-sm text-slate-600">
          Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--rec-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--rec-primary-strong)]"
          >
            Estudiantes y Docentes
          </Link>
          <Link
            href="/acceso-secretaria"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--rec-soft)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--rec-title)] transition hover:bg-slate-50"
          >
            Secretaría / Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-white p-6 shadow-[0_22px_55px_-35px_rgba(19,52,35,0.5)] md:p-8">
      <h1 className="text-2xl font-bold text-[color:var(--rec-title)]">Nueva contraseña</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <label className="text-sm font-semibold text-slate-700" htmlFor="new-password">
          Nueva contraseña
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-24 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <label className="text-sm font-semibold text-slate-700" htmlFor="confirm-password">
          Confirmar contraseña
        </label>
        <input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="mt-1 rounded-xl bg-[color:var(--rec-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--rec-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Guardando..." : "Restablecer contraseña"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0f8f3_0%,_#f8fbf9_40%,_#ffffff_100%)]">
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-12">
        <Suspense
          fallback={
            <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-white p-8 text-center text-sm text-slate-500">
              Cargando...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
