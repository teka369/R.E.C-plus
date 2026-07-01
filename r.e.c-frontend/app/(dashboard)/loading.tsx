import { FiLoader } from "react-icons/fi";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <FiLoader className="animate-spin text-rec-primary" size={40} />
        <p className="text-rec-muted text-sm">Cargando...</p>
      </div>
    </div>
  );
}
