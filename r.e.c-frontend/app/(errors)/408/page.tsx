import HttpErrorPage from "../_components/HttpErrorPage";

export default function RequestTimeoutPage() {
  return (
    <HttpErrorPage
      code="408"
      title="Tiempo de espera agotado"
      description="El servidor agotó el tiempo de espera al recibir la solicitud."
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
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      }
    />
  );
}

