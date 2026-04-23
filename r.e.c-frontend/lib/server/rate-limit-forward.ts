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

export function getClientIpFromIncomingRequest(req: NextRequest | Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) {
    return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

/**
 * Cabeceras que el BFF envía al backend Nest para rate limiting por visitante.
 * - X-Forwarded-For: IP del cliente cuando existe.
 * - X-Visitor-Id: UUID estable en cookie (independiente por navegador/dispositivo).
 */
export function buildRateLimitForwardHeaders(
  req: NextRequest | Request,
  cookieStore: RateLimitCookieStore,
): { headers: Record<string, string>; setVisitorCookie: string | null } {
  const out: Record<string, string> = {};
  const ip = getClientIpFromIncomingRequest(req);
  if (ip) {
    out["X-Forwarded-For"] = ip;
  }

  let visitorId = cookieStore.get(REC_RATE_LIMIT_VISITOR_COOKIE)?.value?.trim() ?? "";
  let setVisitorCookie: string | null = null;
  if (!visitorId || !VISITOR_UUID_RE.test(visitorId)) {
    visitorId = crypto.randomUUID();
    setVisitorCookie = visitorId;
  }
  out["X-Visitor-Id"] = visitorId;

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
