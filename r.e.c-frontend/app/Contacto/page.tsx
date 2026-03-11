import Link from "next/link";

export default function ContactoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Contacto</h1>
      <p className="mt-2 text-sm text-slate-700">
        Para soporte de acceso o gestión de usuarios, comunícate con secretaría de tu institución.
      </p>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm text-sm text-slate-700">
        <p><span className="font-medium text-slate-900">Canal recomendado:</span> Secretaría académica.</p>
        <p className="mt-2"><span className="font-medium text-slate-900">Horarios de atención:</span> definidos por la institución.</p>
        <p className="mt-2"><span className="font-medium text-slate-900">Detalle de incidencia:</span> incluye nombre, rol y descripción breve del problema.</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/acceso-secretaria" className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Acceso secretaría
        </Link>
        <Link href="/Informacion" className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Volver a información
        </Link>
      </div>
    </main>
  );
}
