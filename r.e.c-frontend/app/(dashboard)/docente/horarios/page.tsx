"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type Group, type TeacherAssignment } from "@/lib/academicApi";
import {
  scheduleApi,
  type CreateEntryInput,
  type CreateEventInput,
  type ScheduleEntry,
  type ScheduleEvent,
  type ScheduleNote,
} from "@/lib/scheduleApi";
import { getErrorMessage } from "@/lib/errors";

const DAYS = [1, 2, 3, 4, 5];
const DAY_SHORT: Record<number, string> = { 1: "Lun", 2: "Mar", 3: "Mie", 4: "Jue", 5: "Vie" };
const DAY_FULL: Record<number, string> = { 1: "Lunes", 2: "Martes", 3: "Miercoles", 4: "Jueves", 5: "Viernes" };

const HOUR_HEIGHT = 42;

type Tab = "horario" | "entrada" | "evento" | "nota";
type ViewMode = "grid" | "list";

const ENTRY_COLORS = [
  "bg-emerald-100 border-l-emerald-500 text-emerald-900",
  "bg-sky-100 border-l-sky-500 text-sky-900",
  "bg-indigo-100 border-l-indigo-500 text-indigo-900",
  "bg-amber-100 border-l-amber-500 text-amber-900",
  "bg-rose-100 border-l-rose-500 text-rose-900",
  "bg-violet-100 border-l-violet-500 text-violet-900",
  "bg-teal-100 border-l-teal-500 text-teal-900",
  "bg-orange-100 border-l-orange-500 text-orange-900",
];

function entryColorClass(subjectId?: number | null, idx = 0): string {
  const i = subjectId != null ? subjectId % ENTRY_COLORS.length : idx % ENTRY_COLORS.length;
  return ENTRY_COLORS[i];
}

function toTimeText(minutes: number): string {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
}

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function currentSchoolDay(): number | null {
  const d = new Date().getDay();
  if (d >= 1 && d <= 5) return d;
  return null;
}

function isBreakEntry(entry: Pick<ScheduleEntry, "title" | "subjectId">): boolean {
  const normalized = (entry.title ?? "").trim().toLowerCase();
  return entry.subjectId == null && (normalized.includes("descanso") || normalized.includes("recreo") || normalized.includes("break"));
}

function getCalendarRange(entries: ScheduleEntry[]) {
  const minStart = entries.length > 0 ? Math.min(...entries.map((entry) => entry.startMinutes)) : 7 * 60;
  const maxEnd = entries.length > 0 ? Math.max(...entries.map((entry) => entry.endMinutes)) : 14 * 60;
  const startHour = Math.max(6, Math.floor(minStart / 60) - 1);
  const endHour = Math.min(20, Math.ceil(maxEnd / 60) + 1);
  const gridStart = startHour * 60;
  const gridEnd = endHour * 60;
  const totalMinutes = Math.max(60, gridEnd - gridStart);

  return {
    gridStart,
    totalMinutes,
    gridHeight: (totalMinutes / 60) * HOUR_HEIGHT,
    hours: Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i),
  };
}

export default function DocenteHorariosPage() {
  const { user } = useAuth();
  const teacherId = Number(user?.id);

  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [directorGroupIds, setDirectorGroupIds] = useState<Set<number>>(new Set());
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [notes, setNotes] = useState<ScheduleNote[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("horario");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [nowMinutes, setNowMinutes] = useState<number>(new Date().getHours() * 60 + new Date().getMinutes());

  const [entryDay, setEntryDay] = useState("1");
  const [entryStart, setEntryStart] = useState("07:00");
  const [entryEnd, setEntryEnd] = useState("08:00");
  const [entryTitle, setEntryTitle] = useState("");
  const [entrySubjectId, setEntrySubjectId] = useState("0");
  const [entryLocation, setEntryLocation] = useState("");
  const [entryKind, setEntryKind] = useState<"class" | "break">("class");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartAt, setEventStartAt] = useState("");
  const [eventEndAt, setEventEndAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [noteContent, setNoteContent] = useState("");

  const groups = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>();
    assignments.forEach((a) => {
      if (!a.group?.id) return;
      map.set(a.group.id, {
        id: a.group.id,
        label: `${a.group.grade?.nombre ?? "?"} - ${a.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

  const subjectsInSelectedGroup = useMemo(
    () => assignments.filter((a) => a.group?.id === selectedGroupId),
    [assignments, selectedGroupId],
  );

  const subjectMap = useMemo(() => {
    const map: Record<number, string> = {};
    subjectsInSelectedGroup.forEach((a) => {
      map[a.subject.id] = a.subject.nombre;
    });
    return map;
  }, [subjectsInSelectedGroup]);

  const isDirector = selectedGroupId != null && directorGroupIds.has(selectedGroupId);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinutes - b.startMinutes),
    [entries],
  );

  const weeklyMinutes = useMemo(
    () => entries.reduce((acc, e) => acc + (e.endMinutes - e.startMinutes), 0),
    [entries],
  );

  const weeklyHours = useMemo(() => (weeklyMinutes / 60).toFixed(1), [weeklyMinutes]);
  const calendarRange = useMemo(() => getCalendarRange(entries), [entries]);

  const nextEvent = useMemo(
    () => [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0] ?? null,
    [events],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      academicApi.listTeacherAssignments(teacherId),
      academicApi.listGroups().catch(() => [] as (Group & { grade?: { nombre: string } })[]),
    ])
      .then(([assignmentData, allGroups]) => {
        setAssignments(assignmentData);
        setDirectorGroupIds(new Set(allGroups.filter((g) => g.directorId === teacherId).map((g) => g.id)));
        setSelectedGroupId(assignmentData[0]?.group?.id ?? null);
      })
      .catch((cause: unknown) => setError(getErrorMessage(cause, "No se pudieron cargar asignaciones")))
      .finally(() => setLoading(false));
  }, [teacherId]);

  useEffect(() => {
    if (!selectedGroupId) {
      setEntries([]);
      setEvents([]);
      setNotes([]);
      return;
    }
    setError(null);
    Promise.all([
      scheduleApi.listEntries(selectedGroupId),
      scheduleApi.listEvents(selectedGroupId),
      scheduleApi.listNotes(selectedGroupId),
    ])
      .then(([entryData, eventData, noteData]) => {
        setEntries(entryData);
        setEvents(eventData);
        setNotes(noteData);
      })
      .catch((cause: unknown) => setError(getErrorMessage(cause, "No se pudo cargar el horario")));
  }, [selectedGroupId]);

  const onCreateEntry = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGroupId) return;
    setError(null);
    setOk(null);

    const start = toMinutes(entryStart);
    const end = toMinutes(entryEnd);
    if (end <= start) {
      setError("La hora de fin debe ser posterior al inicio");
      return;
    }

    const isBreak = entryKind === "break";
    const payload: CreateEntryInput = {
      groupId: selectedGroupId,
      dayOfWeek: Number(entryDay),
      startMinutes: start,
      endMinutes: end,
      title: isBreak ? entryTitle.trim() || "Descanso" : entryTitle.trim() || undefined,
      subjectId: isBreak ? undefined : Number(entrySubjectId) > 0 ? Number(entrySubjectId) : undefined,
      location: entryLocation.trim() || undefined,
    };

    setSaving(true);
    try {
      const created = await scheduleApi.createEntry(payload);
      setEntries((prev) => [...prev, created]);
      setEntryTitle("");
      setEntryLocation("");
      setEntrySubjectId("0");
      setEntryKind("class");
      setOk("Entrada creada");
      setActiveTab("horario");
      setViewMode("grid");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo crear la entrada"));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteEntry = async (id: number) => {
    if (!window.confirm("Eliminar esta entrada?")) return;
    try {
      await scheduleApi.deleteEntry(id);
      setEntries((prev) => prev.filter((item) => item.id !== id));
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo eliminar la entrada"));
    }
  };

  const onCreateEvent = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGroupId) return;
    setError(null);
    setOk(null);
    if (!eventTitle.trim() || !eventStartAt || !eventEndAt) {
      setError("Completa titulo, inicio y fin del evento");
      return;
    }
    if (new Date(eventEndAt).getTime() <= new Date(eventStartAt).getTime()) {
      setError("El fin debe ser posterior al inicio");
      return;
    }

    const payload: CreateEventInput = {
      groupId: selectedGroupId,
      title: eventTitle.trim(),
      description: eventDescription.trim() || undefined,
      startAt: new Date(eventStartAt).toISOString(),
      endAt: new Date(eventEndAt).toISOString(),
      location: eventLocation.trim() || undefined,
    };

    setSaving(true);
    try {
      const created = await scheduleApi.createEvent(payload);
      setEvents((prev) => [...prev, created].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
      setEventTitle("");
      setEventDescription("");
      setEventStartAt("");
      setEventEndAt("");
      setEventLocation("");
      setOk("Evento creado");
      setActiveTab("horario");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo crear el evento"));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteEvent = async (id: number) => {
    if (!window.confirm("Eliminar este evento?")) return;
    try {
      await scheduleApi.deleteEvent(id);
      setEvents((prev) => prev.filter((item) => item.id !== id));
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo eliminar el evento"));
    }
  };

  const onCreateNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGroupId || !noteContent.trim()) return;
    setError(null);
    setOk(null);
    setSaving(true);
    try {
      const created = await scheduleApi.createNote({ groupId: selectedGroupId, content: noteContent.trim() });
      setNotes((prev) => [created, ...prev]);
      setNoteContent("");
      setOk("Nota publicada");
      setActiveTab("horario");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo crear la nota"));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteNote = async (id: number) => {
    if (!window.confirm("Eliminar esta nota?")) return;
    try {
      await scheduleApi.deleteNote(id);
      setNotes((prev) => prev.filter((item) => item.id !== id));
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo eliminar la nota"));
    }
  };

  const inputClass =
    "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500";

  if (loading) {
    return (
      <section className="p-4">
        <div className="space-y-3 animate-pulse">
          <div className="h-7 w-56 rounded bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-100" />
          <div className="h-[460px] rounded-2xl bg-slate-100" />
        </div>
      </section>
    );
  }

  const today = currentSchoolDay();
  const nowInRange = nowMinutes >= calendarRange.gridStart && nowMinutes <= calendarRange.gridStart + calendarRange.totalMinutes;

  return (
    <section className="space-y-4 overflow-x-hidden p-3 md:p-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Horario docente</h2>
            <p className="text-sm text-slate-600">Panel semanal para planear clases, publicar notas y coordinar eventos.</p>
          </div>
          {selectedGroupId && (
            <div className="text-xs md:text-sm rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 w-fit">
              {isDirector ? "Modo gestion activo" : "Modo consulta"}
            </div>
          )}
        </div>
      </div>

      {ok && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{ok}</p>}
      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      {groups.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                setSelectedGroupId(group.id);
                setActiveTab("horario");
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                group.id === selectedGroupId
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      )}

      {groups.length === 1 && (
        <p className="text-sm font-medium text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full w-fit border border-emerald-200">
          {groups[0].label}
          {isDirector && <span className="ml-2 text-emerald-500 text-xs">(Director)</span>}
        </p>
      )}

      {groups.length === 0 && (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          No tienes grupos asignados. Contacta a la secretaria.
        </p>
      )}

      {selectedGroupId && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-3.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Clases</p>
              <p className="text-2xl font-bold text-slate-900">{entries.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-3.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Horas semana</p>
              <p className="text-2xl font-bold text-slate-900">{weeklyHours}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-3.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Eventos</p>
              <p className="text-2xl font-bold text-slate-900">{events.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-3.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Notas</p>
              <p className="text-2xl font-bold text-slate-900">{notes.length}</p>
            </div>
          </div>

          <div className="flex flex-col 2xl:flex-row gap-4">
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                {([
                  ["horario", "Horario"],
                  ...(isDirector ? [["entrada", "Entrada"], ["evento", "Evento"], ["nota", "Nota"]] : []),
                ] as [Tab, string][]).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab ? "bg-emerald-100 text-emerald-800" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                {activeTab === "horario" && (
                  <div className="ml-auto inline-flex rounded-lg border border-slate-300 overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-1.5 text-sm ${viewMode === "grid" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                    >
                      Grilla
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                    >
                      Lista
                    </button>
                  </div>
                )}
              </div>

              {activeTab === "horario" && viewMode === "grid" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[640px] lg:min-w-[700px]">
                      <div className="sticky top-0 z-10 flex border-b border-slate-200 bg-slate-50">
                        <div className="w-12 shrink-0 border-r border-slate-200" />
                        {DAYS.map((day) => (
                          <div
                            key={day}
                            className={`flex-1 text-center py-3 border-r last:border-r-0 border-slate-200 ${today === day ? "bg-emerald-50" : ""}`}
                          >
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{DAY_SHORT[day]}</span>
                          </div>
                        ))}
                      </div>

                      <div className="relative" style={{ height: `${calendarRange.gridHeight}px` }}>
                        <div className="w-12 h-full absolute left-0 top-0 border-r border-slate-200 bg-white">
                          {calendarRange.hours.slice(0, -1).map((h, i) => (
                            <div
                              key={h}
                              className="absolute w-full flex items-start justify-end pr-2 border-t border-slate-100"
                              style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                            >
                              <span className="text-[10px] text-slate-500 mt-0.5">{String(h).padStart(2, "0")}:00</span>
                            </div>
                          ))}
                        </div>

                        <div className="ml-12 h-full flex">
                          {DAYS.map((day) => {
                            const dayEntries = entries.filter((entry) => entry.dayOfWeek === day);
                            return (
                              <div key={day} className={`flex-1 relative border-r last:border-r-0 border-slate-200 ${today === day ? "bg-emerald-50/30" : ""}`}>
                                {calendarRange.hours.slice(0, -1).map((_, i) => (
                                  <div key={i} className="absolute w-full border-t border-slate-100" style={{ top: `${i * HOUR_HEIGHT}px` }} />
                                ))}
                                {calendarRange.hours.slice(0, -1).map((_, i) => (
                                  <div
                                    key={`half-${i}`}
                                    className="absolute w-full border-t border-slate-50"
                                    style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                                  />
                                ))}

                                {today === day && nowInRange && (
                                  <div
                                    className="absolute left-0 right-0 border-t border-red-400 z-10"
                                    style={{ top: `${((nowMinutes - calendarRange.gridStart) / calendarRange.totalMinutes) * calendarRange.gridHeight}px` }}
                                  >
                                    <span className="absolute -top-2 right-1 text-[10px] bg-red-500 text-white px-1 rounded">ahora</span>
                                  </div>
                                )}

                                {dayEntries.map((entry, idx) => {
                                  const top = ((entry.startMinutes - calendarRange.gridStart) / calendarRange.totalMinutes) * calendarRange.gridHeight;
                                  const height = Math.max(((entry.endMinutes - entry.startMinutes) / calendarRange.totalMinutes) * calendarRange.gridHeight, 24);
                                  const isBreak = isBreakEntry(entry);
                                  const subjectName = entry.subjectId ? subjectMap[entry.subjectId] : null;
                                  const colorClass = isBreak ? "bg-amber-100 border-l-amber-500 text-amber-900" : entryColorClass(entry.subjectId, idx);
                                  return (
                                    <div
                                      key={entry.id}
                                      className={`absolute left-1 right-1 rounded-lg border-l-[3px] px-2 py-1 overflow-hidden group cursor-default select-none transition-all hover:shadow ${colorClass}`}
                                      style={{ top: `${top}px`, height: `${height}px` }}
                                      title={`${subjectName ?? entry.title ?? (isBreak ? "Descanso" : "Clase")} | ${toTimeText(entry.startMinutes)}-${toTimeText(entry.endMinutes)}${
                                        entry.location ? ` | ${entry.location}` : ""
                                      }`}
                                    >
                                      <p className="text-[10px] font-bold leading-tight truncate">{subjectName ?? entry.title ?? (isBreak ? "Descanso" : "Clase")}</p>
                                      {height > 28 && (
                                        <p className="text-[10px] opacity-75">
                                          {toTimeText(entry.startMinutes)}-{toTimeText(entry.endMinutes)}
                                        </p>
                                      )}
                                      {height > 42 && entry.location && <p className="text-[9px] opacity-60 truncate">{entry.location}</p>}
                                      {isDirector && (
                                        <button
                                          onClick={() => void onDeleteEntry(entry.id)}
                                          className="hidden group-hover:flex absolute top-1 right-1 w-5 h-5 items-center justify-center rounded bg-white/80 text-[11px] text-red-600 hover:bg-red-100"
                                          title="Eliminar"
                                        >
                                          x
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "horario" && viewMode === "list" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Agenda de clases</h3>
                  {sortedEntries.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin entradas registradas.</p>
                  ) : (
                    <div className="space-y-2">
                      {sortedEntries.map((entry, idx) => {
                        const isBreak = isBreakEntry(entry);
                        const colorClass = isBreak ? "bg-amber-100 border-l-amber-500 text-amber-900" : entryColorClass(entry.subjectId, idx);
                        const subjectName = entry.subjectId ? subjectMap[entry.subjectId] : null;
                        return (
                          <div
                            key={entry.id}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 border-l-[3px] text-sm ${colorClass}`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="font-semibold shrink-0 w-10">{DAY_SHORT[entry.dayOfWeek]}</span>
                              <span className="text-xs opacity-75 shrink-0">{toTimeText(entry.startMinutes)}-{toTimeText(entry.endMinutes)}</span>
                              <span className="truncate font-medium">{subjectName ?? entry.title ?? (isBreak ? "Descanso" : "(Sin titulo)")}</span>
                              {entry.location && <span className="text-xs opacity-60 truncate hidden md:block">{entry.location}</span>}
                            </div>
                            {isDirector && (
                              <button
                                onClick={() => void onDeleteEntry(entry.id)}
                                className="ml-2 px-2 py-1 rounded text-xs text-red-600 hover:bg-red-100"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "entrada" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-1">Nueva entrada semanal</h3>
                  <p className="text-xs text-slate-500 mb-4">Define dia, franja horaria y materia para el bloque recurrente.</p>
                  <form onSubmit={onCreateEntry} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de bloque</label>
                      <select className={inputClass} value={entryKind} onChange={(event) => setEntryKind(event.target.value as "class" | "break")}>
                        <option value="class">Clase</option>
                        <option value="break">Descanso</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Dia</label>
                      <select className={inputClass} value={entryDay} onChange={(event) => setEntryDay(event.target.value)}>
                        {DAYS.map((day) => (
                          <option key={day} value={day}>
                            {DAY_FULL[day]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Materia</label>
                      <select className={inputClass} value={entrySubjectId} onChange={(event) => setEntrySubjectId(event.target.value)} disabled={entryKind === "break"}>
                        <option value="0">Sin materia asignada</option>
                        {subjectsInSelectedGroup.map((assignment) => (
                          <option key={assignment.id} value={assignment.subject.id}>
                            {assignment.subject.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Hora inicio</label>
                      <input type="time" className={inputClass} value={entryStart} onChange={(event) => setEntryStart(event.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Hora fin</label>
                      <input type="time" className={inputClass} value={entryEnd} onChange={(event) => setEntryEnd(event.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Titulo (opcional)</label>
                      <input
                        className={inputClass}
                        value={entryTitle}
                        onChange={(event) => setEntryTitle(event.target.value)}
                        placeholder={entryKind === "break" ? "Ej. Descanso / Recreo" : "Ej. Algebra"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Lugar (opcional)</label>
                      <input className={inputClass} value={entryLocation} onChange={(event) => setEntryLocation(event.target.value)} placeholder="Ej. Aula 204" />
                    </div>
                    <div className="sm:col-span-2 flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {saving ? "Guardando..." : "Guardar entrada"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("horario")}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "evento" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-1">Nuevo evento</h3>
                  <p className="text-xs text-slate-500 mb-4">Publica novedades puntuales para tu grupo.</p>
                  <form onSubmit={onCreateEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Titulo</label>
                      <input className={inputClass} value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Inicio</label>
                      <input type="datetime-local" className={inputClass} value={eventStartAt} onChange={(event) => setEventStartAt(event.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Fin</label>
                      <input type="datetime-local" className={inputClass} value={eventEndAt} onChange={(event) => setEventEndAt(event.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Descripcion</label>
                      <textarea className={inputClass} rows={2} value={eventDescription} onChange={(event) => setEventDescription(event.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Lugar</label>
                      <input className={inputClass} value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} />
                    </div>
                    <div className="sm:col-span-2 flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {saving ? "Guardando..." : "Crear evento"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("horario")}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "nota" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-1">Nueva nota</h3>
                  <p className="text-xs text-slate-500 mb-4">Comparte avisos rapidos para estudiantes.</p>
                  <form onSubmit={onCreateNote} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Contenido</label>
                      <textarea className={inputClass} rows={4} value={noteContent} onChange={(event) => setNoteContent(event.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving || !noteContent.trim()}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {saving ? "Publicando..." : "Publicar nota"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("horario")}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="2xl:w-72 space-y-4 shrink-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Proximo evento</h3>
                {nextEvent ? (
                  <div className="text-xs space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{nextEvent.title}</p>
                    <p className="text-slate-600">{formatDateTime(nextEvent.startAt)} - {formatDateTime(nextEvent.endAt)}</p>
                    {nextEvent.location && <p className="text-slate-600">{nextEvent.location}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No hay eventos proximos.</p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Eventos ({events.length})</h3>
                  {isDirector && (
                    <button onClick={() => setActiveTab("evento")} className="text-xs text-emerald-700 hover:underline font-medium">
                      + Anadir
                    </button>
                  )}
                </div>
                {events.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin eventos programados.</p>
                ) : (
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {[...events]
                      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
                      .map((item) => (
                        <li key={item.id} className="border border-slate-100 rounded-xl p-2.5 space-y-0.5 text-xs">
                          <p className="font-semibold text-slate-800 text-sm leading-tight">{item.title}</p>
                          <p className="text-slate-600">{formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}</p>
                          {item.description && <p className="text-slate-600">{item.description}</p>}
                          {item.location && <p className="text-slate-500">{item.location}</p>}
                          {isDirector && (
                            <button onClick={() => void onDeleteEvent(item.id)} className="text-red-600 hover:text-red-700">
                              Eliminar
                            </button>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Notas ({notes.length})</h3>
                  {isDirector && (
                    <button onClick={() => setActiveTab("nota")} className="text-xs text-emerald-700 hover:underline font-medium">
                      + Anadir
                    </button>
                  )}
                </div>
                {notes.length === 0 ? (
                  <p className="text-xs text-slate-500">Sin notas publicadas.</p>
                ) : (
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {notes.map((item) => (
                      <li key={item.id} className="border border-amber-100 bg-amber-50 rounded-xl p-2.5">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.content}</p>
                        {isDirector && (
                          <button onClick={() => void onDeleteNote(item.id)} className="text-xs text-red-600 hover:text-red-700 mt-1">
                            Eliminar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {Object.keys(subjectMap).length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Materias activas</h3>
                  <ul className="space-y-1">
                    {Object.entries(subjectMap).map(([id, name]) => (
                      <li key={id} className={`rounded-lg px-2 py-1 text-xs font-medium border-l-[3px] ${entryColorClass(Number(id))}`}>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!isDirector && selectedGroupId && (
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  Solo el director del grupo puede gestionar el horario.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
