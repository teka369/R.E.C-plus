import type { DocenteTourModuleId, TourStepDef } from "./types";
import { normalizeDocentePath, resolveDocenteTourModule } from "./modules";
import { PANEL_TOUR_STEPS } from "./panelTourSteps";
import {
  MATERIALES_CREAR_STEPS,
  MATERIALES_EDITAR_STEPS,
  MATERIALES_TOUR_STEPS,
  PASSWORD_TOUR_STEPS,
  PERFIL_TOUR_STEPS,
  TEMARIO_DETALLE_STEPS,
  TEMARIOS_TOUR_STEPS,
} from "./subpageTourSteps";

/** Pasos del tour y módulo de progreso para la ruta actual (subpáginas antes que listados). */
export function getTourStepsForPath(pathname: string): {
  moduleId: DocenteTourModuleId;
  steps: TourStepDef[];
} | null {
  const p = normalizeDocentePath(pathname);

  if (p === "/docente") {
    return { moduleId: "panel", steps: PANEL_TOUR_STEPS };
  }

  if (p.startsWith("/docente/materiales/editar/")) {
    const rest = p.slice("/docente/materiales/editar/".length);
    if (rest && !rest.includes("/")) {
      return { moduleId: "materiales", steps: MATERIALES_EDITAR_STEPS };
    }
  }
  if (p === "/docente/materiales/crear") {
    return { moduleId: "materiales", steps: MATERIALES_CREAR_STEPS };
  }
  if (p === "/docente/materiales") {
    return { moduleId: "materiales", steps: MATERIALES_TOUR_STEPS };
  }

  if (p.startsWith("/docente/temarios/")) {
    const seg = p.slice("/docente/temarios/".length).split("/")[0] ?? "";
    if (seg && /^\d+$/.test(seg)) {
      return { moduleId: "temarios", steps: TEMARIO_DETALLE_STEPS };
    }
  }
  if (p === "/docente/temarios") {
    return { moduleId: "temarios", steps: TEMARIOS_TOUR_STEPS };
  }

  if (p === "/docente/perfil") {
    return { moduleId: "perfil", steps: PERFIL_TOUR_STEPS };
  }
  if (p === "/docente/cambiar-contrasena") {
    return { moduleId: "password", steps: PASSWORD_TOUR_STEPS };
  }

  const mod = resolveDocenteTourModule(pathname);
  if (!mod) return null;
  return { moduleId: mod.id, steps: mod.getSteps() };
}
