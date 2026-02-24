"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { materialsApi, type StudyMaterial, type UpdateStudyMaterialInput } from "@/lib/materialsApi";

export default function EditarMaterialPage() {
  const params = useParams();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string | undefined);
  const idNum = Number(idParam);
  const { user } = useAuth();
  const isProfessor = user?.role === "PROFESOR";
  const [item, setItem] = useState<StudyMaterial | null>(null);
  const [form, setForm] = useState<UpdateStudyMaterialInput>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const data = await materialsApi.getStudy(idNum);
        if (!abort) {
          setItem(data);
          setForm({ title: data.title, description: data.description ?? undefined, resourceUrl: data.resourceUrl ?? undefined, imageUrl: data.imageUrl ?? undefined, filePath: data.filePath ?? undefined, type: data.type, visibility: data.visibility });
        }
      } catch (e: any) {
        if (!abort) setError(e?.message || "Error cargando material");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [idNum]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfessor) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const updated = await materialsApi.updateStudy(idNum, form);
      setItem(updated);
      setOk("Material actualizado");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!isProfessor) return;
    try {
      await materialsApi.deleteStudy(idNum);
      setOk("Material eliminado");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Error al eliminar");
    } finally {
      setConfirmDelete(false);
    }
  };

  const isImageUrl = (url?: string | null) => !!url && /(\.png|\.jpe?g|\.gif|\.webp|\.bmp)$/i.test(url);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Editar material #{idNum}</h2>
        <div className="flex gap-2">
          <Link href={`/materiales/${idNum}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Ver</Link>
          <Link href={`/docente/materiales`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Volver</Link>
        </div>
      </div>
      {!isProfessor && <p className="text-sm text-red-600">No autorizado. Solo docentes pueden editar/eliminar materiales.</p>}
      {loading && <p className="text-sm text-gray-600">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-700">{ok}</p>}

      {item && (
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600">Título</label>
              <input className="mt-1 w-full border rounded p-2 text-sm" value={form.title ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Tipo</label>
              <select className="mt-1 w-full border rounded p-2 text-sm" value={form.type ?? item.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as any }))}>
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
              <select className="mt-1 w-full border rounded p-2 text-sm" value={form.visibility ?? item.visibility} onChange={(e) => setForm((prev) => ({ ...prev, visibility: e.target.value as any }))}>
                {(["GROUP", "GRADE"] as const).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <button disabled={saving || !isProfessor} className="px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? "Guardando…" : "Guardar"}</button>
            {!confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={!isProfessor} className="px-4 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Eliminar</button>
            )}
            {confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">¿Confirmar?</span>
                <button type="button" onClick={onDeleteConfirm} className="px-2 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">Sí</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-md text-xs border border-gray-300 text-gray-700 hover:bg-gray-100">No</button>
              </div>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
