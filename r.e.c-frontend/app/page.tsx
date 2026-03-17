"use client";

import Footer from "@/components/layouts/Footer";
import Navbar from "@/components/layouts/Navbar";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type SVGProps } from "react";

type Feature = "temarios" | "materiales" | "horarios" | "feedback";

export default function Home() {
  const { token, user } = useAuth();
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setHeroReady(true), 60);
    return () => clearTimeout(id);
  }, []);

  const dashboardBase =
    user?.role === "PROFESOR"
      ? "/docente"
      : user?.role === "ESTUDIANTE"
      ? "/estudiante"
      : "/secretaria";

  const featureHref = (feature: Feature) => {
    if (!token) return "/login";
    if (user?.role === "SECRETARIA") return "/secretaria";
    if (feature === "temarios") return `${dashboardBase}/temarios`;
    if (feature === "materiales") return `${dashboardBase}/materiales`;
    if (feature === "horarios") {
      return user?.role === "PROFESOR" ? "/docente/horarios" : "/estudiante/horario";
    }
    return `${dashboardBase}/feedback`;
  };

  return (
    <>
      <main className="min-h-screen text-[color:var(--rec-ink)]">
        <Navbar />

        <header className="relative overflow-hidden border-b border-[color:var(--rec-soft)]">
          <BackgroundCarousel />
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--rec-primary)]/90 via-[color:var(--rec-primary)]/78 to-[color:var(--rec-earth)]/45" />

          <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
              <div
                className={
                  "transition-all duration-700 " +
                  (heroReady ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")
                }
              >
                <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                  Plataforma academica institucional
                </p>
                <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-6xl">
                  R.E.C Education
                </h1>
                <p className="mt-5 max-w-2xl text-base text-white/90 md:text-lg">
                  Refuerzo Educativo Complementario para instituciones que necesitan claridad,
                  seguimiento academico y una experiencia digital confiable para estudiantes,
                  docentes y secretaria.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {!token ? (
                    <>
                      <Link
                        href="/login"
                        prefetch={false}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[color:var(--rec-primary)] shadow-md hover:scale-[1.02]"
                      >
                        <IconBolt className="h-4 w-4" />
                        Iniciar sesion
                      </Link>
                      <Link
                        href="/acceso-secretaria"
                        prefetch={false}
                        className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20"
                      >
                        <IconUser className="h-4 w-4" />
                        Acceso secretaria
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={dashboardBase}
                      prefetch={false}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[color:var(--rec-primary)] shadow-md hover:scale-[1.02]"
                    >
                      <IconSpark className="h-4 w-4" />
                      Ir al panel
                    </Link>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/90">
                  <div>
                    <p className="text-2xl font-black text-white">+1200</p>
                    <p>Usuarios activos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">98%</p>
                    <p>Satisfaccion operativa</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">24/7</p>
                    <p>Acceso multiplataforma</p>
                  </div>
                </div>
              </div>

              <div className="rec-glass relative overflow-hidden rounded-3xl p-5 shadow-2xl">
                <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[color:var(--rec-earth)]/22 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-[color:var(--rec-leaf)]/25 blur-3xl" />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <Image src="/logo.png" alt="Logo REC" width={56} height={56} className="h-14 w-14 object-contain" priority />
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--rec-title)]">Institucion conectada</p>
                      <p className="text-xs text-slate-600">Control academico en tiempo real</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      "Seguimiento por periodos, materias y grupos.",
                      "Comunicacion docente-estudiante mas clara.",
                      "Gestion de recuperaciones y horarios con trazabilidad.",
                      "Vista institucional con enfoque en resultados.",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2 rounded-xl bg-white/80 p-3">
                        <IconCheck className="mt-0.5 h-4 w-4 text-[color:var(--rec-leaf)]" />
                        <p className="text-sm text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </header>

        <section className="rec-grid-bg border-y border-[color:var(--rec-soft)] bg-white/60">
          <div className="mx-auto grid max-w-6xl gap-3 px-6 py-5 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Dashboard por rol",
              "Reportes accionables",
              "Diseno mobile-first",
              "Escalable para multi-sede",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-[color:var(--rec-soft)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--rec-title)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-7 flex flex-col gap-2 text-center">
            <h2 className="text-3xl font-black text-[color:var(--rec-title)] md:text-4xl">Accesos rapidos</h2>
            <p className="text-slate-600">Entradas clave para los flujos academicos diarios.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: featureHref("temarios"),
                title: "Temarios",
                text: "Planificacion por periodos y asignaturas.",
                icon: IconBook,
              },
              {
                href: featureHref("materiales"),
                title: "Materiales",
                text: "Recursos de estudio centralizados.",
                icon: IconFolder,
              },
              {
                href: featureHref("horarios"),
                title: "Horarios",
                text: "Organizacion semanal de clases.",
                icon: IconClock,
              },
              {
                href: featureHref("feedback"),
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
                <p className="mt-1 text-sm text-slate-600">{card.text}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--rec-accent)]">
                  Ver modulo
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-[color:var(--rec-soft)] bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="text-2xl font-black text-[color:var(--rec-title)]">Ruta de inscripcion y adopcion</h3>
              <p className="mt-2 text-sm text-slate-600">
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
                    <p className="mt-1 text-sm text-slate-600">{step.d}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[color:var(--rec-soft)] bg-[color:var(--rec-primary)] p-6 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-white/70">Panel institucional</p>
              <h3 className="mt-2 text-2xl font-black">Control con foco en resultados</h3>
              <p className="mt-3 text-sm text-white/85">
                Administra estudiantes, docentes, recuperaciones y rendimiento desde un ecosistema unificado.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Promedio general por grupo",
                  "Asistencia y alertas tempranas",
                  "Flujo de recuperaciones",
                  "Comunicacion y feedback",
                ].map((item) => (
                  <div key={item} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm">
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
            <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
              R.E.C es un ecosistema educativo para fortalecer el aprendizaje, simplificar la gestión
              institucional y conectar a toda la comunidad académica.
            </p>
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
                <p className="mt-2 text-sm text-slate-600">{block.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-[color:var(--rec-soft)] bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="text-2xl font-black text-[color:var(--rec-title)]">Eventos y experiencias</h3>
              <p className="mt-2 text-sm text-slate-600">
                Ferias, jornadas y actividades académicas que conectan el aula con la innovación.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Feria de ciencias",
                    info: "30 Nov · Laboratorio central",
                    img: "/proyectos.jpg",
                  },
                  {
                    title: "Jornada de innovación",
                    info: "12 Dic · Sala STEAM",
                    img: "/educacion-chile.webp",
                  },
                ].map((event) => (
                  <div key={event.title} className="overflow-hidden rounded-xl border border-[color:var(--rec-soft)] bg-[color:var(--rec-surface)]">
                    <Image src={event.img} alt={event.title} width={700} height={300} className="h-36 w-full object-cover" />
                    <div className="p-4">
                      <h4 className="font-bold text-[color:var(--rec-title)]">{event.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{event.info}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[color:var(--rec-soft)] bg-[color:var(--rec-surface)] p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--rec-title)]">Testimonios</p>
              <h3 className="mt-2 text-2xl font-black text-[color:var(--rec-title)]">Voces de la comunidad</h3>
              <div className="mt-5 space-y-3">
                {[
                  "Como docente, ahora tengo trazabilidad real de cada grupo.",
                  "Como estudiante, encuentro todo más rápido y sin confusiones.",
                  "Desde secretaría, el flujo operativo es más ordenado.",
                ].map((quote) => (
                  <blockquote key={quote} className="rounded-lg border border-[color:var(--rec-soft)] bg-white px-3 py-2 text-sm text-slate-700">
                    "{quote}"
                  </blockquote>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="rounded-3xl border border-[color:var(--rec-soft)] bg-gradient-to-r from-[color:var(--rec-primary-strong)] to-[color:var(--rec-primary)] p-8 text-white md:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-3xl font-black md:text-4xl">Listo para subir el nivel de tu gestion academica</h2>
                <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
                  Diseno claro, estructura escalable y experiencia enfocada en confianza institucional y rendimiento.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link
                  href={token ? dashboardBase : "/login"}
                  prefetch={false}
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[color:var(--rec-primary)]"
                >
                  {token ? "Ir al panel" : "Empezar ahora"}
                </Link>
                <Link
                  href="/Contacto"
                  prefetch={false}
                  className="inline-flex items-center rounded-full bg-[color:var(--rec-cta)] px-6 py-3 text-sm font-semibold text-white hover:brightness-95"
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

function BackgroundCarousel() {
  const images = useMemo(
    () => [
      "/books-bookstore-book-reading-159711.jpeg",
      "/Educacion-Grado.jpg",
      "/universidad-autonoma-facultad-educacion.jpg",
      "/beneficios-educacion-superior-titulo-universitario.jpg",
      "/educacion-formal-e1536242919719.jpg",
      "/educacion-chile.webp",
      "/64481f3d579fd.jpeg",
    ],
    [],
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5200);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt="Fondo educativo"
          fill
          priority={i === 0}
          sizes="100vw"
          className={
            "object-cover transition-opacity duration-1000 " +
            (i === index ? "opacity-100" : "opacity-0")
          }
        />
      ))}
    </div>
  );
}

function IconBolt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
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
