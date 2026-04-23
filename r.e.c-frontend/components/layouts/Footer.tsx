"use client";
import Link from "next/link";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import {
  REC_CONTACT_MAILTO,
  REC_CONTACT_PHONE_DISPLAY,
  REC_CONTACT_TEL_HREF,
  REC_WHATSAPP_URL,
} from "@/lib/siteContact";

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
    <footer className="rec-footer-glass relative w-full overflow-hidden border-t">
      <div className="rec-footer-gif pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-rec-text-primary/10" aria-hidden="true" />
      <div className="rec-footer-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-14 md:py-16">
        {/* Grid Principal */}
        <div className="mb-10 grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Columna de Marca */}
          <div className="col-span-1 flex flex-col gap-4 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.webp"
                alt="Logo R.E.C"
                width={96}
                height={96}
                className="rec-logo-on-dark h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-[color:var(--rec-accent)] to-[color:var(--rec-leaf)] bg-clip-text text-transparent">
                R.E.C
              </span>
            </div>
            <p className="text-sm text-rec-footer-fg-muted leading-relaxed">
              Refuerzo Educativo Complementario. Plataforma moderna para gestionar el aprendizaje de forma integrada.
            </p>
            {/* Social Icons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <a
                href={REC_CONTACT_MAILTO}
                aria-label="Correo electrónico"
                className="h-10 w-10 rounded-lg border border-rec-footer-icon-border bg-rec-footer-icon-bg hover:bg-[color:var(--rec-cta)] transition flex items-center justify-center text-rec-footer-fg"
              >
                <FiMail className="h-4 w-4" />
              </a>
              <a
                href={REC_CONTACT_TEL_HREF}
                aria-label={`Teléfono ${REC_CONTACT_PHONE_DISPLAY}`}
                className="h-10 w-10 rounded-lg border border-rec-footer-icon-border bg-rec-footer-icon-bg hover:bg-[color:var(--rec-cta)] transition flex items-center justify-center text-rec-footer-fg"
              >
                <FiPhone className="h-4 w-4" />
              </a>
              <a
                href={REC_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="h-10 w-10 rounded-lg border border-rec-footer-icon-border bg-rec-footer-icon-bg hover:bg-[color:var(--rec-cta)] transition flex items-center justify-center text-[#25D366]"
              >
                <FaWhatsapp className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Columnas de Links */}
          {footerLinks.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-4">
              <h3 className="font-semibold text-rec-footer-fg text-sm">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="text-sm text-rec-footer-link hover:text-[color:var(--rec-cta)] transition duration-200"
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
        <div className="h-px bg-gradient-to-r from-transparent via-rec-footer-divider to-transparent mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Copyright & Info */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-rec-footer-fg-muted">
              © {currentYear} Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-xs text-rec-footer-fg-subtle">
              <FiMapPin className="h-3 w-3" />
              <span>Colombia</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
            <Link
              href="/"
              prefetch={false}
              className="text-rec-footer-link hover:text-[color:var(--rec-cta)] transition"
            >
              Inicio
            </Link>
            <span className="text-rec-footer-fg-subtle">•</span>
            <Link
              href="/tutorial"
              prefetch={false}
              className="text-rec-footer-link hover:text-[color:var(--rec-cta)] transition"
            >
              Tutorial
            </Link>
            <span className="text-rec-footer-fg-subtle">•</span>
            <Link
              href="/Contacto"
              prefetch={false}
              className="text-rec-footer-link hover:text-[color:var(--rec-cta)] transition"
            >
              Contacto
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle Footer Accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-rec-footer-divider to-transparent" />
    </footer>
  );
}

