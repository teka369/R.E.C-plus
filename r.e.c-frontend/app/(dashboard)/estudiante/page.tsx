"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { academicApi, type GroupSubject, type StudentGroup } from "@/lib/academicApi";
import { FiBook, FiClock, FiFileText, FiAward } from "react-icons/fi";
import Link from "next/link";

export default function EstudiantePanel() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<GroupSubject[]>([]);
  const [studentGroup, setStudentGroup] = useState<StudentGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const idNum = Number(user?.id);
    if (!idNum) return;

    const loadStudentData = async () => {
      setLoading(true);
      await Promise.all([
        academicApi
          .listStudentSubjects(idNum)
          .then((data) => {
            setSubjects(data);
          })
          .catch(() => {
            setError("No se pudieron cargar tus materias");
          }),
        academicApi
          .getStudentGroup(idNum)
          .then((data) => {
            setStudentGroup(data);
          })
          .catch(() => {
            // noop
          }),
      ]);
      setLoading(false);
    };

    void loadStudentData();
  }, [user?.id]);

  const totalMaterias = subjects.length;
  const grupoNombre = studentGroup?.group.nombre || "Sin asignar";
  const gradoNombre = studentGroup?.group.grade.nombre || "Sin asignar";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">¡Bienvenido, {user?.name || "Estudiante"}!</h1>
        <p className="mt-2 text-slate-600">Accede a tus materiales, horarios, temarios y portafolio académico.</p>
      </div>

      {/* Grid de Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FiBook className="h-6 w-6" />}
          label="Tu Grupo"
          value={grupoNombre}
          color="emerald"
        />
        <StatCard
          icon={<FiAward className="h-6 w-6" />}
          label="Grado"
          value={gradoNombre}
          color="blue"
        />
        <StatCard
          icon={<FiFileText className="h-6 w-6" />}
          label="Materias"
          valueNum={totalMaterias}
          color="purple"
        />
        <StatCard
          icon={<FiClock className="h-6 w-6" />}
          label="Ver Horario"
          href="/estudiante/horario"
          color="orange"
        />
      </div>

      {/* Sección Principal: Materias */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Tus Materias</h2>
          <p className="text-sm text-slate-500 mt-1">
            Accede a los materiales, temarios y recursos de cada materia
          </p>
        </div>

        {loading && (
          <div className="px-6 py-8 text-center text-slate-500">
            <p>Cargando tus materias...</p>
          </div>
        )}

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && subjects.length === 0 && (
          <div className="px-6 py-8 text-center">
            <FiBook className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Aún no tienes materias asignadas</p>
            <p className="text-sm text-slate-500 mt-1">
              Tu grupo será asignado por secretaría
            </p>
          </div>
        )}

        {!loading && !error && subjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {subjects.map((gs) => (
              <div
                key={gs.id}
                className="rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{gs.subject.nombre}</h3>
                    {gs.subject.codigo && (
                      <p className="text-xs text-slate-500 mt-1">Código: {gs.subject.codigo}</p>
                    )}
                  </div>
                  <div className="text-emerald-600 flex-shrink-0">
                    <FiBook className="h-5 w-5" />
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="mt-4 space-y-2">
                  <Link
                    href={`/estudiante/materiales?materia=${gs.id}`}
                    prefetch={false}
                    className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <FiBook className="h-4 w-4" />
                    Materiales
                  </Link>
                  <Link
                    href={`/estudiante/temarios?materia=${gs.id}`}
                    prefetch={false}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <FiFileText className="h-4 w-4" />
                    Temario
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAccessCard
          title="Ver Horario"
          description="Consulta el horario de clases"
          icon={<FiClock className="h-6 w-6" />}
          href="/estudiante/horario"
        />
        <QuickAccessCard
          title="Ver Materiales"
          description="Accede a los materiales de estudio"
          icon={<FiBook className="h-6 w-6" />}
          href="/estudiante/materiales"
        />
        <QuickAccessCard
          title="Ver Temarios"
          description="Consulta los temarios por materia"
          icon={<FiFileText className="h-6 w-6" />}
          href="/estudiante/temarios"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  valueNum?: number;
  href?: string;
  color?: "emerald" | "blue" | "purple" | "orange";
}

function StatCard({ icon, label, value, valueNum, href, color = "emerald" }: StatCardProps) {
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
          {value && <p className="text-lg font-bold mt-1 truncate">{value}</p>}
          {valueNum !== undefined && <p className="text-2xl font-bold mt-1">{valueNum}</p>}
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