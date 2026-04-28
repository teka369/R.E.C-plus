"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usersApi } from "@/lib/usersApi";
import { academicApi, type TeacherLoadSummary } from "@/lib/academicApi";
import { communicationApi, type ActivityFeedItem } from "@/lib/communicationApi";
import { recoveryApi } from "@/lib/recoveryApi";
import Button from "@/components/ui/Button";

export default function SecretariaDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [studentsCount, setStudentsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [gradesCount, setGradesCount] = useState(0);
  const [groupsCount, setGroupsCount] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
  const [pendingRecoveries, setPendingRecoveries] = useState(0);
  const [gradesData, setGradesData] = useState<{ id: number; nombre: string }[]>([]);
  const [groupsData, setGroupsData] = useState<{ id: number; gradeId: number; grade?: { id: number; nombre: string } }[]>([]);
  const [teacherLoadSummary, setTeacherLoadSummary] = useState<TeacherLoadSummary[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [students, teachers, grades, groups, subjects, pending, teacherLoad, feed] = await Promise.all([
          usersApi.list("ESTUDIANTE"),
          usersApi.list("PROFESOR"),
          academicApi.listGrades(),
          academicApi.listGroups(),
          academicApi.listSubjects(),
          recoveryApi.getPendingCount(),
          academicApi.getTeacherLoadSummary(),
          communicationApi.getActivityFeed(10),
        ]);
        setStudentsCount(students.length);
        setTeachersCount(teachers.length);
        setGradesCount(grades.length);
        setGroupsCount(groups.length);
        setSubjectsCount(subjects.length);
        setPendingRecoveries(pending.pending);
        setGradesData(grades);
        setGroupsData(groups);
        setTeacherLoadSummary(teacherLoad);
        setActivityFeed(feed);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  const quickActions = [
    { href: "/secretaria/usuarios/create?role=ESTUDIANTE", title: "Nuevo estudiante", note: "Alta individual" },
    { href: "/secretaria/usuarios/create?role=PROFESOR", title: "Nuevo docente", note: "Alta individual" },
    { href: "/secretaria/academico", title: "Asignar materias", note: "Gestión académica" },
    { href: "/secretaria/docentes", title: "Asignación docente", note: "Grupo + materia" },
    { href: "/secretaria/recuperaciones/configuracion", title: "Configurar recuperaciones", note: "Periodo oficial" },
    { href: "/secretaria/registro-masivo", title: "Registro masivo", note: "Carga por archivo" },
  ];

  const groupsByGrade = useMemo(() => {
    const groupsCountByGrade = groupsData.reduce<Record<number, number>>((acc, group) => {
      const gradeId = group.grade?.id ?? group.gradeId;
      acc[gradeId] = (acc[gradeId] ?? 0) + 1;
      return acc;
    }, {});

    return gradesData
      .map((grade) => {
        const shortLabel = grade.nombre.length > 8 ? `${grade.nombre.slice(0, 8)}…` : grade.nombre;
        return { label: shortLabel, value: groupsCountByGrade[grade.id] ?? 0 };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [gradesData, groupsData]);

  const teacherLoad = useMemo(
    () =>
      teacherLoadSummary
        .map((item) => ({
          label:
            item.teacherName.length > 10
              ? `${item.teacherName.slice(0, 10)}…`
              : item.teacherName,
          value: item.assignmentCount,
        }))
        .filter((item) => item.value > 0)
        .slice(0, 5),
    [teacherLoadSummary],
  );

  const maxGroupsBar = Math.max(1, ...groupsByGrade.map((item) => item.value));
  const maxLoadBar = Math.max(1, ...teacherLoad.map((item) => item.value));

  return (
    <section className="sec-page space-y-6">
      <div className="sec-hero">
        <div>
          <h1 className="sec-title">Panel de Secretaría</h1>
          <p className="sec-subtitle">Resumen operativo con indicadores, seguimiento académico y acciones frecuentes del equipo.</p>
        </div>
        <span className="sec-chip">{loading ? "Actualizando..." : "Dashboard operativo"}</span>
      </div>

      <div className="sec-grid-cards">
        <div className="sec-stat"><p className="label">Estudiantes activos</p><p className="value">{studentsCount}</p></div>
        <div className="sec-stat"><p className="label">Docentes</p><p className="value">{teachersCount}</p></div>
        <div className="sec-stat"><p className="label">Grados</p><p className="value">{gradesCount}</p></div>
        <div className="sec-stat"><p className="label">Grupos</p><p className="value">{groupsCount}</p></div>
        <div className="sec-stat"><p className="label">Materias</p><p className="value">{subjectsCount}</p></div>
        <div className="sec-stat"><p className="label">Solicitudes pendientes</p><p className="value">{pendingRecoveries}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="sec-card p-4 space-y-3">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Distribución de grupos por grado</h2>
          <p className="sec-muted">Visión rápida de la estructura actual por nivel.</p>
          <div className="space-y-2">
            {groupsByGrade.map((item) => (
              <div key={item.label} className="grid grid-cols-[44px_1fr_40px] gap-2 items-center">
                <span className="text-xs font-semibold text-rec-text-secondary">{item.label}</span>
                <div className="h-2 rounded-full bg-rec-bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-rec-primary" style={{ width: `${(item.value / maxGroupsBar) * 100}%` }} />
                </div>
                <span className="text-xs text-rec-text-muted text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sec-card p-4 space-y-3">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Carga académica por docente</h2>
          <p className="sec-muted">Top de asignaciones activas para balancear carga.</p>
          <div className="space-y-2">
            {teacherLoad.map((item) => (
              <div key={item.label} className="grid grid-cols-[56px_1fr_40px] gap-2 items-center">
                <span className="text-xs font-semibold text-rec-text-secondary">{item.label}</span>
                <div className="h-2 rounded-full bg-rec-bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--sec-primary)]" style={{ width: `${(item.value / maxLoadBar) * 100}%` }} />
                </div>
                <span className="text-xs text-rec-text-muted text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="sec-card p-4 space-y-3">
          <h2 className="font-semibold text-[color:var(--rec-title)]">Accesos rápidos</h2>
          <p className="sec-muted">Solo acciones frecuentes para operación diaria.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} prefetch={false} className="rounded-lg border border-rec-border-default px-3 py-2 hover:bg-rec-bg-muted transition">
                <p className="text-sm font-semibold text-rec-text-primary">{action.title}</p>
                <p className="text-xs text-rec-text-muted">{action.note}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="sec-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-[color:var(--rec-title)]">Actividad reciente</h2>
            <Link href="/secretaria/notificaciones" prefetch={false}>
              <Button variant="secondary" size="sm">Ver módulo</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {activityFeed.map((item, index) => (
              <Link key={`${item.type}-${item.date}-${index}`} href={item.href} prefetch={false} className="block rounded-lg border border-rec-border-default px-3 py-2 hover:bg-rec-bg-muted transition">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-rec-text-primary">{item.description}</p>
                  <span className="text-[11px] text-rec-text-subtle">{new Date(item.date).toLocaleDateString("es-CO")}</span>
                </div>
                <p className="text-xs text-rec-text-muted mt-1">{item.type}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}