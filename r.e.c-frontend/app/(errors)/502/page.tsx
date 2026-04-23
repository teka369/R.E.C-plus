import HttpErrorPage from "../_components/HttpErrorPage";

export default function BadGatewayPage() {
  return (
    <HttpErrorPage
      code="502"
      title="Puerta de enlace inválida"
      description="El servidor recibió una respuesta inválida de un servicio aguas arriba."
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
          <rect x="3" y="4" width="18" height="8" rx="2" />
          <rect x="3" y="12" width="18" height="8" rx="2" />
          <path d="M8 8h.01" />
          <path d="M8 16h.01" />
          <path d="M14 8h4" />
          <path d="M14 16h4" />
        </svg>
      }
    />
  );
}

