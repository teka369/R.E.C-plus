"use client";

import { useDocenteTour } from "./DocenteTourProvider";

export default function DocenteGuideBarPreferenceCard() {
  const { guideBarVisible, setGuideBarVisible, replayCurrentModuleTour } = useDocenteTour();

  return (
    <section
      id="tour-docente-guia-preferencias"
      className="rounded-2xl border border-rec-border-default bg-rec-bg-elevated p-4 shadow-sm sm:p-5"
      aria-labelledby="docente-guia-bar-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 id="docente-guia-bar-heading" className="text-base font-bold text-rec-text-primary">
            Barra «Guía docente»
          </h2>
          <p className="text-sm text-rec-text-secondary">
            Actívala para ver la barra al pie en materiales, temarios, formularios y el resto: progreso por sección, «Ver guía otra vez» y la visita guiada la primera vez en cada módulo. Si la desactivas, solo desde esta tarjeta (al final del panel) puedes volver a mostrarla.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-rec-border-default bg-rec-bg-base px-3 py-2.5 sm:min-w-[220px]">
            <span className="text-sm font-medium text-rec-text-primary">Mostrar barra</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-rec-border-strong text-rec-primary focus:ring-rec-primary"
              checked={guideBarVisible}
              onChange={(e) => setGuideBarVisible(e.target.checked)}
            />
          </label>
          <button
            type="button"
            onClick={() => replayCurrentModuleTour()}
            className="rounded-xl border border-rec-border-default bg-rec-bg-muted px-3 py-2 text-xs font-semibold text-rec-text-secondary transition hover:bg-rec-bg-subtle"
          >
            Ver guía del panel ahora
          </button>
        </div>
      </div>
      {!guideBarVisible ? (
        <p className="mt-3 text-xs text-rec-text-subtle">
          Con la barra oculta no verás chips ni «Ver guía otra vez» en otras pantallas. Esta tarjeta sigue disponible siempre que vuelvas al panel.
        </p>
      ) : null}
    </section>
  );
}
