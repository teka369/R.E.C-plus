"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import { materialsApi, type StudyMaterial, type Syllabus } from "@/lib/materialsApi";
import { recoveryApi, type RecoveryRequest } from "@/lib/recoveryApi";
import { scheduleApi, type ScheduleEntry, type ScheduleEvent } from "@/lib/scheduleApi";
import {
  FiActivity,
  FiBook,
  FiChevronDown,
  FiClock,
  FiFileText,
  FiLayers,
  FiMessageSquare,
  FiTrendingUp,
} from "react-icons/fi";
import Link from "next/link";
import { getErrorMessage } from "@/lib/errors";
import DocenteGuideBarPreferenceCard from "@/components/docente/DocenteGuideBarPreferenceCard";

type AssignmentInsight = {
  id: number;
  groupName: string;
  gradeName: string;
  subjectName: string;
  groupId: number;
  subjectId: number;
  materials: number;
  syllabi: number;
  temarioActivo: boolean;
  hasMaterial: boolean;
  coverage: number;
};

type WeeklyTrendPoint = {
  label: string;
  publicaciones: number;
  recuperaciones: number;
};

const DOCENTE_WEEKLY_TREND_STORAGE_KEY = "dashboard.docente.weeklyTrend.open";

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

export default function DocentePanel() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [recoveries, setRecoveries] = useState<RecoveryRequest[]>([]);
  const [showWeeklyTrend, setShowWeeklyTrend] = useState(true);
  const [weeklyTrendReady, setWeeklyTrendReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const persisted = localStorage.getItem(DOCENTE_WEEKLY_TREND_STORAGE_KEY);
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
      localStorage.setItem(DOCENTE_WEEKLY_TREND_STORAGE_KEY, showWeeklyTrend ? "1" : "0");
    } catch {
      // noop
    }
  }, [showWeeklyTrend, weeklyTrendReady]);

  useEffect(() => {
    const idNum = Number(user?.id);
    if (!idNum) return;

    const loadAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const [teacherAssignments, allMaterials, allSyllabi] = await Promise.all([
          academicApi.listTeacherAssignments(idNum),
          materialsApi.listStudy(),
          materialsApi.listSyllabi(),
        ]);

        setAssignments(teacherAssignments);
        setMaterials(allMaterials.filter((item) => item.teacherId === idNum));
        setSyllabi(allSyllabi.filter((item) => item.teacherId === idNum));

        const groupIds = Array.from(
          new Set(teacherAssignments.map((assignment) => assignment.group.id).filter(Boolean)),
        );

        const groupSnapshots = await Promise.all(
          groupIds.map(async (groupId) => {
            const [groupEntries, groupEvents, groupRecoveries] = await Promise.all([
              scheduleApi.listEntries(groupId).catch(() => []),
              scheduleApi.listEvents(groupId).catch(() => []),
              recoveryApi.listGroupRequests(groupId).catch(() => []),
            ]);
            return { groupEntries, groupEvents, groupRecoveries };
          }),
        );

        setEntries(groupSnapshots.flatMap((snapshot) => snapshot.groupEntries));
        setEvents(groupSnapshots.flatMap((snapshot) => snapshot.groupEvents));
        setRecoveries(
          groupSnapshots
            .flatMap((snapshot) => snapshot.groupRecoveries)
            .filter((request) => request.teacherId === idNum),
        );
      } catch (error: unknown) {
        setError(getErrorMessage(error, "Error al cargar asignaciones"));
      } finally {
        setLoading(false);
      }
    };

    void loadAssignments();
  }, [user?.id]);

  const totalAsignaciones = assignments.length;
  const totalMateriales = materials.length;
  const totalTemarios = syllabi.length;
  const now = Date.now();

  const insightByAssignment: AssignmentInsight[] = assignments.map((assignment) => {
    const groupId = assignment.group.id;
    const subjectId = assignment.subject.id;
    const perAssignmentMaterials = materials.filter(
      (item) => item.groupId === groupId && item.subjectId === subjectId,
    );
    const perAssignmentSyllabi = syllabi.filter(
      (item) => item.groupId === groupId && item.subjectId === subjectId,
    );
    const hasActiveSyllabus = perAssignmentSyllabi.some((item) => item.status === "ACTIVO");
    const hasMaterial = perAssignmentMaterials.length > 0;
    const coverage = (hasMaterial ? 50 : 0) + (hasActiveSyllabus ? 50 : 0);

    return {
      id: assignment.id,
      groupName: assignment.group.nombre,
      gradeName: assignment.group.grade?.nombre || "Sin grado",
      subjectName: assignment.subject.nombre,
      groupId,
      subjectId,
      materials: perAssignmentMaterials.length,
      syllabi: perAssignmentSyllabi.length,
      temarioActivo: hasActiveSyllabus,
      hasMaterial,
      coverage,
    };
  });

  const coveragePromedio =
    insightByAssignment.length > 0
      ? Math.round(
          insightByAssignment.reduce((total, insight) => total + insight.coverage, 0) /
            insightByAssignment.length,
        )
      : 0;

  const solicitudesPendientes = recoveries.filter((item) => item.status === "PENDING").length;
  const solicitudesCerradas = recoveries.filter((item) => item.status === "COMPLETED").length;
  const respondedRecoveries = recoveries.filter((item) => item.status !== "PENDING");
  const tasaRespuesta =
    recoveries.length > 0 ? Math.round((respondedRecoveries.length / recoveries.length) * 100) : 0;

  const eventosProximos = events
    .filter((event) => new Date(event.startAt).getTime() >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 5);

  const bloquesSemanales = entries.length;
  const temariosActivos = syllabi.filter((item) => item.status === "ACTIVO").length;

  const weekSlots = buildWeekSlots(6);
  const publicationDates = [
    ...materials.map((item) => item.createdAt).filter((v): v is string => Boolean(v)),
    ...syllabi
      .map((item) => item.updatedAt || item.createdAt)
      .filter((v): v is string => Boolean(v)),
  ];
  const recoveryActionDates = recoveries
    .map((item) => item.respondedAt || item.requestedAt)
    .filter((v): v is string => Boolean(v));

  const publicacionesPorSemana = pointsPerWeek(publicationDates, weekSlots);
  const recuperacionesPorSemana = pointsPerWeek(recoveryActionDates, weekSlots);
  const weeklyTrend: WeeklyTrendPoint[] = weekSlots.map((slot, idx) => ({
    label: weekLabel(slot),
    publicaciones: publicacionesPorSemana[idx],
    recuperaciones: recuperacionesPorSemana[idx],
  }));

  return (
    <div className="space-y-6">
      <section
        id="tour-docente-hero"
        className="relative overflow-hidden rounded-3xl border border-rec-border-default bg-gradient-to-r from-rec-success-bg via-rec-warning-bg to-rec-info-bg p-4 sm:p-6 shadow-sm"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-rec-bg-elevated/40 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-rec-chart-amber/20 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rec-success-text">Panel Docente</p>
            <h1 className="mt-2 text-3xl font-black text-rec-text-primary">Bienvenido, {user?.name || "Docente"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-rec-text-secondary">
              Supervisa cobertura académica, recuperaciones y ritmo semanal en un solo vistazo.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <Link
              id="btn-nueva-nota"
              href="/docente/gestion-academica"
              prefetch={false}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rec-primary px-4 py-2.5 text-sm font-semibold text-rec-text-on-primary shadow-sm transition hover:opacity-95"
            >
              + Nueva nota
            </Link>
            <div
              id="tour-docente-pulso"
              className="rounded-2xl border border-white/70 bg-rec-bg-elevated/70 px-4 py-3 backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-rec-text-subtle">Pulso de hoy</p>
              <p className="text-2xl font-black text-rec-text-primary">{solicitudesPendientes}</p>
              <p className="text-xs text-rec-text-muted">solicitudes pendientes</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="resumen-periodo"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumen del período"
      >
        <MetricCard
          icon={<FiLayers className="h-5 w-5" />}
          label="Asignaciones"
          value={totalAsignaciones}
          hint={`${temariosActivos} temarios activos`}
          tone="emerald"
        />
        <MetricCard
          icon={<FiBook className="h-5 w-5" />}
          label="Materiales"
          value={totalMateriales}
          hint={`${totalTemarios} temarios creados`}
          tone="cyan"
        />
        <MetricCard
          icon={<FiMessageSquare className="h-5 w-5" />}
          label="Recuperaciones"
          value={recoveries.length}
          hint={`${solicitudesCerradas} finalizadas`}
          tone="amber"
        />
        <MetricCard
          icon={<FiClock className="h-5 w-5" />}
          label="Bloques semanales"
          value={bloquesSemanales}
          hint={`${eventosProximos.length} eventos próximos`}
          tone="rose"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div
          id="tour-actividad-semanal"
          className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-5 shadow-sm xl:col-span-3"
        >
          <button
            type="button"
            onClick={() => setShowWeeklyTrend((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl border border-rec-border-default bg-rec-bg-base px-4 py-3 text-left transition hover:bg-rec-bg-muted"
          >
            <div>
              <h2 className="text-lg font-bold text-rec-text-primary">Actividad real últimas 6 semanas</h2>
              <p className="text-sm text-rec-text-subtle">Conteo semanal de publicaciones y gestiones de recuperaciones.</p>
            </div>
            <FiChevronDown
              className={`h-5 w-5 text-rec-text-subtle transition-transform duration-300 ${showWeeklyTrend ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showWeeklyTrend ? "mt-4 max-h-[1600px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {weeklyTrend.map((point) => {
                const weeklyMax = Math.max(1, point.publicaciones, point.recuperaciones);
                return (
                  <div key={point.label} className="rounded-xl border border-rec-border-default bg-rec-bg-base p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-rec-text-subtle">Semana {point.label}</p>
                      <p className="text-xs text-rec-text-subtle">Total {point.publicaciones + point.recuperaciones}</p>
                    </div>
                    <div className="space-y-2">
                      <TrendRow label="Publicaciones" value={point.publicaciones} color="cyan" maxValue={weeklyMax} />
                      <TrendRow label="Recuperaciones" value={point.recuperaciones} color="amber" maxValue={weeklyMax} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          id="tabla-grupos"
          className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-5 shadow-sm xl:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-rec-text-primary">Cobertura por materia</h2>
              <p className="text-sm text-rec-text-subtle">Materiales, temarios y preparación por asignación.</p>
            </div>
            <Link
              href="/docente/materiales"
              prefetch={false}
              className="rounded-full border border-rec-success-border px-3 py-1 text-xs font-semibold text-rec-success-text transition hover:bg-rec-success-bg"
            >
              Ver materiales
            </Link>
          </div>

          {loading && <p className="py-10 text-center text-sm text-rec-text-subtle">Cargando tablero docente...</p>}
          {error && (
            <div className="rounded-xl border border-rec-danger-border bg-rec-danger-bg px-4 py-3 text-sm text-rec-danger-text">{error}</div>
          )}

          {!loading && !error && insightByAssignment.length === 0 && (
            <div className="rounded-xl border border-dashed border-rec-border-strong bg-rec-bg-base p-4 sm:p-6 text-center">
              <p className="font-medium text-rec-text-secondary">No hay asignaciones activas</p>
              <p className="mt-1 text-sm text-rec-text-subtle">Cuando tengas grupos asignados, verás cobertura y ritmo.</p>
            </div>
          )}

          {!loading && !error && insightByAssignment.length > 0 && (
            <div className="space-y-4">
              {insightByAssignment.map((insight) => (
                <div key={insight.id} className="rounded-xl border border-rec-border-default bg-rec-bg-base/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-rec-text-primary">{insight.subjectName}</p>
                      <p className="text-xs text-rec-text-subtle">
                        {insight.groupName} · {insight.gradeName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-rec-info-bg-strong px-2 py-1 font-semibold text-rec-info-text">
                        {insight.materials} materiales
                      </span>
                      <span className="rounded-full bg-rec-warning-bg px-2 py-1 font-semibold text-rec-warning-text">
                        {insight.syllabi} temarios
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 font-semibold ${
                          insight.temarioActivo
                            ? "bg-rec-success-bg-muted text-rec-success-text"
                            : "bg-rec-danger-bg-strong text-rec-danger-text"
                        }`}
                      >
                        {insight.temarioActivo ? "Activo" : "Sin activar"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={insight.coverage} color="emerald" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div id="tour-docente-indicadores" className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-5 shadow-sm">
          <h2 className="text-lg font-bold text-rec-text-primary">Indicadores</h2>
          <p className="text-sm text-rec-text-subtle">Progreso global del trabajo docente.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <RingMeter value={coveragePromedio} label="Cobertura" tone="emerald" />
            <RingMeter value={tasaRespuesta} label="Respuesta" tone="amber" />
            <RingMeter
              value={recoveries.length ? Math.round((solicitudesPendientes / recoveries.length) * 100) : 0}
              label="Pendiente"
              tone="rose"
            />
            <RingMeter
              value={Math.min(100, Math.round((eventosProximos.length / Math.max(1, bloquesSemanales)) * 100))}
              label="Agenda"
              tone="cyan"
            />
          </div>
          <p className="mt-3 text-[11px] text-rec-text-subtle">
            Cobertura: 50% por materiales cargados y 50% por temario activo en cada asignación.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div
          id="tour-docente-agenda"
          className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-5 shadow-sm xl:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-rec-text-primary">Agenda próxima</h2>
              <p className="text-sm text-rec-text-subtle">Eventos y sesiones más cercanas de tus grupos.</p>
            </div>
            <Link
              href="/docente/horarios"
              prefetch={false}
              className="rounded-full border border-rec-info-border px-3 py-1 text-xs font-semibold text-rec-info-text transition hover:bg-rec-info-bg"
            >
              Ver horarios
            </Link>
          </div>

          {eventosProximos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-rec-border-strong bg-rec-bg-base p-4 sm:p-6 text-center text-sm text-rec-text-subtle">
              No hay eventos próximos registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {eventosProximos.map((event) => (
                <div key={event.id} className="rounded-xl border border-rec-border-default bg-rec-bg-base p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-rec-text-primary">{event.title}</p>
                    <span className="rounded-full bg-rec-bg-elevated px-2 py-1 text-xs font-medium text-rec-text-muted">
                      Grupo {event.groupId}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-rec-text-subtle">
                    {new Date(event.startAt).toLocaleString()} - {new Date(event.endAt).toLocaleTimeString()}
                  </p>
                  {event.location && <p className="mt-1 text-xs text-rec-text-subtle">Lugar: {event.location}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div id="tour-docente-acciones" className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-5 shadow-sm">
          <h2 className="text-lg font-bold text-rec-text-primary">Acciones rápidas</h2>
          <p className="text-sm text-rec-text-subtle">Atajos para tus tareas más frecuentes.</p>
          <div className="mt-4 space-y-3">
            <QuickAction
              href="/docente/materiales/crear"
              icon={<FiBook className="h-4 w-4" />}
              title="Crear material"
              description="Publica PDFs, videos, enlaces y guías prácticas."
            />
            <QuickAction
              href="/docente/temarios"
              icon={<FiFileText className="h-4 w-4" />}
              title="Ajustar temarios"
              description="Activa y alinea contenidos por grupo y periodo."
            />
            <QuickAction
              href="/docente/recuperaciones"
              icon={<FiActivity className="h-4 w-4" />}
              title="Gestionar recuperaciones"
              description="Responde solicitudes y cierra casos pendientes."
            />
            <QuickAction
              href="/docente/gestion-academica"
              icon={<FiTrendingUp className="h-4 w-4" />}
              title="Gestión académica"
              description="Registra notas, avances e inasistencias por estudiante."
            />
          </div>
        </div>
      </div>

      <DocenteGuideBarPreferenceCard />
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  tone: "emerald" | "cyan" | "amber" | "rose";
}

function MetricCard({ icon, label, value, hint, tone }: MetricCardProps) {
  const colorClasses = {
    emerald: "from-rec-success-bg-muted to-rec-success-bg border-rec-success-border text-rec-success-text",
    cyan: "from-rec-info-bg-strong to-rec-info-bg border-rec-info-border text-rec-info-text",
    amber: "from-rec-warning-bg to-rec-warning-bg border-rec-warning-border text-rec-warning-text",
    rose: "from-rec-danger-bg-strong to-rec-danger-bg border-rec-danger-border text-rec-danger-text",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${colorClasses[tone]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none">{value}</p>
          <p className="mt-2 text-xs opacity-80">{hint}</p>
        </div>
        <div className="rounded-xl bg-rec-bg-elevated/70 p-2">{icon}</div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: "emerald" | "cyan" | "amber" | "rose" }) {
  const trackClass = {
    emerald: "bg-rec-chart-emerald",
    cyan: "bg-rec-chart-cyan",
    amber: "bg-rec-chart-amber",
    rose: "bg-rec-chart-rose",
  };

  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] font-semibold text-rec-text-subtle">
        <span>Cobertura</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-rec-bg-subtle">
        <div className={`h-full rounded-full transition-all ${trackClass[color]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RingMeter({ value, label, tone }: { value: number; label: string; tone: "emerald" | "cyan" | "amber" | "rose" }) {
  const ringColor: Record<typeof tone, string> = {
    emerald: "var(--rec-chart-emerald)",
    cyan: "var(--rec-chart-cyan)",
    amber: "var(--rec-chart-amber)",
    rose: "var(--rec-chart-rose)",
  };

  return (
    <div className="rounded-xl border border-rec-border-default bg-rec-bg-base p-3 text-center">
      <div
        className="mx-auto grid h-16 w-16 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${ringColor[tone]} ${Math.max(0, Math.min(value, 100))}%, var(--rec-chart-track) 0)`,
        }}
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-rec-bg-elevated text-sm font-black text-rec-text-secondary">
          {value}%
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-rec-text-subtle">{label}</p>
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
      <div className="group rounded-xl border border-rec-border-default bg-rec-bg-base p-4 transition hover:border-rec-success-border hover:bg-rec-success-bg/60">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-rec-bg-elevated p-2 text-rec-success-text shadow-sm">{icon}</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rec-text-primary">{title}</h3>
            <p className="mt-1 text-xs text-rec-text-muted">{description}</p>
          </div>
          <div className="flex-shrink-0 text-rec-text-subtle transition group-hover:text-rec-success-text">→</div>
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
  color: "cyan" | "amber";
  maxValue: number;
}) {
  const barColor = {
    cyan: "bg-rec-chart-cyan",
    amber: "bg-rec-chart-amber",
  };
  const width = Math.round((value / Math.max(1, maxValue)) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-rec-text-muted">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-rec-bg-subtle">
        <div className={`h-full rounded-full ${barColor[color]}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}