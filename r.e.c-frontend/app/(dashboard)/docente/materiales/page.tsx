"use client";
/* eslint-disable @next/next/no-img-element */
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment, type Subject } from "@/lib/academicApi";
import { materialsApi, type StudyMaterial } from "@/lib/materialsApi";

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

function DocenteMaterialesContent() {
  const { user } = useAuth();
  const isProfessor = user?.role === "PROFESOR";
  const [items, setItems] = useState<StudyMaterial[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Filtros UI
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | StudyMaterial["type"]>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | StudyMaterial["visibility"]>("ALL");
  const [subjectFilter, setSubjectFilter] = useState<number | "ALL">("ALL");
  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Sincronización con URL
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initializedFromUrl = useRef(false);
  const initializedFromStorage = useRef(false);
  const storageKey = "teacher-materials-filters";

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [materials, teacherGroups, subj] = await Promise.all([
          materialsApi.listStudy(),
          user?.id ? academicApi.listTeacherAssignments(Number(user.id)).catch(() => []) : Promise.resolve([]),
          academicApi.listSubjects().catch(() => []),
        ]);
        if (!abort) {
          // Filtrar materiales propios del docente
          const own = user?.id ? materials.filter((m) => String(m.teacherId) === String(user!.id)) : materials;
          setItems(own);
          setAssignments(teacherGroups);
          setSubjects(subj);
        }
      } catch (error: unknown) {
        if (!abort) setError(getErrorMessage(error, "Error cargando materiales"));
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [user]);

  const groupOptions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const a of assignments) {
      const label = `${a.group.grade?.nombre ?? a.group.grade?.id}-${a.group.nombre}`;
      if (!seen.has(a.group.id)) seen.set(a.group.id, label);
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [assignments]);

  const subjectName = (id: number) => subjects.find((s) => s.id === id)?.nombre ?? `Materia #${id}`;

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => {
      if (selectedGroupId && m.groupId !== Number(selectedGroupId)) return false;
      if (typeFilter !== "ALL" && m.type !== typeFilter) return false;
      if (visibilityFilter !== "ALL" && m.visibility !== visibilityFilter) return false;
      if (subjectFilter !== "ALL" && m.subjectId !== subjectFilter) return false;
      if (q) {
        const haystack = `${m.title} ${m.description ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedGroupId, typeFilter, visibilityFilter, subjectFilter, query]);

  // Inicializar filtros y paginación desde la URL (una sola vez)
  useEffect(() => {
    if (initializedFromUrl.current) return;
    const sp = new URLSearchParams(searchParams.toString());
    const q = sp.get("q");
    const type = sp.get("type");
    const vis = sp.get("vis");
    const subj = sp.get("subject");
    const group = sp.get("group");
    const p = sp.get("page");
    const ps = sp.get("psize");
    if (q !== null) setQuery(q);
    if (type && ["PDF","VIDEO","LINK","DOC","OTHER"].includes(type)) setTypeFilter(type as StudyMaterial["type"]);
    if (vis && ["GROUP","GRADE"].includes(vis)) setVisibilityFilter(vis as StudyMaterial["visibility"]);
    if (subj && subj !== "ALL") {
      const sid = Number(subj);
      if (!Number.isNaN(sid)) setSubjectFilter(sid);
    } else if (subj === "ALL") {
      setSubjectFilter("ALL");
    }
    if (group) {
      const gid = Number(group);
      setSelectedGroupId(Number.isNaN(gid) ? "" : gid);
    }
    if (p) {
      const pn = Math.max(1, Number(p));
      if (!Number.isNaN(pn)) setPage(pn);
    }
    if (ps) {
      const psn = Math.max(1, Number(ps));
      if (!Number.isNaN(psn)) setPageSize(psn);
    }
    initializedFromUrl.current = true;
     
  }, [searchParams]);

  // Inicializar desde localStorage si la URL no tiene parámetros
  useEffect(() => {
    if (initializedFromStorage.current) return;
    const hasParams = searchParams.toString().length > 0;
    if (hasParams) {
      initializedFromStorage.current = true;
      return;
    }
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.q === "string") setQuery(data.q);
        if (["PDF","VIDEO","LINK","DOC","OTHER"].includes(data.type)) setTypeFilter(data.type);
        if (["GROUP","GRADE"].includes(data.vis)) setVisibilityFilter(data.vis);
        if (data.subject === "ALL") setSubjectFilter("ALL");
        else if (typeof data.subject === "number") setSubjectFilter(data.subject);
        if (typeof data.group === "number") setSelectedGroupId(data.group);
        if (typeof data.page === "number" && data.page > 0) setPage(data.page);
        if (typeof data.psize === "number" && data.psize > 0) setPageSize(data.psize);
      }
    } catch {}
    initializedFromStorage.current = true;
     
  }, [searchParams]);

  // Actualizar URL cuando cambian filtros/paginación
  useEffect(() => {
    if (!initializedFromUrl.current) return;
    const sp = new URLSearchParams();
    if (query.trim()) sp.set("q", query.trim());
    if (typeFilter !== "ALL") sp.set("type", typeFilter);
    if (visibilityFilter !== "ALL") sp.set("vis", visibilityFilter);
    if (subjectFilter !== "ALL") sp.set("subject", String(subjectFilter));
    if (selectedGroupId !== "") sp.set("group", String(selectedGroupId));
    if (page > 1) sp.set("page", String(page));
    if (pageSize !== 12) sp.set("psize", String(pageSize));
    const newSearch = sp.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      router.replace(`${pathname}${newSearch ? `?${newSearch}` : ""}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, typeFilter, visibilityFilter, subjectFilter, selectedGroupId, page, pageSize]);

  // Persistir en localStorage
  useEffect(() => {
    try {
      const payload = { q: query.trim(), type: typeFilter, vis: visibilityFilter, subject: subjectFilter, group: selectedGroupId, page, psize: pageSize };
      if (typeof window !== "undefined") localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {}
  }, [query, typeFilter, visibilityFilter, subjectFilter, selectedGroupId, page, pageSize]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [query, typeFilter, visibilityFilter, subjectFilter, selectedGroupId]);

  const computeCounts = (list: StudyMaterial[]) => {
    let group = 0;
    let grade = 0;
    for (const m of list) {
      if (m.visibility === "GROUP") group++;
      else if (m.visibility === "GRADE") grade++;
    }
    return { total: list.length, group, grade };
  };
  const countsAll = useMemo(() => computeCounts(items), [items]);
  const countsFiltered = useMemo(() => computeCounts(filteredItems), [filteredItems]);
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      query.trim() ||
      (typeFilter !== "ALL") ||
      (visibilityFilter !== "ALL") ||
      (subjectFilter !== "ALL") ||
      (selectedGroupId !== "")
    );
  }, [query, typeFilter, visibilityFilter, subjectFilter, selectedGroupId]);

  // Paginación derivada
  const totalFiltered = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalFiltered, pageSize, totalPages]);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, page, pageSize]);

  const handleResetFilters = () => {
    setSelectedGroupId("");
    setQuery("");
    setTypeFilter("ALL");
    setVisibilityFilter("ALL");
    setSubjectFilter("ALL");
    setPage(1);
    setPageSize(12);
  };

  const handleDeleteConfirm = async () => {
    if (!isProfessor || pendingDeleteId == null) return;
    try {
      await materialsApi.deleteStudy(pendingDeleteId);
      setItems((prev) => prev.filter((x) => x.id !== pendingDeleteId));
      setPendingDeleteId(null);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Error al eliminar material"));
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
  const getThumbnailUrl = (m: StudyMaterial) => {
    if (m.imageUrl && isImageUrl(m.imageUrl)) return m.imageUrl;
    if (m.resourceUrl && isImageUrl(m.resourceUrl)) return m.resourceUrl;
    return null;
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
  const groupLabelForId = (id: number) => {
    const a = assignments.find((x) => x.group.id === id);
    return a ? `${a.group.grade?.nombre ?? a.group.grade?.id}-${a.group.nombre}` : `Grupo #${id}`;
  };

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("teacher-materials-view-mode") : null;
      if (stored === "list" || stored === "grid") setViewMode(stored);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("teacher-materials-view-mode", viewMode);
    } catch {}
  }, [viewMode]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Materiales</h2>
          <p className="text-sm text-gray-600">Listado de materiales creados por el docente según asignaciones.</p>
          {!loading && !error && (
            <div className="mt-1 text-xs text-gray-700">
              Mostrando {countsFiltered.total} de {countsAll.total} materiales (Grupo: {countsFiltered.group}, Grado: {countsFiltered.grade})
              {" "}· Página {page} de {totalPages}
            </div>
          )}
        </div>
        <Link href="/docente/materiales/crear" prefetch={false} className="px-3 py-1.5 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700">Crear material</Link>
      </div>

      <div className="flex items-end gap-3 flex-wrap rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs text-gray-600">Grado–Grupo asignado</label>
          <select
            className="mt-1 w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            value={String(selectedGroupId)}
            onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Todos</option>
            {groupOptions.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-gray-600">Buscar
            {countsAll.total > 0 && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[11px] rounded bg-gray-100 text-gray-700 border border-gray-200">
                Resultados: {countsFiltered.total}
              </span>
            )}
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Título o descripción"
            className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Tipo</label>
          <select
            className="mt-1 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as StudyMaterial["type"] | "ALL")}
          >
            <option value="ALL">Todos</option>
            <option value="PDF">PDF</option>
            <option value="VIDEO">Video</option>
            <option value="LINK">Link</option>
            <option value="DOC">Doc</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Visibilidad</label>
          <select
            className="mt-1 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as StudyMaterial["visibility"] | "ALL")}
          >
            <option value="ALL">Todas</option>
            <option value="GROUP">Grupo</option>
            <option value="GRADE">Grado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Materia</label>
          <select
            className="mt-1 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
          >
            <option value="ALL">Todas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600">Por página</label>
          <select
            className="mt-1 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 bg-white/90 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`mode-button px-3 py-1.5 text-xs rounded ${viewMode === "list" ? "mode-active" : "text-slate-700 hover:bg-slate-100"}`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`mode-button px-3 py-1.5 text-xs rounded ${viewMode === "grid" ? "mode-active" : "text-slate-700 hover:bg-slate-100"}`}
            >
              Cuadro
            </button>
          </div>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
              Filtros activos
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {countsAll.total === 0 && (
            <div className="text-sm text-gray-600">Aún no hay materiales creados por ti.</div>
          )}
          {countsAll.total > 0 && filteredItems.length === 0 && (
            <div className="text-sm text-gray-600">No hay materiales que coincidan con tu búsqueda y filtros.</div>
          )}
          {/* Controles de paginación */}
          {countsFiltered.total > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-gray-700">
                Mostrando {Math.min((page - 1) * pageSize + 1, totalFiltered)}–{Math.min(page * pageSize, totalFiltered)} de {totalFiltered}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >Anterior</button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                >Siguiente</button>
              </div>
            </div>
          )}
          <div key={`view-${viewMode}`} className="view-mode-switch">
          {viewMode === "list" ? (
            <div className="space-y-4 view-grid">
              {paginatedItems.map((m) => {
                const thumb = getThumbnailUrl(m);
                const resourceHref = m.resourceUrl || (m.filePath ? materialsApi.getStudyFileUrl(m.id) : null);
                return (
                  <article key={m.id} className={`material-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition ${cardClasses(m.id)}`}>
                    <div className="flex flex-col sm:flex-row">
                      <div className="media-shell sm:w-52 shrink-0 relative bg-slate-100 max-h-[200px] sm:max-h-none overflow-hidden">
                        {thumb ? (
                          <img src={thumb} alt={`Miniatura de ${m.title}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full min-h-[120px] w-full flex items-center justify-center text-slate-500 text-sm p-4 text-center">
                            Sin miniatura
                          </div>
                        )}
                        <span className={`absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium backdrop-blur ${badgeClasses(m.groupId)}`}>
                          {groupLabelForId(m.groupId)}
                        </span>
                      </div>

                      <div className="flex-1 p-5 flex flex-col gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 leading-tight">{m.title}</h3>
                          {m.description ? <p className="mt-1.5 text-sm text-slate-600 line-clamp-3">{m.description}</p> : null}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 border-t border-black/5 pt-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Materia</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-700">{subjectName(m.subjectId)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tipo</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-700">{m.type}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visibilidad</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-700">{m.visibility === "GROUP" ? "Grupo" : "Grado"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Vistas</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-700">{m.views ?? 0}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-auto">
                          <Link href={`/materiales/${m.id}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Ver</Link>
                          {isProfessor ? (
                            <Link href={`/docente/materiales/editar/${m.id}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Editar</Link>
                          ) : null}
                          {resourceHref ? (
                            <a
                              href={resourceHref}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                void materialsApi.trackStudyDownload(m.id).catch(() => undefined);
                              }}
                              className="px-3 py-1.5 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Abrir recurso
                            </a>
                          ) : null}
                          {isProfessor && pendingDeleteId !== m.id ? (
                            <button onClick={() => setPendingDeleteId(m.id)} className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700">Eliminar</button>
                          ) : null}
                        </div>
                        {isProfessor && pendingDeleteId === m.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">¿Confirmar eliminación?</span>
                            <button onClick={handleDeleteConfirm} className="px-2 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">Sí</button>
                            <button onClick={() => setPendingDeleteId(null)} className="px-2 py-1 rounded-md text-xs border border-gray-300 text-gray-700 hover:bg-gray-100">No</button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 view-grid">
              {paginatedItems.map((m) => {
                const thumb = getThumbnailUrl(m);
                const resourceHref = m.resourceUrl || (m.filePath ? materialsApi.getStudyFileUrl(m.id) : null);
                return (
                  <article key={m.id} className={`material-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition ${cardClasses(m.id)}`}>
                    <div className="media-shell h-52 bg-slate-100 relative">
                      {thumb ? (
                        <img src={thumb} alt={`Miniatura de ${m.title}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm p-4 text-center">Sin miniatura</div>
                      )}
                      <span className={`absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium backdrop-blur ${badgeClasses(m.groupId)}`}>
                        {groupLabelForId(m.groupId)}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{m.title}</h3>
                        {m.description ? <p className="mt-1.5 text-xs text-slate-600 line-clamp-3">{m.description}</p> : null}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-black/5 pt-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Materia</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-700 truncate">{subjectName(m.subjectId)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tipo</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-700">{m.type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Visibilidad</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-700">{m.visibility === "GROUP" ? "Grupo" : "Grado"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Vistas</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-700">{m.views ?? 0}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        <Link href={`/materiales/${m.id}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Ver</Link>
                        {isProfessor ? (
                          <Link href={`/docente/materiales/editar/${m.id}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Editar</Link>
                        ) : null}
                        {resourceHref ? (
                          <a
                            href={resourceHref}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => {
                              void materialsApi.trackStudyDownload(m.id).catch(() => undefined);
                            }}
                            className="px-3 py-1.5 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Abrir recurso
                          </a>
                        ) : null}
                        {isProfessor && pendingDeleteId !== m.id ? (
                          <button onClick={() => setPendingDeleteId(m.id)} className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700">Eliminar</button>
                        ) : null}
                      </div>

                      {isProfessor && pendingDeleteId === m.id ? (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-gray-600">¿Confirmar?</span>
                          <button onClick={handleDeleteConfirm} className="px-2 py-1 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">Sí</button>
                          <button onClick={() => setPendingDeleteId(null)} className="px-2 py-1 rounded-md text-xs border border-gray-300 text-gray-700 hover:bg-gray-100">No</button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          </div>
        </div>
      )}
      <style jsx>{`
        .mode-button {
          transition: transform 160ms ease, background-color 160ms ease, color 160ms ease;
        }

        .mode-button:hover {
          transform: translateY(-1px);
        }

        .mode-active {
          background: #059669;
          color: white;
          box-shadow: 0 6px 14px -10px rgba(5, 150, 105, 0.75);
        }

        .view-mode-switch {
          animation: viewModeSwitch 220ms ease-out;
          transform-origin: center top;
        }

        .view-grid > * {
          animation: cardReveal 320ms ease-out both;
        }

        .view-grid > *:nth-child(2) { animation-delay: 25ms; }
        .view-grid > *:nth-child(3) { animation-delay: 50ms; }
        .view-grid > *:nth-child(4) { animation-delay: 75ms; }
        .view-grid > *:nth-child(5) { animation-delay: 100ms; }
        .view-grid > *:nth-child(6) { animation-delay: 125ms; }

        .material-card {
          transition: transform 220ms ease, box-shadow 220ms ease;
        }

        .material-card:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.7);
        }

        .media-shell {
          overflow: hidden;
        }

        .media-shell img {
          transition: transform 380ms ease;
        }

        .material-card:hover .media-shell img {
          transform: scale(1.06);
        }

        @keyframes viewModeSwitch {
          0% {
            opacity: 0;
            transform: scale(0.96, 1.04);
          }
          60% {
            opacity: 1;
            transform: scale(1.01, 0.99);
          }
          100% {
            opacity: 1;
            transform: scale(1, 1);
          }
        }

        @keyframes cardReveal {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mode-button,
          .material-card,
          .media-shell img,
          .view-grid > * {
            animation: none;
            transition: none;
          }

          .view-mode-switch {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

export default function DocenteMaterialesPage() {
  return (
    <Suspense fallback={<section className="p-4"><h2 className="text-lg font-semibold">Cargando…</h2></section>}>
      <DocenteMaterialesContent />
    </Suspense>
  );
}
