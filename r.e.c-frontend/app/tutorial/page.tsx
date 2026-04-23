import type { Metadata } from "next";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";
import UserManualExperience from "@/components/tutorial/UserManualExperience";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Manual de Usuario — Guía Completa por Rol",
  description:
    "Manual interactivo de Recedu para docentes, secretaría y estudiantes. Aprende a usar cada módulo de la plataforma de gestión académica paso a paso: horarios, materiales, temarios, recuperaciones y más.",
  alternates: { canonical: "/tutorial" },
  openGraph: {
    title: "Manual de Usuario | Recedu",
    description:
      "Guía completa para usar Recedu: módulos, roles y funcionalidades explicadas paso a paso para docentes, secretaría y estudiantes.",
    url: "/tutorial",
  },
};

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-rec-bg-base text-rec-text-primary">
      <Navbar />
      <main>
        <UserManualExperience />
      </main>
      <Footer />
    </div>
  );
}
