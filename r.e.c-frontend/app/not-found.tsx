import HttpErrorPage from "./(errors)/_components/HttpErrorPage";

export default function NotFound() {
  return (
    <HttpErrorPage
      code="404"
      title="Página no encontrada"
      description="La página que buscas no existe o fue movida."
      primaryCta={{ href: "/", label: "Ir al inicio" }}
      secondaryCtas={[{ href: "/login", label: "Iniciar sesión" }]}
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
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8.5" x2="11" y2="11.5" />
          <line x1="11" y1="14.5" x2="11.01" y2="14.5" />
        </svg>
      }
    />
  );
}
