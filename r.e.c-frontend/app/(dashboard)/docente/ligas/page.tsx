export default function LigasDocentePage() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Ligas</h1>
        <p className="text-slate-600">Gestiona enlaces y recursos externos para tus clases.</p>
      </header>

      <section className="space-y-3">
        {[
          { nombre: "Repositorio curso", url: "https://example.com/repo" },
          { nombre: "Video clase 1", url: "https://example.com/video" },
          { nombre: "Lectura complementaria", url: "https://example.com/docs" },
        ].map((item) => (
          <div key={item.url} className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">{item.nombre}</div>
              <a href={item.url} className="text-xs text-emerald-700 hover:underline" target="_blank" rel="noreferrer">
                {item.url}
              </a>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-md text-sm border border-slate-300 text-slate-700 hover:bg-slate-100">Editar</button>
              <button className="px-3 py-1.5 rounded-md text-sm text-white bg-red-600 hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        ))}
        <div className="mt-4">
          <button className="px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700">Agregar enlace</button>
        </div>
      </section>
    </div>
  );
}