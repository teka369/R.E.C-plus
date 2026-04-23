"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/hooks/useAuth";
import { DOCENTE_TOUR_MODULES, getDocenteTourModuleById, resolveDocenteTourModule } from "@/lib/docenteTour/modules";
import { getTourStepsForPath } from "@/lib/docenteTour/pathSteps";
import {
  clearTutorialInitialAutolaunchPending,
  isTutorialInitialAutolaunchPending,
} from "@/lib/onboarding/welcomeStorage";
import {
  loadDocenteTourProgress,
  loadGuideBarVisible,
  markDocenteTourModuleComplete,
  saveDocenteTourProgress,
  saveGuideBarVisible,
} from "@/lib/docenteTour/storage";
import {
  defsToDriveSteps,
  tourTargetsReady,
  type DocenteTourModuleId,
  type DocenteTourProgress,
  type TourStepDef,
} from "@/lib/docenteTour/types";

function speakTourLine(text: string, muted: boolean) {
  if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-CO";
  utter.rate = 0.98;
  utter.pitch = 1.02;
  const voices = window.speechSynthesis.getVoices();
  const esVoice =
    voices.find((v) => v.lang.startsWith("es-CO")) || voices.find((v) => v.lang.startsWith("es"));
  if (esVoice) utter.voice = esVoice;
  window.speechSynthesis.speak(utter);
}

export type DocenteTourContextValue = { 
  progress: DocenteTourProgress;
  percentComplete: number;
  completedCount: number;
  totalModules: number;
  /** Módulo asociado a la URL actual (incluye subrutas) */
  currentModule: ReturnType<typeof resolveDocenteTourModule>;
  /** Barra «Guía docente» visible fuera del panel; se controla desde /docente */
  guideBarVisible: boolean;
  setGuideBarVisible: (v: boolean) => void;
  replayCurrentModuleTour: () => void;
  startModuleTour: (id: DocenteTourModuleId) => void;
  /** Tour puntual (p. ej. modal) sin actualizar el progreso de módulos */
  runHelpTour: (steps: TourStepDef[]) => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
};

const DocenteTourContext = createContext<DocenteTourContextValue | null>(null);

export function useDocenteTour() {
  const ctx = useContext(DocenteTourContext);
  if (!ctx) throw new Error("useDocenteTour debe usarse dentro de DocenteTourProvider");
  return ctx;
}

export function useDocenteTourOptional() {
  return useContext(DocenteTourContext);
}

export function DocenteTourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [progress, setProgress] = useState<DocenteTourProgress>({});
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [guideBarVisible, setGuideBarVisibleState] = useState(true);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    setProgress(loadDocenteTourProgress());
    setGuideBarVisibleState(loadGuideBarVisible());
    setReady(true);
  }, []);

  const setGuideBarVisible = useCallback((v: boolean) => {
    setGuideBarVisibleState(v);
    saveGuideBarVisible(v);
  }, []);

  const destroyTour = useCallback(() => {
    window.speechSynthesis?.cancel();
    try {
      driverRef.current?.destroy();
    } catch {
      // noop
    }
    driverRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      destroyTour();
    };
  }, [pathname, destroyTour]);

  const persistComplete = useCallback((id: DocenteTourModuleId) => {
    setProgress((prev) => {
      const next = markDocenteTourModuleComplete(prev, id);
      saveDocenteTourProgress(next);
      return next;
    });
  }, []);

  const runTourWithSteps = useCallback(
    (moduleId: DocenteTourModuleId, stepDefs: TourStepDef[], opts?: { allowMarkComplete?: boolean }) => {
      const voices = stepDefs.map((s) => s.voice);
      const driveSteps = defsToDriveSteps(stepDefs);
      const allowMark = opts?.allowMarkComplete !== false;

      destroyTour();

      let attempts = 0;
      const maxAttempts = 32;

      const boot = () => {
        if (!tourTargetsReady(stepDefs)) {
          attempts += 1;
          if (attempts < maxAttempts) {
            window.setTimeout(boot, 260);
          }
          return;
        }

        const d = driver({
          animate: true,
          smoothScroll: true,
          stagePadding: 10,
          stageRadius: 12,
          overlayOpacity: 0.55,
          popoverClass: "recedu-driver-tour-popover",
          showProgress: true,
          showButtons: ["next", "previous", "close"],
          nextBtnText: "Siguiente →",
          prevBtnText: "← Anterior",
          doneBtnText: "Finalizar",
          progressText: "Paso {{current}} de {{total}}",
          onNextClick: (_element, _step, { driver: drv }) => {
            window.speechSynthesis?.cancel();
            drv.moveNext();
          },
          onPrevClick: (_element, _step, { driver: drv }) => {
            window.speechSynthesis?.cancel();
            drv.movePrevious();
          },
          onHighlighted: (_element, _step, { driver: drv }) => {
            const idx = drv.getActiveIndex() ?? 0;
            const line = voices[idx];
            if (line) speakTourLine(line, mutedRef.current);
          },
          onDestroyStarted: (_element, _step, { driver: drv }) => {
            window.speechSynthesis?.cancel();
            if (allowMark) {
              persistComplete(moduleId);
            }
            drv.destroy();
            driverRef.current = null;
          },
          steps: driveSteps,
        });

        driverRef.current = d;
        d.drive();
      };

      const scheduleVoices = () => {
        if (window.speechSynthesis?.getVoices().length) {
          window.setTimeout(boot, 450);
        } else {
          window.speechSynthesis?.addEventListener("voiceschanged", () => window.setTimeout(boot, 450), { once: true });
          window.setTimeout(boot, 1100);
        }
      };
      scheduleVoices();
    },
    [destroyTour, persistComplete],
  );

  const startModuleTour = useCallback(
    (id: DocenteTourModuleId) => {
      const def = getDocenteTourModuleById(id);
      if (!def) return;
      runTourWithSteps(id, def.getSteps(), { allowMarkComplete: true });
    },
    [runTourWithSteps],
  );

  const replayCurrentModuleTour = useCallback(() => {
    const resolved = getTourStepsForPath(pathname);
    if (!resolved) return;
    runTourWithSteps(resolved.moduleId, resolved.steps, { allowMarkComplete: true });
  }, [pathname, runTourWithSteps]);

  const runHelpTour = useCallback(
    (steps: TourStepDef[]) => {
      if (steps.length === 0) return;
      runTourWithSteps("panel", steps, { allowMarkComplete: false });
    },
    [runTourWithSteps],
  );

  useEffect(() => {
    if (!ready || !guideBarVisible) return;
    if (!user?.id || user.role !== "PROFESOR") return;
    if (!isTutorialInitialAutolaunchPending(user.id, "PROFESOR")) return;
    const resolved = getTourStepsForPath(pathname);
    if (!resolved) return;
    if (progressRef.current[resolved.moduleId]) return;
    const t = window.setTimeout(() => {
      if (progressRef.current[resolved.moduleId]) return;
      clearTutorialInitialAutolaunchPending(user.id, "PROFESOR");
      runTourWithSteps(resolved.moduleId, resolved.steps, { allowMarkComplete: true });
    }, 700);
    return () => window.clearTimeout(t);
  }, [pathname, ready, guideBarVisible, runTourWithSteps, user?.id, user?.role]);

  const completedCount = useMemo(
    () => DOCENTE_TOUR_MODULES.filter((m) => progress[m.id]).length,
    [progress],
  );
  const totalModules = DOCENTE_TOUR_MODULES.length;
  const percentComplete = totalModules === 0 ? 0 : Math.round((completedCount / totalModules) * 100);

  const currentModule = useMemo(() => resolveDocenteTourModule(pathname), [pathname]);

  const value = useMemo<DocenteTourContextValue>(
    () => ({
      progress,
      percentComplete,
      completedCount,
      totalModules,
      currentModule,
      guideBarVisible,
      setGuideBarVisible,
      replayCurrentModuleTour,
      startModuleTour,
      runHelpTour,
      muted,
      setMuted,
    }),
    [
      progress,
      percentComplete,
      completedCount,
      totalModules,
      currentModule,
      guideBarVisible,
      setGuideBarVisible,
      replayCurrentModuleTour,
      startModuleTour,
      runHelpTour,
      muted,
    ],
  );

  return <DocenteTourContext.Provider value={value}>{children}</DocenteTourContext.Provider>;
}
