import type { Metadata } from "next";
import BackgroundCarousel from "@/components/ui/BackgroundCarousel";
import Footer from "@/components/layouts/Footer";
import HeroActions from "@/components/ui/HeroActions";
import Navbar from "@/components/layouts/Navbar";
import Image from "next/image";
import Link from "next/link";
import { type SVGProps } from "react";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: {
    absolute:
      "Recedu — Plataforma de Gestión Académica para Colegios en Colombia",
  },
  description:
    "Recedu centraliza notas, recuperaciones académicas, horarios, materiales de estudio y comunicación docente-estudiante. Software de gestión escolar diseñado para colegios e instituciones educativas colombianas.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Recedu — Gestión Académica Integral para Colegios en Colombia",
    description:
      "Notas, recuperaciones, horarios y materiales en una sola plataforma. Diseñada para la educación colombiana.",
    url: "/",
  },
  twitter: {
    title: "Recedu — Gestión Académica para Colegios en Colombia",
    description:
      "Notas, recuperaciones, horarios y materiales en una sola plataforma educativa.",
  },
};

export default function Home() {
  return (
    <>
      <main className="min-h-screen text-[color:var(--rec-ink)]">
        <Navbar />

        <header className="relative overflow-hidden border-b border-[color:var(--rec-soft)]">
          <BackgroundCarousel />
          <div className="absolute inset-0 rec-hero-overlay" />

          <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
              <HeroActions />

              <div className="rec-glass relative overflow-hidden rounded-3xl p-5 shadow-2xl">
                <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[color:var(--rec-earth)]/22 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-[color:var(--rec-leaf)]/25 blur-3xl" />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3 sm:gap-4">
                    <Image
                      src="/logo.webp"
                      alt="Logo REC"
                      width={160}
                      height={160}
                      className="rec-logo-on-dark h-16 w-16 shrink-0 object-contain sm:h-[4.75rem] sm:w-[4.75rem]"
                      priority
                    />
                    <div className="min-w-0 self-center">
                      <p className="text-sm font-semibold leading-snug text-[color:var(--rec-title)]">Institucion conectada</p>
                      <p className="mt-0.5 text-xs leading-snug text-rec-text-muted">Control academico en tiempo real</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      "Seguimiento por periodos, materias y grupos.",
                      "Comunicacion docente-estudiante mas clara.",
                      "Gestion de recuperaciones y horarios con trazabilidad.",
                      "Vista institucional con enfoque en resultados.",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2 rounded-xl bg-rec-bg-elevated/80 p-3">
                        <IconCheck className="mt-0.5 h-4 w-4 text-[color:var(--rec-leaf)]" />
                        <p className="text-sm text-rec-text-secondary">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </header>

        <section className="rec-grid-bg border-y border-[color:var(--rec-soft)] bg-rec-bg-elevated/60">
          <div className="mx-auto grid max-w-6xl gap-3 px-6 py-5 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Dashboard por rol",
              "Reportes accionables",
              "Diseno mobile-first",
              "Escalable para multi-sede",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated px-3 py-2 text-sm font-medium text-[color:var(--rec-title)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-7 flex flex-col gap-2 text-center">
            <h2 className="text-3xl font-black text-[color:var(--rec-title)] md:text-4xl">Accesos rapidos</h2>
            <p className="text-rec-text-muted">Entradas clave para los flujos academicos diarios.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/login",
                title: "Temarios",
                text: "Planificacion por periodos y asignaturas.",
                icon: IconBook,
              },
              {
                href: "/login",
                title: "Materiales",
                text: "Recursos de estudio centralizados.",
                icon: IconFolder,
              },
              {
                href: "/login",
                title: "Horarios",
                text: "Organizacion semanal de clases.",
                icon: IconClock,
              },
              {
                href: "/login",
                title: "Feedback",
                text: "Retroalimentacion con seguimiento.",
                icon: IconChat,
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                prefetch={false}
                className="group rec-glass rounded-2xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--rec-primary)]/10 text-[color:var(--rec-primary)]">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[color:var(--rec-title)]">{card.title}</h3>
                <p className="mt-1 text-sm text-rec-text-muted">{card.text}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--rec-accent)]">
                  Ver modulo
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated p-6 shadow-sm lg:col-span-2">
              <h3 className="text-2xl font-black text-[color:var(--rec-title)]">Ruta de inscripcion y adopcion</h3>
              <p className="mt-2 text-sm text-rec-text-muted">
                Proceso recomendado para implementar la plataforma en una institucion educativa.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  { n: "01", t: "Diagnostico", d: "Levantamiento de estructura academica y roles." },
                  { n: "02", t: "Configuracion", d: "Carga de grupos, materias y usuarios institucionales." },
                  { n: "03", t: "Capacitacion", d: "Guias por rol para docentes, secretaria y estudiantes." },
                  { n: "04", t: "Operacion", d: "Seguimiento de indicadores y mejoras continuas." },
                ].map((step) => (
                  <div key={step.n} className="rounded-xl border border-[color:var(--rec-soft)] bg-[color:var(--rec-surface)] p-4">
                    <p className="text-xs font-semibold tracking-[0.14em] text-[color:var(--rec-title)]">{step.n}</p>
                    <h4 className="mt-1 font-bold text-[color:var(--rec-title)]">{step.t}</h4>
                    <p className="mt-1 text-sm text-rec-text-muted">{step.d}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[color:var(--rec-soft)] bg-[color:var(--rec-primary)] p-6 text-rec-text-on-media shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-rec-text-on-media/70">Panel institucional</p>
              <h3 className="mt-2 text-2xl font-black">Control con foco en resultados</h3>
              <p className="mt-3 text-sm text-rec-text-on-media/85">
                Administra estudiantes, docentes, recuperaciones y rendimiento desde un ecosistema unificado.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Promedio general por grupo",
                  "Asistencia y alertas tempranas",
                  "Flujo de recuperaciones",
                  "Comunicacion y feedback",
                ].map((item) => (
                  <div key={item} className="rounded-lg border border-rec-text-on-media/20 bg-rec-bg-elevated/10 px-3 py-2 text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="mb-7 text-center">
            <h2 className="text-3xl font-black text-[color:var(--rec-title)] md:text-4xl">Sobre R.E.C</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm text-rec-text-muted md:text-base">
              R.E.C es un ecosistema educativo para fortalecer el aprendizaje, simplificar la gestión
              institucional y conectar a toda la comunidad académica.
            </p>
            <div className="mx-auto mt-6 flex w-full max-w-[13rem] justify-center px-2 sm:mt-7 sm:max-w-[15rem] md:max-w-[16.5rem]">
              <Image
                src="/logo2.webp"
                alt="Marca R.E.C — Refuerzo Educativo Complementario"
                width={480}
                height={480}
                className="rec-logo-on-dark h-auto w-full object-contain"
                sizes="(max-width: 640px) 13rem, (max-width: 768px) 15rem, 16.5rem"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Que es R.E.C",
                text: "Una plataforma integral para materiales, temarios, horarios, feedback y seguimiento de rendimiento.",
                icon: IconSpark,
              },
              {
                title: "Mision",
                text: "Facilitar procesos académicos con herramientas accesibles, claras y enfocadas en resultados.",
                icon: IconTarget,
              },
              {
                title: "Vision",
                text: "Ser referente en innovación educativa digital para instituciones con enfoque inclusivo.",
                icon: IconEye,
              },
              {
                title: "Filosofia",
                text: "Aprendizaje continuo, colaboración efectiva y transparencia en cada proceso institucional.",
                icon: IconIdea,
              },
            ].map((block) => (
              <article key={block.title} className="rec-glass rounded-2xl p-5 shadow-sm hover:shadow-md">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--rec-soft)] text-[color:var(--rec-title)]">
                  <block.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[color:var(--rec-title)]">{block.title}</h3>
                <p className="mt-2 text-sm text-rec-text-muted">{block.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-[color:var(--rec-soft)] bg-[color:var(--rec-surface)] p-6 shadow-sm lg:col-span-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--rec-title)]">Problemas reales</p>
              <h3 className="mt-2 text-2xl font-black text-[color:var(--rec-title)]">Lo que resolvemos</h3>
              <div className="mt-5 space-y-3">
                {[
                  { icon: IconFolder, text: "Fragmentación de información: notas, horarios y materiales dispersos en distintas herramientas sin conexión entre sí." },
                  { icon: IconClock, text: "Pérdida de tiempo en procesos manuales: registro de asistencia, carga de notas y comunicación por canales informales." },
                  { icon: IconEye, text: "Falta de trazabilidad académica: sin historial claro de seguimiento por estudiante, grupo o periodo." },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3 rounded-lg border border-[color:var(--rec-soft)] bg-rec-bg-elevated px-4 py-3 text-sm text-rec-text-secondary">
                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--rec-title)]" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-[color:var(--rec-surface)] p-6 shadow-sm md:p-8">
            <div className="mb-7 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--rec-title)]">Proximamente</p>
              <h2 className="text-3xl font-black text-[color:var(--rec-title)] md:text-4xl">Sistema de juegos, rachas y recompensas</h2>
              <p className="max-w-3xl text-sm text-rec-text-muted md:text-base">
                Estamos preparando dinamicas de participacion para impulsar la constancia academica y reconocer el progreso de cada estudiante.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "Misiones y juegos",
                  text: "Retos semanales por materia con objetivos claros y progreso visible por nivel.",
                  icon: IconGame,
                },
                {
                  title: "Rachas activas",
                  text: "Seguimiento de dias consecutivos con actividad para fortalecer el habito de estudio.",
                  icon: IconStreak,
                },
                {
                  title: "Recompensas",
                  text: "Insignias, puntos y reconocimientos por metas cumplidas en clases y recuperaciones.",
                  icon: IconReward,
                },
              ].map((item) => (
                <article key={item.title} className="rec-glass rounded-2xl p-5">
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--rec-primary)]/10 text-[color:var(--rec-primary)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[color:var(--rec-title)]">{item.title}</h3>
                  <p className="mt-2 text-sm text-rec-text-muted">{item.text}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[color:var(--rec-soft)] bg-rec-bg-elevated p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--rec-title)]">Hoja de ruta inicial</p>
              <div className="mt-3 grid gap-2 text-sm text-rec-text-secondary sm:grid-cols-3">
                <p className="rounded-lg border border-[color:var(--rec-soft)] bg-[color:var(--rec-surface)] px-3 py-2">1. Perfil de logros por estudiante</p>
                <p className="rounded-lg border border-[color:var(--rec-soft)] bg-[color:var(--rec-surface)] px-3 py-2">2. Tabla de rachas por curso</p>
                <p className="rounded-lg border border-[color:var(--rec-soft)] bg-[color:var(--rec-surface)] px-3 py-2">3. Canje de recompensas educativas</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-gradient-to-r from-[color:var(--rec-primary-strong)] to-[color:var(--rec-primary)] p-8 text-rec-text-on-media md:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-3xl font-black md:text-4xl">Listo para subir el nivel de tu gestion academica</h2>
                <p className="mt-3 max-w-2xl text-sm text-rec-text-on-media/85 md:text-base">
                  Diseno claro, estructura escalable y experiencia enfocada en confianza institucional y rendimiento.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link
                  href="/login"
                  prefetch={false}
                  className="inline-flex items-center rounded-full bg-rec-bg-elevated px-6 py-3 text-sm font-semibold text-[color:var(--rec-primary)]"
                >
                  Empezar ahora
                </Link>
                <Link
                  href="/Contacto"
                  prefetch={false}
                  className="inline-flex items-center rounded-full bg-[color:var(--rec-cta)] px-6 py-3 text-sm font-semibold text-rec-text-on-media hover:brightness-95"
                >
                  Solicitar informacion
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function IconSpark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l1.5 3L17 7l-3 1.5L12 12l-1.5-3L7 7l3-1.5L12 3z" />
    </svg>
  );
}

function IconCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconBook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 4a8 8 0 0 0-8 8v5a2 2 0 0 0 2 2h6V4z" />
      <path d="M12 4a8 8 0 0 1 8 8v5a2 2 0 0 1-2 2h-6V4z" />
    </svg>
  );
}

function IconFolder(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}

function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconChat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function IconTarget(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}

function IconEye(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconIdea(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 3a7 7 0 0 1 7 7c0 2.4-1.2 4-2.6 5.5L15.5 17h-7l-.9-1.5C6.2 14 5 12.4 5 10a7 7 0 0 1 7-7z" />
    </svg>
  );
}

function IconGame(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="9" width="18" height="10" rx="3" />
      <path d="M8 13h4" />
      <path d="M10 11v4" />
      <circle cx="16.5" cy="13.5" r="1" />
      <circle cx="18.5" cy="15.5" r="1" />
    </svg>
  );
}

function IconStreak(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3c1 3-1 4.5-1 6.5 0 1.6 1 2.8 2.4 3.3-.4-1.8.4-3.4 1.8-4.6 1.8 1.4 2.8 3.3 2.8 5.6A6 6 0 1 1 6 13.8c0-2.5 1.2-4.7 3.2-6.2.6 1.5.7 3.2.2 4.7" />
    </svg>
  );
}

function IconReward(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l2.2 4.5L19 8.2l-3.5 3.4.8 4.8L12 14l-4.3 2.4.8-4.8L5 8.2l4.8-.7L12 3z" />
      <path d="M9 18h6" />
      <path d="M10 21h4" />
    </svg>
  );
}
