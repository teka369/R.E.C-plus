"use client";

import { SocketProvider } from "@/contexts/SocketContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SocketProvider>{children}</SocketProvider>;
}
