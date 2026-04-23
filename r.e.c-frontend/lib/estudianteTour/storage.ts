import type { EstudianteTourModuleId, EstudianteTourProgress } from "./types";

const PROGRESS_KEY = "recedu_estudiante_tour_progress_v1";
const GUIDE_BAR_VISIBLE_KEY = "recedu_estudiante_guide_bar_visible_v1";

const EMPTY: EstudianteTourProgress = {};

export function loadEstudianteTourProgress(): EstudianteTourProgress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EstudianteTourProgress;
      return typeof parsed === "object" && parsed !== null ? parsed : EMPTY;
    }
  } catch {
    // noop
  }
  return EMPTY;
}

export function saveEstudianteTourProgress(progress: EstudianteTourProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // noop
  }
}

export function markEstudianteTourModuleComplete(
  progress: EstudianteTourProgress,
  moduleId: EstudianteTourModuleId,
): EstudianteTourProgress {
  return { ...progress, [moduleId]: true };
}

export function loadEstudianteGuideBarVisible(): boolean {
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

export function saveEstudianteGuideBarVisible(visible: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUIDE_BAR_VISIBLE_KEY, visible ? "1" : "0");
  } catch {
    // noop
  }
}
