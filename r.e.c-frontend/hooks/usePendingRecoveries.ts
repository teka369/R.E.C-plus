"use client";

import { useEffect, useState } from "react";
import { recoveryApi } from "@/lib/recoveryApi";

const REFRESH_MS = 60_000;

/**
 * Conteo de recuperaciones PENDING para el actor actual (backend).
 * Refresco periódico; ante error devuelve pending 0 sin romper la UI.
 */
export function usePendingRecoveries(): {
  pending: number;
  loading: boolean;
} {
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const { pending: n } = await recoveryApi.getPendingCount();
        if (!cancelled) setPending(n);
      } catch {
        if (!cancelled) setPending(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchCount();
    const id = setInterval(() => void fetchCount(), REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { pending, loading };
}
