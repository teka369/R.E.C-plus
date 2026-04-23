import HttpErrorPage from "../_components/HttpErrorPage";

export default function ForbiddenPage() {
  return (
    <HttpErrorPage
      code="403"
      title="Acceso restringido"
      description="No tienes permiso para acceder a esta página."
      primaryCta={{ href: "/", label: "Ir al inicio" }}
      secondaryCtas={[
        { href: "/login", label: "Iniciar sesión" },
        { href: "/Contacto", label: "Solicitar acceso" },
      ]}
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
          <line x1="8" y1="16" x2="16" y2="8" />
        </svg>
      }
    />
  );
}

