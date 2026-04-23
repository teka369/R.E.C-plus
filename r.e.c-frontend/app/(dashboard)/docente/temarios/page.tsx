"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import { materialsApi, type CreateSyllabusInput, type Syllabus, type UpdateSyllabusInput } from "@/lib/materialsApi";
import { getErrorMessage } from "@/lib/errors";
import { useDocenteTour } from "@/components/docente/DocenteTourProvider";
import {
  TEMARIO_MODAL_CREAR_TOUR_STEPS,
  TEMARIO_MODAL_EDITAR_TOUR_STEPS,
  TEMARIO_MODAL_ELIMINAR_TOUR_STEPS,
} from "@/lib/docenteTour/subpageTourSteps";
import { FiTarget, FiBookOpen, FiClipboard, FiCheckSquare, FiLink, FiFileText } from "react-icons/fi";
import type { IconType } from "react-icons";

type DeleteModalState = { id: number; title: string } | null;
type ContentMode = "sections" | "single";

type SyllabusFormInput = CreateSyllabusInput & {
  period: string;
};

const STATUS_OPTIONS = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "ACTIVO", label: "Activo" },
  { value: "ARCHIVADO", label: "Archivado" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  BORRADOR: "bg-rec-warning-bg text-rec-warning-text border-rec-warning-border",
  ACTIVO: "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary-strong)] border-[color:var(--rec-soft)]",
  ARCHIVADO: "bg-rec-bg-muted text-rec-text-secondary border-rec-border-default",
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

const composeSyllabusContent = (sections: SyllabusSections): string | undefined => {
  const orderedKeys: Array<keyof SyllabusSections> = ["objetivos", "contenidos", "actividades", "evaluacion", "recursos", "notas"];
  const blocks = orderedKeys
    .map((key) => ({ key, value: sections[key].trim() }))
    .filter((entry) => entry.value)
    .map((entry) => `## ${SECTION_TITLES[entry.key]}\n${entry.value}`);
  const content = blocks.join("\n\n").trim();
  return content || undefined;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
};

export default function TemariosDocentePage() {
  const { user } = useAuth();
  const { runHelpTour } = useDocenteTour();
  const teacherId = Number(user?.id) || 0;

  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [filterGroupId, setFilterGroupId] = useState<number>(0);
  const [filterSubjectId, setFilterSubjectId] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "BORRADOR" | "ACTIVO" | "ARCHIVADO">("ALL");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterHasContent, setFilterHasContent] = useState<"all" | "with" | "without">("all");
  const [filterHasDuration, setFilterHasDuration] = useState<"all" | "with" | "without">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title_asc" | "title_desc" | "updated">("newest");
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const [form, setForm] = useState<SyllabusFormInput>({
    groupId: 0,
    subjectId: 0,
    title: "",
    period: "",
    status: "BORRADOR",
    duration: "",
    content: "",
  });
  const [formSections, setFormSections] = useState<SyllabusSections>({ ...EMPTY_SECTIONS });
  const [createContentMode, setCreateContentMode] = useState<ContentMode>("sections");

  const [editing, setEditing] = useState<{
    id: number;
    title: string;
    period: string;
    status: "BORRADOR" | "ACTIVO" | "ARCHIVADO";
    duration: string;
  } | null>(null);
  const [editingSections, setEditingSections] = useState<SyllabusSections>({ ...EMPTY_SECTIONS });
  const [editRawContent, setEditRawContent] = useState("");
  const [editContentMode, setEditContentMode] = useState<ContentMode>("sections");

  const [pendingDelete, setPendingDelete] = useState<DeleteModalState>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const groupOptions = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>();
    assignments.forEach((a) => {
      map.set(a.group.id, {
        id: a.group.id,
        label: `${a.group.grade?.nombre ?? "?"} - ${a.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

  const subjectsByGroup = useMemo(() => {
    const map = new Map<number, Array<{ id: number; name: string }>>();
    assignments.forEach((a) => {
      const current = map.get(a.group.id) ?? [];
      if (!current.some((s) => s.id === a.subject.id)) {
        current.push({ id: a.subject.id, name: a.subject.nombre });
      }
      map.set(a.group.id, current);
    });
    return map;
  }, [assignments]);

  const subjectOptionsForForm = useMemo(() => {
    if (!form.groupId) return [];
    return subjectsByGroup.get(form.groupId) ?? [];
  }, [form.groupId, subjectsByGroup]);

  const labelMaps = useMemo(() => {
    const groupLabel = new Map<number, string>();
    const subjectLabel = new Map<number, string>();
    assignments.forEach((a) => {
      groupLabel.set(a.group.id, `${a.group.grade?.nombre ?? "?"} - ${a.group.nombre}`);
      subjectLabel.set(a.subject.id, a.subject.nombre);
    });
    return { groupLabel, subjectLabel };
  }, [assignments]);

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
      .filter((item) => (filterGroupId ? item.groupId === filterGroupId : true))
      .filter((item) => (filterSubjectId ? item.subjectId === filterSubjectId : true))
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
        const subject = (labelMaps.subjectLabel.get(item.subjectId) ?? "").toLowerCase();
        const group = (labelMaps.groupLabel.get(item.groupId) ?? "").toLowerCase();
        const period = (item.period ?? "").toLowerCase();
        const duration = (item.duration ?? "").toLowerCase();
        return item.title.toLowerCase().includes(q) || (item.content ?? "").toLowerCase().includes(q) || subject.includes(q) || group.includes(q) || period.includes(q) || duration.includes(q);
      });

    return filtered.sort((a, b) => {
      if (sortBy === "oldest") return a.id - b.id;
      if (sortBy === "title_asc") return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
      if (sortBy === "title_desc") return b.title.localeCompare(a.title, "es", { sensitivity: "base" });
      if (sortBy === "updated") return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      return b.id - a.id;
    });
  }, [
    filterGroupId,
    filterHasContent,
    filterHasDuration,
    filterPeriod,
    filterStatus,
    filterSubjectId,
    labelMaps.groupLabel,
    labelMaps.subjectLabel,
    search,
    sortBy,
    syllabi,
  ]);

  const activeFiltersCount = useMemo(() => {
    let total = 0;
    if (filterGroupId > 0) total += 1;
    if (filterSubjectId > 0) total += 1;
    if (filterStatus !== "ALL") total += 1;
    if (filterPeriod) total += 1;
    if (filterHasContent !== "all") total += 1;
    if (filterHasDuration !== "all") total += 1;
    if (sortBy !== "newest") total += 1;
    if (search.trim()) total += 1;
    return total;
  }, [filterGroupId, filterHasContent, filterHasDuration, filterPeriod, filterStatus, filterSubjectId, search, sortBy]);

  const readyToCreate = useMemo(
    () => form.groupId > 0 && form.subjectId > 0 && form.title.trim().length > 0,
    [form.groupId, form.subjectId, form.title],
  );

  useEffect(() => {
    let abort = false;
    const run = async () => {
      try {
        const [list, assigns] = await Promise.all([
          materialsApi.listSyllabi(),
          teacherId ? academicApi.listTeacherAssignments(teacherId) : Promise.resolve([]),
        ]);
        if (abort) return;

        setSyllabi(list);
        setAssignments(assigns);

        const firstGroup = assigns[0]?.group.id ?? 0;
        const firstSubjects = assigns.filter((a) => a.group.id === firstGroup);
        const firstSubject = firstSubjects[0]?.subject.id ?? 0;

        setForm((prev) => ({ ...prev, groupId: firstGroup, subjectId: firstSubject, duration: prev.duration ?? "" }));
        setFilterGroupId(firstGroup);
      } catch (cause: unknown) {
        if (!abort) setError(getErrorMessage(cause, "Error cargando temarios"));
      } finally {
        if (!abort) setLoading(false);
      }
    };

    void run();
    return () => {
      abort = true;
    };
  }, [teacherId]);

  useEffect(() => {
    if (!form.groupId) return;
    const subjects = subjectsByGroup.get(form.groupId) ?? [];
    if (!subjects.some((s) => s.id === form.subjectId)) {
      setForm((prev) => ({ ...prev, subjectId: subjects[0]?.id ?? 0 }));
    }
  }, [form.groupId, form.subjectId, subjectsByGroup]);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!readyToCreate) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const created = await materialsApi.createSyllabus({
        groupId: form.groupId,
        subjectId: form.subjectId,
        title: form.title.trim(),
        status: form.status,
        duration: form.duration?.trim() || undefined,
        content: createContentMode === "single" ? form.content?.trim() || undefined : composeSyllabusContent(formSections),
      });
      setSyllabi((prev) => [created, ...prev]);
      setForm((prev) => ({ ...prev, title: "", period: "", status: "BORRADOR", duration: "", content: "" }));
      setFormSections({ ...EMPTY_SECTIONS });
      setCreateContentMode("sections");
      setShowCreateModal(false);
      setOk("Temario creado");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo crear el temario"));
    } finally {
      setSaving(false);
    }
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setError("El titulo es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const payload: UpdateSyllabusInput = {
        title: editing.title.trim(),
        status: editing.status,
        duration: editing.duration.trim() || undefined,
        content: editContentMode === "single" ? editRawContent.trim() || undefined : composeSyllabusContent(editingSections),
      };
      const updated = await materialsApi.updateSyllabus(editing.id, payload);
      setSyllabi((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditing(null);
      setOk("Temario actualizado");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo actualizar"));
    } finally {
      setSaving(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    setOk(null);
    try {
      await materialsApi.deleteSyllabus(pendingDelete.id);
      setSyllabi((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      setOk("Temario eliminado");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo eliminar"));
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="space-y-4">
      <div
        id="tour-tem-header"
        className="rounded-2xl border p-4 text-rec-text-on-media"
        style={{
          borderColor: "var(--rec-soft)",
          background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
        }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Temarios</h1>
        <p className="text-sm text-rec-text-on-media/90">Gestion completa por grupo y materia, con filtros, edicion y control de contenidos.</p>
      </div>

      {ok && <p className="text-sm rounded-xl px-3 py-2" style={{ color: "var(--rec-primary-strong)", background: "var(--rec-soft)", border: "1px solid var(--rec-soft)" }}>{ok}</p>}
      {error && <p className="text-sm text-rec-danger-text bg-rec-danger-bg border border-rec-danger-border rounded-xl px-3 py-2">{error}</p>}

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-6 w-44 rounded bg-rec-bg-subtle" />
          <div className="h-4 w-80 rounded bg-rec-bg-muted" />
          <div className="h-52 rounded-2xl bg-rec-bg-muted" />
        </div>
      )}

      {!loading && (
        <>
          <div
            id="tour-tem-toolbar"
            className="bg-rec-bg-elevated rounded-2xl p-4 shadow-sm space-y-3"
            style={{ border: "1px solid var(--rec-soft)" }}
          >
              <div className="flex items-center justify-end">
                <button
                  id="tour-tem-btn-crear"
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-lg text-rec-text-on-media text-sm font-semibold hover:opacity-90"
                  style={{ background: "var(--rec-primary)" }}
                >
                  Crear temario
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--rec-soft)", background: "var(--rec-soft)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--rec-title)" }}>Filtros de búsqueda</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltersExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 border rounded-lg px-2.5 py-1.5 text-sm text-rec-text-secondary hover:opacity-90"
                    style={{ borderColor: "var(--rec-soft)", background: "white" }}
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
                  <span className="text-xs rounded-full bg-rec-bg-elevated border px-2 py-1 text-rec-text-muted" style={{ borderColor: "var(--rec-soft)" }}>
                    {activeFiltersCount} activo(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterGroupId(0);
                      setFilterSubjectId(0);
                      setFilterStatus("ALL");
                      setFilterPeriod("");
                      setFilterHasContent("all");
                      setFilterHasDuration("all");
                      setSortBy("newest");
                      setSearch("");
                    }}
                    disabled={activeFiltersCount === 0}
                    className="border rounded-lg px-3 py-1.5 text-sm text-rec-text-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: "var(--rec-soft)", background: "white" }}
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {filtersExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <label className="text-xs text-rec-text-muted space-y-1">
                  <span className="block">Grupo</span>
                  <select
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm text-rec-text-primary"
                    value={filterGroupId}
                    onChange={(event) => {
                      setFilterGroupId(Number(event.target.value));
                      setFilterSubjectId(0);
                    }}
                  >
                    <option value={0}>Todos los grupos</option>
                    {groupOptions.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-rec-text-muted space-y-1">
                  <span className="block">Materia</span>
                  <select
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm text-rec-text-primary"
                    value={filterSubjectId}
                    onChange={(event) => setFilterSubjectId(Number(event.target.value))}
                  >
                    <option value={0}>Todas las materias</option>
                    {(
                      filterGroupId
                        ? (subjectsByGroup.get(filterGroupId) ?? [])
                        : Array.from(
                            new Map(
                              assignments.map((a) => [a.subject.id, { id: a.subject.id, name: a.subject.nombre }]),
                            ).values(),
                          )
                    ).map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-rec-text-muted space-y-1">
                  <span className="block">Estado</span>
                  <select
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm text-rec-text-primary"
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

                <label className="text-xs text-rec-text-muted space-y-1">
                  <span className="block">Periodo</span>
                  <select
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm text-rec-text-primary"
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

                <label className="text-xs text-rec-text-muted space-y-1">
                  <span className="block">Contenido</span>
                  <select
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm text-rec-text-primary"
                    value={filterHasContent}
                    onChange={(event) => setFilterHasContent(event.target.value as "all" | "with" | "without")}
                  >
                    <option value="all">Todos</option>
                    <option value="with">Con contenido</option>
                    <option value="without">Sin contenido</option>
                  </select>
                </label>

                <label className="text-xs text-rec-text-muted space-y-1">
                  <span className="block">Duración</span>
                  <select
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm text-rec-text-primary"
                    value={filterHasDuration}
                    onChange={(event) => setFilterHasDuration(event.target.value as "all" | "with" | "without")}
                  >
                    <option value="all">Todos</option>
                    <option value="with">Con duración</option>
                    <option value="without">Sin duración</option>
                  </select>
                </label>

                <label className="text-xs text-rec-text-muted space-y-1 xl:col-span-1">
                  <span className="block">Ordenar por</span>
                  <select
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm text-rec-text-primary"
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

                <label className="text-xs text-rec-text-muted space-y-1 sm:col-span-2 xl:col-span-2">
                  <span className="block">Búsqueda rápida</span>
                  <input
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Ej: título, contenido, grupo, materia, periodo o duración"
                  />
                </label>
              </div>
              )}

              <div className="flex items-center justify-between text-xs text-rec-text-subtle">
                <p>{visibleSyllabi.length} resultado(s)</p>
                <p>Usa filtros combinados para encontrar temarios rápido.</p>
              </div>

              <div id="tour-tem-lista">
              {visibleSyllabi.length === 0 ? (
                <p className="text-sm text-rec-text-subtle">No hay temarios con los filtros actuales.</p>
              ) : (
                <div className="space-y-2.5">
                  {visibleSyllabi.map((item) => {
                    const own = item.teacherId === teacherId;
                    const expanded = Boolean(expandedIds[item.id]);
                    const content = item.content ?? "";
                    const isLong = content.length > 280;
                    const displayContent = expanded || !isLong ? content : `${content.slice(0, 280)}...`;
                    const hasStructuredContent = hasStructuredSyllabusContent(item.content);
                    const parsedSections = hasStructuredContent ? parseSyllabusContent(item.content) : { ...EMPTY_SECTIONS };
                    return (
                      <article key={item.id} className="rounded-xl border border-rec-border-default p-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-rec-text-primary truncate">{item.title}</p>
                            <p className="text-xs text-rec-text-subtle mt-0.5">
                              {labelMaps.groupLabel.get(item.groupId) ?? `Grupo #${item.groupId}`} | {labelMaps.subjectLabel.get(item.subjectId) ?? `Materia #${item.subjectId}`}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {item.period && <span className="text-[11px] px-1.5 py-0.5 rounded border border-rec-info-border text-rec-info-text">Periodo: {item.period}</span>}
                              <span className={`text-[11px] px-1.5 py-0.5 rounded border ${STATUS_STYLE[item.status ?? "BORRADOR"]}`}>
                                {STATUS_OPTIONS.find((s) => s.value === (item.status ?? "BORRADOR"))?.label ?? "Borrador"}
                              </span>
                            </div>
                            {item.duration && <p className="text-xs text-rec-info-text mt-1">Duración: {item.duration}</p>}
                            <p className="text-[11px] text-rec-text-subtle mt-1">Creado: {formatDateTime(item.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Link
                              href={`/docente/temarios/${item.id}`}
                              className="px-2 py-1 rounded text-xs border hover:opacity-90"
                              style={{ borderColor: "var(--rec-soft)", color: "var(--rec-primary-strong)", background: "var(--rec-soft)" }}
                            >
                              Ver temario
                            </Link>
                            {own && (
                              <>
                              <button
                                onClick={() => {
                                  setEditing({
                                    id: item.id,
                                    title: item.title,
                                    period: item.period ?? "",
                                    status: item.status ?? "BORRADOR",
                                    duration: item.duration ?? "",
                                  });
                                  setEditingSections(parseSyllabusContent(item.content));
                                  setEditRawContent(item.content ?? "");
                                  setEditContentMode("sections");
                                }}
                                className="px-2 py-1 rounded text-xs border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setPendingDelete({ id: item.id, title: item.title })}
                                className="px-2 py-1 rounded text-xs border border-rec-danger-border text-rec-danger-text hover:bg-rec-danger-bg"
                              >
                                Eliminar
                              </button>
                              </>
                            )}
                          </div>
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
                                  <div key={key} className="text-xs text-rec-text-secondary flex items-start gap-1.5">
                                    <Icon className="mt-0.5 shrink-0 text-rec-text-subtle" />
                                    <p className="leading-4">
                                      <span className="font-semibold text-rec-text-primary">{SECTION_TITLES[key]}: </span>
                                      {shortText}
                                    </p>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-rec-text-secondary whitespace-pre-wrap">
                            {item.content?.trim() ? displayContent : "Sin contenido detallado."}
                          </p>
                        )}
                        {!hasStructuredContent && isLong && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="mt-2 text-xs text-rec-info-text hover:underline"
                          >
                            {expanded ? "▲ Minimizar" : "▼ Extender"}
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
              </div>
          </div>
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <button className="absolute inset-0 bg-rec-ink/45" onClick={() => setShowCreateModal(false)} aria-label="Cerrar" />
          <form onSubmit={onCreate} className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-rec-border-default bg-rec-bg-elevated shadow-2xl p-4 space-y-3 overflow-y-auto my-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-rec-text-primary">Crear temario</h3>
              <button
                type="button"
                onClick={() => runHelpTour(TEMARIO_MODAL_CREAR_TOUR_STEPS)}
                className="shrink-0 rounded-lg border border-rec-border-default bg-rec-bg-base px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rec-primary hover:bg-rec-bg-muted"
              >
                Guía del formulario
              </button>
            </div>

            <div id="tour-tem-modal-crear-asig" className="space-y-3">
            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Grupo</label>
              <select
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={form.groupId}
                onChange={(event) => setForm((prev) => ({ ...prev, groupId: Number(event.target.value) }))}
              >
                <option value={0}>Selecciona</option>
                {groupOptions.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Materia</label>
              <select
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={form.subjectId}
                onChange={(event) => setForm((prev) => ({ ...prev, subjectId: Number(event.target.value) }))}
              >
                <option value={0}>Selecciona</option>
                {subjectOptionsForForm.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            </div>

            <div id="tour-tem-modal-crear-meta" className="space-y-3">
            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Titulo</label>
              <input
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Ej. Algebra - Primer periodo"
              />
            </div>

            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Periodo</label>
              <input
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={form.period ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, period: event.target.value }))}
                placeholder="Ej. Periodo 1 / 2026-I"
              />
            </div>

            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Estado</label>
              <select
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={form.status ?? "BORRADOR"}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value as "BORRADOR" | "ACTIVO" | "ARCHIVADO",
                  }))
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Duración</label>
              <input
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={form.duration ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
                placeholder="Ej. 8 semanas / Periodo 1"
              />
            </div>
            </div>

            <div id="tour-tem-modal-crear-modo">
              <p className="block text-xs text-rec-text-muted mb-1">Modo de contenido</p>
              <div className="inline-flex rounded-lg border border-rec-border-strong overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    if (createContentMode === "sections") return;
                    setFormSections(parseSyllabusContent(form.content));
                    setCreateContentMode("sections");
                  }}
                  className={`px-3 py-2 text-xs ${createContentMode === "sections" ? "bg-rec-ink text-rec-text-on-media" : "bg-rec-bg-elevated text-rec-text-secondary"}`}
                >
                  Separado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (createContentMode === "single") return;
                    setForm((prev) => ({ ...prev, content: composeSyllabusContent(formSections) ?? "" }));
                    setCreateContentMode("single");
                  }}
                  className={`px-3 py-2 text-xs ${createContentMode === "single" ? "bg-rec-ink text-rec-text-on-media" : "bg-rec-bg-elevated text-rec-text-secondary"}`}
                >
                  Campo unico
                </button>
              </div>
            </div>

            <div id="tour-tem-modal-crear-cuerpo" className="space-y-3">
            {createContentMode === "sections" ? (
              <>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Objetivos</label>
                  <textarea className="w-full border border-rec-border-strong rounded-lg p-2 text-sm" rows={3} value={formSections.objetivos} onChange={(event) => setFormSections((prev) => ({ ...prev, objetivos: event.target.value }))} placeholder="Objetivos del temario" />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Contenidos</label>
                  <textarea className="w-full border border-rec-border-strong rounded-lg p-2 text-sm" rows={3} value={formSections.contenidos} onChange={(event) => setFormSections((prev) => ({ ...prev, contenidos: event.target.value }))} placeholder="Temas o unidades" />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Actividades</label>
                  <textarea className="w-full border border-rec-border-strong rounded-lg p-2 text-sm" rows={3} value={formSections.actividades} onChange={(event) => setFormSections((prev) => ({ ...prev, actividades: event.target.value }))} placeholder="Talleres, tareas, proyectos" />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Evaluacion</label>
                  <textarea className="w-full border border-rec-border-strong rounded-lg p-2 text-sm" rows={3} value={formSections.evaluacion} onChange={(event) => setFormSections((prev) => ({ ...prev, evaluacion: event.target.value }))} placeholder="Criterios o forma de evaluar" />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Recursos</label>
                  <textarea className="w-full border border-rec-border-strong rounded-lg p-2 text-sm" rows={3} value={formSections.recursos} onChange={(event) => setFormSections((prev) => ({ ...prev, recursos: event.target.value }))} placeholder="Links, libros, guias" />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Notas</label>
                  <textarea className="w-full border border-rec-border-strong rounded-lg p-2 text-sm" rows={3} value={formSections.notas} onChange={(event) => setFormSections((prev) => ({ ...prev, notas: event.target.value }))} placeholder="Observaciones adicionales" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs text-rec-text-muted mb-1">Contenido completo</label>
                <textarea
                  className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                  rows={10}
                  value={form.content ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Escribe todo en un solo campo y se guardara tal cual"
                />
              </div>
            )}
            </div>

            <div id="tour-tem-modal-crear-actions" className="flex justify-end gap-2 pt-1">
              <button type="button" className="px-4 py-2 rounded-lg border border-rec-border-strong text-sm" onClick={() => setShowCreateModal(false)} disabled={saving}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!readyToCreate || saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-rec-text-on-media hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--rec-primary)" }}
              >
                {saving ? "Guardando..." : "Crear temario"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <button className="absolute inset-0 bg-rec-ink/45" onClick={() => setEditing(null)} aria-label="Cerrar" />
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-rec-border-default bg-rec-bg-elevated shadow-2xl p-4 space-y-3 overflow-y-auto my-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-rec-text-primary">Editar temario</h3>
              <button
                type="button"
                onClick={() => runHelpTour(TEMARIO_MODAL_EDITAR_TOUR_STEPS)}
                className="shrink-0 rounded-lg border border-rec-border-default bg-rec-bg-base px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rec-primary hover:bg-rec-bg-muted"
              >
                Guía del formulario
              </button>
            </div>
            <div id="tour-tem-modal-edit-meta" className="space-y-3">
            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Titulo</label>
              <input
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={editing.title}
                onChange={(event) => setEditing((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
              />
            </div>
            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Duración</label>
              <input
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={editing.duration}
                onChange={(event) => setEditing((prev) => (prev ? { ...prev, duration: event.target.value } : prev))}
              />
            </div>
            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Periodo</label>
              <input
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={editing.period}
                onChange={(event) => setEditing((prev) => (prev ? { ...prev, period: event.target.value } : prev))}
              />
            </div>
            <div>
              <label className="block text-xs text-rec-text-muted mb-1">Estado</label>
              <select
                className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                value={editing.status}
                onChange={(event) =>
                  setEditing((prev) =>
                    prev
                      ? {
                          ...prev,
                          status: event.target.value as "BORRADOR" | "ACTIVO" | "ARCHIVADO",
                        }
                      : prev,
                  )
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            </div>
            <div id="tour-tem-modal-edit-modo">
              <p className="block text-xs text-rec-text-muted mb-1">Modo de contenido</p>
              <div className="inline-flex rounded-lg border border-rec-border-strong overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    if (editContentMode === "sections") return;
                    setEditingSections(parseSyllabusContent(editRawContent));
                    setEditContentMode("sections");
                  }}
                  className={`px-3 py-2 text-xs ${editContentMode === "sections" ? "bg-rec-ink text-rec-text-on-media" : "bg-rec-bg-elevated text-rec-text-secondary"}`}
                >
                  Separado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editContentMode === "single") return;
                    setEditRawContent(composeSyllabusContent(editingSections) ?? "");
                    setEditContentMode("single");
                  }}
                  className={`px-3 py-2 text-xs ${editContentMode === "single" ? "bg-rec-ink text-rec-text-on-media" : "bg-rec-bg-elevated text-rec-text-secondary"}`}
                >
                  Campo unico
                </button>
              </div>
            </div>

            <div id="tour-tem-modal-edit-cuerpo" className="space-y-3">
            {editContentMode === "sections" ? (
              <>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Objetivos</label>
                  <textarea
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                    rows={3}
                    value={editingSections.objetivos}
                    onChange={(event) => setEditingSections((prev) => ({ ...prev, objetivos: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Contenidos</label>
                  <textarea
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                    rows={3}
                    value={editingSections.contenidos}
                    onChange={(event) => setEditingSections((prev) => ({ ...prev, contenidos: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Actividades</label>
                  <textarea
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                    rows={3}
                    value={editingSections.actividades}
                    onChange={(event) => setEditingSections((prev) => ({ ...prev, actividades: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Evaluacion</label>
                  <textarea
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                    rows={3}
                    value={editingSections.evaluacion}
                    onChange={(event) => setEditingSections((prev) => ({ ...prev, evaluacion: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Recursos</label>
                  <textarea
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                    rows={3}
                    value={editingSections.recursos}
                    onChange={(event) => setEditingSections((prev) => ({ ...prev, recursos: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-rec-text-muted mb-1">Notas</label>
                  <textarea
                    className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                    rows={3}
                    value={editingSections.notas}
                    onChange={(event) => setEditingSections((prev) => ({ ...prev, notas: event.target.value }))}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs text-rec-text-muted mb-1">Contenido completo</label>
                <textarea
                  className="w-full border border-rec-border-strong rounded-lg p-2 text-sm"
                  rows={10}
                  value={editRawContent}
                  onChange={(event) => setEditRawContent(event.target.value)}
                />
              </div>
            )}
            </div>
            <div id="tour-tem-modal-edit-actions" className="flex justify-end gap-2 pt-1">
              <button className="px-4 py-2 rounded-lg border border-rec-border-strong text-sm" onClick={() => setEditing(null)} disabled={saving}>
                Cancelar
              </button>
              <button className="px-4 py-2 rounded-lg text-rec-text-on-media text-sm font-semibold disabled:opacity-50 hover:opacity-90" style={{ background: "var(--rec-primary)" }} onClick={() => void onSaveEdit()} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-rec-ink/45" onClick={() => !deleting && setPendingDelete(null)} aria-label="Cerrar" />
          <div className="relative w-full max-w-md rounded-2xl border border-rec-border-default bg-rec-bg-elevated shadow-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-rec-text-primary">Eliminar temario</h3>
              <button
                type="button"
                onClick={() => runHelpTour(TEMARIO_MODAL_ELIMINAR_TOUR_STEPS)}
                className="shrink-0 rounded-lg border border-rec-border-default bg-rec-bg-base px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rec-primary hover:bg-rec-bg-muted"
              >
                Guía
              </button>
            </div>
            <p className="text-sm text-rec-text-muted">Esta accion no se puede deshacer.</p>
            <div id="tour-tem-modal-del-titulo" className="rounded-lg border border-rec-border-default bg-rec-bg-base p-3 text-sm font-medium text-rec-text-primary">{pendingDelete.title}</div>
            <div id="tour-tem-modal-del-actions" className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-lg border border-rec-border-strong text-sm" onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancelar
              </button>
              <button className="px-4 py-2 rounded-lg bg-rec-danger-solid text-rec-text-on-media text-sm font-semibold disabled:opacity-50" onClick={() => void onConfirmDelete()} disabled={deleting}>
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
