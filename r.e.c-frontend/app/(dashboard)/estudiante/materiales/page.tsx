"use client";
/* eslint-disable @next/next/no-img-element */
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type Grade, type Group, type Subject } from "@/lib/academicApi";
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

function isGroupSubject(
  value: unknown,
): value is { subject?: Subject | null } {
  return typeof value === "object" && value !== null;
}

function EstudianteMaterialesContent() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<(Group & { grade?: Grade })[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<Subject[]>([]);
  const [studentGroup, setStudentGroup] = useState<{ groupId: number; gradeId: number; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const storageKey = "student-materials-filters";

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const idNum = Number(user?.id);
        const [mats, allGrades, allGroups, allSubjects, sg] = await Promise.all([
          materialsApi.listStudy(),
          academicApi.listGrades().catch(() => []),
          academicApi.listGroups().catch(() => []),
          academicApi.listSubjects().catch(() => []),
          idNum ? academicApi.getStudentGroup(idNum).catch(() => null) : Promise.resolve(null),
        ]);
        if (abort) return;
        setMaterials(mats);
        setGrades(allGrades);
        setGroups(allGroups);
        setSubjects(allSubjects);
        
        // Obtener materias asignadas al estudiante
        let assignedSubjects: Subject[] = [];
        if (idNum) {
          try {
            const groupSubjects = await academicApi.listStudentSubjects(idNum);
            assignedSubjects = groupSubjects
              .filter(isGroupSubject)
              .map((groupSubject) => groupSubject.subject)
              .filter((subject): subject is Subject => Boolean(subject));
          } catch (err) {
            console.error("Error cargando materias del estudiante:", err);
          }
        }
        setStudentSubjects(assignedSubjects);
        
        if (sg?.group && sg.group.grade) {
          const label = `${sg.group.grade.nombre}-${sg.group.nombre}`;
          setStudentGroup({ groupId: sg.group.id, gradeId: sg.group.grade.id, label });
        } else {
          setStudentGroup(null);
        }
      } catch (error: unknown) {
        if (!abort) setError(getErrorMessage(error, "Error cargando materiales del estudiante"));
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [user]);

  // El backend ya filtra por rol (grupo/grado del estudiante) en /materials/study.
  // No necesitamos aplicar filtrado adicional en el cliente.

  const visibleMaterials = materials;

  const subjectName = (id: number) => subjects.find((s) => s.id === id)?.nombre ?? `Materia #${id}`;

  const filteredMaterials = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleMaterials.filter((m) => {
      if (typeFilter !== "ALL" && m.type !== typeFilter) return false;
      if (visibilityFilter !== "ALL" && m.visibility !== visibilityFilter) return false;
      if (subjectFilter !== "ALL" && m.subjectId !== subjectFilter) return false;
      if (q) {
        const haystack = `${m.title} ${m.description ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [visibleMaterials, typeFilter, visibilityFilter, subjectFilter, query]);

  // Inicializar filtros y paginación desde la URL (solo una vez)
  useEffect(() => {
    if (initializedFromUrl.current) return;
    const sp = new URLSearchParams(searchParams.toString());
    const q = sp.get("q");
    const type = sp.get("type");
    const vis = sp.get("vis");
    const subj = sp.get("subject");
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
        if (typeof data.page === "number" && data.page > 0) setPage(data.page);
        if (typeof data.psize === "number" && data.psize > 0) setPageSize(data.psize);
      }
    } catch {}
    initializedFromStorage.current = true;
     
  }, [searchParams]);

  // Actualizar la URL cuando cambian filtros o paginación
  useEffect(() => {
    if (!initializedFromUrl.current) return;
    const sp = new URLSearchParams();
    if (query.trim()) sp.set("q", query.trim());
    if (typeFilter !== "ALL") sp.set("type", typeFilter);
    if (visibilityFilter !== "ALL") sp.set("vis", visibilityFilter);
    if (subjectFilter !== "ALL") sp.set("subject", String(subjectFilter));
    if (page > 1) sp.set("page", String(page));
    if (pageSize !== 12) sp.set("psize", String(pageSize));
    const newSearch = sp.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      router.replace(`${pathname}${newSearch ? `?${newSearch}` : ""}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, typeFilter, visibilityFilter, subjectFilter, page, pageSize]);

  // Persistir en localStorage
  useEffect(() => {
    try {
      const payload = { q: query.trim(), type: typeFilter, vis: visibilityFilter, subject: subjectFilter, page, psize: pageSize };
      if (typeof window !== "undefined") localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {}
  }, [query, typeFilter, visibilityFilter, subjectFilter, page, pageSize]);

  // Reset de página cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [query, typeFilter, visibilityFilter, subjectFilter]);

  const isImageUrl = (url?: string | null) => !!url && /(\.png|\.jpe?g|\.gif|\.webp|\.bmp)$/i.test(url);
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
    "bg-emerald-200 border border-emerald-400",
    "bg-indigo-200 border border-indigo-400",
    "bg-amber-200 border border-amber-400",
    "bg-rose-200 border border-rose-400",
    "bg-sky-200 border border-sky-400",
    "bg-violet-200 border border-violet-400",
    "bg-teal-200 border border-teal-400",
    "bg-lime-200 border border-lime-400",
  ];
  const cardClasses = (key: number) => cardPalette[key % cardPalette.length];
  const groupLabelForId = (id: number) => {
    const g = groups.find((x) => x.id === id);
    if (g) {
      const gradeId = g.grade?.id ?? g.gradeId;
      const gradeName = g.grade?.nombre ?? (grades.find((gr) => gr.id === gradeId)?.nombre ?? gradeId);
      return `${gradeName}-${g.nombre}`;
    }
    for (const gr of grades) {
      const gg = (gr.groups ?? []).find((x) => x.id === id);
      if (gg) return `${gr.nombre}-${gg.nombre}`;
    }
    return `Grupo #${id}`;
  };

  const computeCounts = (list: StudyMaterial[]) => {
    let group = 0;
    let grade = 0;
    for (const m of list) {
      if (m.visibility === "GROUP") group++;
      else if (m.visibility === "GRADE") grade++;
    }
    return { total: list.length, group, grade };
  };
  const countsAll = useMemo(() => computeCounts(visibleMaterials), [visibleMaterials]);
  const countsFiltered = useMemo(() => computeCounts(filteredMaterials), [filteredMaterials]);
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      query.trim() ||
      (typeFilter !== "ALL") ||
      (visibilityFilter !== "ALL") ||
      (subjectFilter !== "ALL")
    );
  }, [query, typeFilter, visibilityFilter, subjectFilter]);

  // Paginación derivada
  const totalFiltered = filteredMaterials.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalFiltered, pageSize, totalPages]);
  const paginatedMaterials = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredMaterials.slice(start, end);
  }, [filteredMaterials, page, pageSize]);

  const handleResetFilters = () => {
    setQuery("");
    setTypeFilter("ALL");
    setVisibilityFilter("ALL");
    setSubjectFilter("ALL");
    setPage(1);
    setPageSize(12);
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Materiales del curso</h2>
        {studentGroup && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-gray-700">Mi grado–grupo:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${badgeClasses(studentGroup.groupId)}`}>
              {studentGroup.label}
            </span>
          </div>
        )}
        {!loading && !error && (
          <div className="mt-2 text-xs text-gray-700">
            Mostrando {countsFiltered.total} de {countsAll.total} materiales (Grupo: {countsFiltered.group}, Grado: {countsFiltered.grade})
            {" "}· Página {page} de {totalPages}
          </div>
        )}
      </div>

      {/* Filtros */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs text-gray-700">Buscar
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
              className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as StudyMaterial["type"] | "ALL")}
              className="mt-1 border border-gray-300 rounded px-2 py-1 text-sm"
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
            <label className="block text-xs text-gray-700">Visibilidad</label>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as StudyMaterial["visibility"] | "ALL")}
              className="mt-1 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="ALL">Todas</option>
              <option value="GROUP">Grupo</option>
              <option value="GRADE">Grado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-700">Materia</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
              className="mt-1 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="ALL">Todas</option>
              {studentSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-700">Por página</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="mt-1 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
          <div className="ml-auto">
            {hasActiveFilters && (
              <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                Filtros activos
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-5 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-gray-600">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {countsAll.total === 0 && (
            <div className="text-sm text-gray-600">
              {studentGroup
                ? "No hay materiales disponibles de tu grupo ni de tu grado."
                : "No tienes grado–grupo asignado. Comunícate con secretaría para tu asignación."}
            </div>
          )}
          {countsAll.total > 0 && countsFiltered.total === 0 && (
            <div className="text-sm text-gray-600">No hay materiales que coincidan con tu búsqueda y filtros.</div>
          )}
          {countsFiltered.total > 0 && (
            <div className="text-xs text-gray-600">
              {countsFiltered.group === 0 && <div>• No hay materiales de tu grupo con los filtros aplicados.</div>}
              {countsFiltered.grade === 0 && <div>• No hay materiales de tu grado con los filtros aplicados.</div>}
            </div>
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
          {paginatedMaterials.map((m) => (
            <div key={m.id} className={`rounded p-4 ${cardClasses(m.groupId)}`}>
              <div className="text-sm font-medium text-gray-900">{m.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600">Tipo: {m.type} · Visibilidad: {m.visibility} · Origen: {m.visibility === "GROUP" ? "Tu grupo" : "Tu grado"} · Materia: {subjectName(m.subjectId)}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${badgeClasses(m.groupId)}`}>
                  {groupLabelForId(m.groupId)}
                </span>
              </div>
              {(m.imageUrl && isImageUrl(m.imageUrl)) ? (
                <img src={m.imageUrl!} alt="Imagen del material" className="mt-2 h-32 w-auto rounded border" />
              ) : (isImageUrl(m.resourceUrl) && (
                <img src={m.resourceUrl!} alt="Imagen del material" className="mt-2 h-32 w-auto rounded border" />
              ))}
              {m.description && <p className="text-xs text-gray-700 mt-1">{m.description}</p>}
              <p className="text-[11px] text-gray-600 mt-1">
                Vistas: {m.views ?? 0} · Descargas: {m.downloads ?? 0}
              </p>
              {m.resourceUrl && (
                <a
                  href={m.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    void materialsApi.trackStudyDownload(m.id).catch(() => undefined);
                  }}
                  className="text-xs text-emerald-700 hover:underline"
                >
                  Abrir recurso
                </a>
              )}
              <div className="mt-2">
                <Link href={`/materiales/${m.id}`} prefetch={false} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-100">Ver</Link>
              </div>
            </div>
          ))}
          {process.env.NODE_ENV !== "production" && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-gray-700">Depuración (solo desarrollo)</summary>
              <pre className="mt-2 text-[11px] bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">
{JSON.stringify({
  userId: user?.id,
  studentGroup,
  countsAll,
  countsFiltered,
  filters: { query, typeFilter, visibilityFilter, subjectFilter },
  pagination: { page, pageSize, totalPages },
  sample: filteredMaterials.slice(0, 3).map((x) => ({ id: x.id, visibility: x.visibility, groupId: x.groupId, subjectId: x.subjectId }))
}, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

export default function EstudianteMaterialesPage() {
  return (
    <Suspense fallback={<section className="p-4"><h2 className="text-lg font-semibold">Cargando…</h2></section>}>
      <EstudianteMaterialesContent />
    </Suspense>
  );
}
