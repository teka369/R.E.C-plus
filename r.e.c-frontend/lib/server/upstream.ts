/**
 * URL del backend Nest solo en el servidor Next (BFF, /api/auth/*).
 * En producción: INTERNAL_API_URL=http://127.0.0.1:4000 (mismo host que PM2).
 * No usar NEXT_PUBLIC_* aquí: evita apuntar por error al dominio público o al puerto equivocado.
 */
export function getUpstreamBaseUrl(): string {
  const raw = process.env.INTERNAL_API_URL || "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}
