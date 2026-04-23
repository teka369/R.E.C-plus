import HttpErrorPage from "../_components/HttpErrorPage";

export default function TooManyRequestsPage() {
  return (
    <HttpErrorPage
      code="429"
      title="Demasiadas solicitudes"
      description="Has enviado demasiadas solicitudes en poco tiempo. Intenta de nuevo en unos segundos."
      primaryCta={{ href: "/", label: "Ir al inicio" }}
      showReload
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
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.93 4.93l2.83 2.83" />
          <path d="M16.24 16.24l2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="M4.93 19.07l2.83-2.83" />
          <path d="M16.24 7.76l2.83-2.83" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      }
    />
  );
}

