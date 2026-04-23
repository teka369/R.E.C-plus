import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUpstreamBaseUrl } from "@/lib/server/upstream";
import {
  applyRateLimitVisitorCookie,
  buildRateLimitForwardHeaders,
} from "@/lib/server/rate-limit-forward";
import {
  cookieMaxAgeSeconds,
  verifyAccessToken,
} from "@/lib/server/verify-access-token";

const isDev = process.env.NODE_ENV === "development";

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !isDev,
    path: "/",
    maxAge,
  };
}

function clearAll(res: NextResponse) {
  const cleared = { ...cookieOpts(0), maxAge: 0 };
  res.cookies.set("rec_token", "", cleared);
  res.cookies.set("rec_role", "", cleared);
  res.cookies.set("rec_uid", "", cleared);
  res.cookies.set("rec_refresh", "", cleared);
}

/**
 * POST /api/auth/refresh
 *
 * Lee la cookie httpOnly `rec_refresh`, llama al backend NestJS para renovar
 * los tokens, y actualiza todas las cookies de sesión.
 * El cliente (interceptor axios) no necesita enviar body.
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const { headers: rlHeaders, setVisitorCookie } = buildRateLimitForwardHeaders(req, store);
  const refreshToken = store.get("rec_refresh")?.value;

  if (!refreshToken) {
    const res = NextResponse.json(
      { ok: false, message: "No hay refresh token" },
      { status: 401 },
    );
    clearAll(res);
    applyRateLimitVisitorCookie(res, setVisitorCookie);
    return res;
  }

  const base = getUpstreamBaseUrl();

  let upstream: Response;
  try {
    const fetchHeaders = new Headers({ "Content-Type": "application/json" });
    for (const [k, v] of Object.entries(rlHeaders)) {
      fetchHeaders.set(k, v);
    }
    upstream = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    const res = NextResponse.json(
      { ok: false, message: "No se pudo contactar al backend" },
      { status: 502 },
    );
    applyRateLimitVisitorCookie(res, setVisitorCookie);
    return res;
  }

  if (!upstream.ok) {
    const res = NextResponse.json(
      { ok: false, message: "Refresh token expirado o inválido" },
      { status: 401 },
    );
    clearAll(res);
    applyRateLimitVisitorCookie(res, setVisitorCookie);
    return res;
  }

  let body: { access_token?: string; refresh_token?: string };
  try {
    body = await upstream.json();
  } catch {
    const res = NextResponse.json(
      { ok: false, message: "Respuesta inválida del backend" },
      { status: 502 },
    );
    clearAll(res);
    applyRateLimitVisitorCookie(res, setVisitorCookie);
    return res;
  }

  const newAccessToken = body.access_token;
  const newRefreshToken = body.refresh_token;

  if (!newAccessToken) {
    const res = NextResponse.json(
      { ok: false, message: "No se recibió access token" },
      { status: 502 },
    );
    clearAll(res);
    applyRateLimitVisitorCookie(res, setVisitorCookie);
    return res;
  }

  let verified;
  try {
    verified = await verifyAccessToken(newAccessToken);
  } catch {
    const res = NextResponse.json(
      { ok: false, message: "El nuevo token no es válido" },
      { status: 502 },
    );
    clearAll(res);
    applyRateLimitVisitorCookie(res, setVisitorCookie);
    return res;
  }

  const maxAge = cookieMaxAgeSeconds(verified.exp);
  const res = NextResponse.json({ ok: true });

  res.cookies.set("rec_token", newAccessToken, cookieOpts(maxAge));
  res.cookies.set("rec_role", verified.role, cookieOpts(maxAge));
  res.cookies.set("rec_uid", String(verified.userId), cookieOpts(maxAge));

  if (newRefreshToken) {
    res.cookies.set("rec_refresh", newRefreshToken, cookieOpts(60 * 60 * 24 * 7));
  }

  applyRateLimitVisitorCookie(res, setVisitorCookie);
  return res;
}
