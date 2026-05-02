"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  joinRecovery: (requestId: number) => void;
  leaveRecovery: (requestId: number) => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

/**
 * URL base HTTP(S) para socket.io (mismo host que la API). No usar ws:// ni wss:// aquí.
 * NEXT_PUBLIC_* se inyecta en build; el fallback a window solo aplica en el navegador.
 */
function resolveSocketBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  if (raw.length > 0 && /^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

async function fetchAccessTokenForSocket(): Promise<string | null> {
  const res = await fetch("/api/auth/session?socket=1", { credentials: "same-origin" });
  const data = (await res.json()) as { ok?: boolean; accessToken?: string };
  if (!data?.ok || typeof data.accessToken !== "string") return null;
  const jwt = data.accessToken.trim();
  return jwt.length > 0 ? jwt : null;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;

    const socketBaseUrl = resolveSocketBaseUrl();
    if (!socketBaseUrl) {
      setIsConnected(false);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      let jwt: string | null = null;
      if (token && token !== "cookie") {
        jwt = token;
      } else {
        try {
          jwt = await fetchAccessTokenForSocket();
        } catch {
          jwt = null;
        }
      }

      if (cancelled || !jwt) {
        if (!cancelled) setIsConnected(false);
        return;
      }

      const s = io(`${socketBaseUrl}/app`, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        auth: { token: jwt },
        query: { token: jwt },
      });

      if (cancelled) {
        s.removeAllListeners();
        s.disconnect();
        return;
      }

      socket = s;
      socketRef.current = s;

      s.on("connect", () => setIsConnected(true));
      s.on("disconnect", () => setIsConnected(false));
      s.on("connect_error", () => setIsConnected(false));
    })();

    return () => {
      cancelled = true;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  const joinRecovery = useCallback((requestId: number) => {
    if (!requestId || !socketRef.current) return;
    socketRef.current.emit("joinRecovery", { requestId });
  }, []);

  const leaveRecovery = useCallback((requestId: number) => {
    if (!requestId || !socketRef.current) return;
    socketRef.current.emit("leaveRecovery", { requestId });
  }, []);

  const value: SocketContextValue = {
    socket: socketRef.current,
    isConnected,
    joinRecovery,
    leaveRecovery,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used within SocketProvider");
  return ctx;
}
