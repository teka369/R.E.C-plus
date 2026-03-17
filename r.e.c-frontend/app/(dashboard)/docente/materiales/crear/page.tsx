"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import { materialsApi, type CreateStudyMaterialInput } from "@/lib/materialsApi";
import { getErrorMessage } from "@/lib/errors";

export default function CrearMaterialPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [form, setForm] = useState<Partial<CreateStudyMaterialInput>>({
    type: "LINK",
    visibility: "GROUP",
  });
  const [saving, setSaving] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [localImageDataUrl, setLocalImageDataUrl] = useState<string | null>(null);
  const [localImageName, setLocalImageName] = useState<string | null>(null);
  const [showHeavyImageModal, setShowHeavyImageModal] = useState(false);
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  const [localResourceFile, setLocalResourceFile] = useState<File | null>(null);
  const [localResourceName, setLocalResourceName] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const isImageUrl = (url?: string | null) => {
    if (!url) return false;
    const value = url.trim();
    if (!value) return false;
    if (/^data:image\//i.test(value)) return true;
    if (/^https?:\/\//i.test(value)) return true;
    return /(\.png|\.jpe?g|\.gif|\.webp|\.bmp)(\?.*)?(#.*)?$/i.test(value);
  };

  useEffect(() => {
    const idNum = Number(user?.id);
    if (!idNum) {
      setLoadingAssignments(false);
      return;
    }
    setLoadingAssignments(true);
    academicApi
      .listTeacherAssignments(idNum)
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setLoadingAssignments(false));
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
  const inputClass = "mt-1 w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]";
  const selectedGroupLabel = groupOptions.find((g) => g.id === Number(form.groupId))?.label;
  const selectedSubjectLabel = subjectOptions.find((s) => s.id === Number(form.subjectId))?.nombre;
  const previewImage = localImageDataUrl || (isImageUrl(form.imageUrl) ? form.imageUrl : null);

  const readThumbnailFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setError(null);
      setLocalImageDataUrl(result);
      setLocalImageName(file.name);
    };
    reader.onerror = () => {
      setError("No se pudo leer la imagen seleccionada");
      setLocalImageDataUrl(null);
      setLocalImageName(null);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      let uploadedFilePath = form.filePath || undefined;
      if (localResourceFile) {
        const uploadResult = await materialsApi.uploadStudyFile(
          localResourceFile,
          Number(form.groupId),
          Number(form.subjectId),
        );
        uploadedFilePath = uploadResult.filePath;
      }

      await materialsApi.createStudy({
        subjectId: Number(form.subjectId),
        groupId: Number(form.groupId),
        title: String(form.title),
        description: form.description || undefined,
        type: form.type!,
        resourceUrl: localResourceFile ? undefined : (form.resourceUrl || undefined),
        imageUrl: localImageDataUrl || form.imageUrl || undefined,
        filePath: uploadedFilePath,
        visibility: form.visibility!,
      });
      setOk("Material creado correctamente");
      setLocalImageDataUrl(null);
      setLocalImageName(null);
      setLocalResourceFile(null);
      setLocalResourceName(null);
      setForm({
        type: form.type ?? "LINK",
        visibility: form.visibility ?? "GROUP",
      });
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al crear material"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--rec-title)" }}>Crear material</h2>
          <p className="text-sm text-gray-600">Publica recursos para tus estudiantes con miniatura y vista previa.</p>
        </div>
        <Link href="/docente/materiales" prefetch={false} className="px-3 py-1.5 rounded-md text-sm border text-gray-700 hover:bg-gray-100" style={{ borderColor: "var(--rec-soft)" }}>Volver</Link>
      </div>

      <div className="rounded-xl border px-3 py-2 text-xs flex flex-wrap gap-2" style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
        <span className="font-medium">Resumen:</span>
        <span>{selectedGroupLabel ?? "Sin grupo"}</span>
        <span>•</span>
        <span>{selectedSubjectLabel ?? "Sin materia"}</span>
        <span>•</span>
        <span>Tipo {form.type ?? "LINK"}</span>
        <span>•</span>
        <span>{form.visibility === "GRADE" ? "Visible por grado" : "Visible por grupo"}</span>
      </div>

      {error && <p className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {ok && <p className="text-sm rounded-lg px-3 py-2" style={{ color: "var(--rec-primary-strong)", border: "1px solid var(--rec-soft)", background: "var(--rec-soft)" }}>{ok}</p>}

      {loadingAssignments ? (
        <div className="space-y-4 animate-pulse" aria-label="Cargando formulario">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="h-4 w-44 rounded bg-slate-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-10 rounded-lg bg-slate-100 border border-slate-200" />
              <div className="h-10 rounded-lg bg-slate-100 border border-slate-200" />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-10 rounded-lg bg-slate-100 border border-slate-200" />
            <div className="h-10 rounded-lg bg-slate-100 border border-slate-200" />
            <div className="h-24 rounded-lg bg-slate-100 border border-slate-200" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-24 rounded-lg bg-slate-100 border border-slate-200" />
              <div className="h-24 rounded-lg bg-slate-100 border border-slate-200" />
            </div>
          </div>
        </div>
      ) : (
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="rounded-xl border bg-white p-4 space-y-3" style={{ borderColor: "var(--rec-soft)" }}>
          <h3 className="text-sm font-semibold text-slate-900">Asignacion academica</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Grupo</label>
            <select
              className={inputClass}
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
              className={inputClass}
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
        </div>

        <div className="rounded-xl border bg-white p-4 space-y-3" style={{ borderColor: "var(--rec-soft)" }}>
          <h3 className="text-sm font-semibold text-slate-900">Contenido del material</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Título</label>
            <input className={inputClass} value={form.title ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Tipo</label>
            <select
              className={inputClass}
              value={form.type ?? "LINK"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  type: e.target.value as CreateStudyMaterialInput["type"],
                }))
              }
            >
              {(["PDF", "VIDEO", "LINK", "DOC", "OTHER"] as const).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600">Descripción</label>
          <textarea className={inputClass} rows={3} value={form.description ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">URL del recurso</label>
            <input className={inputClass} value={form.resourceUrl ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, resourceUrl: e.target.value }))} />
            <p className="mt-1 text-[11px] text-gray-500">Puedes pegar enlace o subir archivo local justo abajo.</p>
          </div>
          <div>
            <label className="block text-xs text-gray-600">URL de imagen (miniatura)</label>
            <input className={inputClass} value={form.imageUrl ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600">Archivo local del material (opcional)</label>
          <input
            type="file"
            className={inputClass}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setLocalResourceFile(file);
              setLocalResourceName(file?.name ?? null);
            }}
          />
          {localResourceName ? (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-[11px] text-gray-600">Archivo seleccionado: {localResourceName}</p>
              <button
                type="button"
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                onClick={() => {
                  setLocalResourceFile(null);
                  setLocalResourceName(null);
                }}
              >
                Quitar
              </button>
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-gray-500">Formatos permitidos: PDF, DOC, PPT, video y otros archivos hasta 25MB.</p>
          )}
        </div>
        </div>

        <div className="rounded-xl border bg-white p-4 space-y-3" style={{ borderColor: "var(--rec-soft)" }}>
          <h3 className="text-sm font-semibold text-slate-900">Miniatura y visibilidad</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Miniatura local (opcional)</label>
            <input
              type="file"
              accept="image/*"
              ref={thumbnailInputRef}
              className={inputClass}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setLocalImageDataUrl(null);
                  setLocalImageName(null);
                  return;
                }
                if (!file.type.startsWith("image/")) {
                  setError("El archivo de miniatura debe ser una imagen válida");
                  e.currentTarget.value = "";
                  setLocalImageDataUrl(null);
                  setLocalImageName(null);
                  return;
                }
                if (file.size > 2 * 1024 * 1024) {
                  setError("La miniatura local supera 2MB. Usa una imagen más liviana.");
                  e.currentTarget.value = "";
                  setLocalImageDataUrl(null);
                  setLocalImageName(null);
                  return;
                }
                if (file.size > 1024 * 1024) {
                  setPendingThumbnailFile(file);
                  setShowHeavyImageModal(true);
                  return;
                }
                readThumbnailFile(file);
              }}
            />
            <p className="mt-1 text-[11px] text-gray-500">Si eliges imagen local, tendrá prioridad sobre la URL de imagen.</p>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Vista previa de miniatura</label>
            {previewImage ? (
              <div className="mt-1 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <img src={previewImage} alt="Vista previa" className="h-28 w-full object-cover rounded border" />
                {localImageName ? <p className="text-[11px] text-gray-600">Archivo: {localImageName}</p> : null}
                <button
                  type="button"
                  onClick={() => {
                    setLocalImageDataUrl(null);
                    setLocalImageName(null);
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                >
                  Limpiar miniatura local
                </button>
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-gray-500 rounded-lg border border-dashed border-gray-300 p-3">Sin miniatura seleccionada.</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Visibilidad</label>
            <select
              className={inputClass}
              value={form.visibility ?? "GROUP"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  visibility:
                    e.target.value as CreateStudyMaterialInput["visibility"],
                }))
              }
            >
              {(["GROUP", "GRADE"] as const).map((v) => (
                <option key={v} value={v}>{v === "GROUP" ? "GROUP (solo grupo)" : "GRADE (todo el grado)"}</option>
              ))}
            </select>
          </div>
        </div>
        </div>

        <div className="rounded-xl border bg-white p-3 flex justify-end" style={{ borderColor: "var(--rec-soft)" }}>
          <button disabled={!canSubmit || saving} className="px-4 py-2 rounded-md text-sm text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "var(--rec-primary)" }}>
            {saving ? "Guardando..." : "Crear material"}
          </button>
        </div>
      </form>
      )}

      {showHeavyImageModal && pendingThumbnailFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-4 shadow-xl">
            <h4 className="text-sm font-semibold text-slate-900">Miniatura pesada</h4>
            <p className="mt-2 text-sm text-slate-700">
              La imagen <span className="font-medium">{pendingThumbnailFile.name}</span> pesa aproximadamente <span className="font-medium">{(pendingThumbnailFile.size / (1024 * 1024)).toFixed(2)} MB</span>.
            </p>
            <p className="mt-1 text-xs text-slate-500">Podría tardar más en cargar. ¿Deseas usarla de todos modos?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setShowHeavyImageModal(false);
                  setPendingThumbnailFile(null);
                  setLocalImageDataUrl(null);
                  setLocalImageName(null);
                  if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
                }}
              >
                Elegir otra
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md text-sm text-white hover:opacity-90"
                style={{ background: "var(--rec-primary)" }}
                onClick={() => {
                  readThumbnailFile(pendingThumbnailFile);
                  setShowHeavyImageModal(false);
                  setPendingThumbnailFile(null);
                }}
              >
                Usar esta imagen
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
