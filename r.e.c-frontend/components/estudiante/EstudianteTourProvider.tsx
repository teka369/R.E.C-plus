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
import {
  ESTUDIANTE_TOUR_MODULES,
  getEstudianteTourModuleById,
  resolveEstudianteTourModule,
} from "@/lib/estudianteTour/modules";
import { getEstudianteTourStepsForPath } from "@/lib/estudianteTour/pathSteps";
import {
  clearTutorialInitialAutolaunchPending,
  isTutorialInitialAutolaunchPending,
} from "@/lib/onboarding/welcomeStorage";
import {
  loadEstudianteGuideBarVisible,
  loadEstudianteTourProgress,
  markEstudianteTourModuleComplete,
  saveEstudianteGuideBarVisible,
  saveEstudianteTourProgress,
} from "@/lib/estudianteTour/storage";
import {
  defsToDriveSteps,
  tourTargetsReady,
  type EstudianteTourModuleId,
  type EstudianteTourProgress,
  type TourStepDef,
} from "@/lib/estudianteTour/types";

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

export type EstudianteTourContextValue = {
  progress: EstudianteTourProgress;
  percentComplete: number;
  completedCount: number;
  totalModules: number;
  currentModule: ReturnType<typeof resolveEstudianteTourModule>;
  guideBarVisible: boolean;
  setGuideBarVisible: (v: boolean) => void;
  replayCurrentModuleTour: () => void;
  startModuleTour: (id: EstudianteTourModuleId) => void;
  runHelpTour: (steps: TourStepDef[]) => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
};

const EstudianteTourContext = createContext<EstudianteTourContextValue | null>(null);

export function useEstudianteTour() {
  const ctx = useContext(EstudianteTourContext);
  if (!ctx) throw new Error("useEstudianteTour debe usarse dentro de EstudianteTourProvider");
  return ctx;
}

export function useEstudianteTourOptional() {
  return useContext(EstudianteTourContext);
}

export function EstudianteTourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [progress, setProgress] = useState<EstudianteTourProgress>({});
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [guideBarVisible, setGuideBarVisibleState] = useState(true);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    setProgress(loadEstudianteTourProgress());
    setGuideBarVisibleState(loadEstudianteGuideBarVisible());
    setReady(true);
  }, []);

  const setGuideBarVisible = useCallback((v: boolean) => {
    setGuideBarVisibleState(v);
    saveEstudianteGuideBarVisible(v);
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

  const persistComplete = useCallback((id: EstudianteTourModuleId) => {
    setProgress((prev) => {
      const next = markEstudianteTourModuleComplete(prev, id);
      saveEstudianteTourProgress(next);
      return next;
    });
  }, []);

  const runTourWithSteps = useCallback(
    (moduleId: EstudianteTourModuleId, stepDefs: TourStepDef[], opts?: { allowMarkComplete?: boolean }) => {
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
    (id: EstudianteTourModuleId) => {
      const def = getEstudianteTourModuleById(id);
      if (!def) return;
      runTourWithSteps(id, def.getSteps(), { allowMarkComplete: true });
    },
    [runTourWithSteps],
  );

  const replayCurrentModuleTour = useCallback(() => {
    const resolved = getEstudianteTourStepsForPath(pathname);
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
    if (!user?.id || user.role !== "ESTUDIANTE") return;
    if (!isTutorialInitialAutolaunchPending(user.id, "ESTUDIANTE")) return;
    const resolved = getEstudianteTourStepsForPath(pathname);
    if (!resolved) return;
    if (progressRef.current[resolved.moduleId]) return;
    const t = window.setTimeout(() => {
      if (progressRef.current[resolved.moduleId]) return;
      clearTutorialInitialAutolaunchPending(user.id, "ESTUDIANTE");
      runTourWithSteps(resolved.moduleId, resolved.steps, { allowMarkComplete: true });
    }, 700);
    return () => window.clearTimeout(t);
  }, [pathname, ready, guideBarVisible, runTourWithSteps, user?.id, user?.role]);

  const completedCount = useMemo(
    () => ESTUDIANTE_TOUR_MODULES.filter((m) => progress[m.id]).length,
    [progress],
  );
  const totalModules = ESTUDIANTE_TOUR_MODULES.length;
  const percentComplete = totalModules === 0 ? 0 : Math.round((completedCount / totalModules) * 100);

  const currentModule = useMemo(() => resolveEstudianteTourModule(pathname), [pathname]);

  const value = useMemo<EstudianteTourContextValue>(
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

  return <EstudianteTourContext.Provider value={value}>{children}</EstudianteTourContext.Provider>;
}
