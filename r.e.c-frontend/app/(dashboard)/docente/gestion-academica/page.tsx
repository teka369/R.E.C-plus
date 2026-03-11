"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import {
  performanceApi,
  type GroupAcademicOverview,
  type StudentAcademicRecord,
  type UpsertStudentAcademicInput,
} from "@/lib/performanceApi";

type SubjectFormState = {
  parcial1: string;
  parcial2: string;
  parcial3: string;
  parcial4: string;
  notaFinal: string;
  progresoMateria: string;
  inasistenciasJustificadas: string;
  inasistenciasInjustificadas: string;
  observaciones: string;
};

function fromRecord(record: StudentAcademicRecord | undefined): SubjectFormState {
  return {
    parcial1: record?.parcial1 == null ? "" : String(record.parcial1),
    parcial2: record?.parcial2 == null ? "" : String(record.parcial2),
    parcial3: record?.parcial3 == null ? "" : String(record.parcial3),
    parcial4: record?.parcial4 == null ? "" : String(record.parcial4),
    notaFinal: record?.notaFinal == null ? "" : String(record.notaFinal),
    progresoMateria: record?.progresoMateria == null ? "" : String(record.progresoMateria),
    inasistenciasJustificadas:
      record?.inasistenciasJustificadas == null ? "0" : String(record.inasistenciasJustificadas),
    inasistenciasInjustificadas:
      record?.inasistenciasInjustificadas == null ? "0" : String(record.inasistenciasInjustificadas),
    observaciones: record?.observaciones ?? "",
  };
}

function toNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default function DocenteGestionAcademicaPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [overview, setOverview] = useState<GroupAcademicOverview | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingSubjectId, setSavingSubjectId] = useState<number | null>(null);

  const groups = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>();
    assignments.forEach((item) => {
      if (!item.group?.id) return;
      map.set(item.group.id, {
        id: item.group.id,
        label: `${item.group.grade?.nombre ?? "Grado"} - ${item.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

  const subjectIdsAssignedToTeacher = useMemo(() => {
    const groupId = Number(selectedGroupId);
    if (!groupId) return new Set<number>();
    return new Set(
      assignments
        .filter((item) => item.group.id === groupId)
        .map((item) => item.subject.id),
    );
  }, [assignments, selectedGroupId]);

  const selectedStudent = useMemo(() => {
    const id = Number(selectedStudentId);
    if (!id || !overview) return null;
    return overview.students.find((item) => item.student.id === id) ?? null;
  }, [overview, selectedStudentId]);

  useEffect(() => {
    const run = async () => {
      const teacherId = Number(user?.id);
      if (!teacherId) return;

      try {
        setLoadingAssignments(true);
        setError(null);
        const list = await academicApi.listTeacherAssignments(teacherId);
        setAssignments(list);
        const firstGroup = list[0]?.group;
        if (firstGroup?.id) setSelectedGroupId(String(firstGroup.id));
      } catch {
        setError("No se pudieron cargar tus grupos asignados");
      } finally {
        setLoadingAssignments(false);
      }
    };

    void run();
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      const groupId = Number(selectedGroupId);
      if (!groupId) {
        setOverview(null);
        setSelectedStudentId("");
        return;
      }

      try {
        setLoadingOverview(true);
        setError(null);
        const data = await performanceApi.getGroupAcademicOverview(groupId);
        setOverview(data);
        const firstStudent = data.students[0]?.student;
        setSelectedStudentId(firstStudent ? String(firstStudent.id) : "");
      } catch {
        setError("No se pudo cargar la gestión académica del grupo");
      } finally {
        setLoadingOverview(false);
      }
    };

    void run();
  }, [selectedGroupId]);

  const saveSubject = async (subjectId: number, form: SubjectFormState, event: FormEvent) => {
    event.preventDefault();
    const groupId = Number(selectedGroupId);
    const studentId = Number(selectedStudentId);
    if (!groupId || !studentId) return;

    const payload: UpsertStudentAcademicInput = {
      parcial1: toNumber(form.parcial1),
      parcial2: toNumber(form.parcial2),
      parcial3: toNumber(form.parcial3),
      parcial4: toNumber(form.parcial4),
      notaFinal: toNumber(form.notaFinal),
      progresoMateria: toNumber(form.progresoMateria),
      inasistenciasJustificadas: toNumber(form.inasistenciasJustificadas),
      inasistenciasInjustificadas: toNumber(form.inasistenciasInjustificadas),
      observaciones: form.observaciones.trim() || undefined,
    };

    try {
      setSavingSubjectId(subjectId);
      setError(null);
      setMessage(null);
      await performanceApi.upsertStudentAcademic(groupId, studentId, subjectId, payload);
      const refreshed = await performanceApi.getGroupAcademicOverview(groupId);
      setOverview(refreshed);
      setMessage("Gestión académica actualizada correctamente");
    } catch {
      setError("No se pudo guardar la gestión académica para esa materia");
    } finally {
      setSavingSubjectId(null);
    }
  };

  return (
    <section className="p-4 space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Gestión académica</h1>
        <p className="text-sm text-slate-600">Registra notas, progreso e inasistencias por estudiante y materia.</p>
      </header>

      {message ? <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div> : null}
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {loadingAssignments ? <p className="text-sm text-slate-600">Cargando grupos asignados...</p> : null}

      {!loadingAssignments && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Grupo</span>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Estudiante</span>
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={!overview || overview.students.length === 0}
            >
              {overview?.students.map((item) => (
                <option key={item.student.id} value={item.student.id}>
                  {item.student.apellidos} {item.student.nombres}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {loadingOverview ? <p className="text-sm text-slate-600">Cargando gestión académica del grupo...</p> : null}

      {!loadingOverview && selectedStudent && overview ? (
        <>
          <div className="rounded border border-slate-200 bg-white p-3 text-sm">
            <p className="text-slate-500">Estudiante seleccionado</p>
            <p className="font-semibold text-slate-900">
              {selectedStudent.student.nombres} {selectedStudent.student.apellidos}
            </p>
            <p className="text-slate-600">Promedio general actual: {selectedStudent.promedioGeneral?.toFixed(2) ?? "—"}</p>
          </div>

          <div className="space-y-3">
            {overview.subjects.map((subject) => {
              const record = selectedStudent.records.find((item) => item.subjectId === subject.id);
              const editable = subjectIdsAssignedToTeacher.has(subject.id);
              return (
                <SubjectEditor
                  key={`${selectedStudent.student.id}-${subject.id}-${record?.updatedAt ?? "new"}`}
                  subjectName={subject.nombre}
                  subjectId={subject.id}
                  initialValue={fromRecord(record)}
                  disabled={!editable}
                  saving={savingSubjectId === subject.id}
                  onSave={saveSubject}
                />
              );
            })}
          </div>
        </>
      ) : null}

      {!loadingAssignments && groups.length === 0 ? (
        <p className="text-sm text-slate-600">No tienes grupos asignados para gestionar información académica.</p>
      ) : null}
    </section>
  );
}

function SubjectEditor({
  subjectId,
  subjectName,
  initialValue,
  disabled,
  saving,
  onSave,
}: {
  subjectId: number;
  subjectName: string;
  initialValue: SubjectFormState;
  disabled: boolean;
  saving: boolean;
  onSave: (subjectId: number, form: SubjectFormState, event: FormEvent) => Promise<void>;
}) {
  const [form, setForm] = useState<SubjectFormState>(initialValue);

  useEffect(() => {
    setForm(initialValue);
  }, [initialValue]);

  const setField = (field: keyof SubjectFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form
      onSubmit={(event) => void onSave(subjectId, form, event)}
      className="rounded border border-slate-200 bg-white p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{subjectName}</h2>
        {!disabled ? null : <span className="text-xs text-amber-700">Solo lectura (no asignada a ti)</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Input label="Parcial 1" value={form.parcial1} onChange={(v) => setField("parcial1", v)} disabled={disabled} />
        <Input label="Parcial 2" value={form.parcial2} onChange={(v) => setField("parcial2", v)} disabled={disabled} />
        <Input label="Parcial 3" value={form.parcial3} onChange={(v) => setField("parcial3", v)} disabled={disabled} />
        <Input label="Parcial 4" value={form.parcial4} onChange={(v) => setField("parcial4", v)} disabled={disabled} />
        <Input label="Nota final" value={form.notaFinal} onChange={(v) => setField("notaFinal", v)} disabled={disabled} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input label="Progreso (%)" value={form.progresoMateria} onChange={(v) => setField("progresoMateria", v)} disabled={disabled} />
        <Input
          label="Inasistencias justif."
          value={form.inasistenciasJustificadas}
          onChange={(v) => setField("inasistenciasJustificadas", v)}
          disabled={disabled}
        />
        <Input
          label="Inasistencias injustif."
          value={form.inasistenciasInjustificadas}
          onChange={(v) => setField("inasistenciasInjustificadas", v)}
          disabled={disabled}
        />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-slate-500">Observaciones</span>
        <textarea
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          rows={3}
          value={form.observaciones}
          onChange={(e) => setField("observaciones", e.target.value)}
          disabled={disabled}
        />
      </label>

      <button
        type="submit"
        disabled={disabled || saving}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar materia"}
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <input
        type="number"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </label>
  );
}
