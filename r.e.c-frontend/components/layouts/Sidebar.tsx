"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePendingRecoveries } from "@/hooks/usePendingRecoveries";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { JSX } from "react/jsx-runtime";
import ThemeToggle from "@/components/ui/ThemeToggle";

type Role = "SECRETARIA" | "PROFESOR" | "ESTUDIANTE";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: JSX.Element;
  section?: string;
  /** id HTML para tours / pruebas (p. ej. Driver.js) */
  domId?: string;
};

type HoveredTooltip = {
  label: string;
  description: string;
  top: number;
  left: number;
};

function profileHrefForRole(r: Role): string {
  if (r === "SECRETARIA") return "/profile";
  if (r === "PROFESOR") return "/docente/perfil";
  return "/estudiante/perfil";
}

function userInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0]?.trim() ?? "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return local.toUpperCase();
  return "?";
}

export default function Sidebar({
  role,
  notificationUnreadCount = 0,
}: {
  role: Role;
  notificationUnreadCount?: number;
}) {
  const { user, logout } = useAuth();
  const { pending: pendingRecoveries, loading: pendingRecoveriesLoading } = usePendingRecoveries();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<HoveredTooltip | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      const desktop = media.matches;
      setIsDesktop(desktop);
      if (!desktop) {
        setCollapsed(false);
        setHoveredTooltip(null);
      }
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const isCollapsedDesktop = collapsed && isDesktop;

  const showTooltip = (event: React.MouseEvent<HTMLDivElement>, item: NavItem) => {
    if (!isCollapsedDesktop) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label: item.label,
      description: item.description,
      top: bounds.top + bounds.height / 2,
      left: bounds.right + 12,
    });
  };

  const hideTooltip = () => setHoveredTooltip(null);

  const isActive = (href: string, opts?: { strict?: boolean }) =>
    opts?.strict ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const items: NavItem[] = useMemo(() => {
    const common: NavItem[] = [
      {
        href: "/" + (role === "SECRETARIA" ? "secretaria" : role === "PROFESOR" ? "docente" : "estudiante"),
        label: "Panel",
        description: "Resumen y accesos rápidos",
        domId:
          role === "PROFESOR" ? "nav-docente-panel" : role === "ESTUDIANTE" ? "nav-estudiante-panel" : undefined,
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
          section: "Gestión académica",
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
          section: "Gestión académica",
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
          section: "Administración",
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
          section: "Administración",
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
          section: "Operación",
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
          href: "/secretaria/academico",
          label: "Académico",
          description: "Estructura académica",
          section: "Gestión académica",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 6l9-4 9 4-9 4-9-4z" />
              <path d="M3 10l9 4 9-4" />
              <path d="M3 14l9 4 9-4" />
            </svg>
          ),
        },
        {
          href: "/secretaria/promociones",
          label: "Promociones",
          description: "Promover y simular grado",
          section: "Operación",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M12 3v18" />
              <path d="M7 8l5-5 5 5" />
              <path d="M17 16l-5 5-5-5" />
            </svg>
          ),
        },
        {
          href: "/secretaria/registro-masivo",
          label: "Registro Masivo",
          description: "Importación de usuarios",
          section: "Administración",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
          ),
        },
        {
          href: "/secretaria/usuarios",
          label: "Usuarios",
          description: "Vista global por roles",
          section: "Administración",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
      ],
      PROFESOR: [
        {
          href: "/docente/materiales",
          label: "Materiales",
          description: "Recursos y materiales",
          domId: "nav-docente-materiales",
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
          domId: "nav-docente-horarios",
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
          domId: "nav-docente-temarios",
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
          domId: "nav-docente-feedback",
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
          domId: "nav-docente-gestion",
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
          domId: "nav-docente-recuperaciones",
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
          domId: "nav-docente-ligas",
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
          domId: "nav-estudiante-materiales",
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
          domId: "nav-estudiante-temarios",
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
          domId: "nav-estudiante-ligas",
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
          domId: "nav-estudiante-horario",
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
          domId: "nav-estudiante-feedback",
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
          domId: "nav-estudiante-gestion",
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
          domId: "nav-estudiante-recuperaciones",
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

  const profileHref = profileHrefForRole(role);
  const displayName =
    (user?.name ?? "").trim() ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "Usuario";
  const initials = userInitials(user?.name ?? "", user?.email ?? "");

  return (
    <aside
      className={`flex flex-col border-b lg:border-b-0 lg:border-r border-rec-border-default bg-rec-bg-elevated/80 backdrop-blur transition-all w-full lg:sticky lg:top-0 lg:h-screen lg:z-40 ${
        isCollapsedDesktop ? "lg:w-16" : "lg:w-64"
      }`}
    >
      {/* Header: Inicio + Toggle */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-rec-border-default">
        <Link
          href="/"
          prefetch={false}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${isCollapsedDesktop ? "justify-center w-full" : ""} ${isActive("/") ? "bg-rec-success-bg text-rec-success-text ring-1 ring-rec-success-border" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
          aria-label="Ir a inicio"
        >
          {/* Home icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 3l9 8h-3v9H6v-9H3l9-8z" />
          </svg>
          {!isCollapsedDesktop && <span>Inicio</span>}
        </Link>
        <button
          type="button"
          onClick={() => setMobileExpanded((open) => !open)}
          className="ml-auto inline-flex lg:hidden items-center justify-center w-9 h-9 rounded-md border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted"
          aria-label={mobileExpanded ? "Minimizar navegación" : "Desplegar navegación"}
          aria-expanded={mobileExpanded}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform ${mobileExpanded ? "rotate-180" : "rotate-0"}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-2 hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-md border border-rec-border-strong text-rec-text-secondary hover:bg-rec-bg-muted"
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
            className={`h-4 w-4 transition-transform ${isCollapsedDesktop ? "rotate-180" : "rotate-0"}`}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out lg:grid-rows-[1fr] lg:opacity-100 ${
          isDesktop || mobileExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden lg:flex lg:min-h-full lg:flex-col lg:overflow-visible">
          <div className="sidebar-scroll lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto lg:overflow-x-visible">
            {/* Nav items */}
            <nav
              className="p-2 space-y-1"
              id={
                role === "PROFESOR"
                  ? "docente-sidebar-nav"
                  : role === "ESTUDIANTE"
                    ? "estudiante-sidebar-nav"
                    : undefined
              }
            >
              {items.map((item, index) => {
                const previous = items[index - 1];
                const shouldRenderSectionLabel =
                  !isCollapsedDesktop &&
                  item.section &&
                  previous?.section !== item.section;
                const isRecuperaciones = item.href.endsWith("/recuperaciones");
                const showRecoveryBadge =
                  isRecuperaciones && !pendingRecoveriesLoading && pendingRecoveries > 0;
                const recoveryBadgeLabel = pendingRecoveries >= 10 ? "9+" : String(pendingRecoveries);
                const isNotifications = item.href.endsWith("/notificaciones");
                const showNotificationBadge = isNotifications && notificationUnreadCount > 0;
                const notificationBadgeLabel =
                  notificationUnreadCount >= 10 ? "9+" : String(notificationUnreadCount);

                return (
                  <div
                    key={item.href}
                    className="relative group"
                    onMouseEnter={(event) => showTooltip(event, item)}
                    onMouseLeave={hideTooltip}
                  >
                    {shouldRenderSectionLabel ? (
                      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-rec-text-subtle">
                        {item.section}
                      </div>
                    ) : null}
                    <Link
                      href={item.href}
                      prefetch={false}
                      id={item.domId}
                      onClick={() => {
                        if (!isDesktop) setMobileExpanded(false);
                        hideTooltip();
                      }}
                      aria-label={
                        (showRecoveryBadge || showNotificationBadge) && isCollapsedDesktop
                          ? `${item.label}, ${
                              showRecoveryBadge ? recoveryBadgeLabel : notificationBadgeLabel
                            } pendientes`
                          : undefined
                      }
                      className={`flex items-center ${isCollapsedDesktop ? "justify-center" : "justify-start"} gap-2 px-3 py-2 rounded-md text-sm transition ease-out ${showRecoveryBadge && !isCollapsedDesktop ? "w-full" : ""} ${isActive(item.href, { strict: item.label === "Panel" }) ? "bg-rec-success-bg text-rec-success-text ring-1 ring-rec-success-border" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
                    >
                      <span className="relative inline-flex text-current">
                        {item.icon}
                        {showRecoveryBadge && isCollapsedDesktop ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rec-danger-solid ring-2 ring-rec-bg-elevated"
                            aria-hidden
                          />
                        ) : null}
                        {showNotificationBadge && isCollapsedDesktop ? (
                          <span
                            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rec-danger-solid ring-2 ring-rec-bg-elevated"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                      {!isCollapsedDesktop && (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {showRecoveryBadge ? (
                            <span className="ml-auto shrink-0 rounded-full bg-rec-danger-solid px-2 py-0.5 text-[11px] font-semibold leading-none text-rec-text-on-media">
                              {recoveryBadgeLabel}
                            </span>
                          ) : null}
                          {!showRecoveryBadge && showNotificationBadge ? (
                            <span className="ml-auto shrink-0 rounded-full bg-rec-danger-solid px-2 py-0.5 text-[11px] font-semibold leading-none text-rec-text-on-media">
                              {notificationBadgeLabel}
                            </span>
                          ) : null}
                        </>
                      )}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Footer: tema + perfil + cerrar sesión */}
          <div
            className="mt-auto border-t border-rec-border-default p-3"
            id={
              role === "PROFESOR"
                ? "docente-sidebar-cuenta"
                : role === "ESTUDIANTE"
                  ? "estudiante-sidebar-cuenta"
                  : undefined
            }
          >
            <div className={`mb-2 flex ${isCollapsedDesktop ? "justify-center" : "justify-end"}`}>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href={profileHref}
                prefetch={false}
                id={
                  role === "PROFESOR"
                    ? "docente-nav-perfil"
                    : role === "ESTUDIANTE"
                      ? "estudiante-nav-perfil"
                      : undefined
                }
                onClick={() => {
                  if (!isDesktop) setMobileExpanded(false);
                }}
                className={`flex min-w-0 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-rec-text-secondary transition hover:bg-rec-bg-muted ${isCollapsedDesktop ? "justify-center px-0" : "justify-start"}`}
                aria-label={`Ir a perfil (${displayName})`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rec-primary text-xs font-semibold text-rec-text-on-media">
                  {initials}
                </span>
                {!isCollapsedDesktop && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-rec-text-primary">{displayName}</span>
                    <span className="text-xs text-rec-success-text">Ver perfil</span>
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={logout}
                className={`w-full inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-rec-danger-text transition hover:bg-rec-danger-bg ${isCollapsedDesktop ? "justify-center" : "justify-start"}`}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 shrink-0"
                >
                  <path d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-10H9a2 2 0 00-2 2v3h2V5h10v14H9v-3H7v3a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2z" />
                </svg>
                {!isCollapsedDesktop && <span>Cerrar sesión</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
      {hoveredTooltip && isCollapsedDesktop && (
        <div
          className="pointer-events-none fixed z-[200] w-48 -translate-y-1/2 rounded-md border border-rec-border-default bg-rec-bg-elevated px-3 py-2 shadow-2xl ring-1 ring-rec-border-default/80"
          style={{ top: hoveredTooltip.top, left: hoveredTooltip.left }}
        >
          <div className="text-sm font-medium text-rec-text-primary">{hoveredTooltip.label}</div>
          <div className="text-xs text-rec-text-muted">{hoveredTooltip.description}</div>
        </div>
      )}
    </aside>
  );
}