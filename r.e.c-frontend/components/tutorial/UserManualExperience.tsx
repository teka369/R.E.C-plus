"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowRight,
  FiBookOpen,
  FiChevronRight,
  FiCompass,
  FiLayers,
  FiMapPin,
  FiMenu,
  FiMonitor,
  FiShield,
  FiUser,
  FiUsers,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toTutorialEmbedUrl } from "@/lib/onboarding/videoEmbed";
import { DOCENTE_MANUAL, ESTUDIANTE_MANUAL, MANUAL_FAQS, SECRETARIA_MANUAL } from "@/lib/tutorial/manualContent";
import type { ManualBlock, ManualChapter } from "@/lib/tutorial/manualTypes";

function formatInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-rec-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function BlockView({ block }: { block: ManualBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-[15px] leading-[1.75] text-rec-text-secondary md:text-base">{formatInline(block.text)}</p>
      );
    case "list":
      return (
        <ul className="space-y-2.5 border-l-2 border-rec-primary/25 pl-5">
          {block.items.map((item) => (
            <li key={item.slice(0, 48)} className="text-[15px] leading-relaxed text-rec-text-secondary md:text-base">
              <span className="mr-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rec-primary align-middle" />
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
    case "tip":
      return (
        <div className="relative overflow-hidden rounded-2xl border border-rec-success-border bg-gradient-to-br from-rec-success-bg to-[color:var(--rec-soft)] p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rec-primary/20 blur-2xl" />
          <p className="text-xs font-bold uppercase tracking-widest text-rec-success-text">
            {block.title ?? "Consejo"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-rec-text-primary">{formatInline(block.text)}</p>
        </div>
      );
    case "note":
      return (
        <div className="rounded-2xl border border-rec-warning-border bg-rec-warning-bg p-5">
          <p className="text-sm font-medium text-rec-warning-text">{formatInline(block.text)}</p>
        </div>
      );
    default:
      return null;
  }
}

function ChapterSection({
  chapter,
  index,
}: {
  chapter: ManualChapter;
  index: number;
}) {
  return (
    <motion.section
      id={chapter.id}
      initial={false}
      className="scroll-mt-28 rounded-3xl border border-rec-border-default/80 bg-rec-bg-elevated/80 p-6 shadow-sm backdrop-blur-sm md:p-8 lg:scroll-mt-32"
    >
      <div className="flex flex-col gap-4 border-b border-rec-border-subtle pb-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rec-primary text-xs font-black text-rec-text-on-media">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-rec-text-subtle">Capítulo</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-rec-text-primary md:text-3xl">{chapter.title}</h2>
          {chapter.subtitle ? (
            <p className="max-w-2xl text-sm text-rec-text-muted md:text-base">{chapter.subtitle}</p>
          ) : null}
        </div>
        {chapter.route ? (
          <Link
            href={chapter.route}
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-2xl border border-rec-success-border bg-rec-success-bg px-4 py-2.5 text-sm font-semibold text-rec-success-text transition hover:bg-rec-success-bg-muted"
          >
            <FiMapPin className="h-4 w-4" aria-hidden />
            Abrir en la app
            <FiArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      <div className="mt-6 space-y-5">
        {chapter.blocks.map((b, j) => (
          <BlockView key={j} block={b} />
        ))}
      </div>
    </motion.section>
  );
}

type RoleTab = "docente" | "secretaria" | "estudiante";

const TUTORIAL_VIDEO_URL = process.env.NEXT_PUBLIC_TUTORIAL_VIDEO_URL?.trim() ?? "";
const HAS_TUTORIAL_VIDEO = Boolean(TUTORIAL_VIDEO_URL);

function chaptersForRole(r: RoleTab) {
  if (r === "docente") return DOCENTE_MANUAL;
  if (r === "secretaria") return SECRETARIA_MANUAL;
  return ESTUDIANTE_MANUAL;
}

export default function UserManualExperience() {
  const [role, setRole] = useState<RoleTab>("docente");
  const [activeId, setActiveId] = useState<string>("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(MANUAL_FAQS[0]?.id ?? null);

  const chapters = useMemo(() => chaptersForRole(role), [role]);

  useEffect(() => {
    setActiveId(chapters[0]?.id ?? "");
  }, [chapters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const h = window.location.hash.replace(/^#/, "").toLowerCase();
      if (h === "video") {
        window.requestAnimationFrame(() => {
          document.getElementById("manual-video")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }
      if (h === "secretaria") setRole("secretaria");
      else if (h === "estudiante" || h === "estudiantes") setRole("estudiante");
      else if (h === "docente") setRole("docente");
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const setRoleWithHash = useCallback((r: RoleTab) => {
    setRole(r);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${r}`);
    }
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.target.id)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id) setActiveId(top.target.id);
      },
      { rootMargin: "-14% 0px -48% 0px", threshold: [0.08, 0.15, 0.25, 0.4] },
    );
    for (const c of chapters) {
      const el = document.getElementById(c.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [chapters]);

  const scrollToId = (id: string) => {
    setMobileTocOpen(false);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-rec-border-default/60">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 0% -20%, color-mix(in srgb, var(--rec-primary) 45%, transparent), transparent 55%), radial-gradient(ellipse 90% 70% at 100% 0%, color-mix(in srgb, var(--rec-accent) 35%, transparent), transparent 50%), radial-gradient(ellipse 60% 50% at 50% 100%, color-mix(in srgb, var(--rec-success-text) 20%, transparent), transparent 45%)",
          }}
        />
        <div className="rec-grid-bg pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-rec-border-default bg-rec-bg-elevated/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-rec-text-subtle backdrop-blur-sm">
              <FiBookOpen className="h-3.5 w-3.5 text-rec-primary" aria-hidden />
              Manual de usuario
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-rec-text-primary sm:text-5xl md:text-6xl">
              Domina Recedu
              <span className="block bg-gradient-to-r from-rec-primary via-rec-accent to-rec-primary bg-clip-text text-transparent">
                en lectura guiada
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-rec-text-secondary sm:text-lg">
              Tres formatos complementarios:{" "}
              <strong className="text-rec-text-primary">tour interactivo</strong> dentro de la app,{" "}
              <strong className="text-rec-text-primary">este manual</strong> para profundizar, y{" "}
              <strong className="text-rec-text-primary">video</strong>{" "}
              {HAS_TUTORIAL_VIDEO ? "disponible con recorrido audiovisual." : "en preparación."}
            </p>
          </motion.div>

          {/* Format cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3"
          >
            <div className="group relative overflow-hidden rounded-3xl border border-rec-border-default bg-rec-bg-elevated/90 p-6 shadow-sm backdrop-blur-md transition hover:border-rec-primary/30 hover:shadow-md">
              <div className="mb-3 inline-flex rounded-xl bg-rec-primary/15 p-2.5 text-rec-primary">
                <FiMonitor className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="font-bold text-rec-text-primary">Interactivo</h3>
              <p className="mt-2 text-sm leading-relaxed text-rec-text-muted">
                Guías paso a paso con voz opcional en panel docente y estudiante.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-rec-primary hover:underline"
              >
                Ir al acceso
                <FiChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-3xl border-2 border-rec-primary/40 bg-gradient-to-b from-rec-primary/10 to-rec-bg-elevated p-6 shadow-lg ring-2 ring-rec-primary/20">
              <div className="absolute right-3 top-3 rounded-full bg-rec-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rec-text-on-media">
                Aquí estás
              </div>
              <div className="mb-3 inline-flex rounded-xl bg-rec-primary p-2.5 text-rec-text-on-media">
                <FiLayers className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="font-bold text-rec-text-primary">Lectura</h3>
              <p className="mt-2 text-sm leading-relaxed text-rec-text-secondary">
                Manual estructurado con índice, rutas directas a cada pantalla y consejos de uso.
              </p>
            </div>

            <div className="rounded-3xl border border-dashed border-rec-border-strong bg-rec-bg-muted/40 p-6 opacity-90">
              <div className="mb-3 inline-flex rounded-xl bg-rec-bg-elevated p-2.5 text-rec-text-subtle">
                <FiVideo className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="font-bold text-rec-text-primary">Video</h3>
              <p className="mt-2 text-sm leading-relaxed text-rec-text-muted">
                {HAS_TUTORIAL_VIDEO
                  ? "Ya puedes ver el recorrido en video desde esta misma página."
                  : "Tutoriales en vídeo: próximamente. Mientras tanto, usa el tour y este manual."}
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Student strip */}
      <div className="border-b border-rec-border-default bg-gradient-to-r from-rec-info-bg/50 via-rec-bg-elevated to-rec-warning-bg/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rec-bg-elevated text-xl shadow-sm ring-1 ring-rec-border-default">
              🎓
            </span>
            <div>
              <p className="font-semibold text-rec-text-primary">¿Eres estudiante?</p>
              <p className="text-sm text-rec-text-secondary">
                Ya tienes <strong>manual de lectura</strong> con índice y enlaces a cada pantalla. Combínalo con el{" "}
                <strong>tour interactivo</strong> (barra «Guía estudiante» en el panel). También puedes abrir directamente{" "}
                <Link href="/tutorial#estudiante" className="font-semibold text-rec-primary underline decoration-rec-primary/30 underline-offset-2">
                  #estudiante
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => setRoleWithHash("estudiante")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-rec-primary bg-rec-primary/10 px-5 py-2.5 text-sm font-bold text-rec-primary transition hover:bg-rec-primary/15"
            >
              Ver manual estudiante
              <FiBookOpen className="h-4 w-4" />
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rec-text-primary px-5 py-2.5 text-sm font-bold text-rec-text-on-media transition hover:opacity-90"
            >
              Iniciar sesión
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Role switch + layout */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:flex lg:gap-10 lg:px-8 lg:py-14">
        {/* Mobile TOC toggle */}
        <button
          type="button"
          onClick={() => setMobileTocOpen(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-rec-border-default bg-rec-bg-elevated py-3 text-sm font-semibold text-rec-text-primary shadow-sm lg:hidden"
        >
          <FiMenu className="h-5 w-5" />
          Índice del manual
        </button>

        {/* Desktop TOC */}
        <aside className="relative hidden w-56 shrink-0 lg:block xl:w-64">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-rec-text-subtle">Perfil</p>
              <div className="flex flex-col gap-1 rounded-2xl border border-rec-border-default bg-rec-bg-muted/50 p-1">
                <button
                  type="button"
                  onClick={() => setRoleWithHash("docente")}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition sm:text-sm ${
                    role === "docente"
                      ? "bg-rec-bg-elevated text-rec-primary shadow-sm ring-1 ring-rec-border-default"
                      : "text-rec-text-muted hover:bg-rec-bg-elevated/60 hover:text-rec-text-primary"
                  }`}
                >
                  <FiUsers className="h-4 w-4 shrink-0" />
                  Docente
                </button>
                <button
                  type="button"
                  onClick={() => setRoleWithHash("secretaria")}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition sm:text-sm ${
                    role === "secretaria"
                      ? "bg-rec-bg-elevated text-rec-primary shadow-sm ring-1 ring-rec-border-default"
                      : "text-rec-text-muted hover:bg-rec-bg-elevated/60 hover:text-rec-text-primary"
                  }`}
                >
                  <FiShield className="h-4 w-4 shrink-0" />
                  Secretaría
                </button>
                <button
                  type="button"
                  onClick={() => setRoleWithHash("estudiante")}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition sm:text-sm ${
                    role === "estudiante"
                      ? "bg-rec-bg-elevated text-rec-primary shadow-sm ring-1 ring-rec-border-default"
                      : "text-rec-text-muted hover:bg-rec-bg-elevated/60 hover:text-rec-text-primary"
                  }`}
                >
                  <FiUser className="h-4 w-4 shrink-0" />
                  Estudiante
                </button>
              </div>
            </div>

            <nav className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated/90 p-3 shadow-sm backdrop-blur-sm" aria-label="Índice del manual">
              <p className="mb-2 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-rec-text-subtle">
                <FiCompass className="h-3.5 w-3.5" />
                Contenidos
              </p>
              <ul className="space-y-0.5">
                {chapters.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => scrollToId(c.id)}
                      className={`flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm transition ${
                        activeId === c.id
                          ? "bg-rec-primary/12 font-semibold text-rec-primary"
                          : "text-rec-text-secondary hover:bg-rec-bg-muted"
                      }`}
                    >
                      <FiChevronRight
                        className={`mt-0.5 h-4 w-4 shrink-0 transition ${activeId === c.id ? "rotate-90 text-rec-primary" : "opacity-40"}`}
                      />
                      <span className="leading-snug">{c.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Mobile role tabs (duplicate for small screens) */}
          <div className="mb-8 grid grid-cols-3 gap-1 rounded-2xl border border-rec-border-default bg-rec-bg-muted/50 p-1 lg:hidden">
            <button
              type="button"
              onClick={() => setRoleWithHash("docente")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold sm:flex-row sm:text-xs ${
                role === "docente" ? "bg-rec-bg-elevated shadow-sm ring-1 ring-rec-border-default text-rec-primary" : "text-rec-text-muted"
              }`}
            >
              <FiUsers className="h-4 w-4" />
              <span>Docente</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleWithHash("secretaria")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold sm:flex-row sm:text-xs ${
                role === "secretaria" ? "bg-rec-bg-elevated shadow-sm ring-1 ring-rec-border-default text-rec-primary" : "text-rec-text-muted"
              }`}
            >
              <FiShield className="h-4 w-4" />
              <span className="text-center leading-tight">Secretaría</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleWithHash("estudiante")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold sm:flex-row sm:text-xs ${
                role === "estudiante" ? "bg-rec-bg-elevated shadow-sm ring-1 ring-rec-border-default text-rec-primary" : "text-rec-text-muted"
              }`}
            >
              <FiUser className="h-4 w-4" />
              <span className="text-center leading-tight">Estudiante</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              <div className="rounded-3xl border border-rec-border-default bg-gradient-to-br from-rec-bg-elevated to-rec-bg-base px-6 py-8 md:px-8">
                <h2 className="text-2xl font-bold text-rec-text-primary md:text-3xl">
                  Manual para{" "}
                  {role === "docente" ? "docentes" : role === "secretaria" ? "secretaría" : "estudiantes"}
                </h2>
                <p className="mt-3 max-w-2xl text-rec-text-secondary">
                  {role === "docente"
                    ? "Del panel a recuperaciones: cada capítulo enlaza a la pantalla real para que leas aquí y practiques al instante."
                    : role === "secretaria"
                      ? "Operación institucional: estudiantes, docentes, estructura académica y procesos que condicionan todo el sistema."
                      : "Panel, materiales, temarios, horario, notas, recuperaciones y cuenta: cada capítulo enlaza a tu área real. Combínalo con la barra «Guía estudiante» en el panel."}
                </p>
              </div>

              {chapters.map((chapter, i) => (
                <ChapterSection key={chapter.id} chapter={chapter} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Video (ancla #video) */}
          <section
            id="manual-video"
            className="mt-16 scroll-mt-24 rounded-3xl border border-rec-border-default bg-rec-bg-elevated/60 p-6 md:p-10"
            aria-labelledby="manual-video-heading"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="manual-video-heading" className="text-2xl font-bold text-rec-text-primary md:text-3xl">
                  Video tutorial
                </h2>
                <p className="mt-2 max-w-2xl text-rec-text-muted">
                  Recorrido audiovisual de las funciones clave. También puedes abrirlo desde el centro de ayuda en la página principal o tras iniciar sesión.
                </p>
              </div>
              <span className="rounded-full border border-rec-border-default bg-rec-bg-base px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-rec-text-subtle">
                #video
              </span>
            </div>
            <div className="mt-8">
              {HAS_TUTORIAL_VIDEO ? (
                <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border border-rec-border-default bg-black shadow-inner">
                  <iframe
                    title="Video tutorial Recedu"
                    src={toTutorialEmbedUrl(TUTORIAL_VIDEO_URL)}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-rec-border-strong bg-rec-bg-muted/40 p-8 text-center">
                  <FiVideo className="mx-auto h-10 w-10 text-rec-text-subtle" aria-hidden />
                  <p className="mt-4 text-sm font-medium text-rec-text-secondary">
                    Aún no hay URL de vídeo configurada. Define{" "}
                    <code className="rounded bg-rec-bg-elevated px-1.5 py-0.5 text-xs text-rec-text-primary">NEXT_PUBLIC_TUTORIAL_VIDEO_URL</code>{" "}
                    en el entorno del frontend (por ejemplo enlace de YouTube).
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-16 rounded-3xl border border-rec-border-default bg-rec-bg-elevated/60 p-6 md:p-10" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-2xl font-bold text-rec-text-primary md:text-3xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-2 text-rec-text-muted">Respuestas rápidas para toda la comunidad educativa.</p>
            <div className="mt-8 space-y-3">
              {MANUAL_FAQS.map((faq) => {
                const open = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-2xl border border-rec-border-default bg-rec-bg-base transition hover:border-rec-primary/25"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      aria-expanded={open}
                    >
                      <span className="font-semibold text-rec-text-primary">{faq.question}</span>
                      <span className={`text-rec-text-subtle transition ${open ? "rotate-180" : ""}`}>▼</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-rec-border-subtle"
                        >
                          <p className="px-5 py-4 text-sm leading-relaxed text-rec-text-secondary">{faq.answer}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-rec-primary-strong to-rec-primary px-6 py-12 text-center text-rec-text-on-media md:px-10">
            <h2 className="text-2xl font-bold md:text-3xl">¿Listo para aplicarlo?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-rec-text-on-media/85">
              Inicia sesión y combina este manual con el tour interactivo de tu rol.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-rec-bg-elevated px-6 py-3 text-sm font-bold text-rec-primary shadow-lg transition hover:opacity-95"
              >
                Iniciar sesión
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/Contacto"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 px-6 py-3 text-sm font-bold text-rec-text-on-media transition hover:bg-white/10"
              >
                Contacto
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile TOC drawer */}
      <AnimatePresence>
        {mobileTocOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-rec-text-primary/40 backdrop-blur-sm lg:hidden"
              aria-label="Cerrar índice"
              onClick={() => setMobileTocOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-[70] w-[min(100vw-3rem,20rem)] border-l border-rec-border-default bg-rec-bg-elevated shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-rec-border-default px-4 py-3">
                <span className="font-bold text-rec-text-primary">Índice</span>
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(false)}
                  className="rounded-lg p-2 text-rec-text-muted hover:bg-rec-bg-muted"
                  aria-label="Cerrar"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="p-3">
                <div className="mb-4 flex flex-col gap-1 rounded-xl border border-rec-border-default p-1">
                  <button
                    type="button"
                    onClick={() => setRoleWithHash("docente")}
                    className={`rounded-lg py-2 text-left text-xs font-bold pl-2 ${role === "docente" ? "bg-rec-primary text-rec-text-on-media" : ""}`}
                  >
                    Docente
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleWithHash("secretaria")}
                    className={`rounded-lg py-2 text-left text-xs font-bold pl-2 ${role === "secretaria" ? "bg-rec-primary text-rec-text-on-media" : ""}`}
                  >
                    Secretaría
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleWithHash("estudiante")}
                    className={`rounded-lg py-2 text-left text-xs font-bold pl-2 ${role === "estudiante" ? "bg-rec-primary text-rec-text-on-media" : ""}`}
                  >
                    Estudiante
                  </button>
                </div>
                <ul className="space-y-1">
                  {chapters.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => scrollToId(c.id)}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-rec-text-secondary hover:bg-rec-bg-muted"
                      >
                        {c.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
