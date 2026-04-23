import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Blog — Educación, Normativa y Gestión Escolar en Colombia",
  description:
    "Artículos sobre gestión académica, normativa educativa colombiana, tecnología para colegios y buenas prácticas docentes. Blog de Recedu.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | Recedu",
    description:
      "Artículos sobre gestión académica, normativa educativa colombiana y tecnología para colegios.",
    url: "/blog",
  },
};

/* ── Mock posts (se reemplazarán por CMS / MDX en el futuro) ─────── */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
}

const posts: BlogPost[] = [
  {
    slug: "decreto-1290-colombia-evaluacion-promocion",
    title:
      "Decreto 1290 de 2009: Guía Completa sobre Evaluación y Promoción para Colegios en 2026",
    excerpt:
      "Todo lo que tu colegio necesita saber sobre el Decreto 1290: Sistema Institucional de Evaluación (SIEE), escala de valoración nacional, criterios de promoción y el rol de las recuperaciones académicas.",
    category: "Normativa",
    date: "2026-04-15",
    readTime: "12 min",
  },
  {
    slug: "como-digitalizar-gestion-academica-colegio",
    title: "Cómo digitalizar la gestión académica de tu colegio en 2026",
    excerpt:
      "Guía práctica para pasar de planillas en Excel a una plataforma digital. Pasos, errores comunes y cómo elegir la herramienta correcta para tu institución.",
    category: "Tecnología",
    date: "2026-03-01",
    readTime: "6 min",
  },
  {
    slug: "recuperaciones-academicas-estrategias-efectivas",
    title:
      "Recuperaciones académicas: 5 estrategias efectivas para mejorar los resultados",
    excerpt:
      "Las recuperaciones no tienen por qué ser un trámite. Descubre estrategias pedagógicas respaldadas por la evidencia para que tus estudiantes realmente aprendan.",
    category: "Pedagogía",
    date: "2026-02-20",
    readTime: "7 min",
  },
  {
    slug: "reportes-academicos-toma-decisiones",
    title:
      "Cómo usar reportes académicos para la toma de decisiones en tu colegio",
    excerpt:
      "Los datos solo sirven si se usan. Aprende a leer reportes de rendimiento, identificar patrones y tomar acciones concretas para mejorar los resultados de tu institución.",
    category: "Gestión",
    date: "2026-02-10",
    readTime: "5 min",
  },
];

const categories = [...new Set(posts.map((p) => p.category))];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const featured = posts[0];
  const rest = posts.slice(1);

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
            Blog
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
            Educación, Normativa y Gestión Escolar
          </h1>
          <p className="text-rec-text-on-media/85 text-lg max-w-xl mx-auto">
            Artículos prácticos sobre gestión académica, normativa educativa
            colombiana y tecnología para colegios.
          </p>
        </div>
      </header>

      <main>
        {/* Categorías */}
        <section className="py-6" style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold bg-rec-bg-elevated"
                  style={{ color: "var(--rec-primary-strong)" }}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Post destacado */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <Link
            href={`/blog/${featured.slug}`}
            className="group block rounded-2xl border overflow-hidden hover:shadow-lg transition"
            style={{
              borderColor: "var(--rec-border-default)",
              background: "var(--rec-bg-elevated)",
            }}
          >
            <div className="p-8 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: "var(--rec-soft)",
                    color: "var(--rec-primary-strong)",
                  }}
                >
                  {featured.category}
                </span>
                <span className="text-xs text-rec-text-subtle">
                  {formatDate(featured.date)}
                </span>
                <span className="text-xs text-rec-text-subtle">
                  · {featured.readTime} lectura
                </span>
              </div>
              <h2
                className="text-2xl md:text-3xl font-extrabold mb-3 group-hover:underline decoration-2 underline-offset-4"
                style={{ color: "var(--rec-title)" }}
              >
                {featured.title}
              </h2>
              <p className="text-rec-text-muted leading-relaxed max-w-3xl">
                {featured.excerpt}
              </p>
              <p
                className="mt-6 text-sm font-semibold uppercase tracking-wider"
                style={{ color: "var(--rec-primary)" }}
              >
                Leer artículo →
              </p>
            </div>
          </Link>
        </section>

        {/* Grid de posts */}
        <section className="py-16" style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-6xl px-6">
            <h2
              className="text-2xl font-extrabold mb-8"
              style={{ color: "var(--rec-title)" }}
            >
              Más artículos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rec-glass rounded-2xl p-6 hover:shadow-md transition flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: "var(--rec-soft)",
                        color: "var(--rec-primary-strong)",
                      }}
                    >
                      {post.category}
                    </span>
                    <span className="text-xs text-rec-text-subtle">
                      {post.readTime}
                    </span>
                  </div>
                  <h3
                    className="font-bold text-lg mb-2 group-hover:underline decoration-1 underline-offset-2"
                    style={{ color: "var(--rec-title)" }}
                  >
                    {post.title}
                  </h3>
                  <p className="text-sm text-rec-text-muted leading-relaxed flex-1">
                    {post.excerpt}
                  </p>
                  <p className="text-xs text-rec-text-subtle mt-4">
                    {formatDate(post.date)}
                  </p>
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
              ¿Quieres ver Recedu en acción?
            </h2>
            <p className="text-rec-text-on-media/80 mb-8">
              Descubre cómo la plataforma puede transformar la gestión académica
              de tu colegio.
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
