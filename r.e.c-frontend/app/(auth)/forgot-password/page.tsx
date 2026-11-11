"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al enviar la solicitud"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="rec-auth-shell min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated p-6 shadow-[0_22px_55px_-35px_color-mix(in_srgb,var(--rec-primary-strong)_50%,transparent)] md:p-8">
          {sent ? (
            <>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--rec-soft)]">
                <span className="text-xl">✉️</span>
              </div>
              <h1 className="text-2xl font-bold text-[color:var(--rec-title)]">Revisa tu correo</h1>
              <p className="mt-3 text-sm text-rec-text-muted leading-relaxed">
                Si existe una cuenta con <strong>{email}</strong>, recibirás un correo con un enlace a la página de
                restablecimiento y un <strong>token de recuperación</strong> que debes copiar y pegar allí (no va en la
                barra de direcciones). Revisa también la carpeta de spam.
              </p>
              <p className="mt-3 text-sm text-rec-text-muted">
                La recuperación por código de usuario fue deshabilitada. El código no es un secreto.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-block text-sm font-semibold text-[color:var(--rec-primary)] hover:underline"
              >
                ← Volver al inicio de sesión
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[color:var(--rec-title)]">Restablecer contraseña</h1>
              <p className="mt-2 text-sm text-rec-text-muted">
                Ingresa tu correo institucional. Te enviaremos un enlace a la página de restablecimiento y un token que
                deberás pegar en el formulario (más seguro que llevarlo en la URL).
              </p>

              <form onSubmit={onSubmitEmail} className="mt-6 flex flex-col gap-4" noValidate>
                <label className="text-sm font-semibold text-rec-text-secondary" htmlFor="forgot-email">
                  Correo
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className="rounded-xl border border-rec-border-strong px-4 py-3 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
                  placeholder="tu.correo@institucion.edu"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? "Enviando..." : "Enviar instrucciones"}
                </button>
              </form>

              <Link
                href="/login"
                className="mt-3 inline-block text-sm text-rec-text-muted hover:text-[color:var(--rec-primary)]"
              >
                ← Volver al inicio de sesión
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
