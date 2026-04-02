import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--rec-soft)] bg-white p-8 text-center shadow-sm">
        <p className="text-5xl font-black text-[color:var(--rec-primary)]">404</p>
        <h1 className="mt-4 text-lg font-bold text-slate-900">
          Sección no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta sección del panel no existe o fue movida.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-[color:var(--rec-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--rec-primary-strong)]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
