"use client";
import { useAuth } from "@/hooks/useAuth";

export default function EstudiantePerfilPage() {
  const { user } = useAuth();
  const nombre = (user?.name || "").trim() || user?.email?.split("@")[0] || "Estudiante";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Perfil del Estudiante</h1>
      <p className="mt-1 text-slate-600">Información básica de tu cuenta.</p>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
          <h2 className="text-sm font-medium text-slate-900">Datos personales</h2>
          <div className="mt-3 space-y-1 text-sm">
            <p><span className="text-slate-500">Nombre: </span>{nombre}</p>
            <p><span className="text-slate-500">Correo: </span>{user?.email || "—"}</p>
            <p><span className="text-slate-500">Rol: </span>{user?.role || "ESTUDIANTE"}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm md:col-span-2">
          <h2 className="text-sm font-medium text-slate-900">Resumen</h2>
          <p className="mt-3 text-sm text-slate-600">Aquí podrás ver y editar tu información, grupos y horarios. Próximamente.</p>
        </div>
      </section>
    </main>
  );
}