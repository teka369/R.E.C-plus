"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { REC_WHATSAPP_URL } from "@/lib/siteContact";
import { FaWhatsapp } from "react-icons/fa";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownLocked, setDropdownLocked] = useState(false);
  const academicoRef = useRef<HTMLDivElement | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLocked, setProfileLocked] = useState(false);

  const role = user?.role as "SECRETARIA" | "PROFESOR" | "ESTUDIANTE" | undefined;
  const dashHref = role === "SECRETARIA" ? "/secretaria" : role === "PROFESOR" ? "/docente" : role === "ESTUDIANTE" ? "/estudiante" : "/";

  const academicItems = useMemo(() => {
    if (role === "SECRETARIA") {
      return [
        { href: "/secretaria/academico", label: "Académico" },
        { href: "/secretaria/estudiantes", label: "Estudiantes" },
        { href: "/secretaria/docentes", label: "Docentes" },
      ];
    }
    const base = role === "PROFESOR" ? "/docente" : "/estudiante";
    // En dropdown solo Temarios, Materiales, Horarios
    return [
      { href: `${base}/temarios`, label: "Temarios" },
      { href: `${base}/materiales`, label: "Materiales" },
      { href: role === "PROFESOR" ? "/docente/horarios" : "/estudiante/horario", label: "Horarios" },
    ];
  }, [role]);

  // Cerrar dropdown Académico por click fuera cuando está bloqueado
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownLocked) return;
      const el = academicoRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setDropdownLocked(false);
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [dropdownLocked]);

  // Perfil: click para bloquear y hover para mostrar, con click-fuera
  const profileRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!profileLocked) return;
      const el = profileRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setProfileLocked(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [profileLocked]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Obtener primer nombre de forma segura desde `user.name`
  const fullName: string = (user?.name ?? "").trim();
  const firstName: string = fullName
    ? fullName.split(/\s+/)[0]
    : (user?.email ? user.email.split("@")[0] : "Usuario");
  const initial: string = (firstName || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* El blur solo en la barra: si envuelve el drawer móvil, WebKit pinta el panel transparente. */}
      <div className="rec-nav-glass w-full border-b border-rec-border-default backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 py-2">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" prefetch={false} className="flex items-center gap-3" aria-label="Ir a inicio">
            <Image
              src="/logo.webp"
              alt="Logo R.E.C"
              width={160}
              height={160}
              className="rec-logo-on-dark h-14 w-14 object-contain sm:h-16 sm:w-16"
              priority
            />
            <span className="text-lg font-bold text-[color:var(--rec-primary)]">R.E.C</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            prefetch={false}
            className={`px-3 py-2 rounded-md text-sm transition ease-out ${isActive("/") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)] ring-1 ring-[color:var(--rec-soft)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
          >
            Inicio
          </Link>

          {/* Más opciones */}
          <div className="relative"
            onMouseLeave={() => { if (!dropdownLocked) setOpenDropdown(null); }}
          >
            <button
              className={`px-3 py-2 rounded-md text-sm transition ease-out ${
                openDropdown === "mas" || isActive("/portafolio")
                  ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)] ring-1 ring-[color:var(--rec-soft)]"
                  : "text-rec-text-secondary hover:bg-rec-bg-muted"
              }`}
              onMouseEnter={() => setOpenDropdown("mas")}
              onClick={() => {
                setDropdownLocked((prev) => !prev);
                setOpenDropdown((d) => (d === "mas" && dropdownLocked ? null : "mas"));
              }}
              aria-haspopup="true"
              aria-expanded={openDropdown === "mas"}
            >
              <span className="inline-flex items-center gap-1">
                Más opciones
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-3 w-3 transition-transform ${openDropdown === "mas" ? "rotate-180" : "rotate-0"}`}
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
            {/* Dropdown: top-full + pt-2 = puente bajo el botón (el margen mt-* no recibe el puntero y cerraba el menú) */}
            <div
              className={`absolute left-0 top-full z-10 w-56 origin-top-left pt-2 transition-opacity duration-200 ease-out ${openDropdown === "mas" ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <div
                className={`origin-top-left rounded-lg border border-rec-border-default bg-rec-bg-elevated shadow-lg transition-all duration-200 ease-out ${openDropdown === "mas" ? "translate-y-0 scale-100" : "-translate-y-0.5 scale-95"}`}
              >
                <ul className="py-1">
                  <li>
                    <Link
                      href="/portafolio"
                      prefetch={false}
                      className={`block px-3 py-2 text-sm rounded-md transition ease-out ${isActive("/portafolio") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
                    >
                      Portafolio
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/tutorial"
                      prefetch={false}
                      className={`block px-3 py-2 text-sm rounded-md transition ease-out ${isActive("/tutorial") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
                    >
                      Tutorial
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/Informacion"
                      prefetch={false}
                      className={`block px-3 py-2 text-sm rounded-md transition ease-out ${isActive("/Informacion") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
                    >
                      Información
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/Contacto"
                      prefetch={false}
                      className={`block px-3 py-2 text-sm rounded-md transition ease-out ${isActive("/Contacto") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
                    >
                      Contacto
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {token && role !== "SECRETARIA" && (
            <>
              <Link
                href={role === "PROFESOR" ? "/docente/ligas" : "/estudiante/ligas"}
                prefetch={false}
                className={`px-3 py-2 rounded-md text-sm transition ease-out ${isActive(role === "PROFESOR" ? "/docente/ligas" : "/estudiante/ligas") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)] ring-1 ring-[color:var(--rec-soft)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
              >
                Ligas
              </Link>
              <Link
                href={role === "PROFESOR" ? "/docente/feedback" : "/estudiante/feedback"}
                prefetch={false}
                className={`px-3 py-2 rounded-md text-sm transition ease-out ${isActive(role === "PROFESOR" ? "/docente/feedback" : "/estudiante/feedback") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)] ring-1 ring-[color:var(--rec-soft)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
              >
                Feedback
              </Link>
            </>
          )}

          {token && (
            <div
              className="relative"
              ref={academicoRef}
              onMouseLeave={() => {
                if (!dropdownLocked) setOpenDropdown(null);
              }}
            >
              <button
                className={`px-3 py-2 rounded-md text-sm transition ease-out ${openDropdown === "academico" ? "bg-rec-bg-muted" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
                onMouseEnter={() => {
                  setOpenDropdown("academico");
                }}
                onClick={() => {
                  setDropdownLocked((prev) => !prev);
                  setOpenDropdown((d) => (d === "academico" && dropdownLocked ? null : "academico"));
                }}
                aria-haspopup="true"
                aria-expanded={openDropdown === "academico"}
              >
                <span className="inline-flex items-center gap-1">
                  Académico
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-3 w-3 transition-transform ${openDropdown === "academico" ? "rotate-180" : "rotate-0"}`}
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
              {/* Dropdown */}
              <div
                className={`absolute left-0 top-full z-10 w-56 origin-top-left pt-2 transition-opacity duration-200 ease-out ${openDropdown === "academico" ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
              >
                <div
                  className={`origin-top-left rounded-lg border border-rec-border-default bg-rec-bg-elevated shadow-lg transition-all duration-200 ease-out ${openDropdown === "academico" ? "translate-y-0 scale-100" : "-translate-y-0.5 scale-95"}`}
                >
                  <ul className="py-1">
                    {academicItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          prefetch={false}
                          className={`block px-3 py-2 text-sm rounded-md transition ease-out ${isActive(item.href) ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {token && (
            <Link
              href={dashHref}
              prefetch={false}
              className={`px-3 py-2 rounded-md text-sm transition ${isActive(dashHref) ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`}
            >
              Panel
            </Link>
          )}
        </nav>

        {/* Right side: tema + auth/profile */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <a
            href={REC_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rec-border-default bg-rec-bg-elevated text-[#25D366] hover:bg-rec-bg-muted"
            aria-label="WhatsApp"
          >
            <FaWhatsapp className="h-5 w-5" aria-hidden />
          </a>
          {!token ? (
            <>
              <Link href="/login" prefetch={false} className="px-3 py-2 rounded-full border border-[color:var(--rec-primary)] text-[color:var(--rec-primary)] text-sm hover:bg-[color:var(--rec-soft)]">Ingresar</Link>
              <Link href="/acceso-secretaria" prefetch={false} className="px-3 py-2 rounded-full bg-[color:var(--rec-primary)] text-rec-text-on-media text-sm hover:bg-[color:var(--rec-primary-strong)]">Acceso Secretaría</Link>
            </>
          ) : (
            <div
              className="relative flex items-center gap-3"
              ref={profileRef}
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => { if (!profileLocked) setProfileOpen(false); }}
              onClick={() => { setProfileLocked((v) => !v); setProfileOpen(true); }}
            >
              <div className="w-8 h-8 rounded-full bg-[color:var(--rec-primary)] text-rec-text-on-media flex items-center justify-center font-semibold">
                {initial}
              </div>
              <div className="leading-tight">
                <span className="block text-sm font-medium text-rec-text-primary">{firstName}</span>
                <span className="block text-xs text-rec-text-muted">{role || "Rol"}</span>
              </div>
              {/* Dropdown perfil: Perfil + Cerrar sesión (pt-2 = puente de hover bajo el trigger) */}
              <div
                className={`absolute right-0 top-full z-10 w-44 origin-top-right pt-2 transition-opacity duration-200 ease-out ${profileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
              >
                <div
                  className={`rounded-lg border border-rec-border-default bg-rec-bg-elevated shadow-lg transition-all duration-200 ease-out ${profileOpen ? "translate-y-0 scale-100" : "-translate-y-0.5 scale-95"}`}
                >
                  {role !== "SECRETARIA" && (
                    <Link
                      href={role === "PROFESOR" ? "/docente/perfil" : "/estudiante/perfil"}
                      prefetch={false}
                      className="block w-full px-3 py-2 text-sm text-rec-text-secondary hover:bg-rec-bg-muted"
                    >
                      Perfil
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm text-rec-danger-text hover:bg-rec-danger-bg"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <a
            href={REC_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-rec-border-strong text-[#25D366]"
            aria-label="WhatsApp"
          >
            <FaWhatsapp className="h-5 w-5" aria-hidden />
          </a>
        {/* Mobile hamburger */}
        <button
          className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-rec-border-strong text-rec-text-secondary"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <span className="sr-only">Abrir menú</span>
          <div className="space-y-1">
            <span className="block w-5 h-[2px] bg-current"></span>
            <span className="block w-5 h-[2px] bg-current"></span>
            <span className="block w-5 h-[2px] bg-current"></span>
          </div>
        </button>
        </div>
        </div>
      </div>

      {/* Mobile drawer: fuera del nodo con backdrop-filter para fondo opaco en iOS/Safari */}
      <div
        className={`fixed inset-0 z-[100] md:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 z-0 bg-rec-text-primary/50 backdrop-blur-sm transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <aside
          className={`absolute left-0 top-0 z-[1] flex h-full w-[min(20rem,88vw)] max-w-[85vw] flex-col border-r border-rec-border-default bg-rec-bg-elevated shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{ backgroundColor: "var(--rec-bg-elevated)" }}
        >
          <div
            className="flex shrink-0 items-center justify-between gap-2 border-b border-rec-border-default bg-rec-bg-elevated p-4"
            style={{ backgroundColor: "var(--rec-bg-elevated)" }}
          >
            <Link href="/" prefetch={false} className="flex items-center gap-2 text-[color:var(--rec-primary)]" onClick={() => setMobileOpen(false)} aria-label="Ir a inicio">
              <Image
                src="/logo.webp"
                alt="Logo R.E.C"
                width={128}
                height={128}
                className="rec-logo-on-dark h-14 w-14 object-contain"
              />
              <span className="text-lg font-bold">R.E.C</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button className="w-9 h-9 rounded-md border border-rec-border-strong" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">✕</button>
            </div>
          </div>
          <nav
            className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-rec-bg-elevated p-2"
            style={{ backgroundColor: "var(--rec-bg-elevated)" }}
          >
            <Link href="/" prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive("/") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`} onClick={() => setMobileOpen(false)}>Inicio</Link>
            <details className="group">
              <summary className="px-3 py-2 rounded-md text-sm text-rec-text-secondary cursor-pointer hover:bg-rec-bg-muted">Más opciones</summary>
              <div className="mt-1 pl-3 space-y-1">
                <Link href="/portafolio" prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive("/portafolio") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`} onClick={() => setMobileOpen(false)}>Portafolio</Link>
                <Link href="/tutorial" prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive("/tutorial") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`} onClick={() => setMobileOpen(false)}>Tutorial</Link>
                <Link href="/Informacion" prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive("/Informacion") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`} onClick={() => setMobileOpen(false)}>Información</Link>
                <Link href="/Contacto" prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive("/Contacto") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`} onClick={() => setMobileOpen(false)}>Contacto</Link>
              </div>
            </details>
            {token && (
              <details className="group">
                <summary className="px-3 py-2 rounded-md text-sm text-rec-text-secondary cursor-pointer hover:bg-rec-bg-muted">Académico</summary>
                <div className="mt-1 pl-3 space-y-1">
                  {academicItems.map((item) => (
                    <Link key={item.href} href={item.href} prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive(item.href) ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`} onClick={() => setMobileOpen(false)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            )}
            {token && role !== "SECRETARIA" && (
              <>
                <Link href={role === "PROFESOR" ? "/docente/ligas" : "/estudiante/ligas"} prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive(role === "PROFESOR" ? "/docente/ligas" : "/estudiante/ligas") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`} onClick={() => setMobileOpen(false)}>Ligas</Link>
                <Link href={role === "PROFESOR" ? "/docente/feedback" : "/estudiante/feedback"} prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive(role === "PROFESOR" ? "/docente/feedback" : "/estudiante/feedback") ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`} onClick={() => setMobileOpen(false)}>Feedback</Link>
              </>
            )}
            {token && (
              <Link href={dashHref} prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive(dashHref) ? "bg-[color:var(--rec-soft)] text-[color:var(--rec-primary)]" : "text-rec-text-secondary hover:bg-rec-bg-muted"}`} onClick={() => setMobileOpen(false)}>Panel</Link>
            )}

            <div className="mt-3 border-t pt-3">
              {!token ? (
                <div className="flex gap-2">
                  <Link href="/login" prefetch={false} className="flex-1 px-3 py-2 rounded-md border border-[color:var(--rec-primary)] text-[color:var(--rec-primary)] text-sm hover:bg-[color:var(--rec-soft)]" onClick={() => setMobileOpen(false)}>Ingresar</Link>
                  <Link href="/acceso-secretaria" prefetch={false} className="flex-1 px-3 py-2 rounded-md bg-[color:var(--rec-primary)] text-rec-text-on-media text-sm hover:bg-[color:var(--rec-primary-strong)]" onClick={() => setMobileOpen(false)}>Acceso Secretaría</Link>
                </div>
              ) : (
                <button className="w-full px-3 py-2 rounded-md text-sm text-rec-danger-text hover:bg-rec-danger-bg" onClick={logout}>Salir</button>
              )}
            </div>
          </nav>
        </aside>
      </div>
    </header>
  );
}
