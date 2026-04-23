import type { MetadataRoute } from "next";

const SITE_URL = "https://recedu.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  /* ── Rutas estáticas principales ───────────────────────────────────── */
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/Informacion`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/Contacto`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/portafolio`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/tutorial`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  /* ── Landings de funcionalidades ───────────────────────────────────── */
  const featureRoutes: MetadataRoute.Sitemap = [
    "/funcionalidades/recuperaciones-academicas",
    "/funcionalidades/gestion-notas",
    "/funcionalidades/reportes-docentes",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  /* ── Comparativa ───────────────────────────────────────────────────── */
  const vsRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/vs/q10`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  /* ── SEO Local (ciudades) ──────────────────────────────────────────── */
  const ciudades = ["medellin", "bogota", "cali"];
  const cityRoutes: MetadataRoute.Sitemap = ciudades.map((ciudad) => ({
    url: `${SITE_URL}/colegios/${ciudad}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  /* ── Blog ──────────────────────────────────────────────────────────── */
  const blogSlugs = [
    "decreto-1290-colombia-evaluacion-promocion",
    "como-digitalizar-gestion-academica-colegio",
    "recuperaciones-academicas-estrategias-efectivas",
    "reportes-academicos-toma-decisiones",
  ];

  const blogRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogSlugs.map((slug) => ({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [
    ...staticRoutes,
    ...featureRoutes,
    ...vsRoutes,
    ...cityRoutes,
    ...blogRoutes,
  ];
}
