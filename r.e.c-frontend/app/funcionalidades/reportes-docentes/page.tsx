import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Reportes para Docentes — Análisis de Rendimiento Académico",
  description:
    "Genera reportes académicos por grupo, materia y periodo con Recedu. Análisis de rendimiento, exportación de datos y seguimiento para docentes de colegios en Colombia.",
  alternates: { canonical: "/funcionalidades/reportes-docentes" },
  openGraph: {
    title: "Reportes para Docentes | Recedu",
    description:
      "Reportes académicos claros y exportables para docentes. Rendimiento por grupo, seguimiento por periodo y análisis visual.",
    url: "/funcionalidades/reportes-docentes",
  },
};

const benefits = [
  {
    icon: "📉",
    title: "Datos accionables",
    text: "No solo números: reportes que muestran tendencias, alertas de bajo rendimiento y comparativas entre periodos.",
  },
  {
    icon: "⏱️",
    title: "Ahorro de tiempo",
    text: "Los reportes se generan automáticamente. Sin cruzar datos entre planillas ni copiar celdas manualmente.",
  },
  {
    icon: "📤",
    title: "Exportación flexible",
    text: "Descarga reportes en formatos estándar para compartir con coordinación, padres de familia o archivos institucionales.",
  },
];

const reportTypes = [
  {
    title: "Rendimiento por grupo",
    desc: "Promedio general del grupo, distribución de notas y comparativa entre materias para identificar fortalezas y debilidades.",
    icon: "📊",
  },
  {
    title: "Seguimiento individual",
    desc: "Historial de calificaciones por estudiante a lo largo de los periodos para detectar tendencias de mejora o declive.",
    icon: "👤",
  },
  {
    title: "Comparativa entre periodos",
    desc: "Evolución del rendimiento académico de un grupo entre periodo 1, 2, 3 y 4 con métricas claras.",
    icon: "📈",
  },
  {
    title: "Alertas de bajo rendimiento",
    desc: "Lista automática de estudiantes por debajo del promedio mínimo, lista para derivar a recuperaciones.",
    icon: "⚠️",
  },
  {
    title: "Reporte de recuperaciones",
    desc: "Estado consolidado de las recuperaciones por grupo: cuántos estudiantes fueron asignados, cuántos completaron y cuántos aprobaron.",
    icon: "🔄",
  },
  {
    title: "Resumen institucional",
    desc: "Vista global para secretaría con los indicadores clave de toda la institución: promedios, aprobación y deserción.",
    icon: "🏫",
  },
];

const steps = [
  {
    n: "01",
    title: "Selección de parámetros",
    desc: "Elige grupo, materia y periodo. El sistema filtra los datos relevantes automáticamente.",
  },
  {
    n: "02",
    title: "Generación del reporte",
    desc: "Recedu calcula promedios, identifica tendencias y presenta los datos de forma visual y ordenada.",
  },
  {
    n: "03",
    title: "Análisis y acción",
    desc: "Revisa los indicadores, identifica los casos que requieren atención y toma decisiones informadas.",
  },
  {
    n: "04",
    title: "Exportación",
    desc: "Descarga el reporte para compartirlo con coordinación, padres de familia o para los archivos institucionales.",
  },
];

export default function ReportesDocentesPage() {
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
            Reportes Académicos para Docentes y Secretaría
          </h1>
          <p className="text-rec-text-on-media/85 text-lg max-w-xl mx-auto">
            Genera reportes claros sobre rendimiento, recuperaciones y
            seguimiento por grupo. Decisiones informadas en pocos clics.
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
        {/* Beneficios */}
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
                Reportes que impulsan la mejora continua
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

        {/* Tipos de reportes */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-extrabold mb-2"
              style={{ color: "var(--rec-title)" }}
            >
              Tipos de reportes disponibles
            </h2>
            <p className="text-rec-text-muted max-w-2xl mx-auto">
              Cada reporte está diseñado para responder una pregunta clave de la
              gestión académica.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reportTypes.map((r) => (
              <article
                key={r.title}
                className="rounded-2xl border p-6 hover:shadow-md transition"
                style={{
                  borderColor: "var(--rec-border-default)",
                  background: "var(--rec-bg-elevated)",
                }}
              >
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3
                  className="font-bold mb-2"
                  style={{ color: "var(--rec-title)" }}
                >
                  {r.title}
                </h3>
                <p className="text-sm text-rec-text-muted leading-relaxed">
                  {r.desc}
                </p>
              </article>
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
                De los datos a la acción en 4 pasos
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

        {/* Cross-links */}
        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
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
                href: "/funcionalidades/recuperaciones-academicas",
                label: "Recuperaciones",
                desc: "Seguimiento del ciclo de refuerzo",
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
              ¿Quieres tomar decisiones con datos reales?
            </h2>
            <p className="text-rec-text-on-media/80 mb-8">
              Descubre cómo los reportes de Recedu transforman la gestión
              académica de tu institución.
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
