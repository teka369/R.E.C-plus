"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import { academicApi, type GroupSubject, type StudentGroup } from "@/lib/academicApi";
import Navbar from "@/components/layouts/Navbar";

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
      if (!userId) { setLoading(false); return; }
      try {
        setLoading(true);
        setError(null);
        const [userData, groupData, subjectData] = await Promise.all([
          usersApi.me(),
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

  const nombreCompleto = profile
    ? `${profile.nombres} ${profile.apellidos}`
    : (user?.name || "").trim() || user?.email?.split("@")[0] || "Estudiante";

  const groupLabel = useMemo(() => {
    if (!studentGroup?.group) return "Sin grupo asignado";
    return `${studentGroup.group.grade.nombre} \u2014 ${studentGroup.group.nombre}`;
  }, [studentGroup]);

  const initials = nombreCompleto
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Cabecera */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-5">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-extrabold text-rec-text-on-media flex-shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))" }}
        >
          {loading ? "…" : initials}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--rec-title)" }}>
            {loading ? "Cargando perfil…" : nombreCompleto}
          </h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: "var(--rec-primary)" }}>Estudiante</p>
          {!loading && (
            <p className="text-sm text-rec-text-subtle mt-1">{profile?.email || user?.email || ""}</p>
          )}
        </div>
        <div className="sm:ml-auto">
          <Link
            href="/estudiante/cambiar-contrasena"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-rec-text-on-media transition hover:opacity-90"
            style={{ background: "var(--rec-primary)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            Cambiar contraseña
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl px-5 py-4 text-sm font-medium" style={{ background: "var(--rec-alert-soft-bg)", color: "var(--rec-cta)" }}>
          {error}
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Datos personales */}
        <div
          className="md:col-span-2 rounded-2xl bg-rec-bg-elevated p-7 shadow-sm"
          style={{ border: "1px solid var(--rec-soft)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--rec-soft)" }}>
              <svg className="h-4 w-4" style={{ color: "var(--rec-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="font-semibold" style={{ color: "var(--rec-title)" }}>Datos personales</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-5 rounded-lg animate-pulse" style={{ background: "var(--rec-soft)" }} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nombre completo", value: nombreCompleto },
                { label: "Correo institucional", value: profile?.email || user?.email || "–" },
                { label: "Código", value: profile?.codigo || "No especificado" },
                { label: "Grupo académico", value: groupLabel },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl px-4 py-3"
                  style={{ background: "var(--rec-soft)" }}
                >
                  <p className="text-xs font-semibold text-rec-text-subtle mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium" style={{ color: "var(--rec-title)" }}>{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen académico */}
        <div
          className="rounded-2xl bg-rec-bg-elevated p-7 shadow-sm"
          style={{ border: "1px solid var(--rec-soft)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--rec-soft)" }}>
              <svg className="h-4 w-4" style={{ color: "var(--rec-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h2 className="font-semibold" style={{ color: "var(--rec-title)" }}>Resumen</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Materias actuales", value: loading ? "…" : `${subjects.length}` },
              { label: "Grupo asignado", value: loading ? "…" : (studentGroup?.group ? "Sí" : "No") },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--rec-soft)" }}>
                <span className="text-sm text-rec-text-subtle">{stat.label}</span>
                <span className="text-sm font-bold" style={{ color: "var(--rec-primary)" }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Materias */}
        <div
          className="md:col-span-3 rounded-2xl bg-rec-bg-elevated p-7 shadow-sm"
          style={{ border: "1px solid var(--rec-soft)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--rec-soft)" }}>
              <svg className="h-4 w-4" style={{ color: "var(--rec-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h2 className="font-semibold" style={{ color: "var(--rec-title)" }}>Materias del período</h2>
            {!loading && (
              <span className="ml-auto rounded-full px-3 py-0.5 text-xs font-semibold" style={{ background: "var(--rec-primary)", color: "white" }}>
                {subjects.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "var(--rec-soft)" }} />)}
            </div>
          ) : subjects.length === 0 ? (
            <div className="rounded-xl px-5 py-8 text-center" style={{ background: "var(--rec-soft)" }}>
              <p className="text-sm text-rec-text-subtle">No hay materias asignadas para este período.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {subjects.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ background: "var(--rec-soft)", color: "var(--rec-title)" }}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-rec-text-on-media text-xs flex-shrink-0"
                    style={{ background: "var(--rec-primary)" }}
                  >✓</span>
                  {item.subject.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Mi horario", href: "/estudiante/horario", icon: "📅" },
          { label: "Materiales", href: "/estudiante/materiales", icon: "📚" },
          { label: "Recuperaciones", href: "/estudiante/recuperacion", icon: "🔄" },
          { label: "Feedback", href: "/estudiante/feedback", icon: "💬" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="flex flex-col items-center gap-2 rounded-2xl py-5 px-3 text-center text-sm font-semibold bg-rec-bg-elevated shadow-sm transition hover:shadow-md"
            style={{ border: "1px solid var(--rec-soft)", color: "var(--rec-title)" }}
          >
            <span className="text-2xl">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </main>
    </>
  );
}
