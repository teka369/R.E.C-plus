import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Recuperaciones Académicas — Gestión y Seguimiento Automatizado",
  description:
    "Gestiona las recuperaciones académicas de tu colegio con Recedu. Asignación automática, seguimiento por estudiante, notificaciones y reportes. Cumple el Decreto 1290 de Colombia.",
  alternates: { canonical: "/funcionalidades/recuperaciones-academicas" },
  openGraph: {
    title: "Recuperaciones Académicas | Recedu",
    description:
      "Sistema de recuperaciones académicas para colegios colombianos. Asignación, seguimiento y reportes en una sola plataforma.",
    url: "/funcionalidades/recuperaciones-academicas",
  },
};

const benefits = [
  {
    icon: "🎯",
    title: "Asignación inteligente",
    text: "El sistema identifica automáticamente a los estudiantes que requieren recuperación según sus calificaciones y criterios institucionales.",
  },
  {
    icon: "📈",
    title: "Seguimiento en tiempo real",
    text: "Docentes y secretaría pueden monitorear el estado de cada recuperación: pendiente, en proceso o completada.",
  },
  {
    icon: "📋",
    title: "Reportes por periodo",
    text: "Genera informes detallados de recuperaciones por grupo, materia y estudiante para la toma de decisiones.",
  },
];

const steps = [
  {
    n: "01",
    title: "Configuración",
    desc: "Secretaría define los periodos de recuperación, criterios de elegibilidad y fechas límite desde el panel administrativo.",
  },
  {
    n: "02",
    title: "Asignación",
    desc: "El sistema cruza las calificaciones con los criterios y genera la lista de estudiantes que deben recuperar por materia.",
  },
  {
    n: "03",
    title: "Seguimiento",
    desc: "Los docentes registran las actividades de refuerzo, y los estudiantes pueden consultar su estado de recuperación.",
  },
  {
    n: "04",
    title: "Cierre y reporte",
    desc: "Al finalizar el periodo, secretaría genera el reporte consolidado con los resultados de las recuperaciones.",
  },
];

const features = [
  {
    title: "Cumplimiento del Decreto 1290",
    desc: "Diseñado para cumplir las disposiciones del Decreto 1290 de Colombia sobre evaluación y promoción de estudiantes.",
  },
  {
    title: "Notificaciones automáticas",
    desc: "Estudiantes y docentes reciben alertas cuando se abre un periodo de recuperaciones o hay cambios de estado.",
  },
  {
    title: "Historial completo",
    desc: "Trazabilidad total de cada proceso de recuperación con fechas, calificaciones anteriores y resultados finales.",
  },
  {
    title: "Horarios de recuperación",
    desc: "Programación de sesiones de refuerzo con control de horarios y asignación de espacios por grupo.",
  },
  {
    title: "Multi-periodo",
    desc: "Gestiona recuperaciones de distintos periodos académicos de forma simultánea sin perder el contexto de cada uno.",
  },
  {
    title: "Exportación de datos",
    desc: "Descarga los reportes en formatos compatibles con las necesidades administrativas de tu institución.",
  },
];

export default function RecuperacionesAcademicasPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <header
        className="relative text-rec-text-on-media text-center py-24 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--rec-primary-strong) 0%, var(--rec-primary) 100%)",
        }}
      >
        <div className="absolute inset-0 rec-grid-bg opacity-20" />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <span
            className="inline-block mb-4 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase"
            style={{
              background: "color-mix(in srgb, var(--rec-text-on-media) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--rec-text-on-media) 30%, transparent)",
            }}
          >
            Funcionalidad principal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
            Recuperaciones Académicas Automatizadas
          </h1>
          <p className="text-rec-text-on-media/85 text-lg max-w-xl mx-auto">
            Gestiona todo el ciclo de recuperaciones de tu colegio: desde la
            identificación de estudiantes hasta el cierre del periodo con
            reportes consolidados.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href="/Contacto"
              className="rounded-full px-7 py-3 text-sm font-bold bg-rec-bg-elevated transition hover:opacity-90"
              style={{ color: "var(--rec-primary-strong)" }}
            >
              Solicitar demostración
            </Link>
            <Link
              href="/vs/q10"
              className="rounded-full px-7 py-3 text-sm font-bold border border-rec-text-on-media/50 text-rec-text-on-media transition hover:bg-rec-bg-elevated/10"
            >
              Comparar con Q10
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Beneficios clave */}
        <section className="py-20" style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-14">
              <span
                className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-rec-bg-elevated"
                style={{ color: "var(--rec-primary-strong)" }}
              >
                Beneficios
              </span>
              <h2
                className="text-3xl font-extrabold"
                style={{ color: "var(--rec-title)" }}
              >
                ¿Por qué digitalizar las recuperaciones?
              </h2>
              <div
                className="h-1 w-14 mx-auto mt-3 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))",
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((b) => (
                <article
                  key={b.title}
                  className="rec-glass rounded-2xl p-7 hover:shadow-md transition"
                >
                  <div className="text-4xl mb-4">{b.icon}</div>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{ color: "var(--rec-title)" }}
                  >
                    {b.title}
                  </h3>
                  <p className="text-sm text-rec-text-muted leading-relaxed">
                    {b.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Quién se beneficia */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-extrabold mb-2"
              style={{ color: "var(--rec-title)" }}
            >
              Diseñado para cada rol
            </h2>
            <div
              className="h-1 w-14 mx-auto rounded-full"
              style={{ background: "var(--rec-primary)" }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                role: "Secretaría",
                icon: "🏫",
                items: [
                  "Configura periodos y criterios",
                  "Visualiza estadísticas globales",
                  "Genera reportes por grupo",
                  "Controla los horarios de refuerzo",
                ],
              },
              {
                role: "Docentes",
                icon: "👨‍🏫",
                items: [
                  "Consulta estudiantes asignados",
                  "Registra actividades de refuerzo",
                  "Actualiza el estado de cada caso",
                  "Recibe alertas de fechas límite",
                ],
              },
              {
                role: "Estudiantes",
                icon: "🎓",
                items: [
                  "Consulta materias a recuperar",
                  "Revisa horarios de sesiones",
                  "Conoce su estado en tiempo real",
                  "Recibe notificaciones de cambios",
                ],
              },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-2xl border p-6 shadow-sm"
                style={{
                  borderColor: "var(--rec-border-default)",
                  background: "var(--rec-bg-elevated)",
                }}
              >
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3
                  className="font-bold text-lg mb-4"
                  style={{ color: "var(--rec-title)" }}
                >
                  {r.role}
                </h3>
                <ul className="space-y-2">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-rec-text-on-media text-xs shrink-0"
                        style={{ background: "var(--rec-primary)" }}
                      >
                        ✓
                      </span>
                      <span className="text-rec-text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="py-20" style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <span
                className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-rec-bg-elevated"
                style={{ color: "var(--rec-primary-strong)" }}
              >
                Proceso
              </span>
              <h2
                className="text-3xl font-extrabold"
                style={{ color: "var(--rec-title)" }}
              >
                ¿Cómo funciona?
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {steps.map((s) => (
                <div
                  key={s.n}
                  className="rec-glass rounded-2xl p-6 hover:shadow-md transition"
                >
                  <p
                    className="text-xs font-semibold tracking-widest mb-1"
                    style={{ color: "var(--rec-primary)" }}
                  >
                    Paso {s.n}
                  </p>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{ color: "var(--rec-title)" }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm text-rec-text-muted leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Funcionalidades detalladas */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-extrabold mb-2"
              style={{ color: "var(--rec-title)" }}
            >
              Todo lo que necesitas
            </h2>
            <p className="text-rec-text-muted max-w-2xl mx-auto">
              Funcionalidades diseñadas para que las recuperaciones dejen de ser
              un dolor de cabeza administrativo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border p-6 hover:shadow-md transition"
                style={{
                  borderColor: "var(--rec-border-default)",
                  background: "var(--rec-bg-elevated)",
                }}
              >
                <h3
                  className="font-bold mb-2"
                  style={{ color: "var(--rec-title)" }}
                >
                  {f.title}
                </h3>
                <p className="text-sm text-rec-text-muted leading-relaxed">
                  {f.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <section className="py-16" style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2
              className="text-2xl font-extrabold mb-6"
              style={{ color: "var(--rec-title)" }}
            >
              Explora más funcionalidades
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  href: "/funcionalidades/gestion-notas",
                  label: "Gestión de notas",
                  desc: "Calificaciones y promedios automatizados",
                },
                {
                  href: "/funcionalidades/reportes-docentes",
                  label: "Reportes docentes",
                  desc: "Análisis de rendimiento por grupo",
                },
                {
                  href: "/vs/q10",
                  label: "Recedu vs Q10",
                  desc: "Compara y decide con datos",
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rec-glass rounded-2xl p-5 hover:shadow-md transition text-left"
                >
                  <p
                    className="font-bold text-sm mb-1"
                    style={{ color: "var(--rec-primary)" }}
                  >
                    {link.label}
                  </p>
                  <p className="text-xs text-rec-text-muted">{link.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-16 text-rec-text-on-media text-center"
          style={{
            background:
              "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
          }}
        >
          <div className="mx-auto max-w-xl px-6">
            <h2 className="text-2xl font-extrabold mb-3">
              ¿Listo para modernizar las recuperaciones de tu colegio?
            </h2>
            <p className="text-rec-text-on-media/80 mb-8">
              Agenda una demostración y descubre cómo Recedu transforma el
              proceso de recuperaciones académicas.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/Contacto"
                className="rounded-full px-7 py-3 text-sm font-bold bg-rec-bg-elevated transition hover:opacity-90"
                style={{ color: "var(--rec-primary-strong)" }}
              >
                Solicitar demostración
              </Link>
              <Link
                href="/Informacion"
                className="rounded-full px-7 py-3 text-sm font-bold border border-rec-text-on-media/50 text-rec-text-on-media transition hover:bg-rec-bg-elevated/10"
              >
                Conocer la plataforma
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
