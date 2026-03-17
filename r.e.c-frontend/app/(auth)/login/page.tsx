"use client";
import { useState } from "react";
import Navbar from "@/components/layouts/Navbar";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { Player } from "@lottiefiles/react-lottie-player";

function KidsLoginIllustration() {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border border-[color:var(--rec-soft)] bg-[linear-gradient(145deg,#eef7f1_0%,#dff0e7_100%)]"
      role="img"
      aria-label="Animacion institucional de acceso"
    >
      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[color:var(--rec-primary)]/12" />
      <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-[color:var(--rec-leaf)]/15" />
      <div className="absolute left-0 top-[78%] h-14 w-full bg-[linear-gradient(180deg,rgba(47,138,87,0.02),rgba(47,138,87,0.14))]" />

      <div className="relative z-10 flex h-full w-full items-center justify-center p-4 md:p-6">
        <Player
          autoplay
          loop
          src="/animations/login/businessman-rocket.json"
          style={{ height: "100%", width: "100%", maxHeight: "250px", maxWidth: "250px" }}
        />
      </div>

      <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-2 lg:flex">
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--rec-primary)] shadow-sm">
          Accede aqui
        </span>
        <span className="text-xl text-[color:var(--rec-primary)]">➡</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      // Este login es exclusivo para Estudiantes y Docentes
      if (user.role === "SECRETARIA") {
        setError("Este acceso es para estudiantes y docentes. Usa 'Acceso Secretaría'.");
        return;
      }
      await login(user, access_token);
      const target = user.role === "PROFESOR" ? "/docente" : "/estudiante";
      window.location.href = target;
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0f8f3_0%,_#f8fbf9_40%,_#ffffff_100%)]">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--rec-soft)] bg-white shadow-[0_22px_60px_-30px_rgba(25,50,32,0.45)]">
            <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[color:var(--rec-primary)]/10" />
            <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-[color:var(--rec-leaf)]/15" />
            <div className="relative z-10 p-5 md:p-8">
              <p className="inline-flex rounded-full border border-[color:var(--rec-soft)] bg-[color:var(--rec-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--rec-primary)]">
                Bienvenido a R.E.C
              </p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                Aprende, conecta y entra en segundos.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                Estudiantes y docentes pueden iniciar sesion desde aqui para gestionar actividades,
                seguimiento academico y retroalimentacion en un solo espacio.
              </p>
              <div className="mt-5 h-[250px] w-full md:h-[290px]">
                <KidsLoginIllustration />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-white p-5 shadow-[0_22px_55px_-35px_rgba(19,52,35,0.5)] md:p-8">
            <h2 className="text-2xl font-bold text-[color:var(--rec-title)]">Ingresar</h2>
            <p className="mt-1 text-sm text-slate-600">Usa tu correo institucional para continuar.</p>

            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
              <label className="text-sm font-semibold text-slate-700" htmlFor="login-email">
                Correo
              </label>
              <input
                id="login-email"
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
                placeholder="tu.correo@institucion.edu"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label className="text-sm font-semibold text-slate-700" htmlFor="login-password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-24 text-sm outline-none transition focus:border-[color:var(--rec-primary)] focus:ring-2 focus:ring-[color:var(--rec-primary)]/20"
                  placeholder="Ingresa tu contraseña"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button
                disabled={loading}
                className="mt-1 rounded-xl bg-[color:var(--rec-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--rec-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <div className="mt-5 rounded-xl border border-[color:var(--rec-soft)] bg-[color:var(--rec-soft)]/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--rec-primary)]">Ayuda rapida</p>
              <p className="mt-1 text-sm text-slate-600">
                Si olvidaste tu contraseña, solicita el cambio presencial en Secretaría.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}