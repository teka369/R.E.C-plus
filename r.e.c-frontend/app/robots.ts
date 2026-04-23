import type { MetadataRoute } from "next";

const SITE_URL = "https://recedu.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/Informacion",
          "/Contacto",
          "/portafolio",
          "/tutorial",
          "/funcionalidades/",
          "/colegios/",
          "/vs/",
          "/blog/",
        ],
        disallow: [
          "/api/",
          "/docente/",
          "/estudiante/",
          "/secretaria/",
          "/super-admin/",
          "/profile/",
          "/login",
          "/logout",
          "/forgot-password",
          "/reset-password",
          "/acceso-secretaria",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
