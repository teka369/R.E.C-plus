/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layouts/Footer";

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
      {/* Hero (imagen de fondo + overlay gradiente, título grande) */}
      <section
        className="relative flex items-center justify-center text-center text-white mb-16 h-[80vh] rounded-b-[30px] shadow-2xl overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/80 to-slate-800/90" />
        <div className="relative z-10 max-w-3xl px-5">
          <h1 className="text-[4rem] font-extrabold mb-6 drop-shadow-lg md:text-[3.5rem] sm:text-[2.5rem]">Equipo de Desarrollo</h1>
          <p className="text-[1.5rem] opacity-90 md:text-[1.3rem] sm:text-[1.2rem]">Transformando ideas en soluciones digitales innovadoras</p>
        </div>
      </section>

      {/* Nuestro Equipo */}
      {/* Equipo (retrato 250x400 con zoom y badges acento) */}
      <section className="mx-auto max-w-6xl px-6 py-20 relative">
        <div className="text-center mb-12">
          <h2 className="text-[2.5rem] font-bold text-slate-900">Nuestro Equipo</h2>
          <div className="h-1 w-[70px] mx-auto bg-gradient-to-r from-indigo-600 to-indigo-300 rounded" />
          <p className="mt-4 text-slate-600 max-w-[700px] mx-auto">Profesionales apasionados por la tecnología y la innovación</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="group h-[400px] w-[250px] rounded-[10px] overflow-hidden shadow-xl mb-6">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={500}
                      height={800}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.15]"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{member.name}</h3>
                  <p className="text-slate-500 text-lg mb-3">{member.role}</p>
                  <p className="text-slate-700">{member.bio}</p>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {member.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center rounded-full bg-indigo-600 text-white px-3 py-2 text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex justify-center">
                  <Link
                    href={member.github}
                    target="_blank"
                    className="inline-flex items-center gap-3 rounded-full border border-indigo-600 text-indigo-700 px-4 py-2 text-sm font-bold shadow-sm hover:bg-indigo-50"
                  >
                    <span className="inline-block">GitHub</span>
                    <span aria-hidden>↗</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Proyectos */}
      <section className="mx-auto max-w-6xl px-6 py-20 bg-slate-50">
        <div className="text-center mb-12">
          <h2 className="text-[2.5rem] font-bold text-slate-900">Practicas</h2>
          <div className="h-1 w-[70px] mx-auto bg-gradient-to-r from-indigo-600 to-indigo-300 rounded" />
          <p className="mt-4 text-slate-600">Practicas creativas a mano</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <article
              key={project.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="relative h-[400px] overflow-hidden">
                {/* Para imagen externa usamos <img> para evitar config de dominios */}
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.15]"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/80 to-indigo-700/90 opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Link
                    href={project.repoUrl}
                    target="_blank"
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100"
                  >
                    Repositorio ↗
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                <p className="mt-1 text-slate-600">{project.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 px-3 py-1 text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Stack Tecnológico */}
      {/* Tecnología (patrón de fondo + tarjetas absolutas + conectores) */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 to-indigo-100" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#a5b4fc_1px,transparent_1px),radial-gradient(#a5b4fc_1px,transparent_1px)] bg-[length:40px_40px] bg-[position:0_0,20px_20px]" />

        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-[2.5rem] font-bold text-slate-900">Nuestro Stack Tecnológico</h2>
            <div className="h-1 w-[70px] mx-auto bg-gradient-to-r from-indigo-600 to-indigo-300 rounded" />
            <p className="mt-4 text-slate-700">Visualiza la arquitectura tecnológica que impulsa nuestra plataforma</p>
          </div>

          <div className="relative mx-auto max-w-[1000px] h-[600px]">
            {/* Frontend */}
            <div className="absolute top-[50px] left-[50px] w-[280px] min-h-[200px] rounded-2xl border border-black/10 bg-white p-6 shadow-2xl text-center transition hover:scale-[1.08]">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Frontend</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {["React", "CSS", "HTML5", "TypeScript", "Bootstrap"].map((t) => (
                  <span key={t} className="rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 px-3 py-1 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Backend */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] min-h-[200px] rounded-2xl border border-black/10 bg-white p-6 shadow-2xl text-center transition hover:scale-[1.08]">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Backend</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {["Node.js", "Express"].map((t) => (
                  <span key={t} className="rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 px-3 py-1 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Database */}
            <div className="absolute bottom-[50px] right-[50px] w-[280px] min-h-[200px] rounded-2xl border border-black/10 bg-white p-6 shadow-2xl text-center transition hover:scale-[1.08]">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Base de Datos</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {["MySQL"].map((t) => (
                  <span key={t} className="rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 px-3 py-1 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Conectores */}
            <div className="absolute left-[320px] top-[150px] h-[4px] w-[160px] bg-gradient-to-r from-indigo-600 to-indigo-700" />
            <div className="absolute left-[calc(50%+140px)] top-1/2 -translate-y-1/2 h-[4px] w-[160px] bg-gradient-to-r from-indigo-600 to-indigo-700" />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

