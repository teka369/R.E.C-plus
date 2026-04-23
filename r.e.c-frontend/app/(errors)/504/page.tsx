import HttpErrorPage from "../_components/HttpErrorPage";

export default function GatewayTimeoutPage() {
  return (
    <HttpErrorPage
      code="504"
      title="Tiempo de espera del gateway"
      description="El servicio aguas arriba no respondió a tiempo."
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
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6" />
          <path d="M12 12l3 3" />
          <path d="M8 3h8" />
        </svg>
      }
    />
  );
}

