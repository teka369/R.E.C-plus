import type { DocenteTourModuleDefinition, DocenteTourModuleId } from "./types";
import { PANEL_TOUR_STEPS } from "./panelTourSteps";
import {
  FEEDBACK_TOUR_STEPS,
  GESTION_TOUR_STEPS,
  HORARIOS_TOUR_STEPS,
  LIGAS_TOUR_STEPS,
  MATERIALES_TOUR_STEPS,
  PASSWORD_TOUR_STEPS,
  PERFIL_TOUR_STEPS,
  RECUPERACIONES_TOUR_STEPS,
  TEMARIOS_TOUR_STEPS,
} from "./subpageTourSteps";

export const DOCENTE_TOUR_MODULES: DocenteTourModuleDefinition[] = [
  {
    id: "panel",
    path: "/docente",
    shortLabel: "Panel",
    label: "Panel docente",
    getSteps: () => PANEL_TOUR_STEPS,
  },
  {
    id: "materiales",
    path: "/docente/materiales",
    shortLabel: "Materiales",
    label: "Materiales",
    getSteps: () => MATERIALES_TOUR_STEPS,
  },
  {
    id: "horarios",
    path: "/docente/horarios",
    shortLabel: "Horarios",
    label: "Horarios",
    getSteps: () => HORARIOS_TOUR_STEPS,
  },
  {
    id: "temarios",
    path: "/docente/temarios",
    shortLabel: "Temarios",
    label: "Temarios",
    getSteps: () => TEMARIOS_TOUR_STEPS,
  },
  {
    id: "feedback",
    path: "/docente/feedback",
    shortLabel: "Feedback",
    label: "Feedback",
    getSteps: () => FEEDBACK_TOUR_STEPS,
  },
  {
    id: "gestion",
    path: "/docente/gestion-academica",
    shortLabel: "Gestión",
    label: "Gestión académica",
    getSteps: () => GESTION_TOUR_STEPS,
  },
  {
    id: "recuperaciones",
    path: "/docente/recuperaciones",
    shortLabel: "Recup.",
    label: "Recuperaciones",
    getSteps: () => RECUPERACIONES_TOUR_STEPS,
  },
  {
    id: "ligas",
    path: "/docente/ligas",
    shortLabel: "Ligas",
    label: "Ligas",
    getSteps: () => LIGAS_TOUR_STEPS,
  },
  {
    id: "perfil",
    path: "/docente/perfil",
    shortLabel: "Perfil",
    label: "Mi perfil",
    getSteps: () => PERFIL_TOUR_STEPS,
  },
  {
    id: "password",
    path: "/docente/cambiar-contrasena",
    shortLabel: "Clave",
    label: "Cambiar contraseña",
    getSteps: () => PASSWORD_TOUR_STEPS,
  },
];

const BY_ID = Object.fromEntries(DOCENTE_TOUR_MODULES.map((m) => [m.id, m])) as Record<
  DocenteTourModuleId,
  DocenteTourModuleDefinition
>;

/** Orden largo → corto para que /docente/materiales gane sobre /docente */
const SORTED_BY_PATH_LEN = [...DOCENTE_TOUR_MODULES].sort((a, b) => b.path.length - a.path.length);

export function normalizeDocentePath(pathname: string): string {
  if (!pathname) return "/";
  const t = pathname.replace(/\/+$/, "");
  return t === "" ? "/" : t;
}

/** Módulo cuya ruta coincide con la URL (incluye subrutas, p. ej. /materiales/crear) */
export function resolveDocenteTourModule(pathname: string): DocenteTourModuleDefinition | null {
  const p = normalizeDocentePath(pathname);
  for (const m of SORTED_BY_PATH_LEN) {
    if (p === m.path || p.startsWith(`${m.path}/`)) return m;
  }
  return null;
}

/** Solo rutas exactas: primera visita auto-inicia el tour de ese módulo */
export function docenteModuleForAutostart(pathname: string): DocenteTourModuleDefinition | null {
  const p = normalizeDocentePath(pathname);
  return DOCENTE_TOUR_MODULES.find((m) => m.path === p) ?? null;
}

export function getDocenteTourModuleById(id: DocenteTourModuleId): DocenteTourModuleDefinition | undefined {
  return BY_ID[id];
}
