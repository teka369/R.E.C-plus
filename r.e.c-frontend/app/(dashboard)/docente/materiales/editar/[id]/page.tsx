"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { materialsApi, type StudyMaterial, type UpdateStudyMaterialInput } from "@/lib/materialsApi";
import { academicApi, type Grade, type Subject } from "@/lib/academicApi";
import { getErrorMessage } from "@/lib/errors";
import { useDocenteTour } from "@/components/docente/DocenteTourProvider";
import { MATERIALES_EDITAR_STEPS } from "@/lib/docenteTour/subpageTourSteps";

export default function EditarMaterialPage() {
  const params = useParams();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string | undefined);
  const idNum = Number(idParam);
  const { user } = useAuth();
  const { runHelpTour } = useDocenteTour();
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
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const [data, allGrades, allSubjects] = await Promise.all([
          materialsApi.getStudy(idNum),
          academicApi.listGrades().catch(() => []),
          academicApi.listSubjects().catch(() => []),
        ]);
        if (!abort) {
          setItem(data);
          setGrades(allGrades);
          setSubjects(allSubjects);
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
  const inputClass = "mt-1 w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]";
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

  const groupLabel = (groupId?: number | null) => {
    if (!groupId) return `Grupo #${groupId}`;
    for (const g of grades) {
      const gr = (g.groups ?? []).find((x) => x.id === groupId);
      if (gr) return `${g.nombre} - ${gr.nombre}`;
    }
    return `Grupo #${groupId}`;
  };
  const subjectLabel = (subjectId?: number | null) => {
    if (!subjectId) return `Materia #${subjectId}`;
    return subjects.find((s) => s.id === subjectId)?.nombre ?? `Materia #${subjectId}`;
  };

  return (
    <section className="space-y-4">
      <div id="tour-mat-ed-header" className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--rec-title)" }}>Editar material</h2>
          <p className="text-sm text-rec-text-muted">Actualiza contenido, recurso, miniatura y visibilidad del material.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => runHelpTour(MATERIALES_EDITAR_STEPS)}
            className="rounded-lg border border-rec-border-default bg-rec-bg-base px-2.5 py-1.5 text-xs font-semibold text-rec-primary hover:bg-rec-bg-muted"
          >
            Guía del formulario
          </button>
          <Link href={`/materiales/${idNum}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border text-rec-text-secondary hover:bg-rec-bg-muted" style={{ borderColor: "var(--rec-soft)" }}>Ver</Link>
          <Link href={`/docente/materiales`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border text-rec-text-secondary hover:bg-rec-bg-muted" style={{ borderColor: "var(--rec-soft)" }}>Volver</Link>
        </div>
      </div>
      {!isProfessor && <p className="text-sm text-rec-danger-text">No autorizado. Solo docentes pueden editar/eliminar materiales.</p>}
      {loading && (
        <div className="space-y-4 animate-pulse" aria-label="Cargando material">
          <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-4 space-y-3">
            <div className="h-4 w-44 rounded bg-rec-bg-subtle" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-10 rounded-lg bg-rec-bg-muted border border-rec-border-default" />
              <div className="h-10 rounded-lg bg-rec-bg-muted border border-rec-border-default" />
            </div>
          </div>
          <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-4 space-y-3">
            <div className="h-4 w-40 rounded bg-rec-bg-subtle" />
            <div className="h-10 rounded-lg bg-rec-bg-muted border border-rec-border-default" />
            <div className="h-10 rounded-lg bg-rec-bg-muted border border-rec-border-default" />
            <div className="h-24 rounded-lg bg-rec-bg-muted border border-rec-border-default" />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-rec-danger-text border border-rec-danger-border bg-rec-danger-bg rounded-lg px-3 py-2">{error}</p>}
      {ok && <p className="text-sm rounded-lg px-3 py-2" style={{ color: "var(--rec-primary-strong)", border: "1px solid var(--rec-soft)", background: "var(--rec-soft)" }}>{ok}</p>}

      {item && (
        <>
        <div id="tour-mat-ed-resumen" className="rounded-xl border px-3 py-2 text-xs flex flex-wrap gap-2" style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)", color: "var(--rec-primary-strong)" }}>
          <span className="font-medium">Resumen:</span>
          <span>{subjectLabel(item.subjectId)}</span>
          <span>•</span>
          <span>{groupLabel(item.groupId)}</span>
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
          <div id="tour-mat-ed-asig" className="rounded-xl border bg-rec-bg-elevated p-4 space-y-3" style={{ borderColor: "var(--rec-soft)" }}>
            <h3 className="text-sm font-semibold text-rec-text-primary">Asignación académica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-rec-text-muted">Grupo</label>
                <input className={inputClass} value={groupLabel(item.groupId)} disabled />
              </div>
              <div>
                <label className="block text-xs text-rec-text-muted">Materia</label>
                <input className={inputClass} value={subjectLabel(item.subjectId)} disabled />
              </div>
            </div>
            <p className="text-[11px] text-rec-text-subtle">Grupo y materia no se cambian desde esta vista para mantener consistencia de asignación docente.</p>
          </div>

          <div id="tour-mat-ed-contenido" className="rounded-xl border bg-rec-bg-elevated p-4 space-y-3" style={{ borderColor: "var(--rec-soft)" }}>
            <h3 className="text-sm font-semibold text-rec-text-primary">Contenido del material</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-rec-text-muted">Título</label>
              <input className={inputClass} value={form.title ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-rec-text-muted">Tipo</label>
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
            <label className="block text-xs text-rec-text-muted">Descripción</label>
            <textarea className={inputClass} rows={3} value={form.description ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-rec-text-muted">URL del recurso</label>
              <input className={inputClass} value={form.resourceUrl ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, resourceUrl: e.target.value }))} />
              <p className="mt-1 text-[11px] text-rec-text-subtle">También puedes subir archivo local abajo para reemplazar este enlace.</p>
            </div>
            <div>
              <label className="block text-xs text-rec-text-muted">URL de imagen (miniatura)</label>
              <input className={inputClass} value={form.imageUrl ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-rec-text-muted">Miniatura local (opcional)</label>
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
              <p className="mt-1 text-[11px] text-rec-text-subtle">Si eliges imagen local, tendrá prioridad sobre la URL de imagen.</p>
            </div>
            <div>
              <label className="block text-xs text-rec-text-muted">Vista previa de miniatura</label>
              {previewImage ? (
                <div className="mt-1 space-y-2 rounded-lg border border-rec-border-default bg-rec-bg-base p-2">
                  <img src={previewImage} alt="Vista previa" className="h-28 w-full object-cover rounded border" />
                  {localImageName ? <p className="text-[11px] text-rec-text-muted">Archivo: {localImageName}</p> : null}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalImageDataUrl(null);
                      setLocalImageName(null);
                    }}
                    className="px-2 py-1 text-xs border border-rec-border-strong rounded hover:bg-rec-bg-muted"
                  >
                    Limpiar miniatura local
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-rec-text-subtle rounded-lg border border-dashed border-rec-border-strong p-3">Sin miniatura seleccionada.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-rec-text-muted">Archivo local del material (opcional)</label>
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
                <p className="text-[11px] text-rec-text-muted">Archivo seleccionado: {localResourceName}</p>
                <button
                  type="button"
                  className="px-2 py-1 text-xs border border-rec-border-strong rounded hover:bg-rec-bg-muted"
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
                <p className="text-[11px] text-rec-text-subtle">Actual: {currentLocalPath ? `Archivo local (${currentLocalPath})` : "Sin archivo local"}.</p>
                {currentLocalPath ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveLocalFile(true);
                      setLocalResourceFile(null);
                      setLocalResourceName(null);
                    }}
                    className="px-2 py-1 text-xs border border-rec-danger-border text-rec-danger-text rounded hover:bg-rec-danger-bg"
                  >
                    Quitar archivo local actual
                  </button>
                ) : null}
              </div>
            )}
            {removeLocalFile ? <p className="mt-1 text-[11px] text-rec-warning-text">Se quitará el archivo local al guardar.</p> : null}
          </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-rec-text-muted">Visibilidad</label>
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

          <div id="tour-mat-ed-actions" className="rounded-xl border bg-rec-bg-elevated p-3 flex gap-2 items-center justify-end" style={{ borderColor: "var(--rec-soft)" }}>
            {!confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={!isProfessor} className="px-4 py-2 rounded-md text-sm border border-rec-danger-border text-rec-danger-text hover:bg-rec-danger-bg disabled:opacity-50">Eliminar</button>
            )}
            <button disabled={saving || !isProfessor} className="px-4 py-2 rounded-md text-sm text-rec-text-on-media hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "var(--rec-primary)" }}>{saving ? "Guardando..." : "Guardar cambios"}</button>
            {confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rec-text-muted">¿Confirmar?</span>
                <button type="button" onClick={onDeleteConfirm} className="px-2 py-1 rounded-md text-xs bg-rec-danger-solid text-rec-text-on-media hover:bg-rec-danger-solid-hover">Sí</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-md text-xs border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted">No</button>
              </div>
            )}
          </div>
        </form>
        </>
      )}

      {showHeavyImageModal && pendingThumbnailFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rec-ink/45 px-4">
          <div className="w-full max-w-md rounded-xl border border-rec-warning-border bg-rec-bg-elevated p-4 shadow-xl">
            <h4 className="text-sm font-semibold text-rec-text-primary">Miniatura pesada</h4>
            <p className="mt-2 text-sm text-rec-text-secondary">
              La imagen <span className="font-medium">{pendingThumbnailFile.name}</span> pesa aproximadamente <span className="font-medium">{(pendingThumbnailFile.size / (1024 * 1024)).toFixed(2)} MB</span>.
            </p>
            <p className="mt-1 text-xs text-rec-text-subtle">Podría tardar más en cargar. ¿Deseas usarla de todos modos?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-md text-sm border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted"
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
                className="px-3 py-1.5 rounded-md text-sm text-rec-text-on-media hover:opacity-90"
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
