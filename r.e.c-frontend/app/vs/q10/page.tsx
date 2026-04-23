import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Recedu vs Q10 — Comparativa de Software Académico para Colegios",
  description:
    "Comparativa honesta entre Recedu y Q10. Descubre cuál plataforma de gestión académica se adapta mejor a tu colegio en Colombia: funcionalidades, precio, modernidad y facilidad de uso.",
  alternates: { canonical: "/vs/q10" },
  openGraph: {
    title: "Recedu vs Q10 — ¿Cuál es mejor para tu colegio?",
    description:
      "Comparativa detallada entre Recedu y Q10: funcionalidades, costos, tecnología y experiencia de usuario para colegios colombianos.",
    url: "/vs/q10",
  },
};

/* ── Datos de comparación ────────────────────────────────────────────── */

interface ComparisonRow {
  feature: string;
  recedu: string;
  q10: string;
  advantage: "recedu" | "q10" | "tie";
}

const comparisonTable: ComparisonRow[] = [
  {
    feature: "Precio",
    recedu: "Gratuita. Sin costos ocultos, sin cobro por usuario",
    q10: "Licencia anual de pago por institución",
    advantage: "recedu",
  },
  {
    feature: "Recuperaciones académicas",
    recedu: "Módulo completo: asignación automática, seguimiento y reportes",
    q10: "Funcionalidad básica o dependiente de procesos manuales",
    advantage: "recedu",
  },
  {
    feature: "Tiempo de implementación",
    recedu: "Implementación en 24 horas. Solo necesitas un navegador",
    q10: "Proceso de onboarding con soporte del proveedor",
    advantage: "recedu",
  },
  {
    feature: "Experiencia del docente",
    recedu: "Menos clics para calificar. Paneles por rol, acciones guiadas",
    q10: "Interfaz funcional con curva de aprendizaje moderada",
    advantage: "recedu",
  },
  {
    feature: "Diseño e interfaz",
    recedu: "Glassmorphism, modo claro/oscuro, mobile-first",
    q10: "Interfaz funcional de estilo tradicional",
    advantage: "recedu",
  },
  {
    feature: "Enfoque del producto",
    recedu: "Nace desde la necesidad pedagógica: recuperaciones y seguimiento",
    q10: "ERP educativo generalista con amplio catálogo de módulos",
    advantage: "recedu",
  },
  {
    feature: "Roles diferenciados",
    recedu: "Docente, estudiante y secretaría con paneles dedicados",
    q10: "Múltiples roles con sistema de permisos configurables",
    advantage: "tie",
  },
  {
    feature: "Gestión de notas",
    recedu: "Registro por periodo con promedios automáticos",
    q10: "Sistema de notas completo con generación de boletines",
    advantage: "tie",
  },
  {
    feature: "Boletines y certificados",
    recedu: "En desarrollo activo",
    q10: "Generación completa de boletines y certificados",
    advantage: "q10",
  },
  {
    feature: "Trayectoria en el mercado",
    recedu: "Plataforma nueva con enfoque en innovación y velocidad",
    q10: "Más de 10 años en el mercado educativo colombiano",
    advantage: "q10",
  },
  {
    feature: "Feedback docente-estudiante",
    recedu: "Canal directo integrado con seguimiento por conversación",
    q10: "Comunicación vía mensajes internos del sistema",
    advantage: "recedu",
  },
  {
    feature: "Soporte técnico",
    recedu: "WhatsApp directo, correo y documentación interactiva",
    q10: "Soporte por sistema de tickets y base de conocimiento",
    advantage: "tie",
  },
  {
    feature: "Tecnología",
    recedu: "Next.js, NestJS, PostgreSQL — stack moderno 2026",
    q10: "Stack probado y estable",
    advantage: "recedu",
  },
  {
    feature: "Decreto 1290",
    recedu: "Diseñado específicamente para automatizar su cumplimiento",
    q10: "Compatible con la normativa educativa colombiana",
    advantage: "tie",
  },
];

const receduStrengths = [
  {
    icon: "💰",
    title: "Sin costos ocultos. Nunca.",
    text: "Recedu es gratuita para instituciones educativas. No hay licencias anuales, no hay cobro por usuario, no hay sorpresas en la factura. Tu colegio puede empezar hoy sin presupuesto adicional.",
  },
  {
    icon: "🔄",
    title: "Las recuperaciones no son un módulo extra: son el centro",
    text: "Q10 trata las recuperaciones como un apéndice del sistema de notas. Recedu fue concebida alrededor de este proceso. Asignación automática basada en calificaciones, seguimiento por estudiante, horarios de refuerzo y reportes listos para la comisión de evaluación.",
  },
  {
    icon: "⚡",
    title: "Menos clics para calificar, más tiempo para enseñar",
    text: "La experiencia del docente fue la prioridad número uno en el diseño. Cada pantalla muestra solo lo que ese rol necesita. Sin menús infinitos, sin permisos que configurar, sin tutoriales de 2 horas. Un docente nuevo puede registrar notas en su primer día.",
  },
  {
    icon: "🎨",
    title: "Una interfaz que la gente quiere usar",
    text: "Modo claro y oscuro, diseño glassmorphism, animaciones fluidas y responsive-first. Cuando una plataforma es agradable de usar, la adopción sube. Y cuando la adopción sube, los datos son completos y confiables.",
  },
  {
    icon: "🚀",
    title: "Implementación en 24 horas",
    text: "No necesitas un consultor de implementación. Recedu es 100% web: abres el navegador, configuras los grupos y materias, y tu colegio ya está operando. Sin instalaciones, sin servidores, sin dependencias técnicas.",
  },
  {
    icon: "🔧",
    title: "Stack tecnológico de nueva generación",
    text: "Construida con Next.js 16, NestJS y PostgreSQL. Esto no es jerga: significa tiempos de carga rápidos, actualizaciones frecuentes, seguridad moderna y una base sólida para las funcionalidades que vendrán.",
  },
];

function AdvantageIcon({
  advantage,
}: {
  advantage: ComparisonRow["advantage"];
}) {
  if (advantage === "recedu") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-rec-text-on-media text-xs font-bold shrink-0"
        style={{ background: "var(--rec-primary)" }}
      >
        ✓
      </span>
    );
  }
  if (advantage === "q10") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 bg-rec-bg-muted text-rec-text-muted">
        ✓
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 bg-rec-bg-muted text-rec-text-subtle">
      =
    </span>
  );
}

export default function VsQ10Page() {
  const receduWins = comparisonTable.filter(
    (r) => r.advantage === "recedu"
  ).length;
  const q10Wins = comparisonTable.filter(
    (r) => r.advantage === "q10"
  ).length;
  const ties = comparisonTable.filter(
    (r) => r.advantage === "tie"
  ).length;

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
            Comparativa honesta
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
            Recedu vs Q10: ¿Cuál necesita tu colegio?
          </h1>
          <p className="text-rec-text-on-media/85 text-lg max-w-2xl mx-auto">
            Q10 es un ERP educativo generalista.{" "}
            <strong>Recedu nace desde la pedagogía</strong>: recuperaciones
            académicas, seguimiento docente y facilidad de uso como ejes
            centrales. Compara y decide con datos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              href="/Contacto"
              className="rounded-full px-8 py-3.5 text-sm font-bold bg-rec-bg-elevated shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
              style={{ color: "var(--rec-primary-strong)" }}
            >
              Agendar demo gratuita
            </Link>
            <Link
              href="#comparativa"
              className="rounded-full px-7 py-3 text-sm font-bold border border-rec-text-on-media/50 text-rec-text-on-media transition hover:bg-rec-bg-elevated/10"
            >
              Ver comparativa ↓
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Veredicto rápido */}
        <section className="py-12" style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center mb-8">
              <div className="rec-glass rounded-2xl py-7 px-4">
                <p
                  className="text-4xl font-extrabold mb-1"
                  style={{ color: "var(--rec-primary)" }}
                >
                  {receduWins}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--rec-title)" }}
                >
                  Ventajas Recedu
                </p>
              </div>
              <div className="rec-glass rounded-2xl py-7 px-4">
                <p
                  className="text-4xl font-extrabold mb-1"
                  style={{ color: "var(--rec-title)" }}
                >
                  {ties}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--rec-title)" }}
                >
                  Empates
                </p>
              </div>
              <div className="rec-glass rounded-2xl py-7 px-4">
                <p className="text-4xl font-extrabold mb-1 text-rec-text-muted">
                  {q10Wins}
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--rec-title)" }}
                >
                  Ventajas Q10
                </p>
              </div>
            </div>

            {/* TL;DR */}
            <div
              className="rounded-2xl border p-6 md:p-8"
              style={{
                borderColor: "var(--rec-border-default)",
                background: "var(--rec-bg-elevated)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--rec-primary)" }}
              >
                Resumen ejecutivo
              </p>
              <p
                className="text-lg font-bold leading-relaxed mb-3"
                style={{ color: "var(--rec-title)" }}
              >
                Si tu colegio busca una herramienta madura con boletines y
                certificados, Q10 es una opción sólida. Si necesitas una
                plataforma moderna, gratuita, enfocada en recuperaciones y que
                un docente pueda usar desde el primer día —Recedu es tu
                respuesta.
              </p>
              <p className="text-sm text-rec-text-muted leading-relaxed">
                Recedu no compite en cantidad de módulos. Compite en{" "}
                <strong
                  className="font-semibold"
                  style={{ color: "var(--rec-title)" }}
                >
                  claridad, velocidad de implementación y costo cero
                </strong>
                . Cada funcionalidad que existe fue diseñada para que el docente
                pase menos tiempo en la plataforma y más tiempo enseñando.
              </p>
            </div>
          </div>
        </section>

        {/* Tabla comparativa */}
        <section
          id="comparativa"
          className="mx-auto max-w-5xl px-6 py-20 scroll-mt-20"
        >
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-extrabold mb-2"
              style={{ color: "var(--rec-title)" }}
            >
              Comparativa función por función
            </h2>
            <p className="text-rec-text-muted max-w-2xl mx-auto">
              14 criterios evaluados. El ícono verde marca la ventaja en cada
              categoría.
            </p>
          </div>

          {/* Desktop */}
          <div
            className="hidden md:block rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--rec-border-default)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--rec-soft)" }}>
                  <th
                    className="text-left px-6 py-4 font-bold"
                    style={{ color: "var(--rec-title)" }}
                  >
                    Criterio
                  </th>
                  <th
                    className="text-left px-6 py-4 font-bold"
                    style={{ color: "var(--rec-primary)" }}
                  >
                    Recedu
                  </th>
                  <th
                    className="text-left px-6 py-4 font-bold"
                    style={{ color: "var(--rec-title)" }}
                  >
                    Q10
                  </th>
                  <th className="px-4 py-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{
                      background:
                        i % 2 === 0
                          ? "var(--rec-bg-elevated)"
                          : "var(--rec-bg-base)",
                    }}
                  >
                    <td
                      className="px-6 py-4 font-semibold"
                      style={{ color: "var(--rec-title)" }}
                    >
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-rec-text-secondary">
                      {row.recedu}
                    </td>
                    <td className="px-6 py-4 text-rec-text-muted">
                      {row.q10}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <AdvantageIcon advantage={row.advantage} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-4">
            {comparisonTable.map((row) => (
              <div
                key={row.feature}
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "var(--rec-border-default)",
                  background: "var(--rec-bg-elevated)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="font-bold"
                    style={{ color: "var(--rec-title)" }}
                  >
                    {row.feature}
                  </h3>
                  <AdvantageIcon advantage={row.advantage} />
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--rec-primary)" }}
                    >
                      Recedu:{" "}
                    </span>
                    <span className="text-rec-text-secondary">
                      {row.recedu}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-rec-text-muted">
                      Q10:{" "}
                    </span>
                    <span className="text-rec-text-muted">{row.q10}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA mid-page */}
        <section className="py-10">
          <div className="mx-auto max-w-2xl px-6">
            <div
              className="rounded-2xl p-8 text-center shadow-sm"
              style={{
                background: "var(--rec-primary)",
              }}
            >
              <p className="text-2xl font-extrabold text-rec-text-on-media mb-2">
                ¿Quieres verlo en acción?
              </p>
              <p className="text-sm text-rec-text-on-media/80 mb-6">
                Agenda una demo de 15 minutos. Sin compromiso, sin tarjeta de
                crédito, sin presión.
              </p>
              <Link
                href="/Contacto"
                className="inline-flex rounded-full px-8 py-3.5 text-sm font-bold bg-rec-bg-elevated shadow-lg transition hover:scale-[1.02]"
                style={{ color: "var(--rec-primary-strong)" }}
              >
                Agendar demo gratuita →
              </Link>
            </div>
          </div>
        </section>

        {/* Fortalezas */}
        <section className="py-20" style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-14">
              <span
                className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-rec-bg-elevated"
                style={{ color: "var(--rec-primary-strong)" }}
              >
                Diferenciadores
              </span>
              <h2
                className="text-3xl font-extrabold"
                style={{ color: "var(--rec-title)" }}
              >
                Donde Recedu marca la diferencia
              </h2>
              <div
                className="h-1 w-14 mx-auto mt-3 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))",
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {receduStrengths.map((s) => (
                <article
                  key={s.title}
                  className="rec-glass rounded-2xl p-7 hover:shadow-md transition"
                >
                  <div className="text-4xl mb-4">{s.icon}</div>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{ color: "var(--rec-title)" }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm text-rec-text-muted leading-relaxed">
                    {s.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* La diferencia de filosofía */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="rounded-2xl border p-7"
              style={{
                borderColor: "var(--rec-border-default)",
                background: "var(--rec-bg-elevated)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--rec-primary)" }}
              >
                Filosofía Recedu
              </p>
              <h3
                className="text-xl font-extrabold mb-3"
                style={{ color: "var(--rec-title)" }}
              >
                Nace desde la pedagogía
              </h3>
              <p className="text-sm text-rec-text-muted leading-relaxed mb-4">
                Recedu se diseñó preguntando:{" "}
                <strong
                  className="font-semibold"
                  style={{ color: "var(--rec-title)" }}
                >
                  ¿qué necesita un docente a las 7 AM cuando llega al colegio?
                </strong>{" "}
                Necesita ver sus grupos, registrar asistencia, calificar rápido
                y saber qué estudiantes tienen recuperaciones pendientes. Todo
                en menos de 3 clics.
              </p>
              <p className="text-sm text-rec-text-muted leading-relaxed">
                Cada funcionalidad fue construida con un enfoque pedagógico: las
                recuperaciones no son un trámite, son el mecanismo para que los
                estudiantes realmente aprendan. Los reportes no son tablas de
                números, son herramientas para tomar decisiones.
              </p>
            </div>
            <div
              className="rounded-2xl border p-7"
              style={{
                borderColor: "var(--rec-border-default)",
                background: "var(--rec-bg-elevated)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-rec-text-muted">
                Filosofía Q10
              </p>
              <h3
                className="text-xl font-extrabold mb-3"
                style={{ color: "var(--rec-title)" }}
              >
                ERP educativo generalista
              </h3>
              <p className="text-sm text-rec-text-muted leading-relaxed mb-4">
                Q10 es una plataforma madura con más de una década en el
                mercado. Su fortaleza está en la amplitud: matrícula, facturación,
                boletines, certificados, cartera, contabilidad y más.
              </p>
              <p className="text-sm text-rec-text-muted leading-relaxed">
                Para instituciones que necesitan un sistema integral que cubra
                desde la admisión hasta la graduación —incluyendo la parte
                financiera— Q10 es una opción consolidada. La contrapartida es
                una mayor complejidad y un costo de licencia anual.
              </p>
            </div>
          </div>
        </section>

        {/* Reconocimiento justo */}
        <section style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-4xl px-6 py-16">
            <div
              className="rounded-2xl border p-8"
              style={{
                borderColor: "var(--rec-border-default)",
                background: "var(--rec-bg-elevated)",
              }}
            >
              <h2
                className="text-2xl font-extrabold mb-4"
                style={{ color: "var(--rec-title)" }}
              >
                Reconocimiento justo a Q10
              </h2>
              <p className="text-rec-text-muted leading-relaxed mb-4">
                Q10 lleva más de 10 años resolviendo problemas reales de
                instituciones educativas en Colombia. Su ecosistema es amplio,
                su base de clientes es sólida y funcionalidades como la
                generación de boletines y certificados están maduras.
              </p>
              <p className="text-rec-text-muted leading-relaxed">
                Recedu no pretende reemplazar a Q10 en todo. Somos una{" "}
                <strong
                  className="font-semibold"
                  style={{ color: "var(--rec-title)" }}
                >
                  alternativa moderna y gratuita
                </strong>{" "}
                para colegios que priorizan la facilidad de uso, las
                recuperaciones académicas como proceso central y la experiencia
                del docente como punto de partida. Si eso describe a tu
                institución, Recedu es para ti.
              </p>
            </div>
          </div>
        </section>

        {/* Cross-links */}
        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2
            className="text-2xl font-extrabold mb-6"
            style={{ color: "var(--rec-title)" }}
          >
            Conoce las funcionalidades en detalle
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                href: "/funcionalidades/recuperaciones-academicas",
                label: "Recuperaciones",
                desc: "El corazón de Recedu",
              },
              {
                href: "/funcionalidades/gestion-notas",
                label: "Gestión de notas",
                desc: "Menos clics para calificar",
              },
              {
                href: "/funcionalidades/reportes-docentes",
                label: "Reportes",
                desc: "Datos accionables por grupo",
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

        {/* CTA final — prominente */}
        <section
          className="py-20 text-rec-text-on-media text-center"
          style={{
            background:
              "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
          }}
        >
          <div className="mx-auto max-w-xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-rec-text-on-media/70 mb-4">
              Sin costos · Sin compromiso · En 24 horas
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              ¿Listo para probar la alternativa moderna?
            </h2>
            <p className="text-rec-text-on-media/80 mb-8 max-w-md mx-auto">
              Agenda una demo de 15 minutos con nuestro equipo. Te mostramos
              cómo Recedu puede funcionar en tu colegio.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/Contacto"
                className="rounded-full px-9 py-4 text-base font-bold bg-rec-bg-elevated shadow-xl transition hover:scale-[1.03] hover:shadow-2xl"
                style={{ color: "var(--rec-primary-strong)" }}
              >
                Agendar demo gratuita
              </Link>
              <Link
                href="/Informacion"
                className="rounded-full px-7 py-3.5 text-sm font-bold border-2 border-rec-text-on-media/50 text-rec-text-on-media transition hover:bg-rec-bg-elevated/10"
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
