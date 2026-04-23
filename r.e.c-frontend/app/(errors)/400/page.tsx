import HttpErrorPage from "../_components/HttpErrorPage";

export default function BadRequestPage() {
  return (
    <HttpErrorPage
      code="400"
      title="Solicitud inválida"
      description="El servidor no pudo entender la solicitud por sintaxis inválida."
      primaryCta={{ href: "/", label: "Ir al inicio" }}
      icon={
        <svg
          className="h-7 w-7 text-[color:var(--rec-primary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8.5 8.5h.01" />
          <path d="M15.5 8.5h.01" />
          <path d="M8 15h8" />
        </svg>
      }
    />
  );
}

