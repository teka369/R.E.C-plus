import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata = {
  title: "Información | R.E.C",
  description: "Conoce R.E.C: Refuerzo Educativo Complementario, la plataforma académica integral",
};

const modules = [
  {
    icon: "📅",
    title: "Horarios",
    desc: "Consulta los horarios académicos completos por grupo, materia y docente. Siempre actualizado en tiempo real.",
  },
  {
    icon: "📚",
    title: "Materiales de estudio",
    desc: "Accede y descarga los recursos educativos publicados por tus docentes: PDF, guías, presentaciones y más.",
  },
  {
    icon: "📝",
    title: "Temarios",
    desc: "Visualiza el contenido programado para cada unidad académica y mantente al día con el plan de estudios.",
  },
  {
    icon: "🔄",
    title: "Recuperaciones",
    desc: "Gestiona y consulta las actividades de refuerzo y recuperación académica según el seguimiento docente.",
  },
  {
    icon: "💬",
    title: "Feedback",
    desc: "Canal directo de comunicación entre docentes y estudiantes para retroalimentación académica personalizada.",
  },
  {
    icon: "📊",
    title: "Rendimiento",
    desc: "Seguimiento del rendimiento académico por grupo con reportes visuales para docentes y secretaría.",
  },
];

const stats = [
  { value: "3", label: "Roles de usuario", sub: "Docente · Estudiante · Secretaría" },
  { value: "6+", label: "Módulos activos", sub: "Horarios, materiales, temarios…" },
  { value: "100%", label: "Web responsivo", sub: "Funciona en móvil y desktop" },
];

export default function InformacionPage() {
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
          <span
            className="inline-block mb-4 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            Acerca de R.E.C
          </span>
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">¿Qué es R.E.C?</h1>
          <p className="text-white/85 text-lg max-w-xl mx-auto">
            Refuerzo Educativo Complementario: la plataforma que centraliza toda la gestión académica
            de tu institución en un solo lugar.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12" style={{ background: "var(--rec-soft)" }}>
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label} className="rec-glass rounded-2xl py-7 px-4">
                <p className="text-4xl font-extrabold mb-1" style={{ color: "var(--rec-primary)" }}>{s.value}</p>
                <p className="text-sm font-semibold" style={{ color: "var(--rec-title)" }}>{s.label}</p>
                <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Descripción */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>La plataforma</span>
            <h2 className="text-3xl font-extrabold mb-4" style={{ color: "var(--rec-title)" }}>Una solución completa para instituciones educativas</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              R.E.C nace como respuesta a la fragmentación de herramientas académicas en las instituciones educativas
              colombianas. Centraliza en un único sistema digital la comunicación, seguimiento y gestión del proceso
              de enseñanza-aprendizaje.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Diseñada pensando en tres actores clave: <strong style={{ color: "var(--rec-title)" }}>docentes</strong> que
              necesitan gestionar contenidos, <strong style={{ color: "var(--rec-title)" }}>estudiantes</strong> que
              requieren acceso fácil a recursos, y <strong style={{ color: "var(--rec-title)" }}>secretaría</strong> que
              administra la estructura académica completa.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tutorial"
                className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--rec-primary)" }}
              >
                Ver tutorial
              </Link>
              <Link
                href="/Contacto"
                className="rounded-full px-6 py-2.5 text-sm font-semibold transition"
                style={{ border: "1.5px solid var(--rec-primary)", color: "var(--rec-primary)" }}
              >
                Contacto
              </Link>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--rec-soft)" }}>
            <div className="p-8" style={{ background: "var(--rec-soft)" }}>
              <h3 className="font-bold mb-5 text-sm uppercase tracking-wider" style={{ color: "var(--rec-primary-strong)" }}>Características clave</h3>
              <ul className="space-y-3">
                {[
                  "Acceso multi-rol con permisos diferenciados",
                  "Paneles optimizados por tipo de usuario",
                  "Gestión de grupos, grados y asignaciones",
                  "Sistema de recuperaciones y seguimiento",
                  "Comunicación directa docente-estudiante",
                  "Reportes exportables para administración",
                  "Interfaz responsiva para todos los dispositivos",
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-sm">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-white text-xs flex-shrink-0"
                      style={{ background: "var(--rec-primary)" }}
                    >✓</span>
                    <span className="text-slate-700">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="py-20" style={{ background: "var(--rec-soft)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <span className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-white" style={{ color: "var(--rec-primary-strong)" }}>Funcionalidades</span>
            <h2 className="text-3xl font-extrabold" style={{ color: "var(--rec-title)" }}>Módulos principales</h2>
            <div className="h-1 w-14 mx-auto mt-3 rounded-full" style={{ background: "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <div
                key={mod.title}
                className="rec-glass rounded-2xl p-7 hover:shadow-md transition"
              >
                <div className="text-4xl mb-4">{mod.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: "var(--rec-title)" }}>{mod.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{mod.desc}</p>
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
          <h2 className="text-2xl font-extrabold mb-3">¿Tu institución aún no usa R.E.C?</h2>
          <p className="text-white/80 mb-8">Contáctanos para agendar una demostración de la plataforma</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/Contacto"
              className="rounded-full px-7 py-3 text-sm font-bold bg-white transition hover:opacity-90"
              style={{ color: "var(--rec-primary-strong)" }}
            >
              Solicitar información
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
