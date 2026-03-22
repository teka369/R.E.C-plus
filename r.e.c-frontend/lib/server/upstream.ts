/**
 * URL del backend Nest visto solo desde Route Handlers (servidor Next).
 * En Docker usar el hostname del servicio (p. ej. http://backend:4001).
 */
export function getUpstreamBaseUrl(): string {
  const raw =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:4001";
  return raw.replace(/\/$/, "");
}
