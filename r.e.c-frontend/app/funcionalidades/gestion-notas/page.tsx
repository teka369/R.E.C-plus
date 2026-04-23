import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Gestión de Notas y Calificaciones — Control Académico Digital",
  description:
    "Registra, calcula y consulta calificaciones escolares con Recedu. Promedios automáticos por periodo, grupo y materia. Software de notas para colegios en Colombia.",
  alternates: { canonical: "/funcionalidades/gestion-notas" },
  openGraph: {
    title: "Gestión de Notas y Calificaciones | Recedu",
    description:
      "Sistema de calificaciones para colegios colombianos. Promedios automáticos, reportes por periodo y seguimiento académico.",
    url: "/funcionalidades/gestion-notas",
  },
};

const benefits = [
  {
    icon: "⚡",
    title: "Cálculo automático",
    text: "Los promedios por periodo, materia y grupo se calculan automáticamente. Sin hojas de cálculo ni fórmulas manuales.",
  },
  {
    icon: "🔒",
    title: "Datos seguros",
    text: "Cada docente accede solo a sus grupos y materias asignadas. Secretaría tiene la visión global con permisos diferenciados.",
  },
  {
    icon: "📊",
    title: "Visión institucional",
    text: "Secretaría puede consultar el rendimiento general, identificar grupos en riesgo y generar reportes consolidados.",
  },
];

const steps = [
  {
    n: "01",
    title: "Estructura académica",
    desc: "Secretaría configura grados, grupos, materias y asigna docentes. Esta estructura es la base del sistema de notas.",
  },
  {
    n: "02",
    title: "Registro de calificaciones",
    desc: "Los docentes ingresan las notas de sus estudiantes por periodo y materia desde su panel personalizado.",
  },
  {
    n: "03",
    title: "Cálculo y consolidación",
    desc: "Recedu calcula promedios, identifica estudiantes en riesgo y genera el panorama académico de cada grupo.",
  },
  {
    n: "04",
    title: "Consulta y reporte",
    desc: "Estudiantes consultan sus notas, docentes revisan el rendimiento y secretaría exporta informes institucionales.",
  },
];

const features = [
  {
    title: "Notas por periodo",
    desc: "Registro de calificaciones organizado por periodos académicos con cierre configurable por secretaría.",
  },
  {
    title: "Promedios automáticos",
    desc: "Cálculo instantáneo de promedios por materia, grupo y estudiante sin intervención manual.",
  },
  {
    title: "Vista por rol",
    desc: "Docentes ven sus grupos, estudiantes ven sus notas, secretaría ve todo. Cada quien ve lo que necesita.",
  },
  {
    title: "Seguimiento de rendimiento",
    desc: "Identificación automática de estudiantes con bajo rendimiento para tomar acciones preventivas a tiempo.",
  },
  {
    title: "Integración con recuperaciones",
    desc: "Las notas alimentan directamente el módulo de recuperaciones: los estudiantes que no alcanzan el mínimo se listan automáticamente.",
  },
  {
    title: "Histórico completo",
    desc: "Consulta calificaciones de periodos anteriores para análisis de progreso y toma de decisiones académicas.",
  },
];

export default function GestionNotasPage() {
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
            Gestión de Notas y Calificaciones para Colegios
          </h1>
          <p className="text-rec-text-on-media/85 text-lg max-w-xl mx-auto">
            Olvídate de las planillas en Excel. Registra, calcula y consulta
            calificaciones desde una plataforma centralizada y segura.
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
                ¿Por qué gestionar notas con Recedu?
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
              Una experiencia adaptada a cada rol
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
                  "Configura la estructura académica",
                  "Consulta promedios institucionales",
                  "Exporta reportes consolidados",
                  "Controla cierre de periodos",
                ],
              },
              {
                role: "Docentes",
                icon: "👨‍🏫",
                items: [
                  "Registra notas por grupo y materia",
                  "Visualiza promedios automáticos",
                  "Identifica estudiantes en riesgo",
                  "Accede al historial de calificaciones",
                ],
              },
              {
                role: "Estudiantes",
                icon: "🎓",
                items: [
                  "Consulta sus notas por periodo",
                  "Visualiza su promedio general",
                  "Recibe alertas de bajo rendimiento",
                  "Accede desde cualquier dispositivo",
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
                Flujo de gestión de notas
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
              Todo lo que incluye
            </h2>
            <p className="text-rec-text-muted max-w-2xl mx-auto">
              Un sistema de calificaciones pensado para la realidad de los
              colegios colombianos.
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
                  href: "/funcionalidades/recuperaciones-academicas",
                  label: "Recuperaciones",
                  desc: "Seguimiento de planes de refuerzo",
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
              ¿Listo para dejar de usar planillas en Excel?
            </h2>
            <p className="text-rec-text-on-media/80 mb-8">
              Digitaliza las calificaciones de tu colegio con una plataforma
              hecha para la educación colombiana.
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
