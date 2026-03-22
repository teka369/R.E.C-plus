"use client";

// Contenedor sin lógica de auth en cliente: redirecciones las resuelve `proxy.ts` (Next 16) en el servidor.
export default function Protected({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}