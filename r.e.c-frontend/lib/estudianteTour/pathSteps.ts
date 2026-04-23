import type { EstudianteTourModuleId, TourStepDef } from "./types";
import { normalizeEstudiantePath, resolveEstudianteTourModule } from "./modules";
import { PANEL_TOUR_STEPS } from "./panelTourSteps";
import {
  EST_FEEDBACK_TOUR_STEPS,
  EST_GESTION_TOUR_STEPS,
  EST_HORARIO_TOUR_STEPS,
  EST_LIGAS_TOUR_STEPS,
  EST_MATERIALES_TOUR_STEPS,
  EST_PASSWORD_TOUR_STEPS,
  EST_RECUPERACIONES_TOUR_STEPS,
  EST_TEMARIO_DETALLE_STEPS,
  EST_TEMARIOS_TOUR_STEPS,
} from "./subpageTourSteps";

export function getEstudianteTourStepsForPath(pathname: string): {
  moduleId: EstudianteTourModuleId;
  steps: TourStepDef[];
} | null {
  const p = normalizeEstudiantePath(pathname);

  if (p === "/estudiante") {
    return { moduleId: "panel", steps: PANEL_TOUR_STEPS };
  }

  if (p === "/estudiante/materiales") {
    return { moduleId: "materiales", steps: EST_MATERIALES_TOUR_STEPS };
  }

  if (p.startsWith("/estudiante/temarios/")) {
    const seg = p.slice("/estudiante/temarios/".length).split("/")[0] ?? "";
    if (seg && /^\d+$/.test(seg)) {
      return { moduleId: "temarios", steps: EST_TEMARIO_DETALLE_STEPS };
    }
  }
  if (p === "/estudiante/temarios") {
    return { moduleId: "temarios", steps: EST_TEMARIOS_TOUR_STEPS };
  }

  if (p === "/estudiante/ligas") {
    return { moduleId: "ligas", steps: EST_LIGAS_TOUR_STEPS };
  }
  if (p === "/estudiante/horario") {
    return { moduleId: "horario", steps: EST_HORARIO_TOUR_STEPS };
  }
  if (p === "/estudiante/feedback") {
    return { moduleId: "feedback", steps: EST_FEEDBACK_TOUR_STEPS };
  }
  if (p === "/estudiante/gestion-academica") {
    return { moduleId: "gestion", steps: EST_GESTION_TOUR_STEPS };
  }
  if (p === "/estudiante/recuperaciones") {
    return { moduleId: "recuperaciones", steps: EST_RECUPERACIONES_TOUR_STEPS };
  }
  if (p === "/estudiante/cambiar-contrasena") {
    return { moduleId: "password", steps: EST_PASSWORD_TOUR_STEPS };
  }

  const mod = resolveEstudianteTourModule(pathname);
  if (!mod) return null;
  return { moduleId: mod.id, steps: mod.getSteps() };
}
