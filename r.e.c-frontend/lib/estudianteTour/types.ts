import type { DriveStep } from "driver.js";

export type EstudianteTourModuleId =
  | "panel"
  | "materiales"
  | "temarios"
  | "ligas"
  | "horario"
  | "feedback"
  | "gestion"
  | "recuperaciones"
  | "password";

export type EstudianteTourProgress = Partial<Record<EstudianteTourModuleId, boolean>>;

export type TourStepDef = {
  selector?: string;
  popover: NonNullable<DriveStep["popover"]>;
  voice: string;
};

export type EstudianteTourModuleDefinition = {
  id: EstudianteTourModuleId;
  path: string;
  shortLabel: string;
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
