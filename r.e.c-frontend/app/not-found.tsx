import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f0f8f3_0%,_#f8fbf9_40%,_#ffffff_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--rec-soft)] bg-white p-8 text-center shadow-lg">
        <p className="text-6xl font-black text-[color:var(--rec-primary)]">404</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-[color:var(--rec-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--rec-primary-strong)]"
          >
            Ir al inicio
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
