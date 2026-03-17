"use client";
import Link from "next/link";
import { FiGithub, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Producto",
      links: [
        { label: "Características", href: "#" },
        { label: "Precios", href: "#" },
        { label: "Seguridad", href: "#" },
        { label: "Roadmap", href: "#" },
      ],
    },
    {
      title: "Recursos",
      links: [
        { label: "Documentación", href: "#" },
        { label: "Guías", href: "#" },
        { label: "API", href: "#" },
        { label: "Comunidad", href: "#" },
      ],
    },
    {
      title: "Empresa",
      links: [
        { label: "Acerca de", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Contacto", href: "#" },
        { label: "Empleos", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacidad", href: "#" },
        { label: "Términos", href: "#" },
        { label: "Cookies", href: "#" },
        { label: "Licencia", href: "#" },
      ],
    },
  ];

  return (
    <footer className="w-full bg-gradient-to-b from-[color:var(--rec-primary-strong)] to-[color:var(--rec-primary)] text-white border-t border-white/15">
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Columna de Marca */}
          <div className="col-span-1 flex flex-col gap-4">
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
                href="#"
                aria-label="GitHub"
                className="h-10 w-10 rounded-lg border border-white/30 bg-white/10 hover:bg-[color:var(--rec-cta)] transition flex items-center justify-center text-white"
              >
                <FiGithub className="h-4 w-4" />
              </a>
              <a
                href="mailto:info@rec.edu.co"
                aria-label="Email"
                className="h-10 w-10 rounded-lg border border-white/30 bg-white/10 hover:bg-[color:var(--rec-cta)] transition flex items-center justify-center text-white"
              >
                <FiMail className="h-4 w-4" />
              </a>
              <a
                href="tel:+573001234567"
                aria-label="Teléfono"
                className="h-10 w-10 rounded-lg border border-white/30 bg-white/10 hover:bg-[color:var(--rec-cta)] transition flex items-center justify-center text-white"
              >
                <FiPhone className="h-4 w-4" />
              </a>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Copyright & Info */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-white/80">
              © {currentYear} Institución Educativa Javier Alonso Barrios Sevilla. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <FiMapPin className="h-3 w-3" />
              <span>Colombia</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/"
              prefetch={false}
              className="text-white/85 hover:text-[color:var(--rec-cta)] transition"
            >
              Inicio
            </Link>
            <span className="text-white/45">•</span>
            <Link
              href="#"
              prefetch={false}
              className="text-white/85 hover:text-[color:var(--rec-cta)] transition"
            >
              Ayuda
            </Link>
            <span className="text-white/45">•</span>
            <Link
              href="#"
              prefetch={false}
              className="text-white/85 hover:text-[color:var(--rec-cta)] transition"
            >
              Estado
            </Link>
            <span className="text-white/45">•</span>
            <Link
              href="#"
              prefetch={false}
              className="text-white/85 hover:text-[color:var(--rec-cta)] transition"
            >
              Feedback
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle Footer Accent */}
      <div className="h-px bg-gradient-to-r from-emerald-500/0 via-[color:var(--rec-accent)]/30 to-emerald-500/0" />
    </footer>
  );
}

