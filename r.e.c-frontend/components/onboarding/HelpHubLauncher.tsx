"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, type SVGProps } from "react";
import WelcomeFormatModal from "./WelcomeFormatModal";

type Props = {
  className?: string;
  /** Estilo del botón en el hero (sobre imagen / vídeo). */
  tone?: "onMedia" | "subtle";
};

export default function HelpHubLauncher({ className = "", tone = "onMedia" }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const persistUserId =
    user?.role === "PROFESOR" || user?.role === "ESTUDIANTE" ? user.id : null;

  const base =
    tone === "onMedia"
      ? "border-rec-text-on-media/45 bg-rec-bg-elevated/12 text-rec-text-on-media hover:bg-rec-bg-elevated/22"
      : "border-rec-border-default bg-rec-bg-elevated text-rec-text-primary hover:bg-rec-bg-muted";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:scale-[1.02] ${base} ${className}`}
      >
        <IconLifeBuoy className="h-4 w-4 shrink-0" />
        Centro de ayuda
      </button>
      <WelcomeFormatModal open={open} onClose={() => setOpen(false)} variant="public" userId={persistUserId} />
    </>
  );
}

function IconLifeBuoy(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="m4.93 4.93 4.24 4.24m10.83 10.83 4.24 4.24M4.93 19.07l4.24-4.24m10.83-10.83 4.24-4.24" />
    </svg>
  );
}
