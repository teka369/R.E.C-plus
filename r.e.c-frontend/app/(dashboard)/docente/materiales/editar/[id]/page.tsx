"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { materialsApi, type StudyMaterial, type UpdateStudyMaterialInput } from "@/lib/materialsApi";
import { getErrorMessage } from "@/lib/errors";

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
  const [localImageDataUrl, setLocalImageDataUrl] = useState<string | null>(null);
  const [localImageName, setLocalImageName] = useState<string | null>(null);
  const [showHeavyImageModal, setShowHeavyImageModal] = useState(false);
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  const [localResourceFile, setLocalResourceFile] = useState<File | null>(null);
  const [localResourceName, setLocalResourceName] = useState<string | null>(null);
  const [removeLocalFile, setRemoveLocalFile] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const data = await materialsApi.getStudy(idNum);
        if (!abort) {
          setItem(data);
          setForm({
            title: data.title,
            description: data.description ?? undefined,
            resourceUrl: data.resourceUrl ?? undefined,
            imageUrl: data.imageUrl ?? undefined,
            filePath: data.filePath ?? undefined,
            type: data.type,
            visibility: data.visibility,
          });
        }
      } catch (error: unknown) {
        if (!abort) setError(getErrorMessage(error, "Error cargando material"));
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [idNum]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfessor || !item) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      let uploadedFilePath = form.filePath;
      if (localResourceFile) {
        const uploadResult = await materialsApi.uploadStudyFile(
          localResourceFile,
          item.groupId,
          item.subjectId,
        );
        uploadedFilePath = uploadResult.filePath;
      }
      if (removeLocalFile && !localResourceFile) {
        uploadedFilePath = "";
      }

      const payload: UpdateStudyMaterialInput = {
        ...form,
        resourceUrl: localResourceFile ? undefined : form.resourceUrl,
        imageUrl: localImageDataUrl || form.imageUrl,
        filePath: uploadedFilePath,
      };

      const updated = await materialsApi.updateStudy(idNum, payload);
      setItem(updated);
      setForm({
        title: updated.title,
        description: updated.description ?? undefined,
        resourceUrl: updated.resourceUrl ?? undefined,
        imageUrl: updated.imageUrl ?? undefined,
        filePath: updated.filePath ?? undefined,
        type: updated.type,
        visibility: updated.visibility,
      });
      setLocalResourceFile(null);
      setLocalResourceName(null);
      setLocalImageDataUrl(null);
      setLocalImageName(null);
      setRemoveLocalFile(false);
      setOk("Material actualizado");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al actualizar"));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!isProfessor) return;
    try {
      await materialsApi.deleteStudy(idNum);
      setOk("Material eliminado");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al eliminar"));
    } finally {
      setConfirmDelete(false);
    }
  };

  const isImageUrl = (url?: string | null) => {
    if (!url) return false;
    const value = url.trim();
    if (!value) return false;
    if (/^data:image\//i.test(value)) return true;
    if (/^https?:\/\//i.test(value)) return true;
    return /(\.png|\.jpe?g|\.gif|\.webp|\.bmp)(\?.*)?(#.*)?$/i.test(value);
  };
  const inputClass = "mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
  const resourcePreview = item?.resourceUrl || form.resourceUrl;
  const currentLocalPath = item?.filePath || form.filePath;
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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Editar material</h2>
          <p className="text-sm text-gray-600">Actualiza contenido, recurso, miniatura y visibilidad del material.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/materiales/${idNum}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Ver</Link>
          <Link href={`/docente/materiales`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Volver</Link>
        </div>
      </div>
      {!isProfessor && <p className="text-sm text-red-600">No autorizado. Solo docentes pueden editar/eliminar materiales.</p>}
      {loading && (
        <div className="space-y-4 animate-pulse" aria-label="Cargando material">
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
        </div>
      )}
      {error && <p className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {ok && <p className="text-sm text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-lg px-3 py-2">{ok}</p>}

      {item && (
        <>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs text-emerald-800 flex flex-wrap gap-2">
          <span className="font-medium">Resumen:</span>
          <span>Materia #{item.subjectId}</span>
          <span>•</span>
          <span>Grupo #{item.groupId}</span>
          <span>•</span>
          <span>Tipo {form.type ?? item.type}</span>
          <span>•</span>
          <span>{(form.visibility ?? item.visibility) === "GRADE" ? "Visible por grado" : "Visible por grupo"}</span>
          <span>•</span>
          <span>{resourcePreview ? "Con enlace" : "Sin enlace"}</span>
          <span>•</span>
          <span>{currentLocalPath ? "Con archivo local" : "Sin archivo local"}</span>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Asignación académica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600">Grupo</label>
                <input className={inputClass} value={`Grupo #${item.groupId}`} disabled />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Materia</label>
                <input className={inputClass} value={`Materia #${item.subjectId}`} disabled />
              </div>
            </div>
            <p className="text-[11px] text-gray-500">Grupo y materia no se cambian desde esta vista para mantener consistencia de asignación docente.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
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
                value={form.type ?? item.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as StudyMaterial["type"],
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
              <p className="mt-1 text-[11px] text-gray-500">También puedes subir archivo local abajo para reemplazar este enlace.</p>
            </div>
            <div>
              <label className="block text-xs text-gray-600">URL de imagen (miniatura)</label>
              <input className={inputClass} value={form.imageUrl ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
            </div>
          </div>

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

          <div>
            <label className="block text-xs text-gray-600">Archivo local del material (opcional)</label>
            <input
              type="file"
              className={inputClass}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setLocalResourceFile(file);
                setLocalResourceName(file?.name ?? null);
                if (file) setRemoveLocalFile(false);
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
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-[11px] text-gray-500">Actual: {currentLocalPath ? `Archivo local (${currentLocalPath})` : "Sin archivo local"}.</p>
                {currentLocalPath ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveLocalFile(true);
                      setLocalResourceFile(null);
                      setLocalResourceName(null);
                    }}
                    className="px-2 py-1 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50"
                  >
                    Quitar archivo local actual
                  </button>
                ) : null}
              </div>
            )}
            {removeLocalFile ? <p className="mt-1 text-[11px] text-amber-700">Se quitará el archivo local al guardar.</p> : null}
          </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600">Visibilidad</label>
              <select
                className={inputClass}
                value={form.visibility ?? item.visibility}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    visibility: e.target.value as StudyMaterial["visibility"],
                  }))
                }
              >
                {(["GROUP", "GRADE"] as const).map((v) => (
                  <option key={v} value={v}>{v === "GROUP" ? "GROUP (solo grupo)" : "GRADE (todo el grado)"}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 items-center justify-end">
            {!confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={!isProfessor} className="px-4 py-2 rounded-md text-sm border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50">Eliminar</button>
            )}
            <button disabled={saving || !isProfessor} className="px-4 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? "Guardando..." : "Guardar cambios"}</button>
            {confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">¿Confirmar?</span>
                <button type="button" onClick={onDeleteConfirm} className="px-2 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">Sí</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-md text-xs border border-gray-300 text-gray-700 hover:bg-gray-100">No</button>
              </div>
            )}
          </div>
        </form>
        </>
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
                className="px-3 py-1.5 rounded-md text-sm bg-amber-600 text-white hover:bg-amber-700"
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
