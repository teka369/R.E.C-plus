"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { recoverySettingsApi, type RecoveryConfig } from "@/lib/recoverySettingsApi";

const STORAGE_POS = "rec_recovery_banner_pos";
const STORAGE_OPEN = "rec_recovery_banner_open";
const REFRESH_MS = 60_000;
const DRAG_THRESHOLD_PX = 4;
const EDGE_PAD = 16;

type BannerPos = { x: number; y: number };

function readStoredPos(): BannerPos | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_POS);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (
      typeof p === "object" &&
      p !== null &&
      "x" in p &&
      "y" in p &&
      typeof (p as BannerPos).x === "number" &&
      typeof (p as BannerPos).y === "number"
    ) {
      return { x: (p as BannerPos).x, y: (p as BannerPos).y };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readStoredOpen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_OPEN) === "true";
  } catch {
    return false;
  }
}

function clampPos(
  x: number,
  y: number,
  w: number,
  h: number,
  vw: number,
  vh: number,
): BannerPos {
  const maxX = Math.max(EDGE_PAD, vw - w - EDGE_PAD);
  const maxY = Math.max(EDGE_PAD, vh - h - EDGE_PAD);
  return {
    x: Math.min(Math.max(EDGE_PAD, x), maxX),
    y: Math.min(Math.max(EDGE_PAD, y), maxY),
  };
}

function defaultBottomRight(w: number, h: number, vw: number, vh: number): BannerPos {
  return clampPos(vw - w - EDGE_PAD, vh - h - EDGE_PAD, w, h, vw, vh);
}

function fmtEndAt(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function recoveryPathForRole(role: string | undefined): string {
  if (role === "PROFESOR") return "/docente/recuperaciones";
  if (role === "ESTUDIANTE") return "/estudiante/recuperaciones";
  if (role === "SECRETARIA") return "/secretaria/recuperaciones";
  return "/";
}

/** Sin sesión en estas rutas: no llamar al API (evita 401 + ruido en consola). */
function isPublicAccessPath(pathname: string): boolean {
  const p = pathname || "/";
  if (p === "/login" || p.startsWith("/login/")) return true;
  if (p === "/forgot-password" || p.startsWith("/forgot-password/")) return true;
  if (p === "/reset-password" || p.startsWith("/reset-password/")) return true;
  if (p === "/acceso-secretaria" || p.startsWith("/acceso-secretaria/")) return true;
  if (p === "/") return true;
  if (p.startsWith("/Informacion")) return true;
  if (p.startsWith("/Contacto")) return true;
  if (p.startsWith("/tutorial")) return true;
  if (p.startsWith("/portafolio")) return true;
  if (p.startsWith("/materiales")) return true;
  return false;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="button"]'),
  );
}

function pointInsideEl(el: HTMLElement, clientX: number, clientY: number): boolean {
  const r = el.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

type DragSession = {
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
};

export default function RecoveryCountdownBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [config, setConfig] = useState<RecoveryConfig | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState<BannerPos | null>(null);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const dragMovedRef = useRef(false);
  const expandedRef = useRef(false);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    if (isPublicAccessPath(pathname)) {
      setConfig(null);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const c = await recoverySettingsApi.getConfig();
        if (!cancelled) setConfig(c);
      } catch {
        if (!cancelled) setConfig(null);
      }
    }
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pathname]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setExpanded(readStoredOpen());
  }, []);

  const visible = useMemo(() => {
    if (!config?.active || config.endAt == null) return false;
    const endMs = new Date(config.endAt).getTime();
    return Number.isFinite(endMs) && endMs > nowMs;
  }, [config, nowMs]);

  const applyPositionFromMeasurements = useCallback(() => {
    const el = rootRef.current;
    if (!el || typeof window === "undefined") return;
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const stored = readStoredPos();
    if (stored) {
      setPosition(clampPos(stored.x, stored.y, w, h, vw, vh));
    } else {
      setPosition(defaultBottomRight(w, h, vw, vh));
    }
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    applyPositionFromMeasurements();
  }, [visible, expanded, applyPositionFromMeasurements]);

  useEffect(() => {
    if (!visible) return;
    function onResize() {
      const el = rootRef.current;
      if (!el || typeof window === "undefined") return;
      const rect = el.getBoundingClientRect();
      setPosition((prev) => {
        if (!prev) return prev;
        return clampPos(prev.x, prev.y, rect.width, rect.height, window.innerWidth, window.innerHeight);
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visible]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_OPEN, expanded ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [expanded]);

  const persistPos = useCallback((p: BannerPos) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_POS, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }, []);

  const endPointerSession = useCallback(
    (e: MouseEvent | TouchEvent, endClientX: number, endClientY: number) => {
      const moved = dragMovedRef.current;
      const root = rootRef.current;
      dragSessionRef.current = null;
      setDragging(false);

      setPosition((prev) => {
        if (prev) persistPos(prev);
        return prev;
      });

      if (
        !expandedRef.current &&
        !moved &&
        root &&
        (pointInsideEl(root, endClientX, endClientY) ||
          (e.target instanceof Node && root.contains(e.target))) &&
        !isInteractiveTarget(e.target)
      ) {
        setExpanded(true);
      }
    },
    [persistPos],
  );

  const startDragMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;
    const pos = position;
    if (pos == null) return;
    dragMovedRef.current = false;
    dragSessionRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
    setDragging(true);

    const onMove = (ev: MouseEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;
      const dx = ev.clientX - session.startClientX;
      const dy = ev.clientY - session.startClientY;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) dragMovedRef.current = true;
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = session.originX + dx;
      const ny = session.originY + dy;
      setPosition(
        clampPos(nx, ny, rect.width, rect.height, window.innerWidth, window.innerHeight),
      );
    };

    const onUp = (ev: MouseEvent) => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      endPointerSession(ev, ev.clientX, ev.clientY);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [position, endPointerSession]);

  const startDragTouch = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isInteractiveTarget(e.target)) return;
      const pos = position;
      if (pos == null || e.touches.length === 0) return;
      const t = e.touches[0];
      dragMovedRef.current = false;
      dragSessionRef.current = {
        startClientX: t.clientX,
        startClientY: t.clientY,
        originX: pos.x,
        originY: pos.y,
      };
      setDragging(true);

      const onMove = (ev: TouchEvent) => {
        const session = dragSessionRef.current;
        if (!session || ev.touches.length === 0) return;
        const tt = ev.touches[0];
        const dx = tt.clientX - session.startClientX;
        const dy = tt.clientY - session.startClientY;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) dragMovedRef.current = true;
        const el = rootRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const nx = session.originX + dx;
        const ny = session.originY + dy;
        setPosition(
          clampPos(nx, ny, rect.width, rect.height, window.innerWidth, window.innerHeight),
        );
      };

      const onEnd = (ev: TouchEvent) => {
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
        document.removeEventListener("touchcancel", onEnd);
        const last = ev.changedTouches[0];
        const cx = last ? last.clientX : 0;
        const cy = last ? last.clientY : 0;
        endPointerSession(ev, cx, cy);
      };

      document.addEventListener("touchmove", onMove, { passive: true });
      document.addEventListener("touchend", onEnd);
      document.addEventListener("touchcancel", onEnd);
    },
    [position, endPointerSession],
  );

  const collapse = useCallback(() => setExpanded(false), []);

  const goRecoveries = useCallback(() => {
    router.push(recoveryPathForRole(user?.role));
  }, [router, user?.role]);

  const remainingParts = useMemo(() => {
    if (!config?.endAt) return null;
    const endMs = new Date(config.endAt).getTime();
    const remaining = Math.max(0, endMs - nowMs);
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    const compact = days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
    return { days, hours, minutes, seconds, compact };
  }, [config?.endAt, nowMs]);

  if (!visible || !config?.endAt || remainingParts == null) return null;

  const stylePos: CSSProperties =
    position != null
      ? { position: "fixed", left: position.x, top: position.y, zIndex: 50 }
      : { position: "fixed", left: -9999, top: -9999, zIndex: 50, visibility: "hidden" };

  const cursorClass = dragging ? "cursor-grabbing" : "cursor-grab";

  return (
    <div
      ref={rootRef}
      style={stylePos}
      className={`select-none shadow-xl shadow-rec-primary/25 transition-all duration-300 ease-out ${cursorClass} ${
        expanded ? "w-[280px] rounded-2xl bg-rec-primary-strong text-rec-text-on-media" : "rounded-full bg-rec-primary-strong text-rec-text-on-media hover:bg-rec-primary-strong"
      }`}
      onMouseDown={startDragMouse}
      onTouchStart={startDragTouch}
      role="presentation"
    >
      {!expanded ? (
        <div className="flex max-w-[min(100vw-2rem,22rem)] items-center gap-2 px-4 py-2.5 text-xs font-medium">
          <span
            className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-rec-primary"
            aria-hidden
          />
          <span className="min-w-0 leading-snug">
            Recuperaciones ·{" "}
            <span className="font-mono tabular-nums">{remainingParts.compact}</span>
          </span>
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-2xl">
          <div className="flex items-start justify-between gap-2 border-b border-rec-primary/50 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rec-primary" aria-hidden />
              <span>Período activo</span>
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                collapse();
              }}
              className="cursor-default rounded-md p-1 text-lg leading-none text-rec-text-on-media/90 hover:bg-rec-primary/80"
              aria-label="Cerrar panel"
            >
              ×
            </button>
          </div>
          <div className="px-3 py-4 text-center">
            <div className="grid grid-cols-4 gap-1 text-rec-text-on-media">
              <div>
                <div className="text-2xl font-bold tabular-nums leading-tight">
                  {String(remainingParts.days).padStart(2, "0")}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-rec-text-on-media/90">
                  días
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums leading-tight">
                  {String(remainingParts.hours).padStart(2, "0")}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-rec-text-on-media/90">
                  hrs
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums leading-tight">
                  {String(remainingParts.minutes).padStart(2, "0")}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-rec-text-on-media/90">
                  min
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums leading-tight">
                  {String(remainingParts.seconds).padStart(2, "0")}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-rec-text-on-media/90">
                  seg
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-rec-text-on-media/95">
              Cierra el {fmtEndAt(config.endAt)}
            </p>
          </div>
          <div className="border-t border-rec-primary/40 bg-rec-primary-strong/55 px-3 py-2.5">
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                goRecoveries();
              }}
              className="w-full cursor-default rounded-xl bg-rec-bg-elevated/10 px-3 py-2 text-center text-sm font-semibold text-rec-text-on-media transition hover:bg-rec-bg-elevated/20"
            >
              → Ver recuperaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
