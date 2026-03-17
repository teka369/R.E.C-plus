"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import Footer from "@/components/layouts/Footer";
import Navbar from "@/components/layouts/Navbar";
import { FaCertificate, FaCode, FaUserGraduate, FaSearch, FaCheckCircle } from "react-icons/fa";

type Certificate = {
  title: string;
  platform: string;
  date: string;
  image: string;
  skills: string[];
};

type Member = {
  name: string;
  role: string;
  certificates: Certificate[];
};

const teamMembers: Member[] = [
  {
    name: "Juan David Guarin Romero",
    role: "Frontend Developer",
    certificates: [
      {
        title: "HTML5",
        platform: "Solo Learn",
        date: "2024",
        image: "/images/Certificados/Guarin/HTML.jpg",
        skills: ["Semántica", "Accesibilidad", "SEO"],
      },
      {
        title: "CSS",
        platform: "Solo Learn",
        date: "2024",
        image: "/images/Certificados/Guarin/CSS.jpg",
        skills: ["Flexbox", "Grid", "Animaciones"],
      },
      {
        title: "JavaScript",
        platform: "Solo Learn",
        date: "2024",
        image: "/images/Certificados/Guarin/JS.jpg",
        skills: ["ES6+", "DOM", "Async/Await"],
      },
    ],
  },
  {
    name: "Valeria Zapata Vargas",
    role: "Full Stack Developer",
    certificates: [
      {
        title: "HTML5",
        platform: "Solo Learn",
        date: "2024",
        image: "/images/Certificados/Valeria/HTML.jpg",
        skills: ["Forms", "Canvas", "WebStorage"],
      },
      {
        title: "CSS",
        platform: "Solo Learn",
        date: "2024",
        image: "/images/Certificados/Valeria/css.png",
        skills: ["Sass", "BEM", "Responsive"],
      },
      {
        title: "JavaScript",
        platform: "Solo Learn",
        date: "2024",
        image: "/images/Certificados/Valeria/JS.jpg",
        skills: ["TypeScript", "Testing", "Patterns"],
      },
    ],
  },
  {
    name: "David Blandon Caro",
    role: "Backend Developer",
    certificates: [
      {
        title: "HTML5",
        platform: "Solo Learn",
        date: "2024",
        image: "/images/Certificados/David/HTML.png",
        skills: ["Templates", "APIs", "Performance"],
      },
      {
        title: "CSS",
        platform: "Solo Learn",
        date: "2024",
        image: "/images/Certificados/David/CSS.png",
        skills: ["Modules", "Custom Properties", "Performance"],
      },
      {
        title: "JavaScript",
        platform: "Solo Learn",
        date: "2024",
        image: "/images/Certificados/David/JS.png",
        skills: ["Node.js", "Express", "APIs"],
      },
    ],
  },
];

export default function CertificadosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});

  const handleShowModal = (image: string, title: string) => {
    setSelectedImage(image);
    setSelectedTitle(title);
    setModalOpen(true);
  };

  const toggleKey = (key: string) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalCerts = teamMembers.reduce((acc, m) => acc + m.certificates.length, 0);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section
        className="relative flex items-center justify-center text-center text-white py-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--rec-primary-strong) 0%, var(--rec-primary) 100%)" }}
      >
        <div className="absolute inset-0 rec-grid-bg opacity-20" />
        <div className="relative z-10 max-w-3xl px-6">
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <FaCertificate size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">Certificaciones del Equipo</h1>
          <p className="text-lg text-white/85 max-w-xl mx-auto">
            Nuestro compromiso con la excelencia técnica y el aprendizaje continuo, validado por plataformas reconocidas
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10" style={{ background: "var(--rec-soft)" }}>
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: totalCerts, label: "Certificados Totales" },
              { value: teamMembers.length, label: "Miembros del Equipo" },
              { value: "100%", label: "Verificados" },
            ].map((stat) => (
              <div key={stat.label} className="rec-glass rounded-2xl py-6 px-4">
                <p className="text-4xl font-extrabold mb-1" style={{ color: "var(--rec-primary)" }}>{stat.value}</p>
                <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificados por miembro */}
      <div className="mx-auto max-w-5xl px-6 py-14 space-y-12">
        {teamMembers.map((member, idx) => (
          <div key={idx}>
            {/* Cabecera del miembro */}
            <div
              className="flex items-center gap-4 p-6 rounded-2xl mb-5 shadow-sm"
              style={{ background: "var(--rec-soft)", border: "1px solid var(--rec-soft)" }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0"
                style={{ background: "var(--rec-primary)" }}
              >
                <FaUserGraduate className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--rec-title)" }}>{member.name}</h2>
                <p className="text-sm font-medium" style={{ color: "var(--rec-primary)" }}>{member.role}</p>
              </div>
              <span
                className="ml-auto rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "var(--rec-primary)", color: "white" }}
              >
                {member.certificates.length} certificados
              </span>
            </div>

            {/* Acordeón de certificados */}
            <div className="space-y-3">
              {member.certificates.map((cert, cidx) => {
                const key = `${idx}-${cidx}`;
                const open = !!openKeys[key];
                return (
                  <div
                    key={key}
                    className="rounded-2xl overflow-hidden bg-white shadow-sm"
                    style={{ border: "1px solid var(--rec-soft)" }}
                  >
                    <button
                      onClick={() => toggleKey(key)}
                      className="w-full text-left px-5 py-4 flex items-center gap-3 transition"
                      style={open ? { background: "var(--rec-soft)" } : undefined}
                    >
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                        style={{ background: open ? "var(--rec-primary)" : "var(--rec-soft)" }}
                      >
                        <FaCode style={{ color: open ? "white" : "var(--rec-primary)" }} size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <strong className="block text-sm" style={{ color: "var(--rec-title)" }}>{cert.title}</strong>
                        <span className="text-xs text-slate-500">{cert.platform} · {cert.date}</span>
                      </div>
                      <svg
                        className="h-4 w-4 flex-shrink-0 transition-transform"
                        style={{ color: "var(--rec-primary)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {open && (
                      <div className="px-5 pb-6 pt-1 border-t" style={{ borderColor: "var(--rec-soft)" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {/* Imagen + botón */}
                          <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: "1px solid var(--rec-soft)" }}>
                            <div className="group relative overflow-hidden">
                              <img
                                src={cert.image}
                                alt={`Certificado ${cert.title}`}
                                className="w-full h-52 object-cover"
                              />
                              <div className="absolute inset-0 transition" style={{ background: "transparent" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.3)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              />
                              <button
                                onClick={() => handleShowModal(cert.image, cert.title)}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:opacity-90"
                                style={{ background: "var(--rec-primary)" }}
                              >
                                <FaSearch size={12} />
                                Ver certificado
                              </button>
                            </div>
                            <div className="p-4">
                              <p className="text-xs font-semibold mb-2 text-slate-700">Habilidades adquiridas</p>
                              <div className="flex flex-wrap gap-2">
                                {cert.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                                    style={{ background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}
                                  >
                                    <FaCheckCircle size={10} />
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Detalles */}
                          <div className="flex items-start">
                            <div className="rounded-xl p-6 w-full" style={{ background: "var(--rec-soft)" }}>
                              <h4 className="font-semibold mb-4" style={{ color: "var(--rec-title)" }}>Detalles del certificado</h4>
                              <ul className="space-y-3">
                                {[
                                  { label: "Plataforma", value: cert.platform },
                                  { label: "Fecha de obtención", value: cert.date },
                                  { label: "Validación", value: "Verificado ✓" },
                                  { label: "Categoría", value: "Desarrollo Web" },
                                ].map((item) => (
                                  <li key={item.label} className="flex items-start gap-2 text-sm">
                                    <span className="text-slate-500 min-w-[130px]">{item.label}:</span>
                                    <span className="font-medium" style={{ color: "var(--rec-title)" }}>{item.value}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal lightbox */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-white shadow-2xl">
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--rec-soft)" }}
            >
              <div className="flex items-center gap-3">
                <FaCertificate style={{ color: "var(--rec-primary)" }} size={18} />
                <h3 className="font-semibold" style={{ color: "var(--rec-title)" }}>{selectedTitle}</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:opacity-80"
                style={{ background: "var(--rec-soft)", color: "var(--rec-title)" }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center bg-black/5 p-4 min-h-72">
              <img
                src={selectedImage}
                alt={selectedTitle}
                className="max-w-full h-auto rounded-lg shadow"
                style={{ maxHeight: "75vh", objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section
        className="py-16 text-center text-white"
        style={{ background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))" }}
      >
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-2xl font-extrabold mb-3">¿Conoces a nuestro equipo?</h2>
          <p className="text-white/80 mb-6">Explora el portafolio completo del equipo de desarrollo</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/portafolio" className="rounded-full px-7 py-3 text-sm font-bold bg-white transition hover:opacity-90" style={{ color: "var(--rec-primary-strong)" }}>
              Ver portafolio
            </a>
            <a href="/" className="rounded-full px-7 py-3 text-sm font-bold border border-white/50 text-white transition hover:bg-white/10">
              Volver al inicio
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section — obsoleto, reemplazado arriba, dejamos el cierre */}
      <Footer />
    </div>
  );
}