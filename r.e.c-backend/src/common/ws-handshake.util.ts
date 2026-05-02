/**
 * JWT enviado en la cookie httpOnly `rec_token` (mismo nombre que en Next.js)
 * cuando SESSION_COOKIE_DOMAIN permite enviarla al subdominio del API.
 */
export function getRecTokenFromHandshakeCookie(
  cookieHeader: string | string[] | undefined,
): string | null {
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) {
    return null;
  }
  const match = cookieHeader.match(/(?:^|;\s*)rec_token=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}
