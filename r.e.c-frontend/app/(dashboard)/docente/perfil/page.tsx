"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi, type UserDTO } from "@/lib/usersApi";
import { academicApi, type TeacherAssignment } from "@/lib/academicApi";

export default function DocentePerfilPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
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
        const [userData, teacherAssignments] = await Promise.all([
          usersApi.get(userId),
          academicApi.listTeacherAssignments(userId),
        ]);
        setProfile(userData);
        setAssignments(teacherAssignments);
      } catch {
        setError("No se pudo cargar tu perfil");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.id]);

  const groups = useMemo(() => {
    const map = new Map<number, string>();
    assignments.forEach((item) => {
      if (item.group?.id) {
        const label = `${item.group.grade?.nombre ?? "Grado"} \u2014 ${item.group.nombre}`;
        map.set(item.group.id, label);
      }
    });
    return Array.from(map.values());
  }, [assignments]);

  const subjects = useMemo(() => {
    const map = new Map<number, string>();
    assignments.forEach((item) => {
      if (item.subject?.id) map.set(item.subject.id, item.subject.nombre);
    });
    return Array.from(map.values());
  }, [assignments]);

  const nombreCompleto = profile
    ? `${profile.nombres} ${profile.apellidos}`
    : (user?.name || "").trim() || user?.email?.split("@")[0] || "Profesor";

  const initials = nombreCompleto
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="mx-auto max-w-5xl px-1 sm:px-0">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, var(--rec-primary-strong), var(--rec-primary))" }}
        >
          {loading ? "…" : initials}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--rec-title)" }}>
            {loading ? "Cargando perfil…" : nombreCompleto}
          </h1>
          <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--rec-primary)" }}>
            Docente
          </p>
          {!loading && (
            <p className="mt-1 text-sm text-slate-500">{profile?.email || user?.email || ""}</p>
          )}
        </div>
        <div className="sm:ml-auto">
          <Link
            href="/docente/cambiar-contrasena"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--rec-primary)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            Cambiar contraseña
          </Link>
        </div>
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl px-5 py-4 text-sm font-medium"
          style={{ background: "#fdecea", color: "var(--rec-cta)" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div
          className="rounded-2xl bg-white p-7 shadow-sm md:col-span-2"
          style={{ border: "1px solid var(--rec-soft)" }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--rec-soft)" }}>
              <svg
                className="h-4 w-4"
                style={{ color: "var(--rec-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="font-semibold" style={{ color: "var(--rec-title)" }}>
              Datos personales
            </h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 animate-pulse rounded-lg" style={{ background: "var(--rec-soft)" }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Nombre completo", value: nombreCompleto },
                { label: "Correo institucional", value: profile?.email || user?.email || "–" },
                { label: "Documento de identidad", value: profile?.documento_identidad || "No especificado" },
                { label: "Teléfono", value: profile?.telefono || "No especificado" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl px-4 py-3" style={{ background: "var(--rec-soft)" }}>
                  <p className="mb-0.5 text-xs font-semibold text-slate-500">{item.label}</p>
                  <p className="text-sm font-medium" style={{ color: "var(--rec-title)" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid var(--rec-soft)" }}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--rec-soft)" }}>
              <svg
                className="h-4 w-4"
                style={{ color: "var(--rec-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="font-semibold" style={{ color: "var(--rec-title)" }}>
              Resumen
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Materias", value: loading ? "…" : `${subjects.length}` },
              { label: "Grupos", value: loading ? "…" : `${groups.length}` },
              { label: "Asignaciones", value: loading ? "…" : `${assignments.length}` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between border-b py-2 last:border-0"
                style={{ borderColor: "var(--rec-soft)" }}
              >
                <span className="text-sm text-slate-500">{stat.label}</span>
                <span className="text-sm font-bold" style={{ color: "var(--rec-primary)" }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-sm" style={{ border: "1px solid var(--rec-soft)" }}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--rec-soft)" }}>
              <svg
                className="h-4 w-4"
                style={{ color: "var(--rec-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="font-semibold" style={{ color: "var(--rec-title)" }}>
              Mis materias
            </h2>
            {!loading && (
              <span
                className="ml-auto rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                style={{ background: "var(--rec-primary)" }}
              >
                {subjects.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg" style={{ background: "var(--rec-soft)" }} />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-slate-500">Sin materias asignadas.</p>
          ) : (
            <ul className="space-y-2">
              {subjects.map((subject) => (
                <li
                  key={subject}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium"
                  style={{ background: "var(--rec-soft)", color: "var(--rec-title)" }}
                >
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: "var(--rec-primary)" }} />
                  {subject}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="rounded-2xl bg-white p-7 shadow-sm md:col-span-2"
          style={{ border: "1px solid var(--rec-soft)" }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--rec-soft)" }}>
              <svg
                className="h-4 w-4"
                style={{ color: "var(--rec-primary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="font-semibold" style={{ color: "var(--rec-title)" }}>
              Grupos asignados
            </h2>
            {!loading && (
              <span
                className="ml-auto rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                style={{ background: "var(--rec-primary)" }}
              >
                {groups.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl" style={{ background: "var(--rec-soft)" }} />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-xl px-5 py-6 text-center" style={{ background: "var(--rec-soft)" }}>
              <p className="text-sm text-slate-500">No hay grupos asignados actualmente.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {groups.map((group) => (
                <li
                  key={group}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ background: "var(--rec-soft)", color: "var(--rec-title)" }}
                >
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs text-white"
                    style={{ background: "var(--rec-primary)" }}
                  >
                    🏫
                  </span>
                  {group}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Temarios", href: "/docente/temarios", icon: "📝" },
          { label: "Materiales", href: "/docente/materiales", icon: "📚" },
          { label: "Recuperaciones", href: "/docente/recuperaciones", icon: "🔄" },
          { label: "Feedback", href: "/docente/feedback", icon: "💬" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-5 text-center text-sm font-semibold shadow-sm transition hover:shadow-md"
            style={{ border: "1px solid var(--rec-soft)", color: "var(--rec-title)" }}
          >
            <span className="text-2xl">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
