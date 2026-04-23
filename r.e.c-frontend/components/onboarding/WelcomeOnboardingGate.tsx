"use client";

import { useAuth } from "@/hooks/useAuth";
import { isWelcomeDismissed } from "@/lib/onboarding/welcomeStorage";
import { useEffect, useState } from "react";
import WelcomeFormatModal from "./WelcomeFormatModal";

export default function WelcomeOnboardingGate({ role }: { role: "PROFESOR" | "ESTUDIANTE" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user?.id || user.role !== role) return;
    if (isWelcomeDismissed(user.id)) return;
    const t = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(t);
  }, [user?.id, user?.role, role]);

  const variant = role === "PROFESOR" ? "docente" : "estudiante";

  return <WelcomeFormatModal open={open} onClose={() => setOpen(false)} variant={variant} userId={user?.id ?? null} />;
}
