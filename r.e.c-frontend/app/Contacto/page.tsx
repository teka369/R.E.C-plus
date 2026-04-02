import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata = {
  title: "Contacto | R.E.C",
  description: "Canales de contacto y soporte de la plataforma R.E.C",
};

const contactChannels = [
  {
    icon: "🏫",
    title: "Secretaría Académica",
    desc: "Canal principal para soporte de acceso, gestión de cuentas y matrículas. Es el primer punto de contacto para cualquier incidencia.",
    action: null,
    actionLabel: null,
  },
  {
    icon: "💻",
    title: "Soporte Técnico",
    desc: "Para errores técnicos, problemas de plataforma o solicitudes de mejora, contacta directamente al equipo de desarrollo.",
    action: "/portafolio",
    actionLabel: "Ver equipo de desarrollo",
  },
  {
    icon: "📄",
    title: "Documentación",
    desc: "Consulta el tutorial completo de uso y las preguntas frecuentes antes de abrir un ticket de soporte.",
    action: "/tutorial",
    actionLabel: "Ver tutorial",
  },
];

const infoItems = [
  { label: "Canal recomendado", value: "Secretaría académica de tu institución" },
  { label: "Horario de atención", value: "Definido por cada institución educativa" },
  { label: "Tiempo de respuesta", value: "24–48 horas hábiles" },
  { label: "Detalle requerido", value: "Nombre completo, rol y descripción del problema" },
];

export default function ContactoPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section
        className="relative text-white text-center py-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--rec-primary-strong) 0%, var(--rec-primary) 100%)" }}
      >
        <div className="absolute inset-0 rec-grid-bg opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <span className="inline-block mb-4 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
            Soporte
          </span>
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">Contacto</h1>
          <p className="text-white/85 text-lg max-w-xl mx-auto">
            Estamos para ayudarte. Elige el canal adecuado según tu necesidad
          </p>
        </div>
      </section>

      {/* Canales de contacto */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold mb-2" style={{ color: "var(--rec-title)" }}>Canales de atención</h2>
          <div className="h-1 w-14 mx-auto rounded-full" style={{ background: "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactChannels.map((ch) => (
            <div
              key={ch.title}
              className="rec-glass rounded-2xl p-7 flex flex-col gap-4 shadow-sm hover:shadow-md transition"
            >
              <div className="text-4xl">{ch.icon}</div>
              <h3 className="font-bold text-lg" style={{ color: "var(--rec-title)" }}>{ch.title}</h3>
              <p className="text-sm text-slate-600 flex-1 leading-relaxed">{ch.desc}</p>
              {ch.action && (
                <Link
                  href={ch.action}
                  className="mt-auto inline-flex items-center gap-1 text-sm font-semibold transition hover:opacity-80"
                  style={{ color: "var(--rec-primary)" }}
                >
                  {ch.actionLabel} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Información de contacto */}
      <section className="py-16" style={{ background: "var(--rec-soft)" }}>
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--rec-title)" }}>Información de soporte</h2>
              <div className="h-1 w-12 rounded-full mb-6" style={{ background: "var(--rec-primary)" }} />
              <ul className="space-y-4">
                {infoItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white text-xs flex-shrink-0"
                      style={{ background: "var(--rec-primary)" }}
                    >✓</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-medium" style={{ color: "var(--rec-title)" }}>{item.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rec-glass rounded-2xl p-8">
              <h3 className="font-bold text-lg mb-4" style={{ color: "var(--rec-title)" }}>¿Cómo reportar un problema?</h3>
              <ol className="space-y-4">
                {[
                  "Identifica si es un problema de acceso (contraseña, cuenta) o técnico.",
                  "Para acceso: contacta directamente a secretaría de tu institución.",
                  "Para errores técnicos: incluye capturas de pantalla y describe el paso donde ocurrió el error.",
                  "Indica tu nombre completo, rol (docente/estudiante) e institución.",
                  "El equipo técnico responderá en 24–48 horas hábiles.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "var(--rec-primary)" }}
                    >{i + 1}</span>
                    <span className="text-slate-600 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-extrabold mb-2 text-center" style={{ color: "var(--rec-title)" }}>Ubicación</h2>
          <div className="h-1 w-14 mx-auto rounded-full mb-8" style={{ background: "var(--rec-primary)" }} />
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "📍", label: "Ubicación", value: "Colombia" },
              { icon: "✉️", label: "Correo", value: "contacto@recedu.co" },
            ].map((info) => (
              <div
                key={info.label}
                className="rec-glass rounded-xl px-5 py-4 flex items-center gap-3"
              >
                <span className="text-2xl">{info.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">{info.label}</p>
                  <p className="text-sm font-medium" style={{ color: "var(--rec-title)" }}>{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 text-white text-center"
        style={{ background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))" }}
      >
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-2xl font-extrabold mb-3">¿Listo para usar la plataforma?</h2>
          <p className="text-white/80 mb-8">Inicia sesión o consulta el tutorial para comenzar</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login"
              className="rounded-full px-7 py-3 text-sm font-bold bg-white transition hover:opacity-90"
              style={{ color: "var(--rec-primary-strong)" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/tutorial"
              className="rounded-full px-7 py-3 text-sm font-bold border border-white/50 text-white transition hover:bg-white/10"
            >
              Ver tutorial
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
