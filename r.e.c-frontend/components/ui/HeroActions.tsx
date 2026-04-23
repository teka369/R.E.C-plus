"use client";

import HelpHubLauncher from "@/components/onboarding/HelpHubLauncher";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useEffect, useState, type SVGProps } from "react";

export default function HeroActions() {
  const { token, user } = useAuth();
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setHeroReady(true), 60);
    return () => clearTimeout(id);
  }, []);

  const dashboardBase =
    user?.role === "SUPER_ADMIN"
      ? "/super-admin"
      : user?.role === "PROFESOR"
      ? "/docente"
      : user?.role === "ESTUDIANTE"
      ? "/estudiante"
      : "/secretaria";

  return (
    <div
      className={
        "transition-all duration-700 " +
        (heroReady ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")
      }
    >
      <p className="inline-flex rounded-full border border-rec-text-on-media/30 bg-rec-bg-elevated/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-rec-text-on-media">
        Plataforma academica institucional
      </p>
      <h1 className="mt-5 text-4xl font-black leading-tight text-rec-text-on-media md:text-6xl">
        R.E.C Education
      </h1>
      <p className="mt-5 max-w-2xl text-base text-rec-text-on-media/90 md:text-lg">
        Refuerzo Educativo Complementario para instituciones que necesitan claridad,
        seguimiento academico y una experiencia digital confiable para estudiantes,
        docentes y secretaria.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {!token ? (
          <>
            <Link
              href="/login"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full bg-rec-bg-elevated px-6 py-3 text-sm font-semibold text-[color:var(--rec-primary)] shadow-md hover:scale-[1.02]"
            >
              <IconBolt className="h-4 w-4" />
              Iniciar sesion
            </Link>
            <Link
              href="/acceso-secretaria"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full border border-rec-text-on-media/50 bg-rec-bg-elevated/10 px-6 py-3 text-sm font-semibold text-rec-text-on-media hover:bg-rec-bg-elevated/20"
            >
              <IconUser className="h-4 w-4" />
              Acceso secretaria
            </Link>
            <HelpHubLauncher />
          </>
        ) : (
          <>
            <Link
              href={dashboardBase}
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full bg-rec-bg-elevated px-6 py-3 text-sm font-semibold text-[color:var(--rec-primary)] shadow-md hover:scale-[1.02]"
            >
              <IconSpark className="h-4 w-4" />
              Ir al panel
            </Link>
            <HelpHubLauncher />
          </>
        )}
      </div>

      <p className="mt-6 text-sm font-semibold text-rec-text-on-media/95">Diseñado para toda la comunidad educativa</p>
      <div className="mt-3 flex flex-wrap gap-6 text-sm text-rec-text-on-media/90">
        <div className="flex items-start gap-2">
          <IconBook className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold text-rec-text-on-media">Docentes</p>
            <p>Trazabilidad de cada grupo y seguimiento académico centralizado.</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <IconUser className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold text-rec-text-on-media">Estudiantes</p>
            <p>Acceso directo a horarios, materiales y retroalimentación.</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <IconFolder className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold text-rec-text-on-media">Secretaría</p>
            <p>Gestión operativa ordenada con control de periodos y reportes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBolt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSpark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l1.5 3L17 7l-3 1.5L12 12l-1.5-3L7 7l3-1.5L12 3z" />
    </svg>
  );
}

function IconBook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 4a8 8 0 0 0-8 8v5a2 2 0 0 0 2 2h6V4z" />
      <path d="M12 4a8 8 0 0 1 8 8v5a2 2 0 0 1-2 2h-6V4z" />
    </svg>
  );
}

function IconFolder(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}
