"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi } from "@/lib/academicApi";
import { scheduleApi, type ScheduleEntry, type ScheduleEvent, type ScheduleNote } from "@/lib/scheduleApi";
import { getErrorMessage } from "@/lib/errors";

const dayLabels: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

function toTimeText(minutes: number) {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

export default function EstudianteHorarioPage() {
  const { user } = useAuth();
  const [groupLabel, setGroupLabel] = useState("");
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [notes, setNotes] = useState<ScheduleNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const studentId = Number(user?.id);
      if (!studentId) return;
      setLoading(true);
      setError(null);
      try {
        const studentGroup = await academicApi.getStudentGroup(studentId);
        const groupId = studentGroup?.group.id;
        if (!groupId) {
          setEntries([]);
          setEvents([]);
          setNotes([]);
          return;
        }

        setGroupLabel(`${studentGroup.group.grade.nombre} - ${studentGroup.group.nombre}`);

        const [entryData, eventData, noteData] = await Promise.all([
          scheduleApi.listEntries(groupId),
          scheduleApi.listEvents(groupId),
          scheduleApi.listNotes(groupId),
        ]);

        setEntries(entryData);
        setEvents(eventData);
        setNotes(noteData);
      } catch (cause: unknown) {
        setError(getErrorMessage(cause, "No se pudo cargar tu horario"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user?.id]);

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-lg font-semibold mb-1">Horario</h2>
      <p className="text-sm text-gray-600">Tu horario de clases y notas del grupo.</p>
      {groupLabel ? <p className="text-sm text-emerald-700">Grupo: {groupLabel}</p> : null}
      {loading ? <p className="text-sm text-gray-600">Cargando…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="border rounded p-3">
          <h3 className="font-medium mb-2">Entradas semanales</h3>
          <ul className="space-y-2">
            {entries
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinutes - b.startMinutes)
              .map((entry) => (
                <li key={entry.id} className="border rounded p-2 text-sm">
                  <p className="font-medium">{dayLabels[entry.dayOfWeek]} · {toTimeText(entry.startMinutes)} - {toTimeText(entry.endMinutes)}</p>
                  <p>{entry.title || "(Sin título)"}</p>
                  <p className="text-xs text-gray-600">{entry.location || "Sin ubicación"}</p>
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
                <li key={item.id} className="border rounded p-2 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-gray-600">{new Date(item.startAt).toLocaleString()} - {new Date(item.endAt).toLocaleString()}</p>
                  {item.description ? <p>{item.description}</p> : null}
                </li>
              ))}
            {events.length === 0 ? <li className="text-sm text-gray-600">Sin eventos.</li> : null}
          </ul>
        </section>

        <section className="border rounded p-3">
          <h3 className="font-medium mb-2">Notas importantes</h3>
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="border rounded p-2 text-sm">
                {note.content}
              </li>
            ))}
            {notes.length === 0 ? <li className="text-sm text-gray-600">Sin notas.</li> : null}
          </ul>
        </section>
      </div>
    </section>
  );
}