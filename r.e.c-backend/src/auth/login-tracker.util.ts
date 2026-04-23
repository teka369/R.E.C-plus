import type { Request } from 'express';

/** Misma forma que `CustomThrottlerGuard` (UUID v4). */
const VISITOR_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Identificador estable para rate limit de login (sin JWT / user de Passport).
 * Prioridad: X-Visitor-Id (UUID) → X-Forwarded-For (primer IP) → req.ip → unknown
 */
export function resolveLoginTrackerFromRequest(req: Request): string {
  const rawVisitor = req.headers['x-visitor-id'];
  const visitorId = Array.isArray(rawVisitor)
    ? rawVisitor[0]?.trim() ?? ''
    : typeof rawVisitor === 'string'
      ? rawVisitor.trim()
      : '';
  if (visitorId && VISITOR_UUID_RE.test(visitorId)) {
    return `visitor:${visitorId}`;
  }

  const xff = req.headers['x-forwarded-for'];
  const xffStr = Array.isArray(xff) ? xff.join(',') : xff;
  if (typeof xffStr === 'string' && xffStr.length > 0) {
    const first = xffStr.split(',')[0]?.trim();
    if (first) {
      return `ip:${first}`;
    }
  }

  const ip =
    req.ip ??
    (Array.isArray(req.ips) && req.ips.length > 0 ? req.ips[0] : undefined) ??
    req.socket?.remoteAddress ??
    'unknown';
  return `ip:${ip}`;
}
