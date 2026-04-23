import HttpErrorPage from "../_components/HttpErrorPage";

export default function ServiceUnavailablePage() {
  return (
    <HttpErrorPage
      code="503"
      title="Servicio no disponible"
      description="El servicio está temporalmente fuera de servicio por mantenimiento o alta demanda."
      primaryCta={{ href: "/", label: "Ir al inicio" }}
      secondaryCtas={[{ href: "/Contacto", label: "Contacto" }]}
      showReload
      iconTone="accent"
      icon={
        <svg
          className="h-7 w-7 text-[color:var(--rec-accent)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 6v6l4 2" />
          <path d="M22 4v6h-6" />
        </svg>
      }
    />
  );
}

