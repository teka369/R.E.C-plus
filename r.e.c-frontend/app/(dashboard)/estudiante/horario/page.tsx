"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi } from "@/lib/academicApi";
import { scheduleApi, type ScheduleEntry, type ScheduleEvent, type ScheduleNote } from "@/lib/scheduleApi";
import { getErrorMessage } from "@/lib/errors";

const DAYS = [1, 2, 3, 4, 5];
const DAY_SHORT: Record<number, string> = { 1: "Lun", 2: "Mar", 3: "Mie", 4: "Jue", 5: "Vie" };

const HOUR_HEIGHT = 42;

type ViewMode = "grid" | "list";

const ENTRY_COLORS = [
  "bg-rec-success-bg-muted border-l-rec-chart-emerald text-rec-text-primary",
  "bg-rec-info-bg-strong border-l-rec-chart-cyan text-rec-info-text",
  "bg-rec-info-bg border-l-rec-role-primary text-rec-text-primary",
  "bg-rec-warning-bg border-l-rec-chart-amber text-rec-text-primary",
  "bg-rec-danger-bg border-l-rec-chart-rose text-rec-text-primary",
  "bg-rec-role-surface border-l-rec-role-primary text-rec-text-primary",
  "bg-rec-success-bg border-l-rec-chart-cyan text-rec-text-primary",
  "bg-rec-warning-bg border-l-rec-chart-amber text-rec-text-primary",
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

export default function EstudianteHorarioPage() {
  const { user } = useAuth();

  const [groupLabel, setGroupLabel] = useState("");
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [notes, setNotes] = useState<ScheduleNote[]>([]);
  const [subjectMap, setSubjectMap] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withoutGroup, setWithoutGroup] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [nowMinutes, setNowMinutes] = useState<number>(new Date().getHours() * 60 + new Date().getMinutes());

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
    const studentId = Number(user?.id);
    if (!studentId) return;

    Promise.resolve()
      .then(async () => {
        setError(null);
        setWithoutGroup(false);
        const studentGroup = await academicApi.getStudentGroup(studentId);
        const groupId = studentGroup?.group?.id;

        if (!groupId) {
          setWithoutGroup(true);
          setGroupLabel("");
          setEntries([]);
          setEvents([]);
          setNotes([]);
          setSubjectMap({});
          return;
        }

        setGroupLabel(`${studentGroup.group.grade.nombre} - ${studentGroup.group.nombre}`);

        const [entryData, eventData, noteData, groupSubjects] = await Promise.all([
          scheduleApi.listEntries(groupId),
          scheduleApi.listEvents(groupId),
          scheduleApi.listNotes(groupId),
          academicApi.listGroupSubjects(groupId).catch(() => []),
        ]);

        const map: Record<number, string> = {};
        groupSubjects.forEach((item) => {
          map[item.subject.id] = item.subject.nombre;
        });

        setEntries(entryData);
        setEvents(eventData);
        setNotes(noteData);
        setSubjectMap(map);
      })
      .catch((cause: unknown) => setError(getErrorMessage(cause, "No se pudo cargar tu horario")))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const today = currentSchoolDay();
  const nowInRange = nowMinutes >= calendarRange.gridStart && nowMinutes <= calendarRange.gridStart + calendarRange.totalMinutes;

  return (
    <section className="space-y-4 overflow-x-hidden">
      <div
        id="tour-est-hr-header"
        className="rounded-2xl border p-4 sm:p-6 text-rec-text-on-media"
        style={{
          borderColor: "var(--rec-soft)",
          background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))",
        }}
      >
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Mi horario</h2>
        <p className="text-sm text-rec-text-on-media/90">Consulta rapidamente clases, eventos y avisos del grupo.</p>
      </div>

      <div id="tour-est-hr-grupo" className="min-h-[2.5rem]">
        {groupLabel ? (
          <p className="text-sm font-medium text-rec-success-text bg-rec-success-bg px-4 py-2 rounded-full w-fit border border-rec-success-border">
            Grupo: {groupLabel}
          </p>
        ) : null}
      </div>

      {error && <p className="text-sm text-rec-danger-text bg-rec-danger-bg border border-rec-danger-border rounded-xl px-3 py-2">{error}</p>}

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-7 w-56 rounded bg-rec-bg-subtle" />
          <div className="h-4 w-72 rounded bg-rec-bg-muted" />
          <div className="h-[460px] rounded-2xl bg-rec-bg-muted" />
        </div>
      )}

      {!loading && withoutGroup && (
        <div className="text-sm text-rec-text-subtle bg-rec-bg-base border border-rec-border-default rounded-xl px-3 py-2">
          Sin grupo asignado. Contacta a la secretaria para completar la asignacion.
        </div>
      )}

      {!loading && !withoutGroup && (
        <>
          <div id="tour-est-hr-stats" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-3 md:p-3.5">
              <p className="text-xs uppercase tracking-wide text-rec-text-subtle">Clases</p>
              <p className="text-2xl font-bold text-rec-text-primary">{entries.length}</p>
            </div>
            <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-3 md:p-3.5">
              <p className="text-xs uppercase tracking-wide text-rec-text-subtle">Horas semana</p>
              <p className="text-2xl font-bold text-rec-text-primary">{weeklyHours}</p>
            </div>
            <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-3 md:p-3.5">
              <p className="text-xs uppercase tracking-wide text-rec-text-subtle">Eventos</p>
              <p className="text-2xl font-bold text-rec-text-primary">{events.length}</p>
            </div>
            <div className="rounded-xl border border-rec-border-default bg-rec-bg-elevated p-3 md:p-3.5">
              <p className="text-xs uppercase tracking-wide text-rec-text-subtle">Notas</p>
              <p className="text-2xl font-bold text-rec-text-primary">{notes.length}</p>
            </div>
          </div>

          <div className="flex flex-col 2xl:flex-row gap-4">
            <div id="tour-est-hr-calendario" className="flex-1 min-w-0 space-y-4">
              <div id="tour-est-hr-vista" className="flex items-center gap-2 border-b border-rec-border-default pb-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                    viewMode === "grid" ? "bg-rec-ink text-rec-text-on-media" : "text-rec-text-muted hover:bg-rec-bg-muted"
                  }`}
                >
                  Grilla
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                    viewMode === "list" ? "bg-rec-ink text-rec-text-on-media" : "text-rec-text-muted hover:bg-rec-bg-muted"
                  }`}
                >
                  Lista
                </button>
              </div>

              {viewMode === "grid" && (
                <div className="bg-rec-bg-elevated border border-rec-border-default rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[560px] lg:min-w-[700px]">
                      <div className="sticky top-0 z-10 flex border-b border-rec-border-default bg-rec-bg-base">
                        <div className="w-12 shrink-0 border-r border-rec-border-default" />
                        {DAYS.map((day) => (
                          <div
                            key={day}
                            className={`flex-1 text-center py-3 border-r last:border-r-0 border-rec-border-default ${today === day ? "bg-rec-info-bg" : ""}`}
                          >
                            <span className="text-xs font-bold uppercase tracking-wider text-rec-text-secondary">{DAY_SHORT[day]}</span>
                          </div>
                        ))}
                      </div>

                      <div className="relative" style={{ height: `${calendarRange.gridHeight}px` }}>
                        <div className="w-12 h-full absolute left-0 top-0 border-r border-rec-border-default bg-rec-bg-elevated">
                          {calendarRange.hours.slice(0, -1).map((h, i) => (
                            <div
                              key={h}
                              className="absolute w-full flex items-start justify-end pr-2 border-t border-rec-border-subtle"
                              style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                            >
                              <span className="text-[10px] text-rec-text-subtle mt-0.5">{String(h).padStart(2, "0")}:00</span>
                            </div>
                          ))}
                        </div>

                        <div className="ml-12 h-full flex">
                          {DAYS.map((day) => {
                            const dayEntries = entries.filter((entry) => entry.dayOfWeek === day);
                            return (
                              <div key={day} className={`flex-1 relative border-r last:border-r-0 border-rec-border-default ${today === day ? "bg-rec-info-bg/30" : ""}`}>
                                {calendarRange.hours.slice(0, -1).map((_, i) => (
                                  <div key={i} className="absolute w-full border-t border-rec-border-subtle" style={{ top: `${i * HOUR_HEIGHT}px` }} />
                                ))}
                                {calendarRange.hours.slice(0, -1).map((_, i) => (
                                  <div
                                    key={`half-${i}`}
                                    className="absolute w-full border-t border-rec-bg-muted"
                                    style={{ top: `${i * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                                  />
                                ))}

                                {today === day && nowInRange && (
                                  <div
                                    className="absolute left-0 right-0 border-t border-rec-danger-border z-10"
                                    style={{ top: `${((nowMinutes - calendarRange.gridStart) / calendarRange.totalMinutes) * calendarRange.gridHeight}px` }}
                                  >
                                    <span className="absolute -top-2 right-1 text-[10px] bg-rec-danger-solid text-rec-text-on-media px-1 rounded">ahora</span>
                                  </div>
                                )}

                                {dayEntries.map((entry, idx) => {
                                  const top = ((entry.startMinutes - calendarRange.gridStart) / calendarRange.totalMinutes) * calendarRange.gridHeight;
                                  const height = Math.max(((entry.endMinutes - entry.startMinutes) / calendarRange.totalMinutes) * calendarRange.gridHeight, 24);
                                  const isBreak = isBreakEntry(entry);
                                  const subjectName = entry.subjectId ? subjectMap[entry.subjectId] : null;
                                  const colorClass = isBreak ? "bg-rec-warning-bg border-l-rec-chart-amber text-rec-text-primary" : entryColorClass(entry.subjectId, idx);
                                  return (
                                    <div
                                      key={entry.id}
                                      className={`absolute left-1 right-1 rounded-lg border-l-[3px] px-2 py-1 overflow-hidden cursor-default select-none transition-all hover:shadow ${colorClass}`}
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

              {viewMode === "list" && (
                <div className="bg-rec-bg-elevated border border-rec-border-default rounded-2xl p-3.5 shadow-sm">
                  <h3 className="text-sm font-semibold text-rec-text-secondary mb-3">Agenda de clases</h3>
                  {sortedEntries.length === 0 ? (
                    <p className="text-sm text-rec-text-subtle">No hay clases registradas para este grupo.</p>
                  ) : (
                    <div className="space-y-2">
                      {sortedEntries.map((entry, idx) => {
                        const isBreak = isBreakEntry(entry);
                        const colorClass = isBreak ? "bg-rec-warning-bg border-l-rec-chart-amber text-rec-text-primary" : entryColorClass(entry.subjectId, idx);
                        const subjectName = entry.subjectId ? subjectMap[entry.subjectId] : null;
                        return (
                          <div key={entry.id} className={`rounded-xl px-3 py-2 border-l-[3px] text-sm ${colorClass}`}>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-semibold w-10">{DAY_SHORT[entry.dayOfWeek]}</span>
                              <span className="text-xs opacity-75">{toTimeText(entry.startMinutes)}-{toTimeText(entry.endMinutes)}</span>
                              <span className="font-medium">{subjectName ?? entry.title ?? (isBreak ? "Descanso" : "(Sin titulo)")}</span>
                              {entry.location && <span className="text-xs opacity-60">{entry.location}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="2xl:w-72 space-y-4 shrink-0">
              <div className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-3.5 shadow-sm">
                <h3 className="text-sm font-semibold text-rec-text-secondary mb-2">Proximo evento</h3>
                {nextEvent ? (
                  <div className="text-xs space-y-1">
                    <p className="text-sm font-semibold text-rec-text-primary">{nextEvent.title}</p>
                    <p className="text-rec-text-muted">{formatDateTime(nextEvent.startAt)} - {formatDateTime(nextEvent.endAt)}</p>
                    {nextEvent.location && <p className="text-rec-text-muted">{nextEvent.location}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-rec-text-subtle">No hay eventos proximos.</p>
                )}
              </div>

              <div className="bg-rec-bg-elevated border border-rec-border-default rounded-2xl p-3.5 shadow-sm">
                <h3 className="text-sm font-semibold text-rec-text-secondary mb-3">Eventos ({events.length})</h3>
                {events.length === 0 ? (
                  <p className="text-xs text-rec-text-subtle">Sin eventos programados.</p>
                ) : (
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {[...events]
                      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
                      .map((item) => (
                        <li key={item.id} className="border border-rec-border-subtle rounded-xl p-2.5 space-y-0.5 text-xs">
                          <p className="font-semibold text-rec-text-primary text-sm leading-tight">{item.title}</p>
                          <p className="text-rec-text-muted">{formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}</p>
                          {item.description && <p className="text-rec-text-muted">{item.description}</p>}
                          {item.location && <p className="text-rec-text-subtle">{item.location}</p>}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="bg-rec-bg-elevated border border-rec-border-default rounded-2xl p-3.5 shadow-sm">
                <h3 className="text-sm font-semibold text-rec-text-secondary mb-3">Notas ({notes.length})</h3>
                {notes.length === 0 ? (
                  <p className="text-xs text-rec-text-subtle">Sin notas publicadas.</p>
                ) : (
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {notes.map((item) => (
                      <li key={item.id} className="border border-rec-warning-border bg-rec-warning-bg rounded-xl p-2.5">
                        <p className="text-sm text-rec-text-secondary whitespace-pre-wrap">{item.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {Object.keys(subjectMap).length > 0 && (
                <div className="bg-rec-bg-elevated border border-rec-border-default rounded-2xl p-3.5 shadow-sm">
                  <h3 className="text-sm font-semibold text-rec-text-secondary mb-2">Materias activas</h3>
                  <ul className="space-y-1">
                    {Object.entries(subjectMap).map(([id, name]) => (
                      <li key={id} className={`rounded-lg px-2 py-1 text-xs font-medium border-l-[3px] ${entryColorClass(Number(id))}`}>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
