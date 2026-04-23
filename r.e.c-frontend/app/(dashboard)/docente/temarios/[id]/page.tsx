"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { materialsApi, type Syllabus } from "@/lib/materialsApi";
import { academicApi, type Subject, type Group, type Grade } from "@/lib/academicApi";
import { FiTarget, FiBookOpen, FiClipboard, FiCheckSquare, FiLink, FiFileText } from "react-icons/fi";
import type { IconType } from "react-icons";

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const STATUS_OPTIONS = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "ACTIVO", label: "Activo" },
  { value: "ARCHIVADO", label: "Archivado" },
] as const;

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

  if (!foundHeaders) return { ...EMPTY_SECTIONS, notas: content.trim() };
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

export default function DocenteSyllabusDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Array<Group & { grade?: Grade }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!Number.isFinite(id) || id <= 0) {
        setError("ID de temario invalido");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [syllabusData, subjectsData, groupsData] = await Promise.all([
          materialsApi.getSyllabus(id),
          academicApi.listSubjects(),
          academicApi.listGroups(),
        ]);
        setSyllabus(syllabusData);
        setSubjects(subjectsData);
        setGroups(groupsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el temario");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const subjectName = syllabus
    ? subjects.find((subject) => subject.id === syllabus.subjectId)?.nombre ?? `Materia #${syllabus.subjectId}`
    : "";

  const groupName = syllabus
    ? groups.find((group) => group.id === syllabus.groupId)?.nombre ?? `Grupo #${syllabus.groupId}`
    : "";

  const hasStructuredContent = hasStructuredSyllabusContent(syllabus?.content);
  const sections = hasStructuredContent ? parseSyllabusContent(syllabus?.content) : { ...EMPTY_SECTIONS };
  const singleFieldContent = (syllabus?.content ?? "").trim();

  return (
    <main className="p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div id="tour-tem-det-header" className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-rec-text-primary">Detalle del temario</h1>
          <Link href="/docente/temarios" className="px-3 py-2 rounded-lg border border-rec-border-strong text-sm text-rec-text-secondary hover:bg-rec-bg-muted">
            Volver
          </Link>
        </div>

        {loading ? (
          <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-4 text-sm text-rec-text-muted">Cargando temario...</div>
        ) : error ? (
          <div className="rounded-xl border border-rec-danger-border bg-rec-danger-bg p-4 text-sm text-rec-danger-text">{error}</div>
        ) : syllabus ? (
          <article className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-5 shadow-sm space-y-4">
            <header>
              <h2 className="text-xl font-semibold text-rec-text-primary">{syllabus.title}</h2>
              <p className="text-sm text-rec-text-muted mt-1">{subjectName} | {groupName}</p>
            </header>

            <div id="tour-tem-det-meta" className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-rec-border-default p-3">
                <p className="text-xs uppercase tracking-wide text-rec-text-subtle">Periodo</p>
                <p className="mt-1 font-medium text-rec-text-primary">{syllabus.period?.trim() || "No definido"}</p>
              </div>
              <div className="rounded-lg border border-rec-border-default p-3">
                <p className="text-xs uppercase tracking-wide text-rec-text-subtle">Duración</p>
                <p className="mt-1 font-medium text-rec-text-primary">{syllabus.duration?.trim() || "No especificada"}</p>
              </div>
              <div className="rounded-lg border border-rec-border-default p-3">
                <p className="text-xs uppercase tracking-wide text-rec-text-subtle">Estado</p>
                <p className="mt-1 font-medium text-rec-text-primary">{STATUS_OPTIONS.find((s) => s.value === (syllabus.status ?? "BORRADOR"))?.label ?? "Borrador"}</p>
              </div>
            </div>

            <div id="tour-tem-det-fechas" className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-rec-border-default p-3">
                <p className="text-xs uppercase tracking-wide text-rec-text-subtle">Creado</p>
                <p className="mt-1 font-medium text-rec-text-primary">{formatDate(syllabus.createdAt) || "-"}</p>
              </div>
              <div className="rounded-lg border border-rec-border-default p-3">
                <p className="text-xs uppercase tracking-wide text-rec-text-subtle">Actualizado</p>
                <p className="mt-1 font-medium text-rec-text-primary">{formatDate(syllabus.updatedAt) || "-"}</p>
              </div>
            </div>

            <section id="tour-tem-det-contenido" className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-rec-text-primary uppercase tracking-wide">Contenido del temario</h3>
                <span className="text-xs text-rec-text-subtle">{hasStructuredContent ? "Vista por secciones" : "Vista de campo unico"}</span>
              </div>

              {hasStructuredContent ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(Object.keys(sections) as Array<keyof SyllabusSections>).map((key) => {
                    const Icon = SECTION_ICONS[key];
                    const wide = key === "recursos" || key === "notas";
                    const fallback = key === "notas" ? "Sin notas adicionales" : "Sin registro";
                    return (
                      <div key={key} className={`rounded-lg border border-rec-border-default bg-rec-bg-base p-3 ${wide ? "md:col-span-2" : ""}`}>
                        <p className="text-xs uppercase text-rec-text-subtle flex items-center gap-1.5">
                          <Icon className="text-rec-text-subtle" />
                          {SECTION_TITLES[key]}
                        </p>
                        <p className="text-sm text-rec-text-primary whitespace-pre-wrap mt-1">{sections[key] || fallback}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-rec-border-default bg-rec-bg-base p-4 text-sm text-rec-text-primary whitespace-pre-wrap max-h-[55vh] overflow-y-auto">
                  {singleFieldContent || "Sin contenido detallado."}
                </div>
              )}
            </section>
          </article>
        ) : (
          <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-4 text-sm text-rec-text-muted">No se encontro el temario.</div>
        )}
      </div>
    </main>
  );
}
