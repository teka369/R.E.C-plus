"use client";
import Sidebar from "@/components/layouts/Sidebar";
import Protected from "@/components/layouts/Protected";
import "@/styles/dashboard.css";

export default function DocenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <div className="dashboard-wrapper">
        <Sidebar role="PROFESOR" />
        <div className="dashboard-content px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 xl:px-8">{children}</div>
      </div>
    </Protected>
  );
}