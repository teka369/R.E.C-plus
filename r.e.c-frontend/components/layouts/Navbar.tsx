"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";

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
      { href: `${base}/horarios`, label: "Horarios" },
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

  // Obtener primer nombre de forma segura desde `user.name` (o `nombres` si existiera)
  const fullName: string = ((user as any)?.name || (user as any)?.nombres || "").toString().trim();
  const firstName: string = fullName
    ? fullName.split(/\s+/)[0]
    : (user?.email ? user.email.split("@")[0] : "Usuario");
  const initial: string = (firstName || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" prefetch={false} className="flex items-center gap-3" aria-label="Ir a inicio">
            <Image src="/logo.png" alt="Logo R.E.C" width={96} height={96} className="h-12 w-12 object-contain" priority />
            <span className="text-lg font-bold text-emerald-600">R.E.C</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            prefetch={false}
            className={`px-3 py-2 rounded-md text-sm transition ease-out ${isActive("/") ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "text-slate-700 hover:bg-slate-100"}`}
          >
            Inicio
          </Link>

          {/* Más opciones: Portafolio + Certificados */}
          <div className="relative"
            onMouseLeave={() => { if (!dropdownLocked) setOpenDropdown(null); }}
          >
            <button
              className={`px-3 py-2 rounded-md text-sm transition ease-out ${
                openDropdown === "mas" || isActive("/portafolio") || isActive("/certificados")
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "text-slate-700 hover:bg-slate-100"
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
            {/* Dropdown */}
            <div
              className={`absolute left-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-200 ease-out origin-top-left ${openDropdown === "mas" ? "scale-100 translate-y-1 opacity-100" : "scale-95 translate-y-0 opacity-0 pointer-events-none"}`}
              onMouseEnter={() => setOpenDropdown("mas")}
              onMouseLeave={() => { if (!dropdownLocked) setOpenDropdown(null); }}
            >
              <ul className="py-1">
                <li>
                  <Link
                    href="/portafolio"
                    prefetch={false}
                    className={`block px-3 py-2 text-sm rounded-md transition ease-out ${isActive("/portafolio") ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    Portafolio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/certificados"
                    prefetch={false}
                    className={`block px-3 py-2 text-sm rounded-md transition ease-out ${isActive("/certificados") ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    Certificados
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {token && role !== "SECRETARIA" && (
            <>
              <Link
                href={role === "PROFESOR" ? "/docente/ligas" : "/estudiante/ligas"}
                prefetch={false}
                className={`px-3 py-2 rounded-md text-sm transition ease-out ${isActive(role === "PROFESOR" ? "/docente/ligas" : "/estudiante/ligas") ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "text-slate-700 hover:bg-slate-100"}`}
              >
                Ligas
              </Link>
              <Link
                href={role === "PROFESOR" ? "/docente/feedback" : "/estudiante/feedback"}
                prefetch={false}
                className={`px-3 py-2 rounded-md text-sm transition ease-out ${isActive(role === "PROFESOR" ? "/docente/feedback" : "/estudiante/feedback") ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "text-slate-700 hover:bg-slate-100"}`}
              >
                Feedback
              </Link>
            </>
          )}

          {token && (
            <div className="relative" ref={academicoRef}
            >
              <button
                className={`px-3 py-2 rounded-md text-sm transition ease-out ${openDropdown === "academico" ? "bg-slate-100" : "text-slate-700 hover:bg-slate-100"}`}
                onMouseEnter={() => {
                  setOpenDropdown("academico");
                }}
                onMouseLeave={() => {
                  if (!dropdownLocked) setOpenDropdown(null);
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
                className={`absolute left-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-200 ease-out origin-top-left ${openDropdown === "academico" ? "scale-100 translate-y-1 opacity-100" : "scale-95 translate-y-0 opacity-0 pointer-events-none"}`}
                onMouseEnter={() => {
                  setOpenDropdown("academico");
                }}
                onMouseLeave={() => {
                  if (!dropdownLocked) setOpenDropdown(null);
                }}
              >
                <ul className="py-1">
                  {academicItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch={false}
                        className={`block px-3 py-2 text-sm rounded-md transition ease-out ${isActive(item.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {token && (
            <Link
              href={dashHref}
              prefetch={false}
              className={`px-3 py-2 rounded-md text-sm transition ${isActive(dashHref) ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`}
            >
              Panel
            </Link>
          )}
        </nav>

        {/* Right side: auth/profile */}
        <div className="hidden md:flex items-center gap-3">
          {!token ? (
            <>
              <Link href="/login" prefetch={false} className="px-3 py-2 rounded-full border border-emerald-500 text-emerald-700 text-sm hover:bg-emerald-50">Ingresar</Link>
              <Link href="/acceso-secretaria" prefetch={false} className="px-3 py-2 rounded-full bg-emerald-600 text-white text-sm hover:bg-emerald-700">Acceso Secretaría</Link>
            </>
          ) : (
            <div
              className="relative flex items-center gap-3"
              ref={profileRef}
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => { if (!profileLocked) setProfileOpen(false); }}
              onClick={() => { setProfileLocked((v) => !v); setProfileOpen(true); }}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold">
                {initial}
              </div>
              <div className="leading-tight">
                <span className="block text-sm font-medium text-slate-900">{firstName}</span>
                <span className="block text-xs text-slate-600">{role || "Rol"}</span>
              </div>
              {/* Dropdown perfil: Perfil + Cerrar sesión */}
              <div
                className={`absolute right-0 top-full mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-200 ease-out ${profileOpen ? "opacity-100 scale-100 translate-y-1" : "opacity-0 scale-95 translate-y-0 pointer-events-none"}`}
              >
                {role !== "SECRETARIA" && (
                  <Link
                    href={role === "PROFESOR" ? "/docente/perfil" : "/estudiante/perfil"}
                    prefetch={false}
                    className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Perfil
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-slate-300 text-slate-700"
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

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 ${mobileOpen ? "" : "pointer-events-none"}`} aria-hidden={!mobileOpen}>
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMobileOpen(false)} />
        <aside className={`absolute top-0 left-0 h-full w-72 bg-white shadow-lg transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-4 border-b flex items-center justify-between">
            <Link href="/" prefetch={false} className="flex items-center gap-2 text-emerald-700" onClick={() => setMobileOpen(false)} aria-label="Ir a inicio">
              <Image src="/logo.png" alt="Logo R.E.C" width={44} height={44} className="h-11 w-11 object-contain" />
              <span className="text-lg font-bold">R.E.C</span>
            </Link>
            <button className="w-9 h-9 rounded-md border border-slate-300" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">✕</button>
          </div>
          <nav className="p-2 space-y-1">
            <Link href="/" prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive("/") ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => setMobileOpen(false)}>Inicio</Link>
            <details className="group">
              <summary className="px-3 py-2 rounded-md text-sm text-slate-700 cursor-pointer hover:bg-slate-100">Más opciones</summary>
              <div className="mt-1 pl-3 space-y-1">
                <Link href="/portafolio" prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive("/portafolio") ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => setMobileOpen(false)}>Portafolio</Link>
                <Link href="/certificados" prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive("/certificados") ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => setMobileOpen(false)}>Certificados</Link>
              </div>
            </details>
            {token && (
              <details className="group">
                <summary className="px-3 py-2 rounded-md text-sm text-slate-700 cursor-pointer hover:bg-slate-100">Académico</summary>
                <div className="mt-1 pl-3 space-y-1">
                  {academicItems.map((item) => (
                    <Link key={item.href} href={item.href} prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive(item.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => setMobileOpen(false)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            )}
            {token && role !== "SECRETARIA" && (
              <>
                <Link href={role === "PROFESOR" ? "/docente/ligas" : "/estudiante/ligas"} prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive(role === "PROFESOR" ? "/docente/ligas" : "/estudiante/ligas") ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => setMobileOpen(false)}>Ligas</Link>
                <Link href={role === "PROFESOR" ? "/docente/feedback" : "/estudiante/feedback"} prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive(role === "PROFESOR" ? "/docente/feedback" : "/estudiante/feedback") ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => setMobileOpen(false)}>Feedback</Link>
              </>
            )}
            {token && (
              <Link href={dashHref} prefetch={false} className={`block px-3 py-2 rounded-md text-sm ${isActive(dashHref) ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-100"}`} onClick={() => setMobileOpen(false)}>Panel</Link>
            )}

            <div className="mt-3 border-t pt-3">
              {!token ? (
                <div className="flex gap-2">
                  <Link href="/login" prefetch={false} className="flex-1 px-3 py-2 rounded-md border border-emerald-500 text-emerald-700 text-sm hover:bg-emerald-50" onClick={() => setMobileOpen(false)}>Ingresar</Link>
                  <Link href="/acceso-secretaria" prefetch={false} className="flex-1 px-3 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700" onClick={() => setMobileOpen(false)}>Acceso Secretaría</Link>
                </div>
              ) : (
                <button className="w-full px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50" onClick={logout}>Salir</button>
              )}
            </div>
          </nav>
        </aside>
      </div>
    </header>
  );
}