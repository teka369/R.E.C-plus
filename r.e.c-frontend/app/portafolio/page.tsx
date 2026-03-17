/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layouts/Footer";
import Navbar from "@/components/layouts/Navbar";

export const metadata = {
  title: "Portafolio | R.E.C",
  description: "Equipo de desarrollo y proyectos del ecosistema R.E.C",
};

const teamMembers = [
  {
    name: "Juan David Guarin Romero",
    role: "Desarrollador Full Stack",
    bio: "Apasionado por crear soluciones escalables con las mejores tecnologías web.",
    image: "/Guarin.png",
    github: "https://github.com/teka369",
    technologies: [
      "React",
      "Next.js",
      "MySQL",
      "PostgreSQL",
      "Tailwind",
      "CSS",
      "HTML",
      "JavaScript",
      "TypeScript",
      "Node.js",
      "Express",
      "Bootstrap",
    ],
  },
  {
    name: "Valeria Zapata Vargas",
    role: "Desarrolladora Full Stack",
    bio: "Desarrolladora profesional con gran capacidad de liderazgo y experiencia en proyectos web.",
    image: "/Valeria.png",
    github: "https://github.com/AfterNixe",
    technologies: ["HTML", "CSS", "JavaScript", "Bootstrap", "React", "MySQL"],
  },
  {
    name: "David Blandon Caro",
    role: "Desarrollador Full Stack",
    bio: "Eficiente en su trabajo con amplio conocimiento en tecnologías front-end y back-end.",
    image: "/david.png",
    github: "https://github.com/",
    technologies: ["HTML", "CSS", "JavaScript", "Bootstrap", "React", "MySQL"],
  },
];

const projects = [
  {
    title: "Prácticas del SENA 2024",
    description: "Plataforma para gestionar prácticas estudiantiles del SENA",
    image:
      "https://media.istockphoto.com/id/1089037012/es/vector/%C3%A1rbol-de-la-ciencia-y-el-libro-abierto-dise%C3%B1o-de-plantillas-de-educaci%C3%B3n-moderna.jpg?s=612x612&w=0&k=20&c=X0rv_deZID2aVrXu_CqOIxxJV_Rk7q99gUisj53T5c0=",
    technologies: ["HTML", "CSS", "JS"],
    repoUrl: "https://github.com/teka369/Practicas-SENA",
  },
];

export default function PortafolioPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section
        className="relative flex items-center justify-center text-center text-white h-[72vh] overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--rec-primary-strong) 90%, transparent) 0%, color-mix(in srgb, var(--rec-ink) 80%, transparent) 100%)" }} />
        <div className="relative z-10 max-w-3xl px-6">
          <span className="inline-block mb-4 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>Portafolio del Equipo</span>
          <h1 className="text-5xl sm:text-4xl font-extrabold mb-5 leading-tight drop-shadow-lg">Equipo de Desarrollo</h1>
          <p className="text-lg opacity-85 max-w-xl mx-auto">Transformando ideas en soluciones digitales innovadoras para la educación colombiana</p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <a href="#equipo" className="rounded-full px-6 py-3 text-sm font-semibold text-white transition" style={{ background: "var(--rec-cta)" }}>Ver equipo</a>
            <a href="#stack" className="rounded-full px-6 py-3 text-sm font-semibold transition" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)", color: "white" }}>Stack tecnológico</a>
          </div>
        </div>
      </section>

      {/* Nuestro Equipo */}
      <section id="equipo" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-14">
          <span className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>Quiénes somos</span>
          <h2 className="text-4xl font-extrabold mb-3" style={{ color: "var(--rec-title)" }}>Nuestro Equipo</h2>
          <div className="h-1 w-16 mx-auto rounded-full" style={{ background: "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))" }} />
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Profesionales apasionados por la tecnología y la educación, construyendo la plataforma que merece tu institución</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border transition hover:shadow-xl"
              style={{ borderColor: "var(--rec-soft)" }}
            >
              {/* Barra superior decorativa */}
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))" }} />
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-[340px] w-[220px] rounded-2xl overflow-hidden shadow-lg mb-6 ring-4 ring-[color:var(--rec-soft)]">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={440}
                      height={680}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: "var(--rec-title)" }}>{member.name}</h3>
                  <p className="text-sm font-medium mb-3" style={{ color: "var(--rec-primary)" }}>{member.role}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{member.bio}</p>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {member.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                      style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex justify-center">
                  <Link
                    href={member.github}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: "var(--rec-primary)" }}
                  >
                    Ver en GitHub ↗
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Proyectos */}
      <section className="py-20" style={{ background: "var(--rec-soft)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <span className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-white" style={{ color: "var(--rec-primary-strong)" }}>Proyectos</span>
            <h2 className="text-4xl font-extrabold mb-3" style={{ color: "var(--rec-title)" }}>Prácticas y Proyectos</h2>
            <div className="h-1 w-16 mx-auto rounded-full" style={{ background: "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))" }} />
            <p className="mt-4 text-slate-600">Trabajos realizados durante el proceso formativo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <article
                key={project.title}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border transition hover:shadow-xl"
                style={{ borderColor: "var(--rec-soft)" }}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--rec-primary-strong) 82%, transparent)" }}>
                    <Link
                      href={project.repoUrl}
                      target="_blank"
                      className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold shadow-lg transition hover:opacity-90"
                      style={{ color: "var(--rec-primary-strong)" }}
                    >
                      Ver repositorio ↗
                    </Link>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--rec-title)" }}>{project.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                        style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stack Tecnológico */}
      <section id="stack" className="relative py-24 overflow-hidden rec-grid-bg">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <span className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>Tecnología</span>
            <h2 className="text-4xl font-extrabold mb-3" style={{ color: "var(--rec-title)" }}>Nuestro Stack Tecnológico</h2>
            <div className="h-1 w-16 mx-auto rounded-full" style={{ background: "linear-gradient(90deg, var(--rec-primary), var(--rec-leaf))" }} />
            <p className="mt-4 text-slate-600">La arquitectura tecnológica que impulsa nuestra plataforma educativa</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              { title: "Frontend", icon: "🖥️", techs: ["Next.js", "React", "TypeScript", "Tailwind CSS", "HTML5", "CSS3"] },
              { title: "Backend", icon: "⚙️", techs: ["NestJS", "Node.js", "Prisma ORM", "JWT", "REST API"] },
              { title: "Base de Datos", icon: "🗄️", techs: ["PostgreSQL", "MySQL", "Migrations", "Seeds"] },
            ].map((layer) => (
              <div
                key={layer.title}
                className="rec-glass rounded-2xl p-7 text-center shadow-sm hover:shadow-md transition"
              >
                <div className="text-4xl mb-4">{layer.icon}</div>
                <h3 className="text-lg font-bold mb-4" style={{ color: "var(--rec-title)" }}>{layer.title}</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {layer.techs.map((t) => (
                    <span key={t} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
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
      <section className="py-20 text-white text-center" style={{ background: "linear-gradient(135deg, var(--rec-primary-strong) 0%, var(--rec-primary) 100%)" }}>
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-extrabold mb-4">¿Listo para conocer más?</h2>
          <p className="text-white/85 mb-8 text-lg">Explora los certificados del equipo o vuelve a la plataforma educativa</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/certificados" className="rounded-full px-7 py-3 text-sm font-bold bg-white transition hover:opacity-90" style={{ color: "var(--rec-primary-strong)" }}>
              Ver certificados
            </Link>
            <Link href="/" className="rounded-full px-7 py-3 text-sm font-bold border border-white/50 text-white transition hover:bg-white/10">
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

