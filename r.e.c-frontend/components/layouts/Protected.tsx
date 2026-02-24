"use client";

// Componente contenedor simple: no realiza redirecciones en cliente.
// Las protecciones y redirecciones las maneja el middleware del servidor.
export default function Protected({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}