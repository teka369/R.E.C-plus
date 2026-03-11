"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import {
  scheduleApi,
  type CreateEntryInput,
  type CreateEventInput,
  type ScheduleEntry,
  type ScheduleEvent,
  type ScheduleNote,
} from "@/lib/scheduleApi";
import { getErrorMessage } from "@/lib/errors";

function toTimeText(minutes: number) {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

function toMinutes(value: string) {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  return hour * 60 + minute;
}

const dayLabels: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export default function DocenteHorariosPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [notes, setNotes] = useState<ScheduleNote[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [entryDay, setEntryDay] = useState("1");
  const [entryStart, setEntryStart] = useState("07:00");
  const [entryEnd, setEntryEnd] = useState("08:00");
  const [entryTitle, setEntryTitle] = useState("");
  const [entrySubjectId, setEntrySubjectId] = useState("0");
  const [entryLocation, setEntryLocation] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartAt, setEventStartAt] = useState("");
  const [eventEndAt, setEventEndAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [noteContent, setNoteContent] = useState("");

  const groups = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>();
    assignments.forEach((item) => {
      if (!item.group?.id) return;
      map.set(item.group.id, {
        id: item.group.id,
        label: `${item.group.grade?.nombre ?? item.group.gradeId ?? "Grado"} - ${item.group.nombre}`,
      });
    });
    return Array.from(map.values());
  }, [assignments]);

  const subjectsInSelectedGroup = useMemo(() => {
    if (!selectedGroupId) return [] as TeacherAssignment[];
    return assignments.filter((item) => item.group.id === selectedGroupId);
  }, [assignments, selectedGroupId]);

  useEffect(() => {
    const run = async () => {
      const teacherId = Number(user?.id);
      if (!teacherId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await academicApi.listTeacherAssignments(teacherId);
        setAssignments(data);
        const first = data[0]?.group?.id ?? null;
        setSelectedGroupId(first);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudieron cargar asignaciones"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!selectedGroupId) {
        setEntries([]);
        setEvents([]);
        setNotes([]);
        return;
      }
      setError(null);
      try {
        const [entryData, eventData, noteData] = await Promise.all([
          scheduleApi.listEntries(selectedGroupId),
          scheduleApi.listEvents(selectedGroupId),
          scheduleApi.listNotes(selectedGroupId),
        ]);
        setEntries(entryData);
        setEvents(eventData);
        setNotes(noteData);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar horario del grupo"));
      }
    };
    void run();
  }, [selectedGroupId]);

  const onCreateEntry = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGroupId) return;
    const payload: CreateEntryInput = {
      groupId: selectedGroupId,
      dayOfWeek: Number(entryDay),
      startMinutes: toMinutes(entryStart),
      endMinutes: toMinutes(entryEnd),
      title: entryTitle.trim() || undefined,
      subjectId: Number(entrySubjectId) > 0 ? Number(entrySubjectId) : undefined,
      location: entryLocation.trim() || undefined,
    };

    if (payload.endMinutes <= payload.startMinutes) {
      setError("La hora de fin debe ser posterior a la de inicio");
      return;
    }

    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const created = await scheduleApi.createEntry(payload);
      setEntries((prev) => [...prev, created]);
      setOk("Entrada de horario creada");
      setEntryTitle("");
      setEntryLocation("");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo crear la entrada"));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteEntry = async (id: number) => {
    if (!window.confirm("¿Eliminar esta entrada del horario?")) return;
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
    const payload: CreateEventInput = {
      groupId: selectedGroupId,
      title: eventTitle.trim(),
      description: eventDescription.trim() || undefined,
      startAt: new Date(eventStartAt).toISOString(),
      endAt: new Date(eventEndAt).toISOString(),
      location: eventLocation.trim() || undefined,
    };
    if (!payload.title || !eventStartAt || !eventEndAt) {
      setError("Completa título, inicio y fin del evento");
      return;
    }
    if (new Date(payload.endAt).getTime() <= new Date(payload.startAt).getTime()) {
      setError("El fin del evento debe ser posterior al inicio");
      return;
    }

    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const created = await scheduleApi.createEvent(payload);
      setEvents((prev) => [...prev, created]);
      setOk("Evento creado");
      setEventTitle("");
      setEventDescription("");
      setEventStartAt("");
      setEventEndAt("");
      setEventLocation("");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo crear el evento"));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteEvent = async (id: number) => {
    if (!window.confirm("¿Eliminar este evento?")) return;
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
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const created = await scheduleApi.createNote({
        groupId: selectedGroupId,
        content: noteContent.trim(),
      });
      setNotes((prev) => [created, ...prev]);
      setNoteContent("");
      setOk("Nota importante creada");
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo crear la nota"));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteNote = async (id: number) => {
    if (!window.confirm("¿Eliminar esta nota importante?")) return;
    try {
      await scheduleApi.deleteNote(id);
      setNotes((prev) => prev.filter((item) => item.id !== id));
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "No se pudo eliminar la nota"));
    }
  };

  return (
    <section className="p-4 space-y-5">
      <h2 className="text-lg font-semibold">Horarios</h2>
      <p className="text-sm text-gray-600">Gestiona entradas semanales, eventos y notas importantes por grupo.</p>

      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? <p className="text-sm text-gray-600">Cargando…</p> : null}

      {groups.length > 0 ? (
        <div className="max-w-md">
          <label className="block text-xs text-gray-600">Grupo</label>
          <select
            className="mt-1 w-full border rounded p-2 text-sm"
            value={selectedGroupId ?? ""}
            onChange={(event) => setSelectedGroupId(Number(event.target.value) || null)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form className="space-y-2 border rounded p-3" onSubmit={onCreateEntry}>
          <h3 className="font-medium">Nueva entrada semanal</h3>
          <select className="w-full border rounded p-2 text-sm" value={entryDay} onChange={(event) => setEntryDay(event.target.value)}>
            {Object.entries(dayLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input type="time" className="w-full border rounded p-2 text-sm" value={entryStart} onChange={(event) => setEntryStart(event.target.value)} />
          <input type="time" className="w-full border rounded p-2 text-sm" value={entryEnd} onChange={(event) => setEntryEnd(event.target.value)} />
          <input
            className="w-full border rounded p-2 text-sm"
            placeholder="Título"
            value={entryTitle}
            onChange={(event) => setEntryTitle(event.target.value)}
          />
          <select className="w-full border rounded p-2 text-sm" value={entrySubjectId} onChange={(event) => setEntrySubjectId(event.target.value)}>
            <option value="0">Sin materia</option>
            {subjectsInSelectedGroup.map((item) => (
              <option key={item.id} value={item.subject.id}>
                {item.subject.nombre}
              </option>
            ))}
          </select>
          <input
            className="w-full border rounded p-2 text-sm"
            placeholder="Aula / lugar"
            value={entryLocation}
            onChange={(event) => setEntryLocation(event.target.value)}
          />
          <button disabled={saving || !selectedGroupId} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">
            Guardar entrada
          </button>
        </form>

        <form className="space-y-2 border rounded p-3" onSubmit={onCreateEvent}>
          <h3 className="font-medium">Nuevo evento</h3>
          <input
            className="w-full border rounded p-2 text-sm"
            placeholder="Título"
            value={eventTitle}
            onChange={(event) => setEventTitle(event.target.value)}
          />
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={2}
            placeholder="Descripción"
            value={eventDescription}
            onChange={(event) => setEventDescription(event.target.value)}
          />
          <input type="datetime-local" className="w-full border rounded p-2 text-sm" value={eventStartAt} onChange={(event) => setEventStartAt(event.target.value)} />
          <input type="datetime-local" className="w-full border rounded p-2 text-sm" value={eventEndAt} onChange={(event) => setEventEndAt(event.target.value)} />
          <input
            className="w-full border rounded p-2 text-sm"
            placeholder="Lugar"
            value={eventLocation}
            onChange={(event) => setEventLocation(event.target.value)}
          />
          <button disabled={saving || !selectedGroupId} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">
            Guardar evento
          </button>
        </form>

        <form className="space-y-2 border rounded p-3" onSubmit={onCreateNote}>
          <h3 className="font-medium">Nueva nota importante</h3>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={5}
            placeholder="Contenido de la nota"
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
          />
          <button disabled={saving || !selectedGroupId || !noteContent.trim()} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">
            Guardar nota
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="border rounded p-3">
          <h3 className="font-medium mb-2">Entradas semanales</h3>
          <ul className="space-y-2">
            {entries
              .slice()
              .sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || (a.startMinutes - b.startMinutes))
              .map((entry) => (
                <li key={entry.id} className="text-sm border rounded p-2">
                  <p className="font-medium">{dayLabels[entry.dayOfWeek]} · {toTimeText(entry.startMinutes)}-{toTimeText(entry.endMinutes)}</p>
                  <p>{entry.title || "(Sin título)"}</p>
                  <p className="text-xs text-gray-600">{entry.location || "Sin ubicación"}</p>
                  <button className="text-xs text-red-600 mt-1" onClick={() => void onDeleteEntry(entry.id)}>Eliminar</button>
                </li>
              ))}
            {entries.length === 0 ? <li className="text-sm text-gray-600">Sin entradas.</li> : null}
          </ul>
        </section>

        <section className="border rounded p-3">
          <h3 className="font-medium mb-2">Eventos</h3>
          <ul className="space-y-2">
            {events
              .slice()
              .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
              .map((item) => (
                <li key={item.id} className="text-sm border rounded p-2">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-gray-600">{new Date(item.startAt).toLocaleString()} - {new Date(item.endAt).toLocaleString()}</p>
                  {item.description ? <p>{item.description}</p> : null}
                  <button className="text-xs text-red-600 mt-1" onClick={() => void onDeleteEvent(item.id)}>Eliminar</button>
                </li>
              ))}
            {events.length === 0 ? <li className="text-sm text-gray-600">Sin eventos.</li> : null}
          </ul>
        </section>

        <section className="border rounded p-3">
          <h3 className="font-medium mb-2">Notas importantes</h3>
          <ul className="space-y-2">
            {notes.map((item) => (
              <li key={item.id} className="text-sm border rounded p-2">
                <p>{item.content}</p>
                <button className="text-xs text-red-600 mt-1" onClick={() => void onDeleteNote(item.id)}>Eliminar</button>
              </li>
            ))}
            {notes.length === 0 ? <li className="text-sm text-gray-600">Sin notas.</li> : null}
          </ul>
        </section>
      </div>
    </section>
  );
}