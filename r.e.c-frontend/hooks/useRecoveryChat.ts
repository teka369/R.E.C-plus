"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import type { RecoveryMessage } from "@/lib/recoveryApi";

type SendPayload = {
  body: string;
  requestId: number;
};

export function useRecoveryChat(requestId: number | null, initialMessages: RecoveryMessage[]) {
  const { user } = useAuth();
  const { socket, isConnected, joinRecovery, leaveRecovery } = useSocket();
  const [messages, setMessages] = useState<RecoveryMessage[]>(initialMessages);
  const optimisticIdRef = useRef(-1);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, requestId]);

  useEffect(() => {
    if (!requestId || !socket) {
      return;
    }
    joinRecovery(requestId);
    const onMessage = (incoming: RecoveryMessage) => {
      if (incoming.requestId !== requestId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        const next = [...prev];
        const optimisticIdx = next.findIndex(
          (m) =>
            m.id < 0 &&
            m.authorId === incoming.authorId &&
            m.body === incoming.body &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(incoming.createdAt).getTime()) < 15000,
        );
        if (optimisticIdx >= 0) next.splice(optimisticIdx, 1);
        next.push(incoming);
        return next;
      });
    };
    socket.on("recovery:newMessage", onMessage);

    return () => {
      socket.off("recovery:newMessage", onMessage);
      leaveRecovery(requestId);
    };
  }, [requestId, socket, joinRecovery, leaveRecovery]);

  const sendMessage = useCallback(
    (body: string) => {
      const trimmed = body.trim();
      if (!socket || !requestId || !trimmed) return;

      const optimistic: RecoveryMessage = {
        id: optimisticIdRef.current--,
        requestId,
        authorId: Number(user?.id ?? 0),
        body: trimmed,
        createdAt: new Date().toISOString(),
        author: user
          ? {
              id: Number(user.id),
              nombres: user.name || "",
              apellidos: "",
              role: user.role as "SECRETARIA" | "PROFESOR" | "ESTUDIANTE",
            }
          : undefined,
      };

      setMessages((prev) => [...prev, optimistic]);
      socket.emit("sendRecoveryMessage", { body: trimmed, requestId } satisfies SendPayload);
    },
    [requestId, socket, user],
  );

  return { messages, sendMessage, isConnected };
}
