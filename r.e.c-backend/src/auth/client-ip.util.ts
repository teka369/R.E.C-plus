import type { Request } from 'express';

/**
 * IP del peer que Express ya resolvió con `trust proxy`.
 * No lee `X-Forwarded-For`: el cliente puede rotar ese header y evadir el rate limit.
 */
export function clientIpFromExpressRequest(req: Request): string {
  const ip = typeof req.ip === 'string' ? req.ip.trim() : '';
  if (ip) return ip;
  const remote = req.socket?.remoteAddress;
  if (typeof remote === 'string' && remote.trim()) return remote.trim();
  return 'unknown';
}
