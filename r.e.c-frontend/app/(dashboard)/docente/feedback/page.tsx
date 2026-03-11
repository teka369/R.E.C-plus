"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type GroupStudentDTO, type TeacherAssignment } from "@/lib/academicApi";
import { communicationApi, type FeedbackDTO } from "@/lib/communicationApi";
import { getErrorMessage } from "@/lib/errors";

export default function DocenteFeedbackPage() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [students, setStudents] = useState<GroupStudentDTO[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackDTO[]>([]);

  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("0");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [strengthsText, setStrengthsText] = useState("");
  const [improvementsText, setImprovementsText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>();
    assignments.forEach((item) => {
      if (!item.group?.id) return;
      map.set(item.group.id, {
        id: item.group.id,
        label: `${item.group.grade?.nombre ?? item.group.gradeId ?? "Grado"} - ${item.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

  const subjectsInGroup = useMemo(() => {
    if (!selectedGroupId) return [] as TeacherAssignment[];
    return assignments.filter((item) => item.group.id === selectedGroupId);
  }, [assignments, selectedGroupId]);

  useEffect(() => {
    const run = async () => {
      const teacherId = Number(user?.id);
      if (!teacherId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await academicApi.listTeacherAssignments(teacherId);
        setAssignments(data);
        const firstGroup = data[0]?.group.id ?? null;
        setSelectedGroupId(firstGroup);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudieron cargar asignaciones"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!selectedGroupId) {
        setStudents([]);
        setFeedbackList([]);
        setStudentId("");
        return;
      }
      setError(null);
      try {
        const groupStudents = await academicApi.listGroupStudents(selectedGroupId);
        setStudents(groupStudents);
        const firstStudent = groupStudents[0]?.id;
        if (firstStudent) {
          setStudentId(String(firstStudent));
          const list = await communicationApi.listFeedbackByStudent(firstStudent);
          setFeedbackList(list);
        } else {
          setFeedbackList([]);
        }
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar estudiantes o feedback"));
      }
    };
    void run();
  }, [selectedGroupId]);

  useEffect(() => {
    const run = async () => {
      if (!studentId) {
        setFeedbackList([]);
        return;
      }
      try {
        const list = await communicationApi.listFeedbackByStudent(Number(studentId));
        setFeedbackList(list);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar feedback del estudiante"));
      }
    };
    void run();
  }, [studentId]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const teacherId = Number(user?.id);
    if (!teacherId || !selectedGroupId || !studentId || !title.trim() || !content.trim()) {
      setError("Completa grupo, estudiante, título y contenido");
      return;
    }

    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const strengths = strengthsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      const improvements = improvementsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      await communicationApi.createFeedback({
        teacherId,
        studentId: Number(studentId),
        groupId: selectedGroupId,
        subjectId: Number(subjectId) > 0 ? Number(subjectId) : undefined,
        title: title.trim(),
        content: content.trim(),
        strengths: strengths.length > 0 ? { items: strengths } : undefined,
        improvements: improvements.length > 0 ? { items: improvements } : undefined,
      });

      const list = await communicationApi.listFeedbackByStudent(Number(studentId));
      setFeedbackList(list);
      setTitle("");
      setContent("");
      setStrengthsText("");
      setImprovementsText("");
      setOk("Feedback creado correctamente");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo crear feedback"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Feedback</h2>
      <p className="text-sm text-gray-600">Observaciones y retroalimentación para estudiantes.</p>

      {loading ? <p className="text-sm text-gray-600">Cargando…</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form className="space-y-2 border rounded p-3" onSubmit={onSubmit}>
          <h3 className="font-medium">Nuevo feedback</h3>

          <select
            className="w-full border rounded p-2 text-sm"
            value={selectedGroupId ?? ""}
            onChange={(event) => setSelectedGroupId(Number(event.target.value) || null)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>

          <select className="w-full border rounded p-2 text-sm" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            <option value="">Selecciona estudiante</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.nombres} {student.apellidos}
              </option>
            ))}
          </select>

          <select className="w-full border rounded p-2 text-sm" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            <option value="0">Sin materia específica</option>
            {subjectsInGroup.map((item) => (
              <option key={item.id} value={item.subject.id}>
                {item.subject.nombre}
              </option>
            ))}
          </select>

          <input className="w-full border rounded p-2 text-sm" placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} />
          <textarea className="w-full border rounded p-2 text-sm" rows={4} placeholder="Contenido" value={content} onChange={(event) => setContent(event.target.value)} />
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            placeholder="Fortalezas (una por línea)"
            value={strengthsText}
            onChange={(event) => setStrengthsText(event.target.value)}
          />
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            placeholder="Mejoras (una por línea)"
            value={improvementsText}
            onChange={(event) => setImprovementsText(event.target.value)}
          />

          <button disabled={saving} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">
            Guardar feedback
          </button>
        </form>

        <section className="border rounded p-3">
          <h3 className="font-medium mb-2">Historial del estudiante</h3>
          <ul className="space-y-2">
            {feedbackList.map((item) => (
              <li key={item.id} className="border rounded p-2 text-sm">
                <p className="font-medium">{item.title}</p>
                <p>{item.content}</p>
                {item.strengths?.items?.length ? <p className="text-xs text-emerald-700 mt-1">Fortalezas: {item.strengths.items.join(", ")}</p> : null}
                {item.improvements?.items?.length ? <p className="text-xs text-amber-700">Mejoras: {item.improvements.items.join(", ")}</p> : null}
                {item.createdAt ? <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p> : null}
              </li>
            ))}
            {feedbackList.length === 0 ? <li className="text-sm text-gray-600">Sin feedback registrado.</li> : null}
          </ul>
        </section>
      </div>
    </section>
  );
}