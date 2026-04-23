"use client";
import { DocenteTourProvider } from "@/components/docente/DocenteTourProvider";
import DocenteTourToolbar from "@/components/docente/DocenteTourToolbar";
import Sidebar from "@/components/layouts/Sidebar";
import Protected from "@/components/layouts/Protected";
import WelcomeOnboardingGate from "@/components/onboarding/WelcomeOnboardingGate";
import "@/styles/dashboard.css";

export default function DocenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <DocenteTourProvider>
        <WelcomeOnboardingGate role="PROFESOR" />
        <div className="dashboard-wrapper docente-theme">
          <Sidebar role="PROFESOR" />
          <div className="dashboard-content flex min-h-0 flex-1 flex-col px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 xl:px-8">
            <div className="min-w-0 flex-1">{children}</div>
            <div className="sticky bottom-0 z-[38] -mx-3 mt-6 shrink-0 border-t border-rec-border-default bg-rec-bg-base/95 px-1 pb-1 pt-3 backdrop-blur-md sm:-mx-4 lg:-mx-6 xl:-mx-8">
              <DocenteTourToolbar />
            </div>
          </div>
        </div>
      </DocenteTourProvider>
    </Protected>
  );
}