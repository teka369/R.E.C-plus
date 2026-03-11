"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ReportesPage() {
  const { user } = useAuth();
  const role = user?.role;

  const reportLink =
    role === "PROFESOR"
      ? "/docente/ligas"
      : role === "ESTUDIANTE"
        ? "/estudiante"
        : role === "SECRETARIA"
          ? "/secretaria/performance"
          : "/login";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Reportes</h1>
      <p className="mt-2 text-sm text-slate-700">
        En R.E.C 2.0 los reportes académicos se gestionan desde el módulo de rendimiento por rol.
      </p>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Acceso directo</h2>
        <p className="mt-2 text-sm text-slate-700">
          Abre el panel de rendimiento correspondiente a tu perfil.
        </p>
        <Link
          href={reportLink}
          className="mt-4 inline-flex rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Ir a rendimiento
        </Link>
      </section>
    </main>
  );
}
