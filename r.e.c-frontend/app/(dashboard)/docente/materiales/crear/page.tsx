"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import { materialsApi, type CreateStudyMaterialInput } from "@/lib/materialsApi";

export default function CrearMaterialPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [form, setForm] = useState<Partial<CreateStudyMaterialInput>>({ type: "LINK", visibility: "GROUP" } as any);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const isImageUrl = (url?: string | null) => !!url && /(\.png|\.jpe?g|\.gif|\.webp|\.bmp)$/i.test(url);

  useEffect(() => {
    const idNum = Number(user?.id);
    if (!idNum) return;
    academicApi.listTeacherAssignments(idNum).then(setAssignments).catch(() => setAssignments([]));
  }, [user]);

  const groupOptions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const a of assignments) {
      if (!seen.has(a.group.id)) seen.set(a.group.id, `${a.group.grade?.nombre ?? a.group.grade?.id}-${a.group.nombre}`);
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [assignments]);

  const subjectOptions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const a of assignments) {
      if (!seen.has(a.subject.id)) seen.set(a.subject.id, a.subject.nombre);
    }
    return Array.from(seen.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [assignments]);

  const canSubmit = !!form.title && !!form.groupId && !!form.subjectId && !!form.type && !!form.visibility;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await materialsApi.createStudy({
        subjectId: Number(form.subjectId),
        groupId: Number(form.groupId),
        title: String(form.title),
        description: form.description || undefined,
        type: form.type!,
        resourceUrl: form.resourceUrl || undefined,
        imageUrl: form.imageUrl || undefined,
        filePath: form.filePath || undefined,
        visibility: form.visibility!,
      });
      setOk("Material creado correctamente");
      setForm({ type: form.type, visibility: form.visibility } as any);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Error al crear material");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Crear material</h2>
          <p className="text-sm text-gray-600">Complete los campos para publicar material al grupo/materia.</p>
        </div>
        <Link href="/docente/materiales" prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Volver</Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-700">{ok}</p>}

      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Grupo</label>
            <select
              className="mt-1 w-full border rounded p-2 text-sm"
              value={String(form.groupId ?? "")}
              onChange={(e) => setForm((prev) => ({ ...prev, groupId: Number(e.target.value) }))}
            >
              <option value="">Seleccione grupo</option>
              {groupOptions.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Materia</label>
            <select
              className="mt-1 w-full border rounded p-2 text-sm"
              value={String(form.subjectId ?? "")}
              onChange={(e) => setForm((prev) => ({ ...prev, subjectId: Number(e.target.value) }))}
            >
              <option value="">Seleccione materia</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Título</label>
            <input className="mt-1 w-full border rounded p-2 text-sm" value={form.title ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Tipo</label>
            <select className="mt-1 w-full border rounded p-2 text-sm" value={form.type ?? "LINK"} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as any }))}>
              {(["PDF", "VIDEO", "LINK", "DOC", "OTHER"] as const).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600">Descripción</label>
          <textarea className="mt-1 w-full border rounded p-2 text-sm" rows={3} value={form.description ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">URL del recurso</label>
            <input className="mt-1 w-full border rounded p-2 text-sm" value={form.resourceUrl ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, resourceUrl: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-600">URL de imagen (miniatura)</label>
            <input className="mt-1 w-full border rounded p-2 text-sm" value={form.imageUrl ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
            {isImageUrl(form.imageUrl) && (
              <img src={form.imageUrl!} alt="Vista previa" className="mt-2 h-24 w-auto rounded border" />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Visibilidad</label>
            <select className="mt-1 w-full border rounded p-2 text-sm" value={form.visibility ?? "GROUP"} onChange={(e) => setForm((prev) => ({ ...prev, visibility: e.target.value as any }))}>
              {(["GROUP", "GRADE"] as const).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <button disabled={!canSubmit || saving} className="px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? "Guardando…" : "Crear"}</button>
        </div>
      </form>
    </section>
  );
}
