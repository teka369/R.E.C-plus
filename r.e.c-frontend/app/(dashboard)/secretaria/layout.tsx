"use client";
import Sidebar from "@/components/layouts/Sidebar";
import Protected from "@/components/layouts/Protected";
import "@/styles/dashboard.css";

export default function SecretariaLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <div className="dashboard-wrapper">
        <Sidebar role="SECRETARIA" />
        <div className="dashboard-content p-3 md:p-5 lg:p-6">{children}</div>
      </div>
    </Protected>
  );
}