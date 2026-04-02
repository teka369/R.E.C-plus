"use client";
import Link from "next/link";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Plataforma",
      links: [
        { label: "Inicio", href: "/" },
        { label: "Tutorial", href: "/tutorial" },
        { label: "Informacion", href: "/Informacion" },
        { label: "Contacto", href: "/Contacto" },
      ],
    },
    {
      title: "Recursos",
      links: [
        { label: "Portafolio", href: "/portafolio" },
        { label: "Certificados", href: "/certificados" },
        { label: "Reportes", href: "/Reportes" },
        { label: "Login", href: "/login" },
      ],
    },
    {
      title: "Accesos",
      links: [
        { label: "Acceso Secretaria", href: "/acceso-secretaria" },
        { label: "Panel Docente", href: "/docente" },
        { label: "Panel Estudiante", href: "/estudiante" },
        { label: "Cerrar sesion", href: "/logout" },
      ],
    },
  ];

  return (
    <footer className="relative w-full overflow-hidden border-t border-white/15 bg-gradient-to-b from-[#26323d] to-[#2f3e4b] text-white">
      <div className="rec-footer-gif pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(0,0,0,0.18),transparent_55%)]" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-14 md:py-16">
        {/* Grid Principal */}
        <div className="mb-10 grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Columna de Marca */}
          <div className="col-span-1 flex flex-col gap-4 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Logo R.E.C"
                width={96}
                height={96}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-[color:var(--rec-accent)] to-[color:var(--rec-leaf)] bg-clip-text text-transparent">
                R.E.C
              </span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              Refuerzo Educativo Complementario. Plataforma moderna para gestionar el aprendizaje de forma integrada.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 pt-4">
              <a
                href="mailto:contacto@recedu.co"
                aria-label="Email"
                className="h-10 w-10 rounded-lg border border-white/30 bg-white/10 hover:bg-[color:var(--rec-cta)] transition flex items-center justify-center text-white"
              >
                <FiMail className="h-4 w-4" />
              </a>
              <span
                aria-label="Teléfono"
                className="h-10 w-10 rounded-lg border border-white/30 bg-white/10 flex items-center justify-center text-white/50 cursor-default"
                title="Próximamente"
              >
                <FiPhone className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Columnas de Links */}
          {footerLinks.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-4">
              <h3 className="font-semibold text-white text-sm">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="text-sm text-white/85 hover:text-[color:var(--rec-cta)] transition duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Copyright & Info */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-white/80">
              © {currentYear} Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <FiMapPin className="h-3 w-3" />
              <span>Colombia</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
            <Link
              href="/"
              prefetch={false}
              className="text-white/85 hover:text-[color:var(--rec-cta)] transition"
            >
              Inicio
            </Link>
            <span className="text-white/45">•</span>
            <Link
              href="/tutorial"
              prefetch={false}
              className="text-white/85 hover:text-[color:var(--rec-cta)] transition"
            >
              Tutorial
            </Link>
            <span className="text-white/45">•</span>
            <Link
              href="/Contacto"
              prefetch={false}
              className="text-white/85 hover:text-[color:var(--rec-cta)] transition"
            >
              Contacto
            </Link>
            <span className="text-white/45">•</span>
            <Link
              href="/Reportes"
              prefetch={false}
              className="text-white/85 hover:text-[color:var(--rec-cta)] transition"
            >
              Reportes
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle Footer Accent */}
      <div className="h-px bg-gradient-to-r from-slate-300/0 via-white/30 to-slate-300/0" />
    </footer>
  );
}

