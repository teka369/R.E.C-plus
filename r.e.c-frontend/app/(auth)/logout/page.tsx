"use client";
import { useEffect } from "react";
import Navbar from "@/components/layouts/Navbar";
import { useAuth } from "@/hooks/useAuth";

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    // Forzar limpieza de sesión (cookies y localStorage) y redirección
    logout();
  }, [logout]);

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-xl font-semibold mb-2">Cerrando sesión…</h1>
        <p className="text-sm text-rec-text-muted">Limpiando sesión y redirigiendo.</p>
      </section>
    </main>
  );
}