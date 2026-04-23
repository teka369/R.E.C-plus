"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import Navbar from "@/components/layouts/Navbar";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import dynamic from "next/dynamic";

const RATE_LIMIT_SECONDS_REGEX = /espera (\d+) segundos/;

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((module) => module.Player),
  { ssr: false },
);

function SecretariaIllustration() {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border border-[color:var(--rec-soft)]"
      style={{ background: "var(--rec-auth-secretaria-bg)" }}
      role="img"
      aria-label="Animacion de analisis de datos para acceso de secretaria"
    >
      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-rec-chart-cyan/20" />
      <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-rec-primary/20" />
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4 md:p-6">
        <Player
          autoplay
          loop
          src="/animations/secretaria/isometric-data-analysis.json"
          style={{ height: "100%", width: "100%", maxHeight: "260px", maxWidth: "300px" }}
        />
      </div>
      <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-2 lg:flex">
        <span className="rounded-full bg-rec-bg-elevated/90 px-3 py-1 text-xs font-semibold text-[color:var(--rec-primary)] shadow-sm">
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
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [rateLimitAttempts, setRateLimitAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const rateLimitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRateLimitInterval = () => {
    if (rateLimitIntervalRef.current !== null) {
      clearInterval(rateLimitIntervalRef.current);
      rateLimitIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (rateLimitIntervalRef.current !== null) {
        clearInterval(rateLimitIntervalRef.current);
        rateLimitIntervalRef.current = null;
      }
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitSeconds > 0) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await api.post("/auth/login", {
        email: normalizedEmail,
        password,
      });
      const { access_token, refresh_token, user } = res.data;
      if (user.role !== "SECRETARIA" && user.role !== "SUPER_ADMIN") {
        setError("Acceso exclusivo para Secretaría y Super Admin");
        return;
      }
      await login(user, access_token, refresh_token);
      window.location.href = user.role === "SUPER_ADMIN" ? "/super-admin" : "/secretaria";
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 429) {
        const data = err.response.data as { message?: string | string[] } | undefined;
        const raw =
          Array.isArray(data?.message) && data.message.length > 0
            ? data.message[0]
            : typeof data?.message === "string"
              ? data.message
              : "";
        const parsedMatch = raw.match(RATE_LIMIT_SECONDS_REGEX);
        const parsedSeconds = parsedMatch ? parseInt(parsedMatch[1], 10) : 60;
        clearRateLimitInterval();
        setRateLimitAttempts((prev) => {
          const secondsToWait = parsedSeconds + prev * 20;
          setRateLimitSeconds(secondsToWait);
          return prev + 1;
        });
        rateLimitIntervalRef.current = setInterval(() => {
          setRateLimitSeconds((s) => {
            if (s <= 1) {
              clearRateLimitInterval();
              return 0;
            }
            return s - 1;
          });
        }, 1000);
        return;
      }
      setError(getErrorMessage(err, "Error al iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="rec-auth-secretaria-page min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated shadow-[0_22px_60px_-30px_color-mix(in_srgb,var(--rec-ink)_35%,transparent)]">
            <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[color-mix(in_srgb,var(--rec-info-text)_15%,transparent)]" />
            <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--rec-primary)_15%,transparent)]" />
            <div className="relative z-10 p-5 md:p-8">
              <p className="inline-flex rounded-full border border-rec-info-border bg-rec-info-bg px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-rec-info-text">
                Panel administrativo
              </p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-rec-text-primary md:text-4xl">
                Control operativo para Secretaría.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-rec-text-muted md:text-base">
                Gestiona reportes, academico, estudiantes y docentes desde un acceso institucional
                seguro y centralizado.
              </p>
              <div className="mt-5 h-[250px] w-full md:h-[292px]">
                <SecretariaIllustration />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated p-5 shadow-[0_22px_55px_-35px_color-mix(in_srgb,var(--rec-ink)_45%,transparent)] md:p-8">
            <h2 className="text-2xl font-bold text-[color:var(--rec-title)]">Acceso Secretaría</h2>
            <p className="mt-1 text-sm text-rec-text-muted">Ingresa con credenciales autorizadas del area administrativa.</p>

            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
              <label className="text-sm font-semibold text-rec-text-secondary" htmlFor="secretaria-email">Correo</label>
              <input
                id="secretaria-email"
                type="email"
                className="rounded-xl border border-rec-border-strong px-4 py-3 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@tuinstitucion.edu"
                autoComplete="email"
                required
              />

              <label className="text-sm font-semibold text-rec-text-secondary" htmlFor="secretaria-password">Contraseña</label>
              <div className="relative">
                <input
                  id="secretaria-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border border-rec-border-strong px-4 py-3 pr-24 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-rec-text-muted transition hover:bg-rec-bg-muted"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {rateLimitSeconds > 0 ? (
                <div
                  className="flex gap-2 rounded-xl border border-rec-warning-border bg-rec-warning-bg px-3 py-2 text-sm text-rec-warning-text"
                  role="status"
                >
                  <span className="shrink-0" aria-hidden>
                    ⏳
                  </span>
                  <div>
                    <p>
                      Demasiados intentos. Espera {rateLimitSeconds}s para volver a intentar.
                    </p>
                    {rateLimitAttempts >= 2 ? (
                      <p className="mt-1 text-xs text-rec-text-muted">
                        Cada intento fallido aumenta el tiempo de espera.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {error ? (
                <p className="rounded-xl border border-rec-danger-border bg-rec-danger-bg px-3 py-2 text-sm text-rec-danger-text">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className={
                  rateLimitSeconds > 0
                    ? "mt-1 inline-flex items-center justify-center rounded-xl bg-rec-bg-muted px-4 py-3 text-sm font-semibold text-rec-text-muted cursor-not-allowed opacity-70"
                    : "mt-1 inline-flex items-center justify-center rounded-xl bg-[color:var(--rec-primary)] px-4 py-3 text-sm font-semibold text-rec-text-on-media transition hover:bg-[color:var(--rec-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                }
                disabled={loading || rateLimitSeconds > 0}
              >
                {loading
                  ? "Ingresando..."
                  : rateLimitSeconds > 0
                    ? `Espera ${rateLimitSeconds}s...`
                    : "Ingresar"}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="text-sm text-rec-text-muted hover:text-[color:var(--rec-primary)] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}