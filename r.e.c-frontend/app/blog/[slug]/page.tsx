import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

/* ── Tipos ────────────────────────────────────────────────────────────── */

interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  hasRichContent?: boolean;
}

/* ── Metadata de todos los posts ─────────────────────────────────────── */

const POSTS: Record<string, BlogPostMeta> = {
  "decreto-1290-colombia-evaluacion-promocion": {
    slug: "decreto-1290-colombia-evaluacion-promocion",
    title:
      "Decreto 1290 de 2009: Guía Completa sobre Evaluación y Promoción para Colegios en 2026",
    excerpt:
      "Todo lo que tu colegio necesita saber sobre el Decreto 1290: Sistema Institucional de Evaluación (SIEE), escala de valoración nacional, criterios de promoción y el rol de las recuperaciones académicas.",
    category: "Normativa",
    date: "2026-04-15",
    readTime: "12 min",
    hasRichContent: true,
  },
  "como-digitalizar-gestion-academica-colegio": {
    slug: "como-digitalizar-gestion-academica-colegio",
    title: "Cómo digitalizar la gestión académica de tu colegio en 2026",
    excerpt:
      "Guía práctica para pasar de planillas en Excel a una plataforma digital.",
    category: "Tecnología",
    date: "2026-03-01",
    readTime: "6 min",
  },
  "recuperaciones-academicas-estrategias-efectivas": {
    slug: "recuperaciones-academicas-estrategias-efectivas",
    title:
      "Recuperaciones académicas: 5 estrategias efectivas para mejorar los resultados",
    excerpt:
      "Las recuperaciones no tienen por qué ser un trámite. Descubre estrategias pedagógicas respaldadas por la evidencia.",
    category: "Pedagogía",
    date: "2026-02-20",
    readTime: "7 min",
  },
  "reportes-academicos-toma-decisiones": {
    slug: "reportes-academicos-toma-decisiones",
    title:
      "Cómo usar reportes académicos para la toma de decisiones en tu colegio",
    excerpt:
      "Los datos solo sirven si se usan. Aprende a leer reportes de rendimiento y tomar acciones concretas.",
    category: "Gestión",
    date: "2026-02-10",
    readTime: "5 min",
  },
};

const ALL_SLUGS = Object.keys(POSTS);

/* ── Static generation ───────────────────────────────────────────────── */

export function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = POSTS[params.slug];
  if (!post) return { title: "Artículo no encontrado" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: ["Recedu"],
      tags: [post.category, "educación", "colegios Colombia"],
    },
    twitter: { title: post.title, description: post.excerpt },
  };
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ── Estilos reutilizables para el contenido de artículos ────────────── */

const heading2 =
  "text-2xl md:text-3xl font-extrabold mt-12 mb-4";
const heading3 = "text-xl font-bold mt-8 mb-3";
const paragraph = "text-rec-text-secondary leading-relaxed mb-4";
const listItem = "flex items-start gap-2 text-sm text-rec-text-secondary";

function H2({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <h2 id={id} className={heading2} style={{ color: "var(--rec-title)" }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className={heading3} style={{ color: "var(--rec-title)" }}>
      {children}
    </h3>
  );
}

function K({ children }: { children: ReactNode }) {
  return (
    <strong className="font-semibold" style={{ color: "var(--rec-title)" }}>
      {children}
    </strong>
  );
}

function Check() {
  return (
    <span
      className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-rec-text-on-media text-xs shrink-0"
      style={{ background: "var(--rec-primary)" }}
    >
      ✓
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Contenido rico: Decreto 1290
   ═══════════════════════════════════════════════════════════════════════ */

function Decreto1290Content() {
  return (
    <>
      <p className={paragraph}>
        Si trabajas en un colegio colombiano —ya sea como <K>docente</K>,{" "}
        <K>coordinador</K> o <K>secretario académico</K>— el Decreto 1290 de
        2009 es la norma que define cómo debes evaluar, promover y reportar el
        desempeño de tus estudiantes. No es opcional: es el marco legal vigente
        expedido por el <K>Ministerio de Educación Nacional (MEN)</K> que rige
        la evaluación del aprendizaje en la educación básica y media de todo el
        país.
      </p>
      <p className={paragraph}>
        Este artículo es una guía práctica y completa. Vamos a desglosar los
        puntos clave del decreto, explicar qué implica para la operación diaria
        de tu institución y mostrar cómo herramientas como{" "}
        <K>Recedu</K> pueden ayudarte a cumplirlo de forma eficiente.
      </p>

      <H2 id="que-es-decreto-1290">¿Qué es el Decreto 1290 de 2009?</H2>
      <p className={paragraph}>
        El <K>Decreto 1290</K> fue expedido el 16 de abril de 2009. Reemplazó
        al anterior Decreto 230 de 2002 y otorgó a las instituciones educativas
        una <K>autonomía</K> que antes no tenían: la libertad de diseñar su
        propio sistema de evaluación.
      </p>
      <p className={paragraph}>
        Antes del 1290, todos los colegios seguían las mismas reglas rígidas. El
        decreto actual dice: &quot;usted conoce a sus estudiantes mejor que
        nadie, así que defina cómo los evalúa&quot;, pero dentro de un marco
        nacional que garantiza <K>equidad</K> y <K>comparabilidad</K> entre
        instituciones.
      </p>
      <p className={paragraph}>
        Este equilibrio entre autonomía institucional y estándares nacionales es
        precisamente lo que hace al decreto tan relevante —y tan desafiante de
        implementar correctamente.
      </p>

      <H2 id="siee">
        El Sistema Institucional de Evaluación de los Estudiantes (SIEE)
      </H2>
      <p className={paragraph}>
        El corazón del Decreto 1290 es la obligación de cada colegio de
        construir su propio{" "}
        <K>Sistema Institucional de Evaluación de los Estudiantes (SIEE)</K>.
        Este documento no es un formalismo archivado en una carpeta: es la guía
        operativa que define cómo funciona la evaluación en tu institución.
      </p>

      <H3>¿Qué debe incluir el SIEE según el decreto?</H3>
      <p className={paragraph}>
        El artículo 4 del Decreto 1290 establece que el SIEE debe contener como
        mínimo los siguientes componentes:
      </p>
      <ul className="space-y-2 mb-6 pl-1">
        {[
          "Criterios de evaluación y promoción: las reglas claras sobre cómo se evalúa y qué se necesita para pasar de un grado al siguiente.",
          "Escala de valoración institucional: la escala propia del colegio con su equivalencia a la escala nacional.",
          "Estrategias de valoración integral: cómo se evalúa al estudiante de forma completa, no solo con exámenes escritos.",
          "Acciones de seguimiento para el mejoramiento: qué hace el colegio cuando un estudiante muestra bajo rendimiento.",
          "Procesos de autoevaluación de los estudiantes: mecanismos para que el propio estudiante reflexione sobre su aprendizaje.",
          "Estrategias de apoyo para resolver situaciones pedagógicas pendientes: esto es, las recuperaciones académicas.",
          "Periodicidad de la entrega de informes: cuántas veces al año se entrega el boletín.",
          "Estructura de los informes de los estudiantes: qué debe contener cada boletín.",
          "Instancias, procedimientos y mecanismos de atención y resolución de reclamaciones: el debido proceso.",
          "Mecanismos de participación de la comunidad educativa en la construcción del SIEE.",
        ].map((item) => (
          <li key={item} className={listItem}>
            <Check />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className={paragraph}>
        Como puedes ver, el SIEE no es un documento sencillo. Involucra
        decisiones pedagógicas, administrativas y de comunicación que afectan a
        toda la comunidad educativa. Y lo más importante: <K>todo esto debe
        estar documentado, socializado y operando</K> en la práctica diaria.
      </p>

      <H2 id="escala-nacional">Escala Nacional de Valoración</H2>
      <p className={paragraph}>
        Cada colegio puede definir su propia escala de calificación (numérica,
        cualitativa o mixta), pero el decreto exige que esa escala tenga una{" "}
        <K>equivalencia clara</K> con la escala nacional. Esta escala tiene
        cuatro niveles:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {[
          {
            level: "Desempeño Superior",
            desc: "El estudiante supera ampliamente los logros esperados.",
          },
          {
            level: "Desempeño Alto",
            desc: "El estudiante alcanza los logros con dominio claro.",
          },
          {
            level: "Desempeño Básico",
            desc: "El estudiante alcanza los logros mínimos establecidos.",
          },
          {
            level: "Desempeño Bajo",
            desc: "El estudiante no alcanza los logros mínimos. Requiere apoyo.",
          },
        ].map((item) => (
          <div
            key={item.level}
            className="rounded-xl border p-4"
            style={{
              borderColor: "var(--rec-border-default)",
              background: "var(--rec-bg-elevated)",
            }}
          >
            <p
              className="font-bold text-sm mb-1"
              style={{ color: "var(--rec-title)" }}
            >
              {item.level}
            </p>
            <p className="text-xs text-rec-text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
      <p className={paragraph}>
        La equivalencia con la escala nacional permite que cuando un estudiante
        se traslade a otro colegio, su historial académico sea comprensible
        independientemente de la escala que usaba su institución anterior. Es un
        mecanismo de <K>portabilidad académica</K> fundamental.
      </p>

      <H2 id="promocion-escolar">
        Promoción Escolar en Colombia según el Decreto 1290
      </H2>
      <p className={paragraph}>
        La <K>promoción escolar</K> —es decir, si un estudiante pasa o no al
        siguiente grado— es una de las decisiones más importantes que toma una
        institución educativa. El Decreto 1290 da a los colegios autonomía para
        definir sus criterios, pero establece un principio fundamental: la
        decisión debe ser <K>integral</K>, no basarse únicamente en una cifra.
      </p>

      <H3>Criterios de promoción</H3>
      <p className={paragraph}>
        El decreto no dice &quot;si el estudiante saca menos de 3.0, pierde el
        año&quot;. Lo que dice es que cada colegio debe definir en su SIEE los
        criterios claros de promoción, considerando el desarrollo integral del
        estudiante. Esto puede incluir:
      </p>
      <ul className="space-y-2 mb-6 pl-1">
        {[
          "Porcentaje máximo de áreas o asignaturas con desempeño bajo.",
          "Valoración del esfuerzo, asistencia y participación del estudiante.",
          "Resultados de las estrategias de apoyo (recuperaciones) ofrecidas.",
          "Concepto de la comisión de evaluación y promoción.",
        ].map((item) => (
          <li key={item} className={listItem}>
            <Check />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <H3>Las comisiones de evaluación y promoción</H3>
      <p className={paragraph}>
        El decreto establece que cada colegio debe conformar{" "}
        <K>comisiones de evaluación y promoción</K> por grado o grupo. Estas
        comisiones, integradas por docentes, un representante de padres y el
        rector, son las responsables de analizar los casos de estudiantes con
        desempeño bajo y recomendar las acciones a seguir.
      </p>
      <p className={paragraph}>
        Aquí es donde los datos se vuelven críticos. Una comisión que llega a la
        mesa sin información clara —sin saber qué recuperaciones se ofrecieron,
        cuáles se completaron, qué notas obtuvo el estudiante por periodo—
        toma decisiones a ciegas. Y eso perjudica directamente al estudiante.
      </p>

      <H2 id="recuperaciones-decreto">
        Las Recuperaciones Académicas: el Eslabón Olvidado del Decreto
      </H2>
      <p className={paragraph}>
        El artículo 4, numeral 6 del Decreto 1290 obliga a las instituciones a
        definir{" "}
        <K>
          &quot;estrategias de apoyo necesarias para resolver situaciones
          pedagógicas pendientes de los estudiantes&quot;
        </K>
        . En lenguaje cotidiano: las recuperaciones.
      </p>
      <p className={paragraph}>
        Este es, posiblemente, el punto más descuidado del decreto. Muchos
        colegios tienen un SIEE bien redactado, escalas de valoración definidas
        y comisiones constituidas. Pero cuando llega el momento de ejecutar las
        recuperaciones, el proceso se fragmenta:
      </p>
      <ul className="space-y-2 mb-6 pl-1">
        {[
          "Los docentes no saben con certeza cuáles estudiantes deben recuperar.",
          "No hay un sistema centralizado para registrar quién completó la recuperación y quién no.",
          "Las fechas se manejan de forma informal, generando conflictos y reclamos.",
          "La secretaría no tiene visibilidad del estado real de las recuperaciones cuando llega la comisión de evaluación.",
        ].map((item) => (
          <li key={item} className={listItem}>
            <Check />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className={paragraph}>
        Este vacío operativo no es un problema menor. Es la causa directa de
        decisiones de promoción poco informadas, quejas de padres de familia y
        sanciones potenciales del MEN.
      </p>

      <H2 id="recedu-decreto-1290">
        Cómo Recedu Facilita el Cumplimiento del Decreto 1290
      </H2>
      <p className={paragraph}>
        <K>Recedu</K> fue diseñada pensando en la realidad operativa de los
        colegios colombianos. No es un ERP genérico adaptado a la educación: es
        una plataforma construida desde cero para resolver los problemas reales
        que el Decreto 1290 puso sobre la mesa.
      </p>

      <div className="space-y-5 mb-6">
        {[
          {
            title: "Gestión de notas por periodo",
            text: "Los docentes registran calificaciones organizadas por periodo, grupo y materia. El sistema calcula promedios automáticamente y los mapea a la escala de valoración institucional, asegurando la equivalencia con la escala nacional.",
          },
          {
            title: "Recuperaciones académicas automatizadas",
            text: "Recedu identifica automáticamente a los estudiantes con desempeño bajo y los asigna a recuperaciones. Docentes registran avances, estudiantes consultan su estado, y secretaría tiene el panorama completo. Sin planillas, sin WhatsApp, sin ambigüedad.",
          },
          {
            title: "Reportes para las comisiones de evaluación",
            text: "Cuando llega la comisión de evaluación y promoción, Recedu genera reportes por grupo con toda la información necesaria: calificaciones por periodo, estado de recuperaciones, historial de seguimiento y alertas de bajo rendimiento.",
          },
          {
            title: "Feedback docente-estudiante",
            text: "El decreto exige que los estudiantes conozcan sus resultados y tengan oportunidades de mejorar. Recedu incluye un canal directo de retroalimentación entre docente y estudiante, cumpliendo el espíritu del artículo 12 sobre derechos del estudiante.",
          },
          {
            title: "Trazabilidad completa",
            text: "Cada acción queda registrada: qué nota se puso, cuándo se asignó una recuperación, si se completó o no, qué comentó el docente. Esto es fundamental para los procesos de reclamación que el decreto también exige implementar.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border p-5"
            style={{
              borderColor: "var(--rec-border-default)",
              background: "var(--rec-bg-elevated)",
            }}
          >
            <h3
              className="font-bold text-sm mb-2"
              style={{ color: "var(--rec-primary)" }}
            >
              {item.title}
            </h3>
            <p className="text-sm text-rec-text-muted leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      <H2 id="conclusion">Conclusión</H2>
      <p className={paragraph}>
        El <K>Decreto 1290 de 2009</K> sigue siendo la columna vertebral de la
        evaluación escolar en Colombia. Su vigencia en 2026 no ha disminuido;
        por el contrario, la exigencia de transparencia, trazabilidad y
        participación de la comunidad educativa es cada vez mayor.
      </p>
      <p className={paragraph}>
        Cumplir el decreto no debería depender de la buena voluntad de un
        coordinador ni de planillas de Excel compartidas por WhatsApp. Las
        herramientas digitales especializadas como <K>Recedu</K> existen
        precisamente para convertir las obligaciones normativas en procesos
        fluidos, auditables y centrados en lo que realmente importa: el
        aprendizaje de los estudiantes.
      </p>
      <p className={paragraph}>
        Si tu colegio aún gestiona evaluaciones, recuperaciones y boletines de
        forma manual, el primer paso no es cambiar de normativa —es cambiar de
        herramienta.
      </p>
    </>
  );
}

/* ── Mapa de contenido rico por slug ─────────────────────────────────── */

const RICH_CONTENT: Record<string, () => ReactNode> = {
  "decreto-1290-colombia-evaluacion-promocion": Decreto1290Content,
};

/* ── FAQ Schema (JSON-LD) por slug ───────────────────────────────────── */

const FAQ_SCHEMAS: Record<string, object> = {
  "decreto-1290-colombia-evaluacion-promocion": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Qué es el Sistema Institucional de Evaluación (SIEE)?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El SIEE es el documento que cada colegio colombiano debe construir según el Decreto 1290 de 2009. Define los criterios de evaluación y promoción, la escala de valoración institucional, las estrategias de apoyo (recuperaciones), la periodicidad de informes, la estructura de los boletines y los mecanismos de reclamación. Es la guía operativa que rige cómo funciona la evaluación en la institución.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cómo afecta el Decreto 1290 a la promoción escolar en Colombia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "El Decreto 1290 otorga a cada colegio la autonomía de definir sus propios criterios de promoción dentro del SIEE. La decisión de promover o no a un estudiante debe ser integral, considerando no solo las calificaciones sino también el esfuerzo, la asistencia, los resultados de las recuperaciones y el concepto de la comisión de evaluación y promoción.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cuál es la escala nacional de valoración según el Decreto 1290?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La escala nacional tiene cuatro niveles: Desempeño Superior (supera ampliamente los logros), Desempeño Alto (alcanza los logros con dominio), Desempeño Básico (alcanza los logros mínimos) y Desempeño Bajo (no alcanza los logros mínimos). Cada colegio puede usar su propia escala siempre que tenga equivalencia con la escala nacional.",
        },
      },
      {
        "@type": "Question",
        name: "¿Qué son las recuperaciones académicas según la normativa colombiana?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Según el artículo 4, numeral 6 del Decreto 1290, las instituciones deben definir 'estrategias de apoyo necesarias para resolver situaciones pedagógicas pendientes de los estudiantes'. En la práctica, esto se traduce en planes de recuperación que incluyen actividades de refuerzo, evaluaciones adicionales y seguimiento para estudiantes con desempeño bajo.",
        },
      },
      {
        "@type": "Question",
        name: "¿Recedu cumple con la normativa del Ministerio de Educación Nacional?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí. Recedu fue diseñada específicamente para facilitar el cumplimiento del Decreto 1290. Incluye gestión de notas por periodo con equivalencia a la escala nacional, un módulo completo de recuperaciones académicas con asignación automática y seguimiento, reportes listos para las comisiones de evaluación y promoción, y canales de feedback docente-estudiante.",
        },
      },
    ],
  },
};

/* ── Contenido placeholder para posts sin contenido rico ─────────────── */

const PLACEHOLDER_TEXT: Record<string, string[]> = {
  "como-digitalizar-gestion-academica-colegio": [
    "Cubrirá los pasos prácticos para que un colegio migre de procesos manuales a una plataforma digital: diagnóstico inicial, selección de herramienta, migración de datos, capacitación del equipo y medición de resultados.",
    "Se incluirán errores comunes en la digitalización escolar y cómo evitarlos, con ejemplos reales del contexto educativo colombiano.",
  ],
  "recuperaciones-academicas-estrategias-efectivas": [
    "Se presentarán cinco estrategias pedagógicas efectivas para diseñar planes de recuperación que realmente funcionen: evaluación diagnóstica, planes personalizados, tutorías entre pares, uso de tecnología y seguimiento continuo.",
    "Cada estrategia incluirá evidencia, ejemplos prácticos y cómo implementarla con herramientas como Recedu.",
  ],
  "reportes-academicos-toma-decisiones": [
    "Cubrirá cómo interpretar los reportes académicos: qué métricas mirar, cómo identificar patrones preocupantes, y qué acciones concretas tomar basándose en los datos.",
    "Se mostrarán ejemplos de reportes generados por Recedu y cómo usarlos para mejorar el rendimiento institucional.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════
   Componente de página
   ═══════════════════════════════════════════════════════════════════════ */

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = POSTS[params.slug];

  if (!post) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1
            className="text-3xl font-extrabold mb-4"
            style={{ color: "var(--rec-title)" }}
          >
            Artículo no encontrado
          </h1>
          <p className="text-rec-text-muted mb-8">
            El artículo que buscas no existe o fue movido.
          </p>
          <Link
            href="/blog"
            className="rounded-full px-6 py-3 text-sm font-bold text-rec-text-on-media"
            style={{ background: "var(--rec-primary)" }}
          >
            Volver al blog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const RichContent = RICH_CONTENT[post.slug];
  const placeholderParagraphs = PLACEHOLDER_TEXT[post.slug];
  const faqSchema = FAQ_SCHEMAS[post.slug];
  const relatedSlugs = ALL_SLUGS.filter((s) => s !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Navbar />

      <header
        className="relative text-rec-text-on-media py-20 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--rec-primary-strong) 0%, var(--rec-primary) 100%)",
        }}
      >
        <div className="absolute inset-0 rec-grid-bg opacity-20" />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-rec-text-on-media/80 hover:text-rec-text-on-media transition mb-6"
          >
            ← Volver al blog
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "color-mix(in srgb, var(--rec-text-on-media) 15%, transparent)",
                border: "1px solid color-mix(in srgb, var(--rec-text-on-media) 30%, transparent)",
              }}
            >
              {post.category}
            </span>
            <span className="text-sm text-rec-text-on-media/70">
              {formatDate(post.date)}
            </span>
            <span className="text-sm text-rec-text-on-media/70">
              · {post.readTime} lectura
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg leading-tight">
            {post.title}
          </h1>
        </div>
      </header>

      <main>
        <article className="mx-auto max-w-3xl px-6 py-16">
          {/* Contenido rico o placeholder */}
          {RichContent ? (
            <RichContent />
          ) : (
            <>
              <div
                className="rounded-2xl border p-8 mb-10"
                style={{
                  borderColor: "var(--rec-border-default)",
                  background: "var(--rec-bg-elevated)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-rec-text-on-media text-sm"
                    style={{ background: "var(--rec-primary)" }}
                  >
                    ✍️
                  </span>
                  <p
                    className="font-bold text-sm"
                    style={{ color: "var(--rec-title)" }}
                  >
                    Contenido en desarrollo
                  </p>
                </div>
                <p className="text-sm text-rec-text-muted leading-relaxed">
                  Este artículo está en fase de redacción. La estructura y los
                  metadatos SEO ya están configurados. El contenido completo
                  será publicado próximamente.
                </p>
              </div>
              {placeholderParagraphs && (
                <div className="space-y-6">
                  {placeholderParagraphs.map((p, i) => (
                    <p
                      key={i}
                      className="text-rec-text-secondary leading-relaxed"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          {/* CTA inline */}
          <div
            className="mt-12 rounded-2xl p-8 text-center"
            style={{ background: "var(--rec-soft)" }}
          >
            <h3
              className="text-xl font-extrabold mb-2"
              style={{ color: "var(--rec-title)" }}
            >
              ¿Quieres implementar esto en tu colegio?
            </h3>
            <p className="text-sm text-rec-text-muted mb-6">
              Recedu te ayuda a gestionar notas, recuperaciones y comunicación
              académica desde una sola plataforma.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/Contacto"
                className="rounded-full px-6 py-2.5 text-sm font-bold text-rec-text-on-media transition hover:opacity-90"
                style={{ background: "var(--rec-primary)" }}
              >
                Agendar demostración
              </Link>
              <Link
                href="/funcionalidades/recuperaciones-academicas"
                className="rounded-full px-6 py-2.5 text-sm font-semibold transition"
                style={{
                  border: "1.5px solid var(--rec-primary)",
                  color: "var(--rec-primary)",
                }}
              >
                Ver módulo de recuperaciones
              </Link>
            </div>
          </div>
        </article>

        {/* Artículos relacionados */}
        <section className="py-16" style={{ background: "var(--rec-soft)" }}>
          <div className="mx-auto max-w-5xl px-6">
            <h2
              className="text-2xl font-extrabold mb-8"
              style={{ color: "var(--rec-title)" }}
            >
              Artículos relacionados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedSlugs.map((slug) => {
                const related = POSTS[slug];
                return (
                  <Link
                    key={slug}
                    href={`/blog/${slug}`}
                    className="group rec-glass rounded-2xl p-6 hover:shadow-md transition flex flex-col"
                  >
                    <span
                      className="self-start rounded-full px-3 py-1 text-xs font-semibold mb-3"
                      style={{
                        background: "var(--rec-soft)",
                        color: "var(--rec-primary-strong)",
                      }}
                    >
                      {related.category}
                    </span>
                    <h3
                      className="font-bold mb-2 group-hover:underline decoration-1 underline-offset-2"
                      style={{ color: "var(--rec-title)" }}
                    >
                      {related.title}
                    </h3>
                    <p className="text-sm text-rec-text-muted flex-1">
                      {related.excerpt}
                    </p>
                    <p className="text-xs text-rec-text-subtle mt-3">
                      {related.readTime} lectura
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
