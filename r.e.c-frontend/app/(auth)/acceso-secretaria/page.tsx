"use client";
import { useState } from "react";
import Navbar from "@/components/layouts/Navbar";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";

export default function AccesoSecretariaPage() {
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
      const res = await api.post("/auth/login", { email, password });
      const { access_token, user } = res.data;
      if (user.role !== "SECRETARIA") {
        setError("Acceso exclusivo para Secretaría");
        return;
      }
      await login(user, access_token);
      window.location.href = "/secretaria";
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">Acceso Secretaría</h1>
        <form onSubmit={onSubmit} className="space-y-3 max-w-sm">
          <label className="text-sm text-gray-700">Correo</label>
          <input
            type="email"
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="secretaria@rec.com"
            required
          />
          <label className="text-sm text-gray-700">Contraseña</label>
          <input
            type="password"
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded bg-black text-white px-3 py-2 text-sm"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-3">Este acceso está habilitado sólo para personal de Secretaría.</p>
      </main>
    </>
  );
}