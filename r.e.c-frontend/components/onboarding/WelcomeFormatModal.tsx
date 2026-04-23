"use client";

import { useAuth } from "@/hooks/useAuth";
import { toTutorialEmbedUrl } from "@/lib/onboarding/videoEmbed";
import { setTutorialInitialAutolaunchPending, setWelcomeDismissed } from "@/lib/onboarding/welcomeStorage";
import { saveGuideBarVisible as saveDocenteGuideBarVisible } from "@/lib/docenteTour/storage";
import { saveEstudianteGuideBarVisible } from "@/lib/estudianteTour/storage";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type WelcomeFormatVariant = "public" | "docente" | "estudiante";

type Props = {
  open: boolean;
  onClose: () => void;
  variant: WelcomeFormatVariant;
  /** Si hay usuario, al completar u omitir se persiste para no volver a mostrar el modal automático. */
  userId: string | null;
};

const videoUrl = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TUTORIAL_VIDEO_URL?.trim() ?? "" : "";

export default function WelcomeFormatModal({ open, onClose, variant, userId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [panel, setPanel] = useState<"menu" | "video">("menu");

  useEffect(() => {
    if (!open) setPanel("menu");
  }, [open]);

  const persistAndClose = useCallback(() => {
    if (userId) setWelcomeDismissed(userId);
    onClose();
  }, [userId, onClose]);

  const handleText = () => {
    const hash =
      variant === "estudiante"
        ? "#estudiante"
        : variant === "docente"
          ? "#docente"
          : user?.role === "ESTUDIANTE"
            ? "#estudiante"
            : user?.role === "SECRETARIA"
              ? "#secretaria"
              : "#docente";
    if (userId) setWelcomeDismissed(userId);
    onClose();
    router.push(`/tutorial${hash}`);
  };

  const handleInteractive = () => {
    const effectiveRole = variant === "docente" ? "PROFESOR" : variant === "estudiante" ? "ESTUDIANTE" : user?.role;

    if (effectiveRole === "PROFESOR") {
      saveDocenteGuideBarVisible(true);
      if (userId) setTutorialInitialAutolaunchPending(userId, "PROFESOR");
      if (userId) setWelcomeDismissed(userId);
      onClose();
      router.push("/docente");
      return;
    }
    if (effectiveRole === "ESTUDIANTE") {
      saveEstudianteGuideBarVisible(true);
      if (userId) setTutorialInitialAutolaunchPending(userId, "ESTUDIANTE");
      if (userId) setWelcomeDismissed(userId);
      onClose();
      router.push("/estudiante");
      return;
    }
    if (userId) setWelcomeDismissed(userId);
    onClose();
    router.push("/login");
  };

  const handleVideoOpen = () => {
    if (videoUrl) {
      setPanel("video");
      return;
    }
    if (userId) setWelcomeDismissed(userId);
    onClose();
    router.push("/tutorial#video");
  };

  const handleVideoDone = () => {
    persistAndClose();
  };

  if (!open) return null;

  const embedSrc = videoUrl ? toTutorialEmbedUrl(videoUrl) : "";

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-modal-title">
      <button
        type="button"
        className="absolute inset-0 bg-rec-text-primary/55 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={() => persistAndClose()}
      />
      <div className="relative z-[1] max-h-[min(92vh,840px)] w-full max-w-[720px] overflow-hidden rounded-3xl border border-rec-border-default bg-rec-bg-elevated shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-rec-border-subtle bg-gradient-to-r from-rec-primary/12 to-rec-bg-elevated px-5 py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rec-text-subtle">Bienvenida</p>
            <h2 id="welcome-modal-title" className="mt-1 text-lg font-black text-rec-text-primary md:text-xl">
              {panel === "menu" ? "Elige cómo quieres conocer la plataforma" : "Video tutorial"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => (panel === "video" ? setPanel("menu") : persistAndClose())}
            className="shrink-0 rounded-xl border border-rec-border-default bg-rec-bg-base px-3 py-1.5 text-sm font-semibold text-rec-text-secondary transition hover:bg-rec-bg-muted"
          >
            {panel === "video" ? "Volver" : "Cerrar"}
          </button>
        </div>

        <div className="max-h-[calc(min(92vh,840px)-88px)] overflow-y-auto px-5 py-5 md:px-6 md:py-6">
          {panel === "menu" ? (
            <>
              <p className="mb-5 text-sm leading-relaxed text-rec-text-secondary">
                Tres formas complementarias: lectura detallada, recorrido interactivo en el panel o vídeo. Puedes volver a este centro desde la página principal.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleText}
                  className="flex flex-col items-start rounded-2xl border border-rec-border-default bg-rec-bg-base p-4 text-left transition hover:border-rec-primary/40 hover:shadow-md"
                >
                  <span className="text-2xl" aria-hidden>
                    📖
                  </span>
                  <span className="mt-2 text-sm font-bold text-rec-text-primary">Guía de texto</span>
                  <span className="mt-1 text-xs leading-relaxed text-rec-text-muted">Manual con índice, capturas conceptuales y enlaces a cada pantalla.</span>
                </button>
                <button
                  type="button"
                  onClick={handleInteractive}
                  className="flex flex-col items-start rounded-2xl border-2 border-rec-primary/35 bg-rec-primary/5 p-4 text-left transition hover:border-rec-primary/55 hover:shadow-md"
                >
                  <span className="text-2xl" aria-hidden>
                    🎮
                  </span>
                  <span className="mt-2 text-sm font-bold text-rec-text-primary">Tutorial interactivo</span>
                  <span className="mt-1 text-xs leading-relaxed text-rec-text-muted">
                    {variant === "public" && user?.role !== "PROFESOR" && user?.role !== "ESTUDIANTE"
                      ? "Tras iniciar sesión como docente o estudiante, usa la barra de guía en el panel."
                      : "Activa la barra de guía y recorre la interfaz real paso a paso."}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleVideoOpen}
                  className="flex flex-col items-start rounded-2xl border border-rec-border-default bg-rec-bg-base p-4 text-left transition hover:border-rec-primary/40 hover:shadow-md"
                >
                  <span className="text-2xl" aria-hidden>
                    🎥
                  </span>
                  <span className="mt-2 text-sm font-bold text-rec-text-primary">Video tutorial</span>
                  <span className="mt-1 text-xs leading-relaxed text-rec-text-muted">
                    {videoUrl ? "Reproductor integrado con el recorrido en vídeo." : "Abre la sección de vídeo en el manual (o configura NEXT_PUBLIC_TUTORIAL_VIDEO_URL)."}
                  </span>
                </button>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rec-border-subtle pt-5">
                <button
                  type="button"
                  onClick={() => persistAndClose()}
                  className="text-sm font-semibold text-rec-text-muted underline-offset-2 hover:text-rec-text-primary hover:underline"
                >
                  Omitir por ahora
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {embedSrc ? (
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-rec-border-default bg-black shadow-inner">
                  <iframe
                    title="Video tutorial Recedu"
                    src={embedSrc}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : null}
              <p className="text-sm text-rec-text-secondary">
                Cuando termines, confirma abajo para no volver a ver este aviso automático en tu próximo acceso.
              </p>
              <button
                type="button"
                onClick={handleVideoDone}
                className="w-full rounded-2xl bg-rec-primary px-4 py-3 text-sm font-bold text-rec-text-on-media shadow-md transition hover:opacity-95 sm:w-auto"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
