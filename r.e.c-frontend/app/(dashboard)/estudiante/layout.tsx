"use client";
import { EstudianteTourProvider } from "@/components/estudiante/EstudianteTourProvider";
import EstudianteTourToolbar from "@/components/estudiante/EstudianteTourToolbar";
import Sidebar from "@/components/layouts/Sidebar";
import Protected from "@/components/layouts/Protected";
import WelcomeOnboardingGate from "@/components/onboarding/WelcomeOnboardingGate";
import { useNotifications } from "@/hooks/useNotifications";
import "@/styles/dashboard.css";

export default function EstudianteLayout({ children }: { children: React.ReactNode }) {
  const { unreadCount } = useNotifications();
  return (
    <Protected>
      <EstudianteTourProvider>
        <WelcomeOnboardingGate role="ESTUDIANTE" />
        <div className="dashboard-wrapper estudiante-theme">
          <Sidebar role="ESTUDIANTE" notificationUnreadCount={unreadCount} />
          <div className="dashboard-content flex min-h-0 flex-1 flex-col px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 xl:px-8">
            <div className="min-w-0 flex-1">{children}</div>
            <div className="sticky bottom-0 z-[38] -mx-3 mt-6 shrink-0 border-t border-rec-border-default bg-rec-bg-base/95 px-1 pb-1 pt-3 backdrop-blur-md sm:-mx-4 lg:-mx-6 xl:-mx-8">
              <EstudianteTourToolbar />
            </div>
          </div>
        </div>
      </EstudianteTourProvider>
    </Protected>
  );
}