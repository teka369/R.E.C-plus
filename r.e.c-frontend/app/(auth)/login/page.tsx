"use client";
import { useState } from "react";
import Navbar from "@/components/layouts/Navbar";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await api.post("/auth/login", {
        email: normalizedEmail,
        password,
      });
      const { access_token, user } = res.data;
      // Este login es exclusivo para Estudiantes y Docentes
      if (user.role === "SECRETARIA") {
        setError("Este acceso es para estudiantes y docentes. Usa 'Acceso Secretaría'.");
        return;
      }
      await login(user, access_token);
      const target = user.role === "PROFESOR" ? "/docente" : "/estudiante";
      window.location.href = target;
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-xl font-semibold mb-4">Ingresar</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button disabled={loading} className="border rounded px-3 py-2 bg-black text-white">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-3">
          Si olvidaste tu contraseña, solicita el cambio presencial en Secretaría.
        </p>
      </section>
    </main>
  );
}