"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { materialsApi, type StudyMaterial } from "@/lib/materialsApi";
import { academicApi, type Grade } from "@/lib/academicApi";

export default function VerMaterialPage() {
  const params = useParams();
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

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const [data, allGrades] = await Promise.all([
          materialsApi.getStudy(idNum),
          academicApi.listGrades().catch(() => []),
        ]);
        if (!abort) {
          setItem(data);
          setGrades(allGrades);
        }
      } catch (e: any) {
        if (!abort) setError(e?.message || "Error cargando material");
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
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Error al eliminar");
    } finally {
      setConfirmDelete(false);
    }
  };

  const isImageUrl = (url?: string | null) => !!url && /(\.png|\.jpe?g|\.gif|\.webp|\.bmp)$/i.test(url);
  const isPdfUrl = (url?: string | null) => !!url && /\.pdf(\?.*)?$/i.test(url);
  const isVideoUrl = (url?: string | null) => !!url && /(\.mp4|\.webm|\.ogg)$/i.test(url);
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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ver material #{idNum}</h2>
        <div className="flex gap-2">
          <Link href="/docente/materiales" prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Volver</Link>
          {isProfessor && (
            <Link href={`/docente/materiales/editar/${idNum}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700">Editar</Link>
          )}
          {isProfessor && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700">Eliminar</button>
          )}
          {isProfessor && confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">¿Confirmar?</span>
              <button onClick={onDeleteConfirm} className="px-2 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">Sí</button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-md text-xs border border-gray-300 text-gray-700 hover:bg-gray-100">No</button>
            </div>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {status && <p className="text-sm text-emerald-700">{status}</p>}

      {item && (
        <div className={`rounded p-4 space-y-2 ${cardClasses(item.groupId ?? 0)}`}>
          <div className="flex items-start gap-4">
            {(() => {
              const src = (item.imageUrl && isImageUrl(item.imageUrl))
                ? item.imageUrl!
                : (isImageUrl(item.resourceUrl) ? item.resourceUrl! : null);
              return src ? (
                <img src={src} alt="Miniatura del material" className="h-24 w-auto rounded border" />
              ) : null;
            })()}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{item.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600">Tipo: {item.type} · Visibilidad: {item.visibility}</span>
                {item.groupId != null && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${badgeClasses(item.groupId)}`}>
                    {groupLabelForId(item.groupId) ?? `Grupo #${item.groupId}`}
                  </span>
                )}
              </div>
              {item.description && <p className="text-sm text-gray-700">{item.description}</p>}
            </div>
          </div>
          {item.resourceUrl && (
            <a href={item.resourceUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline">Abrir recurso</a>
          )}
          {/* Visor embebido del material */}
          {item.resourceUrl && (
            <div className="mt-4">
              {(() => {
                const yt = toYouTubeEmbed(item.resourceUrl);
                if (yt) {
                  return (
                    <iframe
                      src={yt}
                      className="w-full h-[420px] rounded border"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                if (isPdfUrl(item.resourceUrl)) {
                  return (
                    <iframe
                      src={item.resourceUrl}
                      className="w-full h-[640px] rounded border"
                    />
                  );
                }
                if (isVideoUrl(item.resourceUrl)) {
                  return (
                    <video
                      src={item.resourceUrl}
                      controls
                      className="w-full max-h-[480px] rounded border"
                    />
                  );
                }
                return (
                  <iframe
                    src={item.resourceUrl}
                    className="w-full h-[640px] rounded border"
                  />
                );
              })()}
              <p className="mt-2 text-xs text-gray-500">Si no se carga el contenido embebido por políticas del sitio, use “Abrir recurso”.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
