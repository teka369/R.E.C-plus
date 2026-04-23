import HttpErrorPage from "../_components/HttpErrorPage";

export default function InternalServerErrorPage() {
  return (
    <HttpErrorPage
      code="500"
      title="Error interno"
      description="Algo salió mal de nuestro lado."
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
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      }
    />
  );
}

