import Link from "next/link";

export default function TutorialPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Tutorial de uso</h1>
      <p className="mt-2 text-sm text-slate-700">
        Esta guía rápida resume cómo navegar R.E.C 2.0 según tu rol.
      </p>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Primeros pasos</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Ingresa con tus credenciales institucionales.</li>
          <li>Desde tu panel podrás consultar horario, materiales, temarios y recuperaciones.</li>
          <li>Usa el menú lateral para cambiar entre módulos.</li>
          <li>En el menú de perfil puedes cambiar tu contraseña.</li>
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/login" className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Ir a iniciar sesión
        </Link>
        <Link href="/Informacion" className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Ver información general
        </Link>
      </div>
    </main>
  );
}
