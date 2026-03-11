"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { JSX } from "react/jsx-runtime";

type Role = "SECRETARIA" | "PROFESOR" | "ESTUDIANTE";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: JSX.Element;
};

export default function Sidebar({ role }: { role: Role }) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, opts?: { strict?: boolean }) =>
    opts?.strict ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const items: NavItem[] = useMemo(() => {
    const common: NavItem[] = [
      {
        href: "/" + (role === "SECRETARIA" ? "secretaria" : role === "PROFESOR" ? "docente" : "estudiante"),
        label: "Panel",
        description: "Resumen y accesos rápidos",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
    ];

    const byRole: Record<Role, NavItem[]> = {
      SECRETARIA: [
        {
          href: "/secretaria/estudiantes",
          label: "Estudiantes",
          description: "Gestión de estudiantes",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.42A5 5 0 0121 15.5V19" />
              <path d="M12 14L5.84 10.58A5 5 0 003 15.5V19" />
            </svg>
          ),
        },
        {
          href: "/secretaria/docentes",
          label: "Docentes",
          description: "Gestión de docentes",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21a6.5 6.5 0 0113 0" />
            </svg>
          ),
        },
        {
          href: "/secretaria/secretaria",
          label: "Secretaría",
          description: "Panel de Secretaría",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 22V8l9-5 9 5v14H3z" />
              <path d="M9 22V12h6v10" />
            </svg>
          ),
        },
        {
          href: "/secretaria/notificaciones",
          label: "Notificaciones",
          description: "Alertas y mensajes",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M6 8a6 6 0 0112 0v5l2 2v1H4v-1l2-2V8z" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          ),
        },
        {
          href: "/secretaria/recuperaciones",
          label: "Recuperaciones",
          description: "Periodo y horario oficial",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M6 6l1 14h10l1-14" />
              <path d="M9 11h6" />
              <path d="M9 15h4" />
            </svg>
          ),
        },
        {
          href: "/secretaria/performance",
          label: "Rendimiento",
          description: "Estadísticas por grupo",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 3 2 4-5" />
            </svg>
          ),
        },
      ],
      PROFESOR: [
        {
          href: "/docente/materiales",
          label: "Materiales",
          description: "Recursos y materiales",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M4 19.5A2.5 2.5 0 006.5 22H20" />
              <path d="M4 4h16v16H6.5A2.5 2.5 0 014 17.5V4z" />
              <path d="M8 8h8" />
              <path d="M8 12h8" />
            </svg>
          ),
        },
        {
          href: "/docente/horarios",
          label: "Horarios",
          description: "Agenda y clases",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          ),
        },
        {
          href: "/docente/temarios",
          label: "Temarios",
          description: "Planificación y contenidos",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M4 4h12l4 4v12H4z" />
              <path d="M14 4v4h4" />
              <path d="M8 12h8M8 16h8" />
            </svg>
          ),
        },
        {
          href: "/docente/feedback",
          label: "Feedback",
          description: "Retroalimentación",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M21 15a4 4 0 01-4 4H7l-4 4V5a4 4 0 014-4h10a4 4 0 014 4v10z" />
              <path d="M8 9h8M8 13h6" />
            </svg>
          ),
        },
        {
          href: "/docente/gestion-academica",
          label: "Gestión académica",
          description: "Notas e inasistencias por estudiante",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 3 2 4-5" />
            </svg>
          ),
        },
        {
          href: "/docente/recuperaciones",
          label: "Recuperaciones",
          description: "Solicitudes y actividades",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M6 6l1 14h10l1-14" />
              <path d="M9 11h6" />
              <path d="M9 15h4" />
            </svg>
          ),
        },
        {
          href: "/docente/ligas",
          label: "Ligas",
          description: "Métricas por grupo",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 3 2 4-5" />
            </svg>
          ),
        },
      ],
      ESTUDIANTE: [
        {
          href: "/estudiante/materiales",
          label: "Materiales",
          description: "Recursos de estudio",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M4 19.5A2.5 2.5 0 006.5 22H20" />
              <path d="M4 4h16v16H6.5A2.5 2.5 0 014 17.5V4z" />
              <path d="M8 8h8" />
              <path d="M8 12h8" />
            </svg>
          ),
        },
        {
          href: "/estudiante/temarios",
          label: "Temarios",
          description: "Contenidos por curso",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M4 4h12l4 4v12H4z" />
              <path d="M14 4v4h4" />
              <path d="M8 12h8M8 16h8" />
            </svg>
          ),
        },
        {
          href: "/estudiante/ligas",
          label: "Ligas",
          description: "Enlaces útiles",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M10 13a5 5 0 007.07 0l2.12-2.12a5 5 0 00-7.07-7.07L12.1 4.9" />
              <path d="M14 11a5 5 0 00-7.07 0L4.81 13.12a5 5 0 107.07 7.07l1.99-1.99" />
            </svg>
          ),
        },
        {
          href: "/estudiante/horario",
          label: "Horario",
          description: "Tu calendario",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          ),
        },
        {
          href: "/estudiante/feedback",
          label: "Feedback",
          description: "Tu avance y comentarios",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M21 15a4 4 0 01-4 4H7l-4 4V5a4 4 0 014-4h10a4 4 0 014 4v10z" />
              <path d="M8 9h8M8 13h6" />
            </svg>
          ),
        },
        {
          href: "/estudiante/gestion-academica",
          label: "Gestión académica",
          description: "Tu rendimiento por materia",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 3 2 4-5" />
            </svg>
          ),
        },
        {
          href: "/estudiante/recuperaciones",
          label: "Recuperaciones",
          description: "Solicitudes y seguimiento",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M6 6l1 14h10l1-14" />
              <path d="M9 11h6" />
              <path d="M9 15h4" />
            </svg>
          ),
        },
      ],
    };

    return [...common, ...byRole[role]];
  }, [role]);

  return (
    <aside className={`sticky top-0 h-screen border-r border-slate-200 bg-white/80 backdrop-blur transition-all ${collapsed ? "w-16" : "w-64"}`}>
      {/* Header: Inicio + Toggle */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-slate-200">
        <Link
          href="/"
          prefetch={false}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${collapsed ? "justify-center w-full" : ""} ${isActive("/") ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "text-slate-700 hover:bg-slate-100"}`}
          aria-label="Ir a inicio"
        >
          {/* Home icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 3l9 8h-3v9H6v-9H3l9-8z" />
          </svg>
          {!collapsed && <span>Inicio</span>}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
          aria-label="Alternar sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : "rotate-0"}`}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="p-2 space-y-1">
        {items.map((item) => (
          <div key={item.href} className="relative group">
            <Link
              href={item.href}
              prefetch={false}
              className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} gap-2 px-3 py-2 rounded-md text-sm transition ease-out ${isActive(item.href, { strict: item.label === "Panel" }) ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <span className="text-current">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
            {/* Tooltip when collapsed */}
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 opacity-0 transition bg-white shadow-lg border border-slate-200 rounded-md px-3 py-2 w-48">
                <div className="text-sm font-medium text-slate-900">{item.label}</div>
                <div className="text-xs text-slate-600">{item.description}</div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer: logout */}
      <div className="mt-auto p-3 border-t border-slate-200">
        <button
          onClick={logout}
          className={`w-full ${collapsed ? "justify-center" : "justify-start"} inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50`}
        >
          {/* Logout icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-10H9a2 2 0 00-2 2v3h2V5h10v14H9v-3H7v3a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z" />
          </svg>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}