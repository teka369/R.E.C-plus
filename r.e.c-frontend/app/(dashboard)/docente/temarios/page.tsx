"use client";
import React, { useEffect, useMemo, useState } from "react";
import { materialsApi, type Syllabus, type CreateSyllabusInput } from "@/lib/materialsApi";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";

export default function TemariosDocentePage() {
  const { user } = useAuth();
  const teacherId = Number(user?.id) || 0;
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [assigns, setAssigns] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateSyllabusInput>({ groupId: 0, subjectId: 0, title: "", content: "" });
  const readyToCreate = useMemo(() => form.groupId > 0 && form.subjectId > 0 && form.title.trim().length > 0, [form]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const [sy, as] = await Promise.all([
          materialsApi.listSyllabi(),
          teacherId ? academicApi.listTeacherAssignments(teacherId) : Promise.resolve([]),
        ]);
        if (!abort) {
          setSyllabi(sy);
          setAssigns(as);
          if (as.length > 0) {
            setForm((prev) => ({ ...prev, groupId: as[0].group.id, subjectId: as[0].subject.id }));
          }
        }
      } catch (error: unknown) {
        if (!abort)
          setError(getErrorMessage(error, "Error cargando temarios"));
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [teacherId]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readyToCreate) return;
    setSaving(true);
    setError(null);
    try {
      const created = await materialsApi.createSyllabus(form);
      setSyllabi((prev) => [created, ...prev]);
      setForm((prev) => ({ ...prev, title: "", content: "" }));
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo crear"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Temarios</h1>
        <p className="text-slate-600">Planifica y organiza contenidos por curso para tus estudiantes.</p>
      </header>

      {loading && <p className="text-sm text-gray-600">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {assigns.length > 0 && (
        <form className="space-y-3" onSubmit={onCreate}>
          <h3 className="text-base font-medium">Crear temario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600">Grupo</label>
              <select className="mt-1 w-full border rounded p-2 text-sm" value={form.groupId} onChange={(e) => setForm((p) => ({ ...p, groupId: Number(e.target.value) }))}>
                {assigns.map((a) => (
                  <option key={a.id} value={a.group.id}>{a.group.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Materia</label>
              <select className="mt-1 w-full border rounded p-2 text-sm" value={form.subjectId} onChange={(e) => setForm((p) => ({ ...p, subjectId: Number(e.target.value) }))}>
                {assigns.map((a) => (
                  <option key={a.id} value={a.subject.id}>{a.subject.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Título</label>
              <input className="mt-1 w-full border rounded p-2 text-sm" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Contenido</label>
            <textarea className="mt-1 w-full border rounded p-2 text-sm" rows={4} value={form.content ?? ""} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
          </div>
          <button disabled={!readyToCreate || saving} className="px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? "Creando…" : "Crear temario"}</button>
        </form>
      )}

      <section className="space-y-2">
        <h3 className="text-base font-medium">Temarios disponibles</h3>
        {syllabi.length === 0 && <p className="text-sm text-gray-600">No hay temarios.</p>}
        <ul className="divide-y">
          {syllabi.map((s) => (
            <li key={s.id} className="py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-gray-600">Grupo #{s.groupId} · Materia #{s.subjectId}</p>
                </div>
              </div>
              {s.content && <p className="text-sm mt-1">{s.content}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}