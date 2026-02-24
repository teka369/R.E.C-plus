"use client";

import React, { useState } from "react";
import Footer from "@/components/layouts/Footer";
import { FaCertificate, FaCode, FaUserGraduate, FaSearch } from "react-icons/fa";

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <section className="mb-10 text-center py-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-center mb-4">
            <FaCertificate className="text-indigo-600" size={64} />
          </div>
          <h1 className="text-4xl font-bold mb-3">Certificaciones del Equipo</h1>
          <p className="text-slate-600">Nuestro compromiso con la excelencia y el aprendizaje continuo</p>
        </div>
      </section>

      {/* Team Certificates Section */}
      <div className="mx-auto max-w-5xl px-6">
        {teamMembers.map((member, idx) => (
          <div key={idx} className="mb-10">
            {/* Member Header */}
            <div className="relative p-8 bg-white rounded-2xl shadow-sm mb-4">
              <div className="flex items-center gap-3">
                <FaUserGraduate className="text-indigo-600" size={24} />
                <div>
                  <h2 className="text-xl font-semibold">{member.name}</h2>
                  <h3 className="text-slate-600">{member.role}</h3>
                </div>
              </div>
            </div>

            {/* Accordion */}
            <div className="space-y-4">
              {member.certificates.map((cert, cidx) => {
                const key = `${idx}-${cidx}`;
                const open = !!openKeys[key];
                return (
                  <div key={key} className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
                    {/* Header */}
                    <button
                      onClick={() => toggleKey(key)}
                      className={`w-full text-left p-4 flex items-center gap-3 transition ${
                        open ? "bg-slate-50 text-indigo-700" : "bg-white"
                      }`}
                    >
                      <FaCode className="text-indigo-600" />
                      <div>
                        <strong className="block">{cert.title}</strong>
                        <div className="text-slate-500 text-sm">
                          {cert.platform} • {cert.date}
                        </div>
                      </div>
                      <span className="ml-auto text-slate-400">{open ? "▲" : "▼"}</span>
                    </button>

                    {/* Body */}
                    {open && (
                      <div className="p-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Card with image and overlay */}
                          <div className="rounded-2xl overflow-hidden border-none shadow-sm">
                            <div className="group relative overflow-hidden">
                              <img
                                src={cert.image}
                                alt={`Certificado ${cert.title}`}
                                className="w-full md:h-[300px] h-[200px] object-cover"
                              />
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
                              {/* Floating button */}
                              <button
                                onClick={() => handleShowModal(cert.image, cert.title)}
                                className="absolute bottom-[-100%] left-1/2 -translate-x-1/2 transition-all duration-300 z-10 group-hover:bottom-5 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-medium shadow"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <FaSearch />
                                  Ver Certificado
                                </span>
                              </button>
                            </div>
                            <div className="p-4">
                              <h5 className="font-semibold">Habilidades Adquiridas:</h5>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {cert.skills.map((skill, sidx) => (
                                  <span
                                    key={sidx}
                                    className="inline-flex items-center rounded-full bg-indigo-600 text-white px-3 py-2 text-xs font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="md:flex md:items-center">
                            <div className="p-6 bg-slate-100 rounded-2xl w-full">
                              <h4 className="font-semibold mb-2">Detalles del Certificado</h4>
                              <ul className="space-y-1 text-slate-700">
                                <li>
                                  <strong>Plataforma:</strong> {cert.platform}
                                </li>
                                <li>
                                  <strong>Fecha de Obtención:</strong> {cert.date}
                                </li>
                                <li>
                                  <strong>Validación:</strong> Verificado
                                </li>
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative mx-auto max-w-5xl px-6 py-10">
            <div className="rounded-2xl overflow-hidden bg-white/95 shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="font-semibold">{selectedTitle}</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200"
                >
                  Cerrar
                </button>
              </div>
              <div className="flex items-center justify-center min-h-[300px] bg-black p-4">
                <img
                  src={selectedImage}
                  alt={selectedTitle}
                  className="max-w-full h-auto"
                  style={{ maxHeight: "80vh", objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <section className="bg-indigo-600 text-white py-10 mt-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 text-center gap-8">
            <div>
              <h3 className="text-5xl font-extrabold mb-2">9</h3>
              <p className="text-lg">Certificados Totales</p>
            </div>
            <div>
              <h3 className="text-5xl font-extrabold mb-2">3</h3>
              <p className="text-lg">Miembros del Equipo</p>
            </div>
            <div>
              <h3 className="text-5xl font-extrabold mb-2">100%</h3>
              <p className="text-lg">Certificados Verificados</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}