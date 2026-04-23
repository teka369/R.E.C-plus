import type { Request } from 'express';

/**
 * Misma lógica que `JwtStrategy` (Bearer + cookie `rec_token`) para poder
 * identificar al usuario en guards que corren antes de Passport (p. ej. throttler).
 */
export function extractAccessTokenFromRequest(req?: Request): string | null {
  try {
    const cookieHeader = req?.headers?.cookie;
    if (cookieHeader) {
      const part = cookieHeader
        .split(';')
        .map((value) => value.trim())
        .find((value) => value.startsWith('rec_token='));
      if (part) {
        return decodeURIComponent(part.split('=').slice(1).join('='));
      }
    }

    const authorization = req?.headers?.authorization;
    if (!authorization) return null;
    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
    return token;
  } catch {
    return null;
  }
}
