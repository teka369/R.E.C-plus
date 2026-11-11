import type { NextRequest } from "next/server";

/** Subconjunto de `cookies()` de Next para no depender de rutas internas del paquete. */
export type RateLimitCookieStore = { get: (name: string) => { value?: string } | undefined };

/** Cookie httpOnly: identifica al visitante cuando no hay IP fiable (p. ej. BFF → Nest en la misma máquina). */
export const REC_RATE_LIMIT_VISITOR_COOKIE = "rec_rl_vid";

const VISITOR_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function visitorCookieOptions(maxAgeSec: number, secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: maxAgeSec,
  };
}

/**
 * IP para reenviar a Nest. Nunca usa `X-Forwarded-For` del browser:
 * el cliente puede rotarlo y evadir el rate limit.
 * `X-Real-IP` solo se acepta si el deploy declara TRUST_PROXY_HEADERS=1
 * (nginx lo sobrescribe con $remote_addr).
 */
export function getClientIpFromIncomingRequest(req: NextRequest | Request): string | null {
  if (process.env.TRUST_PROXY_HEADERS !== "1") return null;
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (!realIp || realIp.includes(",")) return null;
  return realIp;
}

/**
 * Cabeceras que el BFF envía al backend Nest.
 * No reenvía el `X-Forwarded-For` del browser ni un visitor-id recién inventado
 * (ambos se podían rotar para saltarse el límite).
 */
export function buildRateLimitForwardHeaders(
  req: NextRequest | Request,
  cookieStore: RateLimitCookieStore,
): { headers: Record<string, string>; setVisitorCookie: string | null } {
  const out: Record<string, string> = {};
  const ip = getClientIpFromIncomingRequest(req);
  if (ip) {
    // Valor calculado por el BFF, no el header que mandó el browser.
    out["X-Forwarded-For"] = ip;
    out["X-Real-IP"] = ip;
  }

  const existing = cookieStore.get(REC_RATE_LIMIT_VISITOR_COOKIE)?.value?.trim() ?? "";
  const setVisitorCookie =
    existing && VISITOR_UUID_RE.test(existing) ? null : crypto.randomUUID();

  return { headers: out, setVisitorCookie };
}

export function applyRateLimitVisitorCookie(
  res: { cookies: { set: (n: string, v: string, o: object) => void } },
  visitorId: string | null,
): void {
  if (!visitorId) {
    return;
  }
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(
    REC_RATE_LIMIT_VISITOR_COOKIE,
    visitorId,
    visitorCookieOptions(60 * 60 * 24 * 400, secure),
  );
}
