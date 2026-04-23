import type { DriveStep } from "driver.js";

export type DocenteTourModuleId =
  | "panel"
  | "materiales"
  | "horarios"
  | "temarios"
  | "feedback"
  | "gestion"
  | "recuperaciones"
  | "ligas"
  | "perfil"
  | "password";

export type DocenteTourProgress = Partial<Record<DocenteTourModuleId, boolean>>;

export type TourStepDef = {
  selector?: string;
  popover: NonNullable<DriveStep["popover"]>;
  voice: string;
};

export type DocenteTourModuleDefinition = {
  id: DocenteTourModuleId;
  /** Ruta exacta donde el tour se inicia solo la primera vez (auto) */
  path: string;
  /** Etiqueta corta en la barra de progreso */
  shortLabel: string;
  /** Título legible */
  label: string;
  getSteps: () => TourStepDef[];
};

export function defsToDriveSteps(defs: TourStepDef[]): DriveStep[] {
  return defs.map((def) => {
    const step: DriveStep = { popover: def.popover };
    if (def.selector) step.element = def.selector;
    return step;
  });
}

export function tourTargetsReady(defs: TourStepDef[]): boolean {
  return defs.every((def) => {
    if (!def.selector) return true;
    return Boolean(document.querySelector(def.selector));
  });
}
