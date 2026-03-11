"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";
import { FiBook, FiClock, FiMessageSquare, FiFileText, FiTrendingUp } from "react-icons/fi";
import Link from "next/link";
import { getErrorMessage } from "@/lib/errors";

export default function DocentePanel() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const idNum = Number(user?.id);
    if (!idNum) return;

    const loadAssignments = async () => {
      setLoading(true);
      try {
        const data = await academicApi.listTeacherAssignments(idNum);
        setAssignments(data);
      } catch (error: unknown) {
        setError(getErrorMessage(error, "Error al cargar asignaciones"));
      } finally {
        setLoading(false);
      }
    };

    void loadAssignments();
  }, [user?.id]);

  const totalAsignaciones = assignments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">Bienvenido, {user?.name || "Docente"}</h1>
        <p className="mt-2 text-slate-600">Gestiona tus materiales, horarios, temarios y retroalimentación a estudiantes.</p>
      </div>

      {/* Grid de Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FiBook className="h-6 w-6" />}
          label="Materias Asignadas"
          value={totalAsignaciones}
          color="emerald"
        />
        <StatCard
          icon={<FiFileText className="h-6 w-6" />}
          label="Temarios"
          href="/docente/temarios"
          color="blue"
        />
        <StatCard
          icon={<FiClock className="h-6 w-6" />}
          label="Horarios"
          href="/docente/horarios"
          color="purple"
        />
        <StatCard
          icon={<FiMessageSquare className="h-6 w-6" />}
          label="Feedback"
          href="/docente/feedback"
          color="orange"
        />
        <StatCard
          icon={<FiTrendingUp className="h-6 w-6" />}
          label="Ligas"
          href="/docente/ligas"
          color="blue"
        />
      </div>

      {/* Sección Principal: Asignaciones */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Tus Asignaciones</h2>
          <p className="text-sm text-slate-500 mt-1">
            Estos son los grupos y materias que tienes asignados
          </p>
        </div>

        {loading && (
          <div className="px-6 py-8 text-center text-slate-500">
            <p>Cargando asignaciones...</p>
          </div>
        )}

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && assignments.length === 0 && (
          <div className="px-6 py-8 text-center">
            <FiBook className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Aún no tienes asignaciones</p>
            <p className="text-sm text-slate-500 mt-1">
              Contacta con secretaría para que te asignen grupos y materias
            </p>
          </div>
        )}

        {!loading && !error && assignments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Grupo</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Grado</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Materia</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{assignment.group.nombre}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{assignment.group.grade?.nombre || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        <FiBook className="h-3 w-3" />
                        {assignment.subject.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/docente/materiales?grupo=${assignment.group.id}&materia=${assignment.subject.id}`}
                        prefetch={false}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAccessCard
          title="Crear Material"
          description="Añade videos, PDFs, links y más"
          icon={<FiBook className="h-6 w-6" />}
          href="/docente/materiales/crear"
        />
        <QuickAccessCard
          title="Gestionar Horario"
          description="Define el horario semanal de clases"
          icon={<FiClock className="h-6 w-6" />}
          href="/docente/horarios"
        />
        <QuickAccessCard
          title="Crear Temario"
          description="Define el contenido de la materia"
          icon={<FiFileText className="h-6 w-6" />}
          href="/docente/temarios"
        />
        <QuickAccessCard
          title="Ligas"
          description="Actualiza métricas por grupo"
          icon={<FiTrendingUp className="h-6 w-6" />}
          href="/docente/ligas"
        />
        <QuickAccessCard
          title="Gestión académica"
          description="Registra notas e inasistencias por estudiante"
          icon={<FiTrendingUp className="h-6 w-6" />}
          href="/docente/gestion-academica"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value?: number;
  href?: string;
  color?: "emerald" | "blue" | "purple" | "orange";
}

function StatCard({ icon, label, value, href, color = "emerald" }: StatCardProps) {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const content = (
    <div className={`rounded-lg border p-4 ${colorClasses[color]} hover:shadow-md transition`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          {value !== undefined && <p className="text-2xl font-bold mt-1">{value}</p>}
        </div>
        <div className="text-2xl opacity-30">{icon}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} prefetch={false}>
        {content}
      </Link>
    );
  }

  return content;
}

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function QuickAccessCard({ title, description, icon, href }: QuickAccessCardProps) {
  return (
    <Link href={href} prefetch={false}>
      <div className="rounded-lg border border-slate-200 bg-white p-6 hover:shadow-md hover:border-slate-300 transition">
        <div className="flex items-start gap-4">
          <div className="text-emerald-600 text-2xl">{icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 mt-1">{description}</p>
          </div>
          <div className="text-slate-400 flex-shrink-0">→</div>
        </div>
      </div>
    </Link>
  );
}