"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import { academicApi, type GroupSubject, type StudentGroup } from "@/lib/academicApi";

export default function EstudiantePerfilPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [studentGroup, setStudentGroup] = useState<StudentGroup | null>(null);
  const [subjects, setSubjects] = useState<GroupSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const userId = Number(user?.id);
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [userData, groupData, subjectData] = await Promise.all([
          usersApi.get(userId),
          academicApi.getStudentGroup(userId),
          academicApi.listStudentSubjects(userId),
        ]);
        setProfile(userData);
        setStudentGroup(groupData);
        setSubjects(subjectData);
      } catch {
        setError("No se pudo cargar tu perfil");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.id]);

  const nombreCompleto =
    profile
      ? `${profile.nombres} ${profile.apellidos}`
      : (user?.name || "").trim() || user?.email?.split("@")[0] || "Estudiante";

  const groupLabel = useMemo(() => {
    if (!studentGroup?.group) return "Sin grupo asignado";
    return `${studentGroup.group.grade.nombre} - ${studentGroup.group.nombre}`;
  }, [studentGroup]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Perfil del Estudiante</h1>
      <p className="mt-1 text-slate-600">Datos personales y estado académico actual.</p>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm md:col-span-2">
          <h2 className="text-sm font-medium text-slate-900">Datos personales</h2>
          {loading ? <p className="mt-3 text-sm text-slate-600">Cargando perfil...</p> : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {!loading && !error ? (
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <p><span className="text-slate-500">Nombre completo: </span>{nombreCompleto}</p>
              <p><span className="text-slate-500">Correo institucional: </span>{profile?.email || user?.email || "—"}</p>
              <p><span className="text-slate-500">Documento: </span>{profile?.documento_identidad || "No especificado"}</p>
              <p><span className="text-slate-500">Grupo: </span>{groupLabel}</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
          <h2 className="text-sm font-medium text-slate-900">Acciones</h2>
          <div className="mt-3">
            <Link
              href="/estudiante/cambiar-contrasena"
              className="inline-flex rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cambiar contraseña
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
          <h2 className="text-sm font-medium text-slate-900">Resumen</h2>
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            <p><span className="text-slate-500">Materias actuales: </span>{subjects.length}</p>
            <p><span className="text-slate-500">Grupo asignado: </span>{studentGroup?.group ? "Sí" : "No"}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm md:col-span-2">
          <h2 className="text-sm font-medium text-slate-900">Materias</h2>
          {subjects.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No hay materias asignadas actualmente.</p>
          ) : (
            <ul className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
              {subjects.map((item) => (
                <li key={item.id} className="rounded border border-slate-200 px-3 py-2">{item.subject.nombre}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}