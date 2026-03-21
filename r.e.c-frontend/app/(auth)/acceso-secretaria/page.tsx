"use client";
import { useState } from "react";
import Navbar from "@/components/layouts/Navbar";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import dynamic from "next/dynamic";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((module) => module.Player),
  { ssr: false },
);

function SecretariaIllustration() {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border border-[color:var(--rec-soft)] bg-[linear-gradient(145deg,#eff6ff_0%,#dceef8_100%)]"
      role="img"
      aria-label="Animacion de analisis de datos para acceso de secretaria"
    >
      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-sky-300/20" />
      <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-emerald-300/20" />
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4 md:p-6">
        <Player
          autoplay
          loop
          src="/animations/secretaria/isometric-data-analysis.json"
          style={{ height: "100%", width: "100%", maxHeight: "260px", maxWidth: "300px" }}
        />
      </div>
      <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-2 lg:flex">
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--rec-primary)] shadow-sm">
          Acceso Secretaría
        </span>
        <span className="text-xl text-[color:var(--rec-primary)]">➡</span>
      </div>
    </div>
  );
}

export default function AccesoSecretariaPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await api.post("/auth/login", {
        email: normalizedEmail,
        password,
      });
      const { access_token, user } = res.data;
      if (user.role !== "SECRETARIA") {
        setError("Acceso exclusivo para Secretaría");
        return;
      }
      await login(user, access_token);
      window.location.href = "/secretaria";
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#edf7ff_0%,_#f7fbff_42%,_#ffffff_100%)]">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--rec-soft)] bg-white shadow-[0_22px_60px_-30px_rgba(23,51,79,0.35)]">
            <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-sky-300/15" />
            <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-emerald-300/15" />
            <div className="relative z-10 p-5 md:p-8">
              <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                Panel administrativo
              </p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                Control operativo para Secretaría.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                Gestiona reportes, academico, estudiantes y docentes desde un acceso institucional
                seguro y centralizado.
              </p>
              <div className="mt-5 h-[250px] w-full md:h-[292px]">
                <SecretariaIllustration />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(23,51,79,0.45)] md:p-8">
            <h2 className="text-2xl font-bold text-[color:var(--rec-title)]">Acceso Secretaría</h2>
            <p className="mt-1 text-sm text-slate-600">Ingresa con credenciales autorizadas del area administrativa.</p>

            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
              <label className="text-sm font-semibold text-slate-700" htmlFor="secretaria-email">Correo</label>
              <input
                id="secretaria-email"
                type="email"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="secretaria@rec.com"
                autoComplete="email"
                required
              />

              <label className="text-sm font-semibold text-slate-700" htmlFor="secretaria-password">Contraseña</label>
              <div className="relative">
                <input
                  id="secretaria-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-24 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              ) : null}

              <button
                type="submit"
                className="mt-1 inline-flex items-center justify-center rounded-xl bg-[color:var(--rec-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--rec-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <p className="mt-5 rounded-xl border border-[color:var(--rec-soft)] bg-[color:var(--rec-soft)]/60 px-4 py-3 text-sm text-slate-600">
              Este acceso esta habilitado solo para personal de Secretaría.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}