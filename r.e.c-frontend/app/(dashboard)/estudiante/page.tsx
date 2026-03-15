"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type GroupSubject, type StudentGroup } from "@/lib/academicApi";
import { materialsApi, type StudyMaterial, type Syllabus } from "@/lib/materialsApi";
import { scheduleApi, type ScheduleEntry, type ScheduleEvent } from "@/lib/scheduleApi";
import { recoveryApi, type RecoveryRequest } from "@/lib/recoveryApi";
import { performanceApi, type StudentAcademicResponse } from "@/lib/performanceApi";
import {
  FiActivity,
  FiAlertTriangle,
  FiAward,
  FiBook,
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiCompass,
  FiFileText,
  FiTarget,
} from "react-icons/fi";
import Link from "next/link";
import { getErrorMessage } from "@/lib/errors";

type SubjectProgress = {
  id: number;
  name: string;
  code?: string | null;
  materials: number;
  syllabi: number;
  progreso: number | null;
  promedio: number | null;
  atRisk: boolean;
};

type WeeklyStudentTrendPoint = {
  label: string;
  actualizaciones: number;
  recuperaciones: number;
  eventos: number;
};

const ESTUDIANTE_WEEKLY_TREND_STORAGE_KEY = "dashboard.estudiante.weeklyTrend.open";

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildWeekSlots(weeks: number): Date[] {
  const currentWeek = startOfWeek(new Date());
  return Array.from({ length: weeks }, (_, idx) => {
    const slot = new Date(currentWeek);
    slot.setDate(currentWeek.getDate() - (weeks - 1 - idx) * 7);
    return slot;
  });
}

function weekLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function pointsPerWeek(isoDates: string[], weekSlots: Date[]): number[] {
  return weekSlots.map((slot) => {
    const end = new Date(slot);
    end.setDate(slot.getDate() + 7);
    return isoDates.filter((iso) => {
      const d = new Date(iso);
      return d >= slot && d < end;
    }).length;
  });
}

export default function EstudiantePanel() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<GroupSubject[]>([]);
  const [studentGroup, setStudentGroup] = useState<StudentGroup | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [recoveries, setRecoveries] = useState<RecoveryRequest[]>([]);
  const [academic, setAcademic] = useState<StudentAcademicResponse | null>(null);
  const [showWeeklyTrend, setShowWeeklyTrend] = useState(true);
  const [weeklyTrendReady, setWeeklyTrendReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const persisted = localStorage.getItem(ESTUDIANTE_WEEKLY_TREND_STORAGE_KEY);
      if (persisted !== null) {
        setShowWeeklyTrend(persisted === "1");
      }
    } catch {
      // noop
    } finally {
      setWeeklyTrendReady(true);
    }
  }, []);

  useEffect(() => {
    if (!weeklyTrendReady) return;
    try {
      localStorage.setItem(ESTUDIANTE_WEEKLY_TREND_STORAGE_KEY, showWeeklyTrend ? "1" : "0");
    } catch {
      // noop
    }
  }, [showWeeklyTrend, weeklyTrendReady]);

  useEffect(() => {
    const idNum = Number(user?.id);
    if (!idNum) return;

    const loadStudentData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [studentSubjects, groupData, myRecoveries, studentAcademic, allMaterials, allSyllabi] =
          await Promise.all([
            academicApi.listStudentSubjects(idNum),
            academicApi.getStudentGroup(idNum),
            recoveryApi.listMyRequests().catch(() => []),
            performanceApi.getStudentAcademic(idNum).catch(() => null),
            materialsApi.listStudy().catch(() => []),
            materialsApi.listSyllabi().catch(() => []),
          ]);

        setSubjects(studentSubjects);
        setStudentGroup(groupData);
        setRecoveries(myRecoveries);
        setAcademic(studentAcademic);

        const subjectIds = new Set(studentSubjects.map((subject) => subject.subject.id));
        const scopedMaterials = allMaterials.filter((item) => {
          if (!subjectIds.has(item.subjectId)) return false;
          if (!groupData?.group.id) return true;
          return item.groupId === groupData.group.id;
        });
        const scopedSyllabi = allSyllabi.filter((item) => {
          if (!subjectIds.has(item.subjectId)) return false;
          if (!groupData?.group.id) return true;
          return item.groupId === groupData.group.id;
        });

        setMaterials(scopedMaterials);
        setSyllabi(scopedSyllabi);

        if (groupData?.group.id) {
          const [groupEvents, groupEntries] = await Promise.all([
            scheduleApi.listEvents(groupData.group.id).catch(() => []),
            scheduleApi.listEntries(groupData.group.id).catch(() => []),
          ]);
          setEvents(groupEvents);
          setEntries(groupEntries);
        } else {
          setEvents([]);
          setEntries([]);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "No se pudo cargar tu panel"));
      } finally {
        setLoading(false);
      }
    };

    void loadStudentData();
  }, [user?.id]);

  const totalMaterias = subjects.length;
  const grupoNombre = studentGroup?.group.nombre || "Sin asignar";
  const gradoNombre = studentGroup?.group.grade.nombre || "Sin asignar";
  const academicSummary = academic?.summary;
  const inasistencias = academicSummary?.totalInasistencias || 0;
  const promedioGeneral = academicSummary?.promedioGeneral ?? null;
  const requestsPending = recoveries.filter((item) => item.status === "PENDING").length;
  const requestsApproved = recoveries.filter((item) => item.status === "APPROVED").length;
  const requestsCompleted = recoveries.filter((item) => item.status === "COMPLETED").length;
  const now = Date.now();

  const upcomingEvents = events
    .filter((event) => new Date(event.startAt).getTime() >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 4);

  const progressBySubject: SubjectProgress[] = subjects.map((subject) => {
    const subjectId = subject.subject.id;
    const rec = academic?.records.find((item) => item.subjectId === subjectId);
    const perSubjectMaterials = materials.filter((item) => item.subjectId === subjectId).length;
    const perSubjectSyllabi = syllabi.filter((item) => item.subjectId === subjectId).length;
    const progreso = rec?.progresoMateria ?? null;
    const promedio = rec?.promedioMateria ?? rec?.notaFinal ?? null;
    const atRisk = promedio !== null ? promedio < 7 : false;

    return {
      id: subject.id,
      name: subject.subject.nombre,
      code: subject.subject.codigo,
      materials: perSubjectMaterials,
      syllabi: perSubjectSyllabi,
      progreso,
      promedio,
      atRisk,
    };
  });

  const avanceGlobal =
    progressBySubject.filter((subject) => subject.progreso !== null).length > 0
      ? Math.round(
          progressBySubject
            .filter((subject) => subject.progreso !== null)
            .reduce((total, subject) => total + Number(subject.progreso), 0) /
            progressBySubject.filter((subject) => subject.progreso !== null).length,
        )
      : 0;

  const materiasRiesgo = progressBySubject.filter((subject) => subject.atRisk).length;
  const temariosActivos = syllabi.filter((item) => item.status === "ACTIVO").length;
  const coberturaPlan =
    totalMaterias > 0
      ? Math.round(
          (progressBySubject.filter((subject) => subject.materials > 0 || subject.syllabi > 0).length /
            totalMaterias) *
            100,
        )
      : 0;

  const porcentajePendientes =
    recoveries.length > 0 ? Math.round((requestsPending / recoveries.length) * 100) : 0;

  const porcentajeMateriasConRegistro =
    totalMaterias > 0 ? Math.round(((academicSummary?.materiasConRegistro || 0) / totalMaterias) * 100) : 0;

  const weekSlots = buildWeekSlots(6);
  const academicUpdateDates = (academic?.records || [])
    .map((record) => record.updatedAt)
    .filter((v): v is string => Boolean(v));
  const recoveryDates = recoveries
    .map((item) => item.respondedAt || item.completedAt || item.requestedAt)
    .filter((v): v is string => Boolean(v));
  const eventDates = events.map((event) => event.startAt).filter((v): v is string => Boolean(v));

  const updatesByWeek = pointsPerWeek(academicUpdateDates, weekSlots);
  const recoveriesByWeek = pointsPerWeek(recoveryDates, weekSlots);
  const eventsByWeek = pointsPerWeek(eventDates, weekSlots);

  const weeklyTrend: WeeklyStudentTrendPoint[] = weekSlots.map((slot, idx) => ({
    label: weekLabel(slot),
    actualizaciones: updatesByWeek[idx],
    recuperaciones: recoveriesByWeek[idx],
    eventos: eventsByWeek[idx],
  }));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-r from-cyan-100 via-amber-50 to-emerald-100 p-4 sm:p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-10 h-36 w-36 rounded-full bg-white/50 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-16 h-44 w-44 rounded-full bg-cyan-300/25 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Panel Estudiante</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Hola, {user?.name || "Estudiante"}</h1>
            <p className="mt-2 text-sm text-slate-700">Mantén control de tus materias, agenda y progreso académico.</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Promedio general</p>
            <p className="text-2xl font-black text-slate-900">
              {promedioGeneral !== null ? promedioGeneral.toFixed(1) : "--"}
            </p>
            <p className="text-xs text-slate-600">escala de 10</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<FiBook className="h-5 w-5" />}
          label="Materias"
          value={totalMaterias}
          hint={`${temariosActivos} temarios activos`}
          tone="cyan"
        />
        <MetricCard
          icon={<FiCalendar className="h-5 w-5" />}
          label="Eventos"
          value={upcomingEvents.length}
          hint={`${entries.length} bloques semanales`}
          tone="amber"
        />
        <MetricCard
          icon={<FiActivity className="h-5 w-5" />}
          label="Recuperaciones"
          value={recoveries.length}
          hint={`${requestsPending} pendientes`}
          tone="rose"
        />
        <MetricCard
          icon={<FiCompass className="h-5 w-5" />}
          label="Cobertura"
          value={coberturaPlan}
          hint="plan académico disponible"
          tone="emerald"
          suffix="%"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
          <button
            type="button"
            onClick={() => setShowWeeklyTrend((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">Actividad real últimas 6 semanas</h2>
              <p className="text-sm text-slate-500">Cambios académicos, recuperaciones y eventos de tu grupo.</p>
            </div>
            <FiChevronDown
              className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${showWeeklyTrend ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showWeeklyTrend ? "mt-4 max-h-[1800px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {weeklyTrend.map((point) => {
                const weeklyMax = Math.max(1, point.actualizaciones, point.recuperaciones, point.eventos);
                return (
                  <div key={point.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Semana {point.label}</p>
                      <p className="text-xs text-slate-500">
                        Total {point.actualizaciones + point.recuperaciones + point.eventos}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <TrendRow label="Actualizaciones" value={point.actualizaciones} color="cyan" maxValue={weeklyMax} />
                      <TrendRow label="Recuperaciones" value={point.recuperaciones} color="amber" maxValue={weeklyMax} />
                      <TrendRow label="Eventos" value={point.eventos} color="emerald" maxValue={weeklyMax} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Progreso por materia</h2>
              <p className="text-sm text-slate-500">Avance, recursos disponibles y materias en riesgo.</p>
            </div>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
              {grupoNombre} · {gradoNombre}
            </span>
          </div>

          {loading && <p className="py-10 text-center text-sm text-slate-500">Cargando panel académico...</p>}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {!loading && !error && progressBySubject.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-6 text-center">
              <p className="font-medium text-slate-700">Aún no tienes materias asignadas</p>
              <p className="mt-1 text-sm text-slate-500">Secretaría asignará tu grupo y materias.</p>
            </div>
          )}

          {!loading && !error && progressBySubject.length > 0 && (
            <div className="space-y-4">
              {progressBySubject.map((subject) => (
                <div key={subject.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{subject.name}</p>
                      <p className="text-xs text-slate-500">
                        {subject.code ? `Código ${subject.code}` : "Código no registrado"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-cyan-100 px-2 py-1 font-semibold text-cyan-700">
                        {subject.materials} recursos
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                        {subject.syllabi} temarios
                      </span>
                      {subject.promedio !== null && (
                        <span
                          className={`rounded-full px-2 py-1 font-semibold ${
                            subject.atRisk
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          Prom {subject.promedio.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    {subject.progreso === null ? (
                      <p className="text-xs font-medium text-slate-500">Sin progreso registrado en gestión académica.</p>
                    ) : (
                      <ProgressBar value={subject.progreso} color={subject.atRisk ? "rose" : "emerald"} />
                    )}
                  </div>
                  <div className="mt-3 flex gap-3 text-xs font-semibold">
                    <Link
                      href={`/estudiante/materiales?materia=${subject.id}`}
                      prefetch={false}
                      className="text-cyan-700 hover:text-cyan-800"
                    >
                      Ver materiales
                    </Link>
                    <Link
                      href={`/estudiante/temarios?materia=${subject.id}`}
                      prefetch={false}
                      className="text-amber-700 hover:text-amber-800"
                    >
                      Ver temarios
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Radar académico</h2>
          <p className="text-sm text-slate-500">Indicadores clave para priorizar tu semana.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <RingMeter value={avanceGlobal} label="Avance" tone="cyan" />
            <RingMeter value={coberturaPlan} label="Plan" tone="emerald" />
            <RingMeter value={porcentajePendientes} label="Pendiente" tone="amber" />
            <RingMeter value={porcentajeMateriasConRegistro} label="Con registro" tone="rose" />
          </div>

          <div className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <InfoLine icon={<FiAward className="h-4 w-4" />} label="Promedio" value={promedioGeneral !== null ? promedioGeneral.toFixed(1) : "--"} />
            <InfoLine icon={<FiAlertTriangle className="h-4 w-4" />} label="Materias en riesgo" value={String(materiasRiesgo)} />
            <InfoLine icon={<FiClock className="h-4 w-4" />} label="Inasistencias" value={String(inasistencias)} />
            <InfoLine icon={<FiTarget className="h-4 w-4" />} label="Recuperaciones aprobadas" value={String(requestsApproved + requestsCompleted)} />
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            El avance por materia usa solo progreso registrado en gestión académica; sin registro no se estima.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Agenda y fechas próximas</h2>
              <p className="text-sm text-slate-500">Mantén visibles tus sesiones y eventos importantes.</p>
            </div>
            <Link
              href="/estudiante/horario"
              prefetch={false}
              className="rounded-full border border-cyan-300 px-3 py-1 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50"
            >
              Ver horario
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-6 text-center text-sm text-slate-500">
              No hay eventos próximos para tu grupo.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{event.title}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">
                      Grupo {event.groupId}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(event.startAt).toLocaleString()} - {new Date(event.endAt).toLocaleTimeString()}
                  </p>
                  {event.location && <p className="mt-1 text-xs text-slate-500">Lugar: {event.location}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Acciones recomendadas</h2>
          <p className="text-sm text-slate-500">Siguiente paso para avanzar más rápido.</p>

          <div className="mt-4 space-y-3">
            <QuickAction
              href="/estudiante/materiales"
              icon={<FiBook className="h-4 w-4" />}
              title="Repasar materiales"
              description="Revisa recursos nuevos y marca pendientes de estudio."
            />
            <QuickAction
              href="/estudiante/temarios"
              icon={<FiFileText className="h-4 w-4" />}
              title="Actualizar temarios"
              description="Alinea tus temas de la semana con cada materia."
            />
            <QuickAction
              href="/estudiante/gestion-academica"
              icon={<FiAward className="h-4 w-4" />}
              title="Revisar gestión académica"
              description="Consulta notas, avances y observaciones recientes."
            />
            <QuickAction
              href="/estudiante/recuperaciones"
              icon={<FiActivity className="h-4 w-4" />}
              title="Seguimiento de recuperaciones"
              description={`Tienes ${requestsPending} solicitudes pendientes por revisar.`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  tone: "emerald" | "cyan" | "amber" | "rose";
  suffix?: string;
}

function MetricCard({ icon, label, value, hint, tone, suffix }: MetricCardProps) {
  const colorClasses = {
    emerald: "from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-800",
    cyan: "from-cyan-100 to-cyan-50 border-cyan-200 text-cyan-800",
    amber: "from-amber-100 to-amber-50 border-amber-200 text-amber-800",
    rose: "from-rose-100 to-rose-50 border-rose-200 text-rose-800",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${colorClasses[tone]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none">
            {value}
            {suffix || ""}
          </p>
          <p className="mt-2 text-xs opacity-80">{hint}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-2">{icon}</div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: "emerald" | "rose" }) {
  const trackClass = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
  };

  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500">
        <span>Avance</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${trackClass[color]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RingMeter({ value, label, tone }: { value: number; label: string; tone: "emerald" | "cyan" | "amber" | "rose" }) {
  const ringColor = {
    emerald: "#10b981",
    cyan: "#06b6d4",
    amber: "#f59e0b",
    rose: "#f43f5e",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
      <div
        className="mx-auto grid h-16 w-16 place-items-center rounded-full"
        style={{ background: `conic-gradient(${ringColor[tone]} ${Math.max(0, Math.min(value, 100))}%, #e2e8f0 0)` }}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-sm font-black text-slate-700">
          {Math.max(0, Math.min(value, 100))}%
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-slate-700">
      <p className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">{icon}</span>
        {label}
      </p>
      <p className="text-xs font-bold">{value}</p>
    </div>
  );
}

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function QuickAction({ href, icon, title, description }: QuickActionProps) {
  return (
    <Link href={href} prefetch={false}>
      <div className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/60">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-white p-2 text-cyan-700 shadow-sm">{icon}</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs text-slate-600">{description}</p>
          </div>
          <div className="flex-shrink-0 text-slate-400 transition group-hover:text-cyan-700">→</div>
        </div>
      </div>
    </Link>
  );
}

function TrendRow({
  label,
  value,
  color,
  maxValue,
}: {
  label: string;
  value: number;
  color: "cyan" | "amber" | "emerald";
  maxValue: number;
}) {
  const barColor = {
    cyan: "bg-cyan-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
  };
  const width = Math.round((value / Math.max(1, maxValue)) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${barColor[color]}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}