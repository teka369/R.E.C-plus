"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type GroupSubject } from "@/lib/academicApi";
import { materialsApi, type Syllabus } from "@/lib/materialsApi";
import { getErrorMessage } from "@/lib/errors";

export default function EstudianteTemariosPage() {
  const { user } = useAuth();
  const [querySubjectId, setQuerySubjectId] = useState(0);

  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [subjects, setSubjects] = useState<GroupSubject[]>([]);
  const [groupId, setGroupId] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = Number(new URLSearchParams(window.location.search).get("materia") ?? 0) || 0;
    setQuerySubjectId(value);
  }, []);

  useEffect(() => {
    const run = async () => {
      const studentId = Number(user?.id);
      if (!studentId) return;
      setLoading(true);
      setError(null);
      try {
        const [studentGroup, studentSubjects, allSyllabi] = await Promise.all([
          academicApi.getStudentGroup(studentId),
          academicApi.listStudentSubjects(studentId),
          materialsApi.listSyllabi(),
        ]);

        const currentGroupId = studentGroup?.group.id ?? 0;
        setGroupId(currentGroupId);
        setSubjects(studentSubjects);
        setSyllabi(allSyllabi.filter((item) => item.groupId === currentGroupId));

        const hasQuerySubject = querySubjectId > 0 && studentSubjects.some((item) => item.subject.id === querySubjectId);
        setSelectedSubjectId(hasQuerySubject ? querySubjectId : 0);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar temarios"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [querySubjectId, user?.id]);

  const subjectNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of subjects) {
      map.set(item.subject.id, item.subject.nombre);
    }
    return map;
  }, [subjects]);

  const visibleSyllabi = useMemo(() => {
    if (!selectedSubjectId) return syllabi;
    return syllabi.filter((item) => item.subjectId === selectedSubjectId);
  }, [selectedSubjectId, syllabi]);

  return (
    <section className="p-6 space-y-6">
      <header>
        <h2 className="text-lg font-semibold mb-1">Temarios</h2>
        <p className="text-sm text-gray-600">Listado de temarios y contenidos por materia.</p>
      </header>

      {loading ? <p className="text-sm text-gray-600">Cargando…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Grupo</p>
                <p className="text-sm font-medium text-slate-800">{groupId ? `#${groupId}` : "Sin grupo asignado"}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Filtrar por materia</label>
                <select
                  className="mt-1 w-full border rounded p-2 text-sm"
                  value={selectedSubjectId}
                  onChange={(event) => setSelectedSubjectId(Number(event.target.value))}
                >
                  <option value={0}>Todas</option>
                  {subjects.map((item) => (
                    <option key={item.id} value={item.subject.id}>
                      {item.subject.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {visibleSyllabi.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <span className="text-xs text-slate-600">{subjectNameById.get(item.subjectId) ?? `Materia #${item.subjectId}`}</span>
                </div>
                {item.content ? <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{item.content}</p> : <p className="mt-2 text-sm text-slate-500">Sin contenido detallado.</p>}
              </article>
            ))}
            {visibleSyllabi.length === 0 ? <p className="text-sm text-gray-600">No hay temarios para mostrar.</p> : null}
          </div>
        </>
      ) : null}
    </section>
  );
}