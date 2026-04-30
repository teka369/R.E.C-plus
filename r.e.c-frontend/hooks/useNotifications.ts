"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

type LiveNotification = {
  id: number;
  userId: number;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  readAt?: string | null;
};

export function useNotifications() {
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<LiveNotification | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (incoming: LiveNotification) => {
      setLatestNotification(incoming);
      if (!incoming.readAt) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("notification:new", onNotification);
    return () => {
      socket.off("notification:new", onNotification);
    };
  }, [socket]);

  return { unreadCount, latestNotification };
}
