import type { Request } from 'express';

/**
 * Clave estable para el contador de intentos de login (AuthService / LoginAttemptsService).
 * Basada solo en la IP del cliente: `login:<ip>`. `x-visitor-id` no participa en la clave
 * para evitar bypass del límite cambiando ese header; el proxy debe usar trust proxy
 * para que `X-Forwarded-For` sea fiable.
 */
export function resolveLoginTrackerFromRequest(req: Request): string {
  const xffHeader = req.headers['x-forwarded-for'];
  const xffStr = Array.isArray(xffHeader) ? xffHeader.join(',') : xffHeader;
  const firstHop =
    typeof xffStr === 'string' && xffStr.length > 0
      ? xffStr.split(',')[0]?.trim()
      : undefined;

  const clientIp = firstHop ?? req.socket?.remoteAddress ?? 'unknown';

  return `login:${clientIp}`;
}
