const PREFIX = "recedu_welcome_modal_dismissed_v1";
const TOUR_INITIAL_AUTOLAUNCH_PREFIX = "recedu_tour_initial_autolaunch_pending_v1";

export type TutorialRole = "PROFESOR" | "ESTUDIANTE";

export function welcomeDismissedStorageKey(userId: string): string {
  return `${PREFIX}:${userId}`;
}

export function isWelcomeDismissed(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(welcomeDismissedStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function setWelcomeDismissed(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(welcomeDismissedStorageKey(userId), "1");
  } catch {
    // noop
  }
}

function tutorialInitialAutolaunchKey(userId: string, role: TutorialRole): string {
  return `${TOUR_INITIAL_AUTOLAUNCH_PREFIX}:${role}:${userId}`;
}

export function isTutorialInitialAutolaunchPending(userId: string, role: TutorialRole): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(tutorialInitialAutolaunchKey(userId, role)) === "1";
  } catch {
    return false;
  }
}

export function setTutorialInitialAutolaunchPending(userId: string, role: TutorialRole): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(tutorialInitialAutolaunchKey(userId, role), "1");
  } catch {
    // noop
  }
}

export function clearTutorialInitialAutolaunchPending(userId: string, role: TutorialRole): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(tutorialInitialAutolaunchKey(userId, role));
  } catch {
    // noop
  }
}
