import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

/* ── Datos por ciudad ────────────────────────────────────────────────── */

interface CityData {
  name: string;
  slug: string;
  deptName: string;
  heroSub: string;
  contextParagraph: string;
  stats: { value: string; label: string }[];
}

const CITIES: Record<string, CityData> = {
  medellin: {
    name: "Medellín",
    slug: "medellin",
    deptName: "Antioquia",
    heroSub:
      "La ciudad de la innovación merece herramientas educativas a su altura. Recedu lleva la gestión académica digital a los colegios de Medellín y el Área Metropolitana.",
    contextParagraph:
      "Medellín es reconocida como la ciudad más innovadora de Colombia. Con más de 1.200 instituciones educativas, la demanda de herramientas tecnológicas para la gestión escolar es cada vez mayor. Recedu responde a esta necesidad con una plataforma moderna, accesible y adaptada a la normativa colombiana.",
    stats: [
      { value: "1.200+", label: "Colegios en la ciudad" },
      { value: "100%", label: "Digital, sin instalación" },
      { value: "3 roles", label: "Docente, estudiante, secretaría" },
    ],
  },
  bogota: {
    name: "Bogotá",
    slug: "bogota",
    deptName: "Cundinamarca",
    heroSub:
      "La capital del país necesita soluciones escalables. Recedu ofrece gestión académica centralizada para colegios de Bogotá y municipios aledaños.",
    contextParagraph:
      "Bogotá concentra la mayor cantidad de instituciones educativas del país. La diversidad de colegios —desde privados de alto rendimiento hasta instituciones públicas con grandes retos— exige una herramienta flexible. Recedu se adapta a cada contexto institucional con roles diferenciados y configuración personalizable.",
    stats: [
      { value: "2.800+", label: "Colegios en la ciudad" },
      { value: "Escalable", label: "De 1 a múltiples sedes" },
      { value: "Decreto 1290", label: "Cumplimiento normativo" },
    ],
  },
  cali: {
    name: "Cali",
    slug: "cali",
    deptName: "Valle del Cauca",
    heroSub:
      "Los colegios de Cali merecen herramientas modernas. Recedu digitaliza la gestión académica con enfoque en seguimiento y comunicación.",
    contextParagraph:
      "Cali es la tercera ciudad más grande de Colombia con una comunidad educativa en crecimiento. Muchas instituciones aún dependen de procesos manuales para la gestión de notas, recuperaciones y comunicación. Recedu ofrece una alternativa digital, intuitiva y accesible desde cualquier dispositivo.",
    stats: [
      { value: "900+", label: "Colegios en la ciudad" },
      { value: "Mobile-first", label: "Funciona en cualquier dispositivo" },
      { value: "Gratuita", label: "Sin costos de licencia" },
    ],
  },
};

const CITY_SLUGS = Object.keys(CITIES);

/* ── Static generation ───────────────────────────────────────────────── */

export function generateStaticParams() {
  return CITY_SLUGS.map((ciudad) => ({ ciudad }));
}

export function generateMetadata({
  params,
}: {
  params: { ciudad: string };
}): Metadata {
  const city = CITIES[params.ciudad];
  if (!city) {
    return { title: "Ciudad no encontrada" };
  }

  return {
    title: `Software de Gestión Académica para Colegios en ${city.name}`,
    description: `Recedu es la plataforma de gestión académica para colegios en ${city.name}, ${city.deptName}. Notas, recuperaciones, horarios y comunicación docente-estudiante en un solo sistema digital.`,
    alternates: { canonical: `/colegios/${city.slug}` },
    openGraph: {
      title: `Gestión Académica para Colegios en ${city.name} | Recedu`,
      description: `Digitaliza la gestión escolar de tu colegio en ${city.name}. Notas, recuperaciones, materiales y reportes en una sola plataforma.`,
      url: `/colegios/${city.slug}`,
    },
  };
}

/* ── Módulos ─────────────────────────────────────────────────────────── */

const modules = [
  {
    icon: "📊",
    title: "Gestión de notas",
    desc: "Registro de calificaciones por periodo con promedios automáticos y seguimiento de rendimiento.",
    href: "/funcionalidades/gestion-notas",
  },
  {
    icon: "🔄",
    title: "Recuperaciones",
    desc: "Asignación automática, seguimiento y reportes de los planes de refuerzo académico.",
    href: "/funcionalidades/recuperaciones-academicas",
  },
  {
    icon: "📈",
    title: "Reportes docentes",
    desc: "Análisis de rendimiento por grupo, alertas de bajo rendimiento y exportación de datos.",
    href: "/funcionalidades/reportes-docentes",
  },
  {
    icon: "📅",
    title: "Horarios",
    desc: "Consulta de horarios académicos por grupo, materia y docente actualizados en tiempo real.",
  },
  {
    icon: "📚",
    title: "Materiales",
    desc: "Publicación y acceso centralizado a recursos educativos: PDF, guías y presentaciones.",
  },
  {
    icon: "💬",
    title: "Feedback",
    desc: "Canal de comunicación directa entre docentes y estudiantes para retroalimentación personalizada.",
  },
];

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function ColegiosCiudadPage({
  params,
}: {
  params: { ciudad: string };
}) {
  const city = CITIES[params.ciudad];

  if (!city) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1
            className="text-3xl font-extrabold mb-4"
            style={{ color: "var(--rec-title)" }}
          >
            Ciudad no encontrada
          </h1>
          <p className="text-rec-text-muted mb-8">
            No tenemos información para esta ciudad todavía.
          </p>
          <Link
            href="/"
            className="rounded-full px-6 py-3 text-sm font-bold text-rec-text-on-media"
            style={{ background: "var(--rec-primary)" }}
          >
            Volver al inicio
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const otherCities = CITY_SLUGS.filter((s) => s !== city.slug);

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
            {city.name}, {city.deptName}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
            Software de Gestión Académica para Colegios en {city.name}
          </h1>
          <p className="text-rec-text-on-media/85 text-lg max-w-xl mx-auto">
            {city.heroSub}
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
              href="/Informacion"
              className="rounded-full px-7 py-3 text-sm font-bold border border-rec-text-on-media/50 text-rec-text-on-media transition hover:bg-rec-bg-elevated/10"
            >
              Conocer la plataforma
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Stats */}
        <section className="py-12" style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {city.stats.map((s) => (
                <div key={s.label} className="rec-glass rounded-2xl py-7 px-4">
                  <p
                    className="text-3xl font-extrabold mb-1"
                    style={{ color: "var(--rec-primary)" }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--rec-title)" }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contexto local */}
        <section className="mx-auto max-w-4xl px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span
                className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider"
                style={{
                  background: "var(--rec-soft)",
                  color: "var(--rec-primary-strong)",
                }}
              >
                Contexto local
              </span>
              <h2
                className="text-3xl font-extrabold mb-4"
                style={{ color: "var(--rec-title)" }}
              >
                La realidad educativa en {city.name}
              </h2>
              <p className="text-rec-text-muted leading-relaxed mb-6">
                {city.contextParagraph}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/Contacto"
                  className="rounded-full px-6 py-2.5 text-sm font-bold text-rec-text-on-media transition hover:opacity-90"
                  style={{ background: "var(--rec-primary)" }}
                >
                  Solicitar información
                </Link>
                <Link
                  href="/vs/q10"
                  className="rounded-full px-6 py-2.5 text-sm font-semibold transition"
                  style={{
                    border: "1.5px solid var(--rec-primary)",
                    color: "var(--rec-primary)",
                  }}
                >
                  Comparar con Q10
                </Link>
              </div>
            </div>
            <div
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{ border: "1px solid var(--rec-soft)" }}
            >
              <div className="p-8" style={{ background: "var(--rec-soft)" }}>
                <h3
                  className="font-bold mb-5 text-sm uppercase tracking-wider"
                  style={{ color: "var(--rec-primary-strong)" }}
                >
                  ¿Por qué Recedu en {city.name}?
                </h3>
                <ul className="space-y-3">
                  {[
                    "Adaptado a la normativa colombiana (Decreto 1290)",
                    "Soporte y atención en español",
                    "Plataforma 100% web, sin instalación",
                    "Diseño responsivo para zonas con conectividad limitada",
                    "Roles diferenciados para cada tipo de usuario",
                    "Gratuita para instituciones educativas",
                  ].map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-rec-text-on-media text-xs shrink-0"
                        style={{ background: "var(--rec-primary)" }}
                      >
                        ✓
                      </span>
                      <span className="text-rec-text-secondary">{feat}</span>
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
              <span
                className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-rec-bg-elevated"
                style={{ color: "var(--rec-primary-strong)" }}
              >
                Funcionalidades
              </span>
              <h2
                className="text-3xl font-extrabold"
                style={{ color: "var(--rec-title)" }}
              >
                Todo lo que tu colegio necesita en {city.name}
              </h2>
              <div
                className="h-1 w-14 mx-auto mt-3 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))",
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((mod) => {
                const cardContent = (
                  <>
                    <div className="text-4xl mb-4">{mod.icon}</div>
                    <h3
                      className="font-bold mb-2"
                      style={{ color: "var(--rec-title)" }}
                    >
                      {mod.title}
                    </h3>
                    <p className="text-sm text-rec-text-muted leading-relaxed">
                      {mod.desc}
                    </p>
                    {mod.href && (
                      <p
                        className="mt-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--rec-primary)" }}
                      >
                        Más información →
                      </p>
                    )}
                  </>
                );

                if (mod.href) {
                  return (
                    <Link
                      key={mod.title}
                      href={mod.href}
                      className="rec-glass rounded-2xl p-7 hover:shadow-md transition"
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={mod.title}
                    className="rec-glass rounded-2xl p-7 hover:shadow-md transition"
                  >
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Otras ciudades */}
        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2
            className="text-2xl font-extrabold mb-6"
            style={{ color: "var(--rec-title)" }}
          >
            También disponible en otras ciudades
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {otherCities.map((slug) => (
              <Link
                key={slug}
                href={`/colegios/${slug}`}
                className="rec-glass rounded-2xl px-6 py-4 hover:shadow-md transition"
              >
                <p
                  className="font-bold"
                  style={{ color: "var(--rec-primary)" }}
                >
                  {CITIES[slug].name}
                </p>
                <p className="text-xs text-rec-text-muted">
                  {CITIES[slug].deptName}
                </p>
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
              ¿Tu colegio en {city.name} necesita una mejor herramienta?
            </h2>
            <p className="text-rec-text-on-media/80 mb-8">
              Agenda una demostración gratuita y descubre lo que Recedu puede
              hacer por tu institución educativa.
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
                href="/tutorial"
                className="rounded-full px-7 py-3 text-sm font-bold border border-rec-text-on-media/50 text-rec-text-on-media transition hover:bg-rec-bg-elevated/10"
              >
                Ver tutorial
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
