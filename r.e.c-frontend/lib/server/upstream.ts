/**
 * URL del backend Nest solo en el servidor Next (BFF, /api/auth/*).
 * Local: http://127.0.0.1:4000
 * Vercel: INTERNAL_API_URL=https://<servicio>.onrender.com (no es red privada;
 * "internal" significa que el browser no la usa para las cookies).
 */
export function getUpstreamBaseUrl(): string {
  const raw = process.env.INTERNAL_API_URL || "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}
