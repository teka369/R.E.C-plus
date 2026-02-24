"use client";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import type { SVGProps } from "react";
import Image from "next/image";

export default function Home() {
  const { token } = useAuth();
  const [welcomeReady, setWelcomeReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setWelcomeReady(true), 50);
    return () => clearTimeout(id);
  }, []);
  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900">
        <Navbar />
        {/* Hero */}
        <header className="relative overflow-hidden min-h-[90vh]">
        <BackgroundCarousel />
        <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="flex flex-col items-center text-center gap-6">
            <div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
                R.E.C
              </h1>
              <p className="mt-4 text-lg md:text-xl text-indigo-100 max-w-2xl">
                Refuerzo Educativo Complementario: impulsa el aprendizaje con gestión académica moderna, accesible y potente.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                {!token ? (
                  <>
                    <Link
                      href="/login"
                      prefetch={false}
                      className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-sm font-medium text-indigo-900 shadow hover:bg-white"
                    >
                      <IconBolt className="h-4 w-4" />
                      <span>Iniciar sesión</span>
                    </Link>
                    <Link
                      href="/acceso-secretaria"
                      prefetch={false}
                      className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-transparent px-5 py-2 text-sm font-medium text-white hover:bg-white/10"
                    >
                      <IconUser className="h-4 w-4" />
                      <span>Acceso Secretaría</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/secretaria"
                    prefetch={false}
                    className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-sm font-medium text-indigo-900 shadow hover:bg-white"
                  >
                    <IconSparkles className="h-4 w-4" />
                    <span>Ir al Panel</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </header>
      {/* Bienvenida (solo sin sesión) debajo del carrusel */}
      {!token && (
        <section className="mx-auto max-w-6xl px-6 pt-8">
          <div
            className={
              "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-700 ease-out " +
              (welcomeReady ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-[.98]")
            }
          >
            {/* Decoración y glow */}
            <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-600/25 to-fuchsia-600/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-600/25 to-violet-600/25 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10 rounded-3xl" />

            {/* Izquierda: icono y texto */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600/20 to-fuchsia-600/20 text-indigo-600">
                <IconSparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">¡Bienvenido a R.E.C!</h2>
                <p className="text-sm md:text-base text-slate-700 mt-2 max-w-xl">Refuerzo Educativo Complementario para estudiantes y docentes. Inicia sesión para acceder a tu panel.</p>
              </div>
            </div>

            {/* Derecha: acciones */}
            <div className="flex flex-wrap gap-3">
              <Link href="/login" prefetch={false} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500">
                <IconBolt className="h-4 w-4" /> Iniciar sesión
              </Link>
              <Link href="/acceso-secretaria" prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-white/20 backdrop-blur">
                <IconUser className="h-4 w-4" /> Acceso Secretaría
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Enlaces rápidos */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Enlaces rápidos</h2>
        <p className="mt-2 text-sm text-slate-600">Accede de forma directa a las áreas clave de la plataforma.</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { href: "/temarios", title: "Temarios", desc: "Explora contenidos planificados y objetivos por asignatura.", Icon: IconBookOpen, accent: "indigo" },
            { href: "/materiales", title: "Materiales", desc: "Comparte y consulta recursos de estudio organizados.", Icon: IconLink, accent: "violet" },
            { href: "/horarios", title: "Horarios", desc: "Visualiza y organiza tu calendario académico.", Icon: IconClock, accent: "fuchsia" },
            { href: "/feedbacks", title: "Feedbacks", desc: "Revisa observaciones y retroalimentación de desempeño.", Icon: IconChat, accent: "cyan" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-60 bg-gradient-to-br from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20" />
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 text-indigo-700">
                  <l.Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{l.title}</h3>
                  <p className="mt-1 text-sm text-slate-700">{l.desc}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-1 h-5 w-5 text-slate-400 group-hover:text-slate-600 transition"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Servicios */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Servicios Académicos</h2>
        <p className="mt-3 text-center text-slate-600 max-w-2xl mx-auto">
          Herramientas clave para estudiantes, docentes y secretaría: organizado, eficiente y centrado en el aprendizaje.
        </p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { Icon: IconBookOpen, title: "Materiales", text: "Comparte y consulta recursos de estudio organizados.", href: "/materiales" },
            { Icon: IconClock, title: "Horarios", text: "Visualiza y organiza tu calendario académico.", href: "/horarios" },
            { Icon: IconChat, title: "Feedback", text: "Revisa observaciones y retroalimentación de desempeño.", href: "/feedbacks" },
            { Icon: IconBookOpen, title: "Temarios", text: "Explora contenidos planificados y objetivos por asignatura.", href: "/temarios" },
          ].map((s, i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-sm hover:shadow-md transition">
              {/* Decoración */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-600/20 via-violet-600/20 to-fuchsia-600/20 blur-2xl" />
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 text-indigo-700 ring-1 ring-white/20">
                <s.Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{s.text}</p>
              <div className="mt-5">
                {token ? (
                  <Link aria-label={`Entrar a ${s.title}`} href={s.href} prefetch={false} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-medium text-white shadow hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500">
                    <IconSparkles className="h-4 w-4" /> Entrar
                  </Link>
                ) : (
                  <Link aria-label={`Iniciar sesión para acceder a ${s.title}`} href="/login" prefetch={false} className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-white px-5 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
                    <IconBolt className="h-4 w-4" /> Iniciar sesión
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Eventos */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Eventos</h2>
        <p className="mt-3 text-center text-slate-600 max-w-3xl mx-auto">Descubre las experiencias que potencian el aprendizaje: ferias, jornadas y espacios de innovación.</p>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Banner destacado */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
            <Image src="/novedades.avif" alt="Feria STEAM" width={1200} height={600} className="w-full h-auto object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">
                <IconSparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-white">Feria STEAM 2024</h3>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/90">
                <span className="inline-flex items-center gap-2"><IconClock className="h-4 w-4" /> 20 Nov, 9:00 AM</span>
                <span className="inline-flex items-center gap-2"><IconMapPin className="h-4 w-4" /> Auditorio Principal</span>
              </div>
              <div className="mt-4">
                <Link href="/horarios" prefetch={false} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-medium text-white shadow hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500" aria-label="Ver agenda de eventos">
                  <IconSparkles className="h-4 w-4" /> Ver agenda
                </Link>
              </div>
            </div>
          </div>

          {/* Tarjetas de próximos eventos */}
          <div className="grid grid-cols-1 gap-6">
            {[
              { title: "Feria de Ciencias", date: "30 Nov, 10:00 AM", place: "Laboratorio Central", image: "/proyectos.jpg" },
              { title: "Jornada de Innovación", date: "12 Dic, 8:00 AM", place: "Sala STEAM", image: "/educacion-chile.webp" },
            ].map((e, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                <Image src={e.image} alt={e.title} width={800} height={400} className="w-full h-36 object-cover" />
                <div className="p-5">
                  <h4 className="text-lg font-semibold text-slate-900">{e.title}</h4>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span className="inline-flex items-center gap-2"><IconClock className="h-4 w-4" /> {e.date}</span>
                    <span className="inline-flex items-center gap-2"><IconMapPin className="h-4 w-4" /> {e.place}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qué dicen nuestros estudiantes y docentes */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Qué dicen nuestros estudiantes y docentes</h2>
        <p className="mt-3 text-center text-slate-600 max-w-3xl mx-auto">Opiniones reales que reflejan cómo R.E.C mejora la organización, la comunicación y el rendimiento académico.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Docente", role: "Profesor de Ciencias", text: "Las herramientas facilitan la evaluación y el seguimiento del grupo." },
            { name: "Estudiante", role: "Grado 10°", text: "Organizo mi tiempo y encuentro materiales al instante." },
            { name: "Docente", role: "Tutor Académico", text: "La comunicación y retroalimentación son mucho más efectivas." },
          ].map((t, i) => (
            <figure key={i} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                  <IconChat className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-600">{t.role}</p>
                  <blockquote className="mt-2 text-slate-700">“{t.text}”</blockquote>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </section>

      {/* Sobre R.E.C */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Sobre R.E.C</h2>
        <p className="mt-3 text-center text-slate-600 max-w-3xl mx-auto">R.E.C (Refuerzo Educativo Complementario) impulsa procesos académicos con tecnología moderna, comunicación ágil y gestión eficiente.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "¿Qué es R.E.C?", text: "Un ecosistema digital para estudiantes, docentes y secretaría: materiales, horarios, feedback y más en un solo lugar.", Icon: IconSparkles },
            { title: "Misión", text: "Facilitar procesos y potenciar habilidades mediante soluciones accesibles y de alto rendimiento.", Icon: IconTarget },
            { title: "Visión", text: "Ser referente en innovación educativa con experiencias inclusivas y efectivas.", Icon: IconEye },
            { title: "Filosofía", text: "Aprendizaje continuo, colaboración y transparencia en cada entrega.", Icon: IconLightbulb },
          ].map((b) => (
            <div key={b.title} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-sm hover:shadow-md transition">
              <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-600/20 via-violet-600/20 to-fuchsia-600/20 blur-2xl" />
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 text-indigo-700 ring-1 ring-white/20">
                <b.Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{b.title}</h3>
              <p className="mt-2 text-sm text-slate-700">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nuestro equipo */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Nuestro equipo</h2>
        <p className="mt-3 text-center text-slate-600 max-w-3xl mx-auto">Conjunto de profesionales que combina diseño, frontend y backend para ofrecer una experiencia académica superior.</p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              name: "Juan David",
              role: "Full‑stack",
              img: "/Guarin.png",
              desc: "Construye experiencias fluidas y eficientes desde el frontend hasta el backend.",
              tech: [
                "React",
                "Next.js",
                "NestJS",
                "Tailwind",
                "HTML",
                "CSS",
                "JavaScript",
                "TypeScript",
                "PostgreSQL",
                "MySQL",
                "Docker",
                "Bootstrap",
              ],
            },
            {
              name: "Valeria",
              role: "Frontend",
              img: "/Valeria.png",
              desc: "Diseña interfaces limpias y accesibles con atención al detalle.",
              tech: ["HTML", "CSS", "JavaScript", "Bootstrap"],
            },
            {
              name: "David",
              role: "Frontend",
              img: "/david.png",
              desc: "Implementa interfaces robustas y responsivas para experiencias consistentes.",
              tech: ["HTML", "CSS", "JavaScript", "Bootstrap"],
            },
          ].map((m) => (
            <div key={m.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <Image src={m.img} alt={m.name} width={64} height={64} className="rounded-full object-cover" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{m.name}</h3>
                  <p className="text-xs text-slate-600">{m.role}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-700">{m.desc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.tech.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-100"
                  >
                    <IconCode className="h-3 w-3" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA (solo sin sesión) */}
      {!token && (
        <section className="bg-gradient-to-br from-rose-500 to-orange-500 text-white">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold">¿Listo para empezar?</h2>
            <p className="mt-3 text-rose-100 max-w-2xl mx-auto">
              Aprovecha todas las herramientas de R.E.C diseñadas para facilitar tu día a día.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/login" prefetch={false} className="rounded-full bg-white/90 px-6 py-3 text-sm font-semibold text-rose-700 shadow hover:bg-white">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Mapa e información de contacto */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">Ubicación e información</h2>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="w-full h-[320px] lg:h-[420px] overflow-hidden rounded-2xl border bg-white shadow-sm">
            <iframe
              title="Mapa institucional"
              src="https://www.google.com/maps?q=Bogota%2C%20Colombia&output=embed"
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Institución educativa</h3>
            <p className="mt-2 text-sm text-slate-700">Aplicativo web desarrollado para fortalecer los procesos académicos.</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><IconPhone className="h-4 w-4 text-slate-500" /><span className="font-medium text-slate-800">Teléfono:</span><span className="text-slate-700">+57 320 000 0000</span></div>
              <div className="flex items-center gap-2"><IconMail className="h-4 w-4 text-slate-500" /><span className="font-medium text-slate-800">Correo:</span><span className="text-slate-700">contacto@rec.edu</span></div>
              <div className="flex items-center gap-2"><IconMapPin className="h-4 w-4 text-slate-500" /><span className="font-medium text-slate-800">Dirección:</span><span className="text-slate-700">Bogotá, Colombia</span></div>
            </dl>
          </div>
        </div>
      </section>

      {/* Pie */}
      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} R.E.C — Refuerzo Educativo Complementario</p>
      </footer>
      </main>
      <Footer />
    </>
  );
}

function BackgroundCarousel() {
  const images = useMemo(
    () => [
      // Imágenes locales desde /public (no requieren dominios remotos)
      "/books-bookstore-book-reading-159711.jpeg",
      "/Educacion-Grado.jpg",
      "/universidad-autonoma-facultad-educacion.jpg",
      "/beneficios-educacion-superior-titulo-universitario.jpg",
      "/educacion-formal-e1536242919719.jpg",
      "/educacion-chile.webp",
      "/64481f3d579fd.jpeg",
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering) return;
    const interval = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % images.length;
        setPrevIndex(prev);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length, isHovering]);

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Pila de imágenes con crossfade */}
      <div className="h-full w-full">
        {images.map((src, i) => {
          const isActive = i === index;
          const isExiting = i === prevIndex && prevIndex !== index;
          return (
            <div
              key={src}
              className={
                "absolute inset-0 transition-all duration-700 ease-out will-change-transform transform-gpu " +
                (isActive
                  ? "opacity-100 translate-x-0 scale-105"
                  : isExiting
                  ? "opacity-0 -translate-x-4 scale-100"
                  : "opacity-0 translate-x-4 scale-100")
              }
            >
              
              <Image
                src={src}
                alt="Fondo institucional educativo"
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover"
              />
            </div>
          );
        })}
      </div>
      {/* Overlay de color para mejorar contraste del texto, limitado al héroe */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/55 via-violet-900/45 to-rose-900/35" />

      {/* Indicadores simples del carrusel (sin botones) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={
              "h-2 w-2 rounded-full transition " +
              (i === index ? "bg-white" : "bg-white/40")
            }
          />
        ))}
      </div>
    </div>
  );
}

// Iconos inline (SVG) para mejorar la estética sin dependencias externas
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

function IconSparkles(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l1.5 3L17 7l-3 1.5L12 12l-1.5-3L7 7l3-1.5L12 3z" />
      <path d="M19 13l.75 1.5L21.5 15l-1.5.75L19 17l-.75-1.25L16.5 15l1.75-.5L19 13z" />
      <path d="M5 13l.75 1.5L7.5 15l-1.5.75L5 17l-.75-1.25L2.5 15l1.75-.5L5 13z" />
    </svg>
  );
}

function IconBookOpen(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 4a8 8 0 0 0-8 8v5a2 2 0 0 0 2 2h6V4z" />
      <path d="M12 4a8 8 0 0 1 8 8v5a2 2 0 0 1-2 2h-6V4z" />
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

function IconLink(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
    </svg>
  );
}

function IconTarget(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v4M2 12h4M20 12h4M12 20v4" />
    </svg>
  );
}

function IconEye(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconLightbulb(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 1 7 7c0 2.7-1.5 4.4-3 6l-1 1H9l-1-1c-1.5-1.6-3-3.3-3-6a7 7 0 0 1 7-7z" />
    </svg>
  );
}

function IconMapPin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s-6-4.5-6-10a6 6 0 1 1 12 0c0 5.5-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

function IconPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 4.18 2 2 0 0 1 4.05 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.76.63 2.58a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.5-1.14a2 2 0 0 1 2.11-.45c.82.3 1.68.51 2.58.63A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

function IconCode(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 18l6-6-6-6" />
      <path d="M8 6L2 12l6 6" />
    </svg>
  );
}