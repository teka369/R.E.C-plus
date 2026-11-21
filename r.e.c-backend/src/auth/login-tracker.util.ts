import type { Request } from 'express';
import { clientIpFromExpressRequest } from './client-ip.util';

/**
 * Clave estable para el contador de intentos de login.
 * Usa `req.ip` (trust proxy), nunca el primer hop de `X-Forwarded-For`.
 */
export function resolveLoginTrackerFromRequest(req: Request): string {
  return `login:${clientIpFromExpressRequest(req)}`;
}
