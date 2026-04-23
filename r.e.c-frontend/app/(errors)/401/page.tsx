import HttpErrorPage from "../_components/HttpErrorPage";

export default function UnauthorizedPage() {
  return (
    <HttpErrorPage
      code="401"
      title="No autorizado"
      description="Necesitas autenticarte para acceder a este recurso."
      primaryCta={{ href: "/login", label: "Iniciar sesión" }}
      secondaryCtas={[{ href: "/Contacto", label: "Solicitar acceso" }]}
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
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          <path d="M12 15v2" />
        </svg>
      }
    />
  );
}

