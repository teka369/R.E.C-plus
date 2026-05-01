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
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  joinRecovery: (requestId: number) => void;
  leaveRecovery: (requestId: number) => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

function resolveSocketBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured && configured.startsWith("http")) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const socketBaseUrl = useMemo(() => resolveSocketBaseUrl(), []);

  useEffect(() => {
    if (!socketBaseUrl) {
      setIsConnected(false);
      return;
    }

    const authToken = token && token !== "cookie" ? token : undefined;
    const socket = io(`${socketBaseUrl}/app`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: authToken ? { token: authToken } : undefined,
      query: authToken ? { token: authToken } : undefined,
    });
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", () => setIsConnected(false));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [socketBaseUrl, token]);

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
