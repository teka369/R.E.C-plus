"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type GroupSubject } from "@/lib/academicApi";
import { materialsApi, type Syllabus } from "@/lib/materialsApi";
import { getErrorMessage } from "@/lib/errors";
import { FiTarget, FiBookOpen, FiClipboard, FiCheckSquare, FiLink, FiFileText } from "react-icons/fi";
import type { IconType } from "react-icons";

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const STATUS_OPTIONS = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "ACTIVO", label: "Activo" },
  { value: "ARCHIVADO", label: "Archivado" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  BORRADOR: "bg-amber-100 text-amber-800 border-amber-200",
  ACTIVO: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ARCHIVADO: "bg-slate-200 text-slate-700 border-slate-300",
};

type SyllabusSections = {
  objetivos: string;
  contenidos: string;
  actividades: string;
  evaluacion: string;
  recursos: string;
  notas: string;
};

const EMPTY_SECTIONS: SyllabusSections = {
  objetivos: "",
  contenidos: "",
  actividades: "",
  evaluacion: "",
  recursos: "",
  notas: "",
};

const SECTION_TITLES: Record<keyof SyllabusSections, string> = {
  objetivos: "Objetivos",
  contenidos: "Contenidos",
  actividades: "Actividades",
  evaluacion: "Evaluacion",
  recursos: "Recursos",
  notas: "Notas",
};

const SECTION_ICONS: Record<keyof SyllabusSections, IconType> = {
  objetivos: FiTarget,
  contenidos: FiBookOpen,
  actividades: FiClipboard,
  evaluacion: FiCheckSquare,
  recursos: FiLink,
  notas: FiFileText,
};

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const HEADER_TO_KEY: Record<string, keyof SyllabusSections> = {
  objetivos: "objetivos",
  contenidos: "contenidos",
  actividades: "actividades",
  evaluacion: "evaluacion",
  recursos: "recursos",
  notas: "notas",
};

const parseSyllabusContent = (content?: string | null): SyllabusSections => {
  if (!content?.trim()) return { ...EMPTY_SECTIONS };
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const sections: SyllabusSections = { ...EMPTY_SECTIONS };
  let current: keyof SyllabusSections | null = null;
  let foundHeaders = false;

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      const mapped = HEADER_TO_KEY[normalizeHeader(headerMatch[1])];
      if (mapped) {
        current = mapped;
        foundHeaders = true;
        continue;
      }
    }

    if (current) {
      sections[current] = sections[current] ? `${sections[current]}\n${line}` : line;
    } else {
      sections.notas = sections.notas ? `${sections.notas}\n${line}` : line;
    }
  }

  if (!foundHeaders) {
    return { ...EMPTY_SECTIONS, notas: content.trim() };
  }

  (Object.keys(sections) as Array<keyof SyllabusSections>).forEach((key) => {
    sections[key] = sections[key].trim();
  });
  return sections;
};

const hasStructuredSyllabusContent = (content?: string | null): boolean => {
  if (!content?.trim()) return false;
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  return lines.some((line) => {
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (!headerMatch) return false;
    return Boolean(HEADER_TO_KEY[normalizeHeader(headerMatch[1])]);
  });
};

export default function EstudianteTemariosPage() {
  const { user } = useAuth();

  const [querySubjectId, setQuerySubjectId] = useState(0);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [subjects, setSubjects] = useState<GroupSubject[]>([]);
  const [groupLabel, setGroupLabel] = useState("");

  const [selectedSubjectId, setSelectedSubjectId] = useState(0);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "BORRADOR" | "ACTIVO" | "ARCHIVADO">("ALL");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterHasContent, setFilterHasContent] = useState<"all" | "with" | "without">("all");
  const [filterHasDuration, setFilterHasDuration] = useState<"all" | "with" | "without">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title_asc" | "title_desc" | "updated">("newest");
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = Number(new URLSearchParams(window.location.search).get("materia") ?? 0) || 0;
    setQuerySubjectId(value);
  }, []);

  useEffect(() => {
    const run = async () => {
      const studentId = Number(user?.id);
      if (!studentId) return;
      setLoading(true);
      setError(null);
      try {
        const [studentGroup, studentSubjects, allSyllabi] = await Promise.all([
          academicApi.getStudentGroup(studentId),
          academicApi.listStudentSubjects(studentId),
          materialsApi.listSyllabi(),
        ]);

        const currentGroupId = studentGroup?.group.id ?? 0;
        setGroupLabel(studentGroup ? `${studentGroup.group.grade.nombre} - ${studentGroup.group.nombre}` : "Sin grupo");
        setSubjects(studentSubjects);

        const filtered = allSyllabi
          .filter((item) => item.groupId === currentGroupId)
          .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

        setSyllabi(filtered);

        const hasQuerySubject = querySubjectId > 0 && studentSubjects.some((item) => item.subject.id === querySubjectId);
        setSelectedSubjectId(hasQuerySubject ? querySubjectId : 0);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar temarios"));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [querySubjectId, user?.id]);

  const subjectNameById = useMemo(() => {
    const map = new Map<number, string>();
    subjects.forEach((item) => map.set(item.subject.id, item.subject.nombre));
    return map;
  }, [subjects]);

  const periodOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        syllabi
          .map((item) => item.period?.trim() ?? "")
          .filter((period) => period.length > 0),
      ),
    );
    return values.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [syllabi]);

  const visibleSyllabi = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = syllabi
      .filter((item) => (selectedSubjectId ? item.subjectId === selectedSubjectId : true))
      .filter((item) => (filterStatus === "ALL" ? true : (item.status ?? "BORRADOR") === filterStatus))
      .filter((item) => (filterPeriod ? (item.period ?? "").trim() === filterPeriod : true))
      .filter((item) => {
        if (filterHasContent === "all") return true;
        const hasContent = (item.content ?? "").trim().length > 0;
        return filterHasContent === "with" ? hasContent : !hasContent;
      })
      .filter((item) => {
        if (filterHasDuration === "all") return true;
        const hasDuration = (item.duration ?? "").trim().length > 0;
        return filterHasDuration === "with" ? hasDuration : !hasDuration;
      })
      .filter((item) => {
        if (!q) return true;
        const subject = (subjectNameById.get(item.subjectId) ?? "").toLowerCase();
        const period = (item.period ?? "").toLowerCase();
        const duration = (item.duration ?? "").toLowerCase();
        return item.title.toLowerCase().includes(q) || (item.content ?? "").toLowerCase().includes(q) || subject.includes(q) || period.includes(q) || duration.includes(q);
      });

    return filtered.sort((a, b) => {
      if (sortBy === "oldest") return a.id - b.id;
      if (sortBy === "title_asc") return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
      if (sortBy === "title_desc") return b.title.localeCompare(a.title, "es", { sensitivity: "base" });
      if (sortBy === "updated") return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      return b.id - a.id;
    });
  }, [
    filterHasContent,
    filterHasDuration,
    filterPeriod,
    filterStatus,
    search,
    selectedSubjectId,
    sortBy,
    subjectNameById,
    syllabi,
  ]);

  const activeFiltersCount = useMemo(() => {
    let total = 0;
    if (selectedSubjectId > 0) total += 1;
    if (filterStatus !== "ALL") total += 1;
    if (filterPeriod) total += 1;
    if (filterHasContent !== "all") total += 1;
    if (filterHasDuration !== "all") total += 1;
    if (sortBy !== "newest") total += 1;
    if (search.trim()) total += 1;
    return total;
  }, [filterHasContent, filterHasDuration, filterPeriod, filterStatus, search, selectedSubjectId, sortBy]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50 p-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Temarios</h2>
        <p className="text-sm text-slate-600">Consulta contenidos por materia con una vista mas clara y filtrable.</p>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-100" />
          <div className="h-56 rounded-2xl bg-slate-100" />
        </div>
      )}

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      {!loading && !error && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-xs text-slate-500">Grupo actual: <span className="font-medium text-slate-700">{groupLabel || "Sin grupo"}</span></p>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-sm font-medium text-slate-800">Filtros de búsqueda</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
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
                <span className="text-xs rounded-full bg-white border border-slate-200 px-2 py-1 text-slate-600">
                  {activeFiltersCount} activo(s)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId(0);
                    setFilterStatus("ALL");
                    setFilterPeriod("");
                    setFilterHasContent("all");
                    setFilterHasDuration("all");
                    setSortBy("newest");
                    setSearch("");
                  }}
                  disabled={activeFiltersCount === 0}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {filtersExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <label className="text-xs text-slate-600 space-y-1">
                <span className="block">Materia</span>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800"
                  value={selectedSubjectId}
                  onChange={(event) => setSelectedSubjectId(Number(event.target.value))}
                >
                  <option value={0}>Todas las materias</option>
                  {subjects.map((item) => (
                    <option key={item.id} value={item.subject.id}>
                      {item.subject.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-600 space-y-1">
                <span className="block">Estado</span>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800"
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value as "ALL" | "BORRADOR" | "ACTIVO" | "ARCHIVADO")}
                >
                  <option value="ALL">Todos los estados</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-600 space-y-1">
                <span className="block">Periodo</span>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800"
                  value={filterPeriod}
                  onChange={(event) => setFilterPeriod(event.target.value)}
                >
                  <option value="">Todos los periodos</option>
                  {periodOptions.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-600 space-y-1">
                <span className="block">Contenido</span>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800"
                  value={filterHasContent}
                  onChange={(event) => setFilterHasContent(event.target.value as "all" | "with" | "without")}
                >
                  <option value="all">Todos</option>
                  <option value="with">Con contenido</option>
                  <option value="without">Sin contenido</option>
                </select>
              </label>

              <label className="text-xs text-slate-600 space-y-1">
                <span className="block">Duración</span>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800"
                  value={filterHasDuration}
                  onChange={(event) => setFilterHasDuration(event.target.value as "all" | "with" | "without")}
                >
                  <option value="all">Todos</option>
                  <option value="with">Con duración</option>
                  <option value="without">Sin duración</option>
                </select>
              </label>

              <label className="text-xs text-slate-600 space-y-1 xl:col-span-1">
                <span className="block">Ordenar por</span>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as "newest" | "oldest" | "title_asc" | "title_desc" | "updated")}
                >
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="updated">Última edición</option>
                  <option value="title_asc">Título A-Z</option>
                  <option value="title_desc">Título Z-A</option>
                </select>
              </label>

              <label className="text-xs text-slate-600 space-y-1 sm:col-span-2 xl:col-span-2">
                <span className="block">Búsqueda rápida</span>
                <input
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ej: título, materia, periodo, duración o contenido"
                />
              </label>
            </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
              <p>{visibleSyllabi.length} resultado(s)</p>
              <p>Filtra por materia, estado y periodo para ubicar más rápido.</p>
            </div>
          </div>

          <div className="space-y-3">
            {visibleSyllabi.length === 0 ? (
              <p className="text-sm text-slate-500">No hay temarios para mostrar con los filtros actuales.</p>
            ) : (
              visibleSyllabi.map((item) => {
                const expanded = Boolean(expandedIds[item.id]);
                const content = item.content ?? "";
                const isLong = content.length > 280;
                const displayContent = expanded || !isLong ? content : `${content.slice(0, 280)}...`;
                const hasStructuredContent = hasStructuredSyllabusContent(item.content);
                const parsedSections = hasStructuredContent ? parseSyllabusContent(item.content) : { ...EMPTY_SECTIONS };
                return (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 truncate">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {subjectNameById.get(item.subjectId) ?? `Materia #${item.subjectId}`}
                          {item.updatedAt && ` | Actualizado ${formatDate(item.updatedAt)}`}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {item.period && <span className="text-[11px] px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700">Periodo: {item.period}</span>}
                          <span className={`text-[11px] px-1.5 py-0.5 rounded border ${STATUS_STYLE[item.status ?? "BORRADOR"]}`}>
                            {STATUS_OPTIONS.find((s) => s.value === (item.status ?? "BORRADOR"))?.label ?? "Borrador"}
                          </span>
                        </div>
                        {item.duration && <p className="text-xs text-indigo-700 mt-1">Duración: {item.duration}</p>}
                        <p className="text-[11px] text-slate-500 mt-1">Creado: {formatDate(item.createdAt)}</p>
                      </div>
                      <Link href={`/estudiante/temarios/${item.id}`} className="px-2 py-1 rounded text-xs border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0">
                        Ver temario
                      </Link>
                    </div>
                    {hasStructuredContent ? (
                      <div className="mt-2 space-y-1.5">
                        {(Object.keys(parsedSections) as Array<keyof SyllabusSections>)
                          .filter((key) => parsedSections[key].trim().length > 0)
                          .map((key) => {
                            const Icon = SECTION_ICONS[key];
                            const text = parsedSections[key].replace(/\s+/g, " ").trim();
                            const shortText = text.length > 110 ? `${text.slice(0, 110)}...` : text;
                            return (
                              <div key={key} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <Icon className="mt-0.5 shrink-0 text-slate-500" />
                                <p className="leading-4">
                                  <span className="font-semibold text-slate-800">{SECTION_TITLES[key]}: </span>
                                  {shortText}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                        {item.content?.trim() ? displayContent : "Sin contenido detallado."}
                      </p>
                    )}
                    {!hasStructuredContent && isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="mt-2 text-xs text-indigo-700 hover:underline"
                      >
                        {expanded ? "▲ Minimizar" : "▼ Extender"}
                      </button>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
}
