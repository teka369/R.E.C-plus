import type { EstudianteTourModuleDefinition, EstudianteTourModuleId } from "./types";
import { PANEL_TOUR_STEPS } from "./panelTourSteps";
import {
  EST_FEEDBACK_TOUR_STEPS,
  EST_GESTION_TOUR_STEPS,
  EST_HORARIO_TOUR_STEPS,
  EST_LIGAS_TOUR_STEPS,
  EST_MATERIALES_TOUR_STEPS,
  EST_PASSWORD_TOUR_STEPS,
  EST_RECUPERACIONES_TOUR_STEPS,
  EST_TEMARIOS_TOUR_STEPS,
} from "./subpageTourSteps";

export const ESTUDIANTE_TOUR_MODULES: EstudianteTourModuleDefinition[] = [
  {
    id: "panel",
    path: "/estudiante",
    shortLabel: "Panel",
    label: "Panel estudiante",
    getSteps: () => PANEL_TOUR_STEPS,
  },
  {
    id: "materiales",
    path: "/estudiante/materiales",
    shortLabel: "Materiales",
    label: "Materiales",
    getSteps: () => EST_MATERIALES_TOUR_STEPS,
  },
  {
    id: "temarios",
    path: "/estudiante/temarios",
    shortLabel: "Temarios",
    label: "Temarios",
    getSteps: () => EST_TEMARIOS_TOUR_STEPS,
  },
  {
    id: "ligas",
    path: "/estudiante/ligas",
    shortLabel: "Ligas",
    label: "Ligas",
    getSteps: () => EST_LIGAS_TOUR_STEPS,
  },
  {
    id: "horario",
    path: "/estudiante/horario",
    shortLabel: "Horario",
    label: "Horario",
    getSteps: () => EST_HORARIO_TOUR_STEPS,
  },
  {
    id: "feedback",
    path: "/estudiante/feedback",
    shortLabel: "Feedback",
    label: "Feedback",
    getSteps: () => EST_FEEDBACK_TOUR_STEPS,
  },
  {
    id: "gestion",
    path: "/estudiante/gestion-academica",
    shortLabel: "Gestión",
    label: "Gestión académica",
    getSteps: () => EST_GESTION_TOUR_STEPS,
  },
  {
    id: "recuperaciones",
    path: "/estudiante/recuperaciones",
    shortLabel: "Recup.",
    label: "Recuperaciones",
    getSteps: () => EST_RECUPERACIONES_TOUR_STEPS,
  },
  {
    id: "password",
    path: "/estudiante/cambiar-contrasena",
    shortLabel: "Clave",
    label: "Cambiar contraseña",
    getSteps: () => EST_PASSWORD_TOUR_STEPS,
  },
];

const BY_ID = Object.fromEntries(ESTUDIANTE_TOUR_MODULES.map((m) => [m.id, m])) as Record<
  EstudianteTourModuleId,
  EstudianteTourModuleDefinition
>;

const SORTED_BY_PATH_LEN = [...ESTUDIANTE_TOUR_MODULES].sort((a, b) => b.path.length - a.path.length);

export function normalizeEstudiantePath(pathname: string): string {
  if (!pathname) return "/";
  const t = pathname.replace(/\/+$/, "");
  return t === "" ? "/" : t;
}

export function resolveEstudianteTourModule(pathname: string): EstudianteTourModuleDefinition | null {
  const p = normalizeEstudiantePath(pathname);
  for (const m of SORTED_BY_PATH_LEN) {
    if (p === m.path || p.startsWith(`${m.path}/`)) return m;
  }
  return null;
}

export function getEstudianteTourModuleById(id: EstudianteTourModuleId): EstudianteTourModuleDefinition | undefined {
  return BY_ID[id];
}
