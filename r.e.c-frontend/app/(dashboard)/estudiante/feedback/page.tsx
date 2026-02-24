export default function FeedbackEstudiantePage() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Feedback</h1>
        <p className="text-slate-600">Consulta tu avance, comentarios y sugerencias de los docentes.</p>
      </header>

      <section className="space-y-3">
        {[
          { curso: "Matemáticas", nota: "Buen trabajo", detalle: "Refuerza fracciones y porcentajes." },
          { curso: "Ciencias", nota: "Excelente participación", detalle: "Sigue con la lectura previa." },
          { curso: "Lenguaje", nota: "Mejora ortografía", detalle: "Practica acentuación y signos." },
        ].map((fb, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-900">{fb.curso}</div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">{fb.nota}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{fb.detalle}</p>
          </div>
        ))}
      </section>
    </div>
  );
}