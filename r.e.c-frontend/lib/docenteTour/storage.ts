import type { DocenteTourModuleId, DocenteTourProgress } from "./types";

const PROGRESS_KEY = "recedu_docente_tour_progress_v1";
/** Si es "0", la barra «Guía docente» no se muestra fuera del panel (se controla solo desde /docente). */
const GUIDE_BAR_VISIBLE_KEY = "recedu_docente_guide_bar_visible_v1";
/** Tour monolítico anterior: migra solo el panel como completado */
const LEGACY_PANEL_KEY = "recedu_docente_onboarding_full_v1";

const EMPTY: DocenteTourProgress = {};

export function loadDocenteTourProgress(): DocenteTourProgress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DocenteTourProgress;
      return typeof parsed === "object" && parsed !== null ? parsed : EMPTY;
    }
    if (localStorage.getItem(LEGACY_PANEL_KEY) === "true") {
      const migrated: DocenteTourProgress = { panel: true };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // noop
  }
  return EMPTY;
}

export function saveDocenteTourProgress(progress: DocenteTourProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // noop
  }
}

export function markDocenteTourModuleComplete(
  progress: DocenteTourProgress,
  moduleId: DocenteTourModuleId,
): DocenteTourProgress {
  return { ...progress, [moduleId]: true };
}

export function loadGuideBarVisible(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(GUIDE_BAR_VISIBLE_KEY);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    // noop
  }
  return true;
}

export function saveGuideBarVisible(visible: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUIDE_BAR_VISIBLE_KEY, visible ? "1" : "0");
  } catch {
    // noop
  }
}
