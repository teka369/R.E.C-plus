"use client";
import Sidebar from "@/components/layouts/Sidebar";
import Protected from "@/components/layouts/Protected";
import { useNotifications } from "@/hooks/useNotifications";
import "@/styles/dashboard.css";

export default function SecretariaLayout({ children }: { children: React.ReactNode }) {
  const { unreadCount } = useNotifications();
  return (
    <Protected>
      <div className="dashboard-wrapper secretaria-theme">
        <Sidebar role="SECRETARIA" notificationUnreadCount={unreadCount} />
        <div className="dashboard-content p-3 md:p-5 lg:p-6">{children}</div>
      </div>
    </Protected>
  );
}