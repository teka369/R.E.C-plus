import Link from "next/link";

export default function InformacionPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Información</h1>
      <p className="mt-2 text-sm text-slate-700">
        R.E.C (Refuerzo Educativo Complementario) centraliza el seguimiento académico para docentes,
        estudiantes y secretaría.
      </p>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Módulos principales</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Horarios y recuperaciones.</li>
          <li>Temarios y materiales de estudio.</li>
          <li>Feedback y comunicación docente-estudiante.</li>
          <li>Rendimiento académico por grupo.</li>
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/tutorial" className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Abrir tutorial
        </Link>
        <Link href="/Contacto" className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Contacto
        </Link>
      </div>
    </main>
  );
}
