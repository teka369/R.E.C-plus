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
  const [filtersExpanded, setFiltersExpanded] = useState(true);
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
  const activeFiltersCount = useMemo(() => {
    let total = 0;
    if (query.trim()) total += 1;
    if (typeFilter !== "ALL") total += 1;
    if (visibilityFilter !== "ALL") total += 1;
    if (subjectFilter !== "ALL") total += 1;
    if (selectedGroupId !== "") total += 1;
    if (pageSize !== 12) total += 1;
    return total;
  }, [pageSize, query, selectedGroupId, subjectFilter, typeFilter, visibilityFilter]);

  const hasActiveFilters = activeFiltersCount > 0;

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
    "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)] border border-[color:var(--rec-soft)]",
    "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)] border border-[color:var(--rec-soft)]",
    "bg-rec-warning-bg text-rec-warning-text border border-rec-warning-border",
    "bg-rec-bg-muted text-rec-text-secondary border border-rec-border-default",
    "bg-rec-info-bg text-rec-info-text border border-rec-info-border",
    "bg-rec-bg-muted text-rec-text-secondary border border-rec-border-default",
    "bg-rec-bg-muted text-rec-text-secondary border border-rec-border-default",
    "bg-rec-bg-muted text-rec-text-secondary border border-rec-border-default",
  ];
  const badgeClasses = (key: number) => badgePalette[key % badgePalette.length];
  const cardPalette = [
    "bg-[color:var(--rec-soft)] border border-[color:var(--rec-soft)]",
    "bg-[color:var(--rec-soft)] border border-[color:var(--rec-soft)]",
    "bg-rec-warning-bg border border-rec-warning-border",
    "bg-rec-bg-muted border border-rec-border-default",
    "bg-rec-info-bg border border-rec-info-border",
    "bg-rec-bg-muted border border-rec-border-default",
    "bg-rec-bg-muted border border-rec-border-default",
    "bg-rec-bg-muted border border-rec-border-default",
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
      <div
        id="tour-mat-header"
        className="rounded-2xl border p-4 sm:p-6 text-rec-text-on-media"
        style={{
          borderColor: "var(--rec-soft)",
          background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Materiales</h1>
            <p className="text-sm text-rec-text-on-media/90">Listado de materiales creados por el docente según asignaciones.</p>
            {!loading && !error && (
              <div className="mt-1 text-xs text-rec-text-on-media/90">
                Mostrando {countsFiltered.total} de {countsAll.total} materiales (Grupo: {countsFiltered.group}, Grado: {countsFiltered.grade})
                {" "}· Página {page} de {totalPages}
              </div>
            )}
          </div>
          <Link
            id="tour-mat-crear"
            href="/docente/materiales/crear"
            prefetch={false}
            className="w-full sm:w-auto text-center px-3 py-1.5 rounded-md text-sm font-semibold bg-rec-bg-elevated hover:opacity-90"
            style={{ color: "var(--rec-primary-strong)" }}
          >
            Crear material
          </Link>
        </div>
      </div>

      <div
        id="tour-mat-filtros"
        className="rounded-2xl border bg-rec-bg-elevated p-3 shadow-sm space-y-3"
        style={{ borderColor: "var(--rec-soft)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium" style={{ color: "var(--rec-title)" }}>Filtros de materiales</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rec-bg-elevated text-rec-text-secondary border" style={{ borderColor: "var(--rec-soft)" }}>
              {activeFiltersCount} activo(s)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 border rounded-lg px-2.5 py-1.5 text-sm text-rec-text-secondary hover:opacity-90"
              style={{ borderColor: "var(--rec-soft)", background: "var(--rec-bg-elevated)" }}
              aria-expanded={filtersExpanded}
              aria-label={filtersExpanded ? "Ocultar filtros" : "Mostrar filtros"}
            >
              <span>{filtersExpanded ? "Ocultar" : "Mostrar"}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 transition-transform ${filtersExpanded ? "rotate-180" : "rotate-0"}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="px-3 py-1.5 text-sm border rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: "var(--rec-soft)", background: "var(--rec-bg-elevated)" }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {filtersExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <label className="text-xs text-rec-text-muted space-y-1">
              <span className="block">Grado-Grupo asignado</span>
              <select
                className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)", background: "var(--rec-bg-elevated)" }}
                value={String(selectedGroupId)}
                onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Todos</option>
                {groupOptions.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs text-rec-text-muted space-y-1">
              <span className="block">Tipo</span>
              <select
                className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)", background: "var(--rec-bg-elevated)" }}
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
            </label>

            <label className="text-xs text-rec-text-muted space-y-1">
              <span className="block">Visibilidad</span>
              <select
                className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)", background: "var(--rec-bg-elevated)" }}
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as StudyMaterial["visibility"] | "ALL")}
              >
                <option value="ALL">Todas</option>
                <option value="GROUP">Grupo</option>
                <option value="GRADE">Grado</option>
              </select>
            </label>

            <label className="text-xs text-rec-text-muted space-y-1">
              <span className="block">Materia</span>
              <select
                className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)", background: "var(--rec-bg-elevated)" }}
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
              >
                <option value="ALL">Todas</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </label>

            <label className="text-xs text-rec-text-muted space-y-1">
              <span className="block">Por página</span>
              <select
                className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)", background: "var(--rec-bg-elevated)" }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </label>

            <label className="text-xs text-rec-text-muted space-y-1 sm:col-span-2 xl:col-span-1">
              <span className="block">Búsqueda rápida</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Título o descripción"
                className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--rec-primary)]"
                style={{ borderColor: "var(--rec-soft)", background: "var(--rec-bg-elevated)" }}
              />
            </label>
          </div>
        )}

        <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border bg-rec-bg-elevated/90 p-1 shadow-sm" style={{ borderColor: "var(--rec-soft)" }}>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`mode-button px-3 py-1.5 text-xs rounded ${viewMode === "list" ? "mode-active" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`mode-button px-3 py-1.5 text-xs rounded ${viewMode === "grid" ? "mode-active" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
            >
              Cuadro
            </button>
          </div>
          {countsAll.total > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] rounded bg-rec-bg-muted text-rec-text-secondary border border-rec-border-default">
              Resultados: {countsFiltered.total}
            </span>
          )}
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rec-warning-bg text-rec-warning-text border border-rec-warning-border">
              Filtros activos
            </span>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-rec-text-muted">Cargando…</p>}
      {error && <p className="text-sm text-rec-danger-text">{error}</p>}

      {!loading && !error && (
        <div id="tour-mat-list" className="space-y-3">
          {countsAll.total === 0 && (
            <div className="text-sm text-rec-text-muted">Aún no hay materiales creados por ti.</div>
          )}
          {countsAll.total > 0 && filteredItems.length === 0 && (
            <div className="text-sm text-rec-text-muted">No hay materiales que coincidan con tu búsqueda y filtros.</div>
          )}
          {/* Controles de paginación */}
          {countsFiltered.total > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-rec-text-secondary">
                Mostrando {Math.min((page - 1) * pageSize + 1, totalFiltered)}–{Math.min(page * pageSize, totalFiltered)} de {totalFiltered}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 text-sm border border-rec-border-strong rounded disabled:opacity-50"
                >Anterior</button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 text-sm border border-rec-border-strong rounded disabled:opacity-50"
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
                      <div className="media-shell sm:w-52 shrink-0 relative bg-rec-bg-muted max-h-[200px] sm:max-h-none overflow-hidden">
                        {thumb ? (
                          <img src={thumb} alt={`Miniatura de ${m.title}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full min-h-[120px] w-full flex items-center justify-center text-rec-text-subtle text-sm p-4 text-center">
                            Sin miniatura
                          </div>
                        )}
                        <span className={`absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium backdrop-blur ${badgeClasses(m.groupId)}`}>
                          {groupLabelForId(m.groupId)}
                        </span>
                      </div>

                      <div className="flex-1 p-5 flex flex-col gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-rec-text-primary leading-tight">{m.title}</h3>
                          {m.description ? <p className="mt-1.5 text-sm text-rec-text-muted line-clamp-3">{m.description}</p> : null}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2 border-t border-rec-text-primary/5 pt-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-rec-text-subtle">Materia</p>
                            <p className="mt-0.5 text-xs font-medium text-rec-text-secondary">{subjectName(m.subjectId)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-rec-text-subtle">Tipo</p>
                            <p className="mt-0.5 text-xs font-medium text-rec-text-secondary">{m.type}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-rec-text-subtle">Visibilidad</p>
                            <p className="mt-0.5 text-xs font-medium text-rec-text-secondary">{m.visibility === "GROUP" ? "Grupo" : "Grado"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-rec-text-subtle">Vistas</p>
                            <p className="mt-0.5 text-xs font-medium text-rec-text-secondary">{m.views ?? 0}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-auto">
                          <Link href={`/materiales/${m.id}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted">Ver</Link>
                          {isProfessor ? (
                            <Link href={`/docente/materiales/editar/${m.id}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted">Editar</Link>
                          ) : null}
                          {resourceHref ? (
                            <a
                              href={resourceHref}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                void materialsApi.trackStudyDownload(m.id).catch(() => undefined);
                              }}
                              className="px-3 py-1.5 rounded-md text-sm text-rec-text-on-media hover:opacity-90"
                              style={{ background: "var(--rec-primary)" }}
                            >
                              Abrir recurso
                            </a>
                          ) : null}
                          {isProfessor && pendingDeleteId !== m.id ? (
                            <button onClick={() => setPendingDeleteId(m.id)} className="px-3 py-1.5 rounded-md text-sm bg-rec-danger-solid text-rec-text-on-media hover:bg-rec-danger-solid-hover">Eliminar</button>
                          ) : null}
                        </div>
                        {isProfessor && pendingDeleteId === m.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-rec-text-muted">¿Confirmar eliminación?</span>
                            <button onClick={handleDeleteConfirm} className="px-2 py-1 rounded-md text-xs bg-rec-danger-solid text-rec-text-on-media hover:bg-rec-danger-solid-hover">Sí</button>
                            <button onClick={() => setPendingDeleteId(null)} className="px-2 py-1 rounded-md text-xs border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted">No</button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 view-grid">
              {paginatedItems.map((m) => {
                const thumb = getThumbnailUrl(m);
                const resourceHref = m.resourceUrl || (m.filePath ? materialsApi.getStudyFileUrl(m.id) : null);
                return (
                  <article key={m.id} className={`material-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition ${cardClasses(m.id)}`}>
                    <div className="media-shell h-52 bg-rec-bg-muted relative">
                      {thumb ? (
                        <img src={thumb} alt={`Miniatura de ${m.title}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-rec-text-subtle text-sm p-4 text-center">Sin miniatura</div>
                      )}
                      <span className={`absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium backdrop-blur ${badgeClasses(m.groupId)}`}>
                        {groupLabelForId(m.groupId)}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-rec-text-primary line-clamp-2">{m.title}</h3>
                        {m.description ? <p className="mt-1.5 text-xs text-rec-text-muted line-clamp-3">{m.description}</p> : null}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rec-text-primary/5 pt-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-rec-text-subtle">Materia</p>
                          <p className="mt-0.5 text-xs font-medium text-rec-text-secondary truncate">{subjectName(m.subjectId)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-rec-text-subtle">Tipo</p>
                          <p className="mt-0.5 text-xs font-medium text-rec-text-secondary">{m.type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-rec-text-subtle">Visibilidad</p>
                          <p className="mt-0.5 text-xs font-medium text-rec-text-secondary">{m.visibility === "GROUP" ? "Grupo" : "Grado"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-rec-text-subtle">Vistas</p>
                          <p className="mt-0.5 text-xs font-medium text-rec-text-secondary">{m.views ?? 0}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        <Link href={`/materiales/${m.id}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted">Ver</Link>
                        {isProfessor ? (
                          <Link href={`/docente/materiales/editar/${m.id}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted">Editar</Link>
                        ) : null}
                        {resourceHref ? (
                          <a
                            href={resourceHref}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => {
                              void materialsApi.trackStudyDownload(m.id).catch(() => undefined);
                            }}
                            className="px-3 py-1.5 rounded-md text-sm text-rec-text-on-media hover:opacity-90"
                            style={{ background: "var(--rec-primary)" }}
                          >
                            Abrir recurso
                          </a>
                        ) : null}
                        {isProfessor && pendingDeleteId !== m.id ? (
                          <button onClick={() => setPendingDeleteId(m.id)} className="px-3 py-1.5 rounded-md text-sm bg-rec-danger-solid text-rec-text-on-media hover:bg-rec-danger-solid-hover">Eliminar</button>
                        ) : null}
                      </div>

                      {isProfessor && pendingDeleteId === m.id ? (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-rec-text-muted">¿Confirmar?</span>
                          <button onClick={handleDeleteConfirm} className="px-2 py-1 rounded-md text-xs bg-rec-danger-solid text-rec-text-on-media hover:bg-rec-danger-solid-hover">Sí</button>
                          <button onClick={() => setPendingDeleteId(null)} className="px-2 py-1 rounded-md text-xs border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted">No</button>
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
          background: var(--rec-primary);
          color: white;
          box-shadow: 0 6px 14px -10px color-mix(in srgb, var(--rec-primary-strong) 72%, transparent);
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
          box-shadow: 0 14px 30px -24px color-mix(in srgb, var(--rec-ink) 70%, transparent);
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
