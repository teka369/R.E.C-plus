import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata = {
  title: "Tutorial | R.E.C",
  description: "Guía de uso de la plataforma R.E.C según tu rol",
};

const roles = [
  {
    icon: "👩‍🏫",
    title: "Docente",
    color: "var(--rec-primary)",
    colorSoft: "var(--rec-soft)",
    steps: [
      { step: "1", title: "Inicia sesión", desc: "Ingresa con tu correo institucional y la contraseña asignada por secretaría." },
      { step: "2", title: "Panel principal", desc: "Accede a tu resumen de grupos, materias y actividad reciente desde el dashboard." },
      { step: "3", title: "Gestiona temarios", desc: "Crea y actualiza el contenido de cada unidad temática por grupo y materia." },
      { step: "4", title: "Sube materiales", desc: "Adjunta archivos PDF, documentos y recursos de estudio para tus estudiantes." },
      { step: "5", title: "Registra recuperaciones", desc: "Programa y registra actividades de refuerzo y recuperación académica." },
      { step: "6", title: "Envía feedback", desc: "Comunica observaciones y comentarios directamente a cada estudiante." },
    ],
  },
  {
    icon: "🎓",
    title: "Estudiante",
    color: "var(--rec-accent)",
    colorSoft: "#fdecea",
    steps: [
      { step: "1", title: "Inicia sesión", desc: "Usa tus credenciales proporcionadas por tu institución educativa." },
      { step: "2", title: "Consulta tu horario", desc: "Visualiza todas tus asignaturas, docentes y horarios de clase desde el panel." },
      { step: "3", title: "Revisa materiales", desc: "Descarga los recursos de estudio que tus docentes han publicado para tu grupo." },
      { step: "4", title: "Ve tus temarios", desc: "Consulta el contenido planificado por cada docente para estar al día en el programa." },
      { step: "5", title: "Recuperaciones", desc: "Consulta las actividades de recuperación pendientes o históricas de cada materia." },
      { step: "6", title: "Tu perfil", desc: "Actualiza tu información de contacto y gestiona tu contraseña de acceso." },
    ],
  },
  {
    icon: "🗂️",
    title: "Secretaría",
    color: "var(--rec-earth)",
    colorSoft: "#f5ede9",
    steps: [
      { step: "1", title: "Inicia sesión", desc: "Accede al sistema con las credenciales administrativas de secretaría." },
      { step: "2", title: "Gestión de usuarios", desc: "Crea, edita y desactiva cuentas de docentes, estudiantes y administradores." },
      { step: "3", title: "Grupos y grados", desc: "Administra la estructura académica: grados, grupos y sus asignaciones." },
      { step: "4", title: "Asignaciones docentes", desc: "Vincula docentes a materias y grupos según el plan de estudios." },
      { step: "5", title: "Matrículas", desc: "Gestiona la inscripción de estudiantes a sus grupos correspondientes." },
      { step: "6", title: "Reportes", desc: "Genera y exporta reportes de rendimiento, asistencia y actividad de la plataforma." },
    ],
  },
];

const faqs = [
  { q: "¿Cómo recupero mi contraseña?", a: "Comunícate con secretaría de tu institución. Ellos pueden asignarte una nueva contraseña desde el panel administrativo." },
  { q: "¿Puedo acceder desde el celular?", a: "Sí, la plataforma está diseñada con diseño responsivo y funciona correctamente en dispositivos móviles y tablets." },
  { q: "¿Qué formatos de archivo se admiten?", a: "Para materiales de estudio se aceptan PDF, imágenes PNG/JPG y documentos de Office (DOCX, XLSX, PPTX)." },
  { q: "¿Los datos son privados?", a: "Sí, todo el contenido de la plataforma es de acceso exclusivo para los usuarios de tu institución. No hay información pública." },
  { q: "¿Cómo contacto al soporte técnico?", a: "A través del módulo de Contacto o directamente con el equipo de desarrollo vía la página de Portafolio." },
];

export default function TutorialPage() {
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
            Guía de uso
          </span>
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">Tutorial de la plataforma</h1>
          <p className="text-white/85 text-lg max-w-xl mx-auto">
            Aprende a sacar el máximo provecho de R.E.C según tu rol: docente, estudiante o secretaría.
          </p>
        </div>
      </section>

      {/* Guía por rol */}
      <section className="mx-auto max-w-6xl px-6 py-20 space-y-20">
        {roles.map((role) => (
          <div key={role.title}>
            {/* Cabecera del rol */}
            <div className="flex items-center gap-4 mb-10">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl flex-shrink-0 shadow-sm"
                style={{ background: role.colorSoft }}
              >
                {role.icon}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold" style={{ color: "var(--rec-title)" }}>
                  Guía para {role.title}
                </h2>
                <p className="text-sm text-slate-500">Pasos para comenzar a usar la plataforma</p>
              </div>
              <div className="ml-auto hidden sm:block h-px flex-1" style={{ background: role.colorSoft, maxWidth: "200px" }} />
            </div>

            {/* Grid de pasos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {role.steps.map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl bg-white p-6 shadow-sm border transition hover:shadow-md"
                  style={{ borderColor: "var(--rec-soft)" }}
                >
                  <div
                    className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                    style={{ background: role.color }}
                  >
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-2 text-sm" style={{ color: "var(--rec-title)" }}>{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ background: "var(--rec-soft)" }}>
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <span className="inline-block mb-3 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider bg-white" style={{ color: "var(--rec-primary-strong)" }}>
              Preguntas frecuentes
            </span>
            <h2 className="text-3xl font-extrabold" style={{ color: "var(--rec-title)" }}>FAQ</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rec-glass rounded-2xl p-6"
              >
                <p className="font-semibold mb-2 text-sm" style={{ color: "var(--rec-title)" }}>— {faq.q}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
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
          <h2 className="text-2xl font-extrabold mb-3">¿Listo para comenzar?</h2>
          <p className="text-white/80 mb-8">Inicia sesión y accede a todas las funcionalidades de R.E.C</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login"
              className="rounded-full px-7 py-3 text-sm font-bold bg-white transition hover:opacity-90"
              style={{ color: "var(--rec-primary-strong)" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/Contacto"
              className="rounded-full px-7 py-3 text-sm font-bold border border-white/50 text-white transition hover:bg-white/10"
            >
              Contactar soporte
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
