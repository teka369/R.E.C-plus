import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layouts/Footer";
import Navbar from "@/components/layouts/Navbar";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Portafolio — Equipo de Desarrollo",
  description:
    "Conoce al equipo detrás de Recedu. Desarrollo de software educativo con tecnologías modernas para colegios e instituciones educativas en Colombia.",
  alternates: { canonical: "/portafolio" },
  openGraph: {
    title: "Portafolio del Equipo de Desarrollo | Recedu",
    description:
      "El equipo de desarrollo detrás de Recedu, la plataforma de gestión académica para colegios colombianos.",
    url: "/portafolio",
  },
};



const teamValues = [
  {
    icon: "🚀",
    title: "Innovación",
    description:
      "Adoptamos tecnologías modernas para construir soluciones que marquen la diferencia en la educación colombiana.",
  },
  {
    icon: "🤝",
    title: "Colaboración",
    description:
      "Trabajamos en equipo compartiendo conocimiento, aprendizajes y responsabilidades en cada etapa del proyecto.",
  },
  {
    icon: "📐",
    title: "Calidad",
    description:
      "Cada línea de código refleja nuestro compromiso con las buenas prácticas, el rendimiento y la experiencia de usuario.",
  },
  {
    icon: "🎓",
    title: "Aprendizaje continuo",
    description:
      "Somos aprendices del SENA en constante formación, llevando la teoría a la práctica en proyectos reales.",
  },
];

const stats = [
  { value: "Full Stack", label: "Perfil del equipo" },
  { value: "1+", label: "Proyectos entregados" },
  { value: "12+", label: "Tecnologías dominadas" },
  { value: "100%", label: "Comprometidos" },
];

const collaborators = [
  {
    name: "SENA Colombia",
    fullName: "Servicio Nacional de Aprendizaje",
    description:
      "Institución pública que impulsó nuestra formación técnica y tecnológica, brindando el marco educativo para el desarrollo de este proyecto.",
    role: "Institución formadora",
    logo: "🏛️",
    url: "https://www.sena.edu.co",
    badge: "Aliado Principal",
    badgeColor: "var(--rec-primary-strong)",
  },
];

const capabilities = [
  {
    icon: "🎨",
    title: "Diseño de Interfaces",
    description:
      "Creamos interfaces modernas, responsivas y accesibles centradas en la experiencia del usuario, usando las mejores prácticas de diseño web actual.",
    tags: ["UI/UX", "Responsive", "Accesibilidad"],
  },
  {
    icon: "⚙️",
    title: "Desarrollo Backend",
    description:
      "Construimos APIs robustas, seguras y escalables con arquitecturas limpias, autenticación JWT y conexión eficiente a bases de datos.",
    tags: ["REST API", "Autenticación", "Escalabilidad"],
  },
  {
    icon: "🗄️",
    title: "Gestión de Datos",
    description:
      "Diseñamos esquemas de bases de datos relacionales optimizados, con migraciones, seeds y consultas eficientes para aplicaciones en producción.",
    tags: ["PostgreSQL", "MySQL", "Migraciones"],
  },
  {
    icon: "🔗",
    title: "Integración Full Stack",
    description:
      "Conectamos frontend y backend de forma fluida, integrando sistemas completos desde el cliente hasta el servidor y la base de datos.",
    tags: ["Next.js", "NestJS", "Prisma ORM"],
  },
  {
    icon: "🛡️",
    title: "Buenas Prácticas",
    description:
      "Aplicamos principios SOLID, control de versiones con Git, revisión de código y documentación técnica en cada proyecto que desarrollamos.",
    tags: ["Git", "SOLID", "Documentación"],
  },
  {
    icon: "📱",
    title: "Aplicaciones Web",
    description:
      "Desarrollamos plataformas web completas orientadas al sector educativo, con foco en la usabilidad, el rendimiento y la mantenibilidad.",
    tags: ["SPA", "SSR", "Plataformas"],
  },
];

export default function PortafolioPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section
        className="relative flex items-center justify-center text-center text-rec-text-on-media h-[72vh] overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--rec-primary-strong) 90%, transparent) 0%, color-mix(in srgb, var(--rec-ink) 80%, transparent) 100%)",
          }}
        />
        <div className="relative z-10 max-w-3xl px-6">
          <span
            className="inline-block mb-4 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase"
            style={{
              background: "color-mix(in srgb, var(--rec-text-on-media) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--rec-text-on-media) 30%, transparent)",
            }}
          >
            Portafolio del Equipo
          </span>
          <h1 className="text-5xl sm:text-4xl font-extrabold mb-5 leading-tight drop-shadow-lg">
            Equipo de Desarrollo
          </h1>
          <p className="text-lg opacity-85 max-w-xl mx-auto">
            Transformando ideas en soluciones digitales innovadoras para la
            educación colombiana
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <a
              href="#nosotros"
              className="rounded-full px-6 py-3 text-sm font-semibold text-rec-text-on-media transition"
              style={{ background: "var(--rec-cta)" }}
            >
              Conócenos
            </a>
            <a
              href="#stack"
              className="rounded-full px-6 py-3 text-sm font-semibold transition"
              style={{
                background: "color-mix(in srgb, var(--rec-text-on-media) 15%, transparent)",
                border: "1px solid color-mix(in srgb, var(--rec-text-on-media) 35%, transparent)",
                color: "white",
              }}
            >
              Stack tecnológico
            </a>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section
        className="py-12 border-b"
        style={{ borderColor: "var(--rec-soft)" }}
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="py-4">
                <p
                  className="text-4xl font-extrabold mb-1"
                  style={{ color: "var(--rec-primary-strong)" }}
                >
                  {stat.value}
                </p>
                <p className="text-sm text-rec-text-subtle font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre Nosotros */}
      <section id="nosotros" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-14">
          <span
            className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{
              background: "var(--rec-soft)",
              color: "var(--rec-primary-strong)",
            }}
          >
            Quiénes somos
          </span>
          <h2
            className="text-4xl font-extrabold mb-3"
            style={{ color: "var(--rec-title)" }}
          >
            Sobre Nosotros
          </h2>
          <div
            className="h-1 w-16 mx-auto rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))",
            }}
          />
          <p className="mt-4 text-rec-text-muted max-w-2xl mx-auto">
            Somos un equipo de tres desarrolladores Full Stack en formación en
            el SENA, unidos por la pasión por la tecnología y el deseo de
            construir herramientas digitales que transformen la educación en
            Colombia.
          </p>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {teamValues.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl p-6 text-center border transition hover:shadow-lg"
              style={{
                borderColor: "var(--rec-soft)",
                background: "white",
              }}
            >
              <div className="text-3xl mb-4">{value.icon}</div>
              <h3
                className="text-base font-bold mb-2"
                style={{ color: "var(--rec-title)" }}
              >
                {value.title}
              </h3>
              <p className="text-sm text-rec-text-subtle leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>


      </section>

      {/* Capacidades */}
      <section className="py-20" style={{ background: "var(--rec-soft)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <span
              className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-rec-bg-elevated"
              style={{ color: "var(--rec-primary-strong)" }}
            >
              Capacidades
            </span>
            <h2
              className="text-4xl font-extrabold mb-3"
              style={{ color: "var(--rec-title)" }}
            >
              ¿Qué sabemos hacer?
            </h2>
            <div
              className="h-1 w-16 mx-auto rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))",
              }}
            />
            <p className="mt-4 text-rec-text-muted max-w-xl mx-auto">
              Habilidades técnicas y profesionales que el equipo ha desarrollado
              a lo largo de su formación
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="group rounded-2xl bg-rec-bg-elevated border p-6 transition hover:shadow-lg"
                style={{ borderColor: "var(--rec-soft)" }}
              >
                <div
                  className="h-1 w-10 rounded-full mb-5 transition-all group-hover:w-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))",
                  }}
                />
                <div className="text-3xl mb-3">{cap.icon}</div>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: "var(--rec-title)" }}
                >
                  {cap.title}
                </h3>
                <p className="text-sm text-rec-text-subtle leading-relaxed mb-4">
                  {cap.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cap.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: "var(--rec-soft)",
                        color: "var(--rec-primary-strong)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Colaboradores */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-14">
          <span
            className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{
              background: "var(--rec-soft)",
              color: "var(--rec-primary-strong)",
            }}
          >
            Alianzas
          </span>
          <h2
            className="text-4xl font-extrabold mb-3"
            style={{ color: "var(--rec-title)" }}
          >
            Colaboradores
          </h2>
          <div
            className="h-1 w-16 mx-auto rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))",
            }}
          />
          <p className="mt-4 text-rec-text-muted max-w-xl mx-auto">
            Instituciones y organizaciones que hacen posible nuestra formación y
            el desarrollo de estos proyectos
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {collaborators.map((collab) => (
            <Link
              key={collab.name}
              href={collab.url}
              target="_blank"
              className="group relative flex flex-col items-center text-center rounded-2xl border p-8 bg-rec-bg-elevated transition hover:shadow-xl w-full max-w-sm"
              style={{ borderColor: "var(--rec-soft)" }}
            >
              {/* Badge */}
              <span
                className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-bold text-rec-text-on-media"
                style={{ background: collab.badgeColor }}
              >
                {collab.badge}
              </span>

              {/* Barra decorativa superior */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{
                  background:
                    "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))",
                }}
              />

              {/* Logo / icono */}
              <div
                className="flex items-center justify-center h-20 w-20 rounded-2xl text-4xl mb-5 shadow-sm"
                style={{ background: "var(--rec-soft)" }}
              >
                {collab.logo}
              </div>

              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--rec-primary)" }}
              >
                {collab.role}
              </p>
              <h3
                className="text-xl font-extrabold mb-1"
                style={{ color: "var(--rec-title)" }}
              >
                {collab.name}
              </h3>
              <p className="text-sm text-rec-text-subtle mb-1">{collab.fullName}</p>
              <p className="text-sm text-rec-text-muted leading-relaxed mt-3">
                {collab.description}
              </p>

              <span
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all"
                style={{ color: "var(--rec-primary)" }}
              >
                Visitar sitio oficial ↗
              </span>
            </Link>
          ))}

          {/* Placeholder para futuros colaboradores */}
          <div
            className="flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed p-8 w-full max-w-sm"
            style={{ borderColor: "var(--rec-soft)" }}
          >
            <div
              className="flex items-center justify-center h-20 w-20 rounded-2xl text-3xl mb-5"
              style={{ background: "var(--rec-soft)" }}
            >
              ➕
            </div>
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: "var(--rec-title)" }}
            >
              ¿Tu organización aquí?
            </h3>
            <p className="text-sm text-rec-text-subtle">
              Estamos abiertos a nuevas alianzas y colaboraciones con
              instituciones educativas y empresas del sector tecnológico.
            </p>
          </div>
        </div>
      </section>

      {/* Stack Tecnológico */}
      <section
        id="stack"
        className="relative py-24 overflow-hidden rec-grid-bg"
        style={{ background: "var(--rec-soft)" }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <span
              className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-rec-bg-elevated"
              style={{ color: "var(--rec-primary-strong)" }}
            >
              Tecnología
            </span>
            <h2
              className="text-4xl font-extrabold mb-3"
              style={{ color: "var(--rec-title)" }}
            >
              Nuestro Stack Tecnológico
            </h2>
            <div
              className="h-1 w-16 mx-auto rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))",
              }}
            />
            <p className="mt-4 text-rec-text-muted">
              La arquitectura tecnológica que impulsa nuestra plataforma
              educativa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              {
                title: "Frontend",
                icon: "🖥️",
                techs: [
                  "Next.js",
                  "React",
                  "TypeScript",
                  "Tailwind CSS",
                  "HTML5",
                  "CSS3",
                ],
              },
              {
                title: "Backend",
                icon: "⚙️",
                techs: ["NestJS", "Node.js", "Prisma ORM", "JWT", "REST API"],
              },
              {
                title: "Base de Datos",
                icon: "🗄️",
                techs: ["PostgreSQL", "MySQL", "Migrations", "Seeds"],
              },
            ].map((layer) => (
              <div
                key={layer.title}
                className="rec-glass rounded-2xl p-7 text-center bg-rec-bg-elevated shadow-sm hover:shadow-md transition"
              >
                <div className="text-4xl mb-4">{layer.icon}</div>
                <h3
                  className="text-lg font-bold mb-4"
                  style={{ color: "var(--rec-title)" }}
                >
                  {layer.title}
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {layer.techs.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: "var(--rec-soft)",
                        color: "var(--rec-primary-strong)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section
        className="py-20 text-rec-text-on-media text-center"
        style={{
          background:
            "linear-gradient(135deg, var(--rec-primary-strong) 0%, var(--rec-primary) 100%)",
        }}
      >
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-extrabold mb-4">
            ¿Listo para conocer más?
          </h2>
          <p className="text-rec-text-on-media/85 mb-8 text-lg">
            Si quieres implementar R.E.C en tu institución o tienes dudas técnicas, escríbenos o vuelve al inicio.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/Contacto"
              className="rounded-full px-7 py-3 text-sm font-bold bg-rec-bg-elevated transition hover:opacity-90"
              style={{ color: "var(--rec-primary-strong)" }}
            >
              Contacto
            </Link>
            <Link
              href="/"
              className="rounded-full px-7 py-3 text-sm font-bold border border-rec-text-on-media/50 text-rec-text-on-media transition hover:bg-rec-bg-elevated/10"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}