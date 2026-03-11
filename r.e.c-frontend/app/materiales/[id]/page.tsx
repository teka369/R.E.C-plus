"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { materialsApi, type StudyMaterial } from "@/lib/materialsApi";
import { academicApi, type Grade, type Subject } from "@/lib/academicApi";

const TYPE_LABELS: Record<StudyMaterial["type"], string> = {
  PDF: "PDF",
  VIDEO: "Video",
  LINK: "Enlace web",
  DOC: "Documento",
  OTHER: "Otro",
};
const VISIBILITY_LABELS: Record<StudyMaterial["visibility"], string> = {
  GROUP: "Solo el grupo",
  GRADE: "Todo el grado",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback;
  }
  if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message?: string }).message ?? fallback;
  }
  return fallback;
}

export default function VerMaterialPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string | undefined);
  const idNum = Number(idParam);
  const { user } = useAuth();
  const isProfessor = user?.role === "PROFESOR";
  const [item, setItem] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

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
          void materialsApi.trackStudyView(idNum).catch(() => undefined);
        }
      } catch (error: unknown) {
        if (!abort) setError(getErrorMessage(error, "Error cargando material"));
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [idNum]);

  const onDeleteConfirm = async () => {
    if (!isProfessor) return;
    try {
      await materialsApi.deleteStudy(idNum);
      setStatus("Material eliminado");
      setItem(null);
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
  const isImagePath = (filePath?: string | null) => !!filePath && /(\.png|\.jpe?g|\.gif|\.webp|\.bmp)$/i.test(filePath);
  const getThumbnailUrl = (m: StudyMaterial) => {
    if (m.imageUrl && isImageUrl(m.imageUrl)) return m.imageUrl;
    if (m.resourceUrl && isImageUrl(m.resourceUrl)) return m.resourceUrl;
    if (m.filePath && isImagePath(m.filePath)) return materialsApi.getStudyFileUrl(m.id);
    return null;
  };
  const isPdfUrl = (url?: string | null, filePath?: string | null) =>
    (!!url && /\.pdf(\?.*)?$/i.test(url)) || (!!filePath && /\.pdf$/i.test(filePath));
  const isVideoUrl = (url?: string | null, filePath?: string | null) =>
    (!!url && /(\.mp4|\.webm|\.ogg|\.mov|\.avi)(\?.*)?$/i.test(url)) ||
    (!!filePath && /(\.mp4|\.webm|\.ogg|\.mov|\.avi)$/i.test(filePath));
  const isAudioUrl = (url?: string | null, filePath?: string | null) =>
    (!!url && /(\.mp3|\.wav|\.m4a|\.aac|\.ogg)(\?.*)?$/i.test(url)) ||
    (!!filePath && /(\.mp3|\.wav|\.m4a|\.aac|\.ogg)$/i.test(filePath));
  const isImageContentUrl = (url?: string | null, filePath?: string | null) =>
    isImageUrl(url) || isImagePath(filePath);
  const isDocUrl = (url?: string | null, filePath?: string | null) =>
    (!!url && /(\.docx?|\.doc)(\?.*)?$/i.test(url)) ||
    (!!filePath && /(\.docx?|\.doc)$/i.test(filePath));
  const getGoogleDocsViewerUrl = (url: string) => {
    return `https://docs.google.com/gvfs/render?url=${encodeURIComponent(url)}`;
  };
  const badgePalette = [
    "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "bg-indigo-50 text-indigo-700 border border-indigo-200",
    "bg-amber-50 text-amber-700 border border-amber-200",
    "bg-rose-50 text-rose-700 border border-rose-200",
    "bg-sky-50 text-sky-700 border border-sky-200",
    "bg-violet-50 text-violet-700 border border-violet-200",
    "bg-teal-50 text-teal-700 border border-teal-200",
    "bg-lime-50 text-lime-700 border border-lime-200",
  ];
  const badgeClasses = (key: number) => badgePalette[key % badgePalette.length];
  const cardPalette = [
    "bg-emerald-50 border border-emerald-200",
    "bg-indigo-50 border border-indigo-200",
    "bg-amber-50 border border-amber-200",
    "bg-rose-50 border border-rose-200",
    "bg-sky-50 border border-sky-200",
    "bg-violet-50 border border-violet-200",
    "bg-teal-50 border border-teal-200",
    "bg-lime-50 border border-lime-200",
  ];
  const cardClasses = (key: number) => cardPalette[key % cardPalette.length];
  const groupLabelForId = (id?: number | null) => {
    if (!id) return null;
    for (const g of grades) {
      const gr = (g.groups ?? []).find((x) => x.id === id);
      if (gr) return `${g.nombre}-${gr.nombre}`;
    }
    return `Grupo #${id}`;
  };
  const subjectName = (id: number) => subjects.find((s) => s.id === id)?.nombre ?? `Materia #${id}`;
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return null;
    }
  };
  const toYouTubeEmbed = (url?: string | null) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        return v ? `https://www.youtube.com/embed/${v}` : null;
      }
      if (u.hostname.includes("youtu.be")) {
        const id = u.pathname.replace("/", "");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      return null;
    } catch {
      return null;
    }
  };
  const resourceHref = item
    ? item.resourceUrl || (item.filePath ? materialsApi.getStudyFileUrl(item.id) : null)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
    <section className="space-y-4 max-w-4xl mx-auto">

      {/* â”€â”€ Cabecera: volver + acciones â”€â”€ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          ← Volver
        </button>

        {isProfessor && !loading && item && (
          <div className="flex items-center gap-2 flex-wrap">
            {!confirmDelete ? (
              <>
                <Link
                  href={`/docente/materiales/editar/${idNum}`}
                  prefetch={false}
                  className="px-3 py-1.5 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Editar
                </Link>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
                >
                  Eliminar
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                <span className="text-xs font-medium text-red-700">¿Eliminar este material?</span>
                <button
                  onClick={onDeleteConfirm}
                  className="px-2.5 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded text-xs border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* â”€â”€ Skeleton â”€â”€ */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-56 h-48 bg-slate-100 shrink-0" />
              <div className="flex-1 p-5 space-y-3">
                <div className="h-6 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="h-2.5 w-16 rounded bg-slate-200" />
                      <div className="h-4 w-24 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <div className="h-2.5 w-16 rounded bg-slate-200" />
            <div className="h-9 w-36 rounded-lg bg-slate-100" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <div className="h-2.5 w-24 rounded bg-slate-200" />
            <div className="h-[320px] rounded-lg bg-slate-100" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {status && <p className="text-sm text-emerald-700">{status}</p>}

      {item && (
        <div className="space-y-3">

          {/* â”€â”€ Card principal: miniatura + tÃ­tulo + descripciÃ³n + metadatos â”€â”€ */}
          <div className={`rounded-2xl overflow-hidden ${cardClasses(item.id)}`}>
            <div className="flex flex-col sm:flex-row">

              {/* Miniatura */}
              {getThumbnailUrl(item) ? (
                <div className="sm:w-56 shrink-0 bg-slate-100">
                  <img
                    src={getThumbnailUrl(item)!}
                    alt="Miniatura del material"
                    className="w-full h-52 sm:h-full object-cover"
                  />
                </div>
              ) : (
                <div className="sm:w-48 shrink-0 h-32 sm:h-auto bg-black/5 flex items-center justify-center text-slate-400 text-sm">
                  Sin miniatura
                </div>
              )}

              {/* InformaciÃ³n */}
              <div className="flex-1 p-5 flex flex-col gap-4">

                {/* TÃ­tulo + descripciÃ³n */}
                <div>
                  <h1 className="text-xl font-bold text-slate-900 leading-snug">{item.title}</h1>
                  {item.description && (
                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Grilla de metadatos etiquetados */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 border-t border-black/5 pt-4 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Materia</p>
                    <p className="mt-0.5 font-medium text-slate-800">{subjectName(item.subjectId)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tipo</p>
                    <p className="mt-0.5 font-medium text-slate-800">{TYPE_LABELS[item.type] ?? item.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visibilidad</p>
                    <p className="mt-0.5 font-medium text-slate-800">{VISIBILITY_LABELS[item.visibility] ?? item.visibility}</p>
                  </div>
                  {item.groupId != null && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Grupo</p>
                      <p className="mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${badgeClasses(item.groupId)}`}>
                          {groupLabelForId(item.groupId) ?? `Grupo #${item.groupId}`}
                        </span>
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Vistas</p>
                    <p className="mt-0.5 font-medium text-slate-800">{item.views ?? 0}</p>
                  </div>
                  {formatDate(item.createdAt) && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Publicado</p>
                      <p className="mt-0.5 font-medium text-slate-800">{formatDate(item.createdAt)}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* â”€â”€ Card recurso â”€â”€ */}
          {resourceHref && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-3">Recurso</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <a
                  href={resourceHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => { void materialsApi.trackStudyDownload(idNum).catch(() => undefined); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
                >
                  Abrir recurso ↗
                </a>
                <p className="text-xs text-slate-500 break-all">{item.resourceUrl ?? `Archivo local: ${item.filePath}`}</p>
              </div>
            </div>
          )}

          {/* â”€â”€ Card vista previa embebida â”€â”€ */}
          {resourceHref && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-3">Vista previa</p>
              {(() => {
                // YouTube
                const yt = item.resourceUrl ? toYouTubeEmbed(item.resourceUrl) : null;
                if (yt) {
                  return (
                    <iframe
                      src={yt}
                      className="w-full h-[420px] rounded-lg border border-slate-100"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }

                // Imagen
                if (isImageContentUrl(item.resourceUrl, item.filePath)) {
                  return (
                    <img
                      src={resourceHref}
                      alt="Recurso imagen"
                      className="w-full max-h-[600px] rounded-lg border border-slate-100 object-contain"
                    />
                  );
                }

                // PDF
                if (isPdfUrl(item.resourceUrl, item.filePath)) {
                  return (
                    <iframe
                      src={resourceHref}
                      className="w-full h-[640px] rounded-lg border border-slate-100"
                      title="PDF viewer"
                    />
                  );
                }

                // Video
                if (isVideoUrl(item.resourceUrl, item.filePath)) {
                  return (
                    <video
                      src={resourceHref}
                      controls
                      className="w-full max-h-[480px] rounded-lg border border-slate-100"
                    />
                  );
                }

                // Audio
                if (isAudioUrl(item.resourceUrl, item.filePath)) {
                  return (
                    <div className="w-full rounded-lg border border-slate-100 bg-slate-50 p-6 flex items-center justify-center">
                      <audio
                        src={resourceHref}
                        controls
                        className="w-full max-w-md"
                      />
                    </div>
                  );
                }

                // Documento (DOC/DOCX)
                if (isDocUrl(item.resourceUrl, item.filePath)) {
                  const viewerUrl = getGoogleDocsViewerUrl(resourceHref);
                  return (
                    <iframe
                      src={viewerUrl}
                      className="w-full h-[640px] rounded-lg border border-slate-100"
                      title="Document viewer"
                    />
                  );
                }

                // Fallback genérico (otros archivos)
                return (
                  <div className="w-full rounded-lg border border-slate-100 bg-slate-50 p-8 text-center">
                    <p className="text-sm text-slate-600 mb-3">No se puede mostrar vista previa de este tipo de archivo</p>
                    <a
                      href={resourceHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => { void materialsApi.trackStudyDownload(idNum).catch(() => undefined); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Descargar archivo ↗
                    </a>
                  </div>
                );
              })()}
              <p className="mt-2 text-xs text-slate-400">Si el contenido no se muestra, usa el bot&oacute;n &ldquo;Abrir recurso&rdquo;.</p>
            </div>
          )}

        </div>
      )}
    </section>
    </div>
  );
}
