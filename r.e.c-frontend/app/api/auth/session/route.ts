import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  applyRateLimitVisitorCookie,
  buildRateLimitForwardHeaders,
} from "@/lib/server/rate-limit-forward";
import {
  cookieMaxAgeSeconds,
  verifyAccessToken,
} from "@/lib/server/verify-access-token";
import { getUpstreamBaseUrl } from "@/lib/server/upstream";
import { sessionCookieOpts } from "@/lib/server/session-cookie-opts";

const isDev = process.env.NODE_ENV === "development";

const jwtSecretEnvFile = isDev ? "r.e.c-frontend/.env.local" : "r.e.c-frontend/.env.production (en el servidor)";

function clearSessionCookies(res: NextResponse) {
  const cleared = { ...sessionCookieOpts(0), maxAge: 0 };
  res.cookies.set("rec_token", "", cleared);
  res.cookies.set("rec_role", "", cleared);
  res.cookies.set("rec_uid", "", cleared);
  res.cookies.set("rec_refresh", "", cleared);
}

export async function POST(req: Request) {
  try {
    if (!process.env.JWT_SECRET?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          message: `JWT_SECRET no está definido en el servidor Next.js. Añádelo en ${jwtSecretEnvFile} con el mismo valor que en r.e.c-backend/.env y reinicia el frontend (pm2 restart recedu-frontend).`,
        },
        { status: 500 },
      );
    }

    const body = (await req.json()) as { token?: string; refreshToken?: string };
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ ok: false, message: "token requerido" }, { status: 400 });
    }

    let verified;
    try {
      verified = await verifyAccessToken(token);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[api/auth/session] JWT inválido o secreto distinto al backend. ¿JWT_SECRET en ${jwtSecretEnvFile}?`,
          err instanceof Error ? err.message : err,
        );
      }
      return NextResponse.json(
        {
          ok: false,
          message: `No se pudo validar el token. En producción, JWT_SECRET en ${jwtSecretEnvFile} debe ser exactamente igual a JWT_SECRET en r.e.c-backend/.env; luego pm2 restart recedu-frontend.`,
        },
        { status: 401 },
      );
    }

    const maxAge = cookieMaxAgeSeconds(verified.exp);
    const res = NextResponse.json({ ok: true });

    res.cookies.set("rec_token", token, sessionCookieOpts(maxAge));
    res.cookies.set("rec_role", verified.role, sessionCookieOpts(maxAge));
    res.cookies.set("rec_uid", String(verified.userId), sessionCookieOpts(maxAge));

    const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken.trim() : "";
    if (refreshToken) {
      // Refresh tokens tienen vida más larga — 7 días
      res.cookies.set("rec_refresh", refreshToken, sessionCookieOpts(60 * 60 * 24 * 7));
    }

    return res;
  } catch {
    return NextResponse.json({ ok: false, message: "payload inválido" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookies(res);
  return res;
}

export async function GET(req: NextRequest) {
  const forSocket = req.nextUrl.searchParams.get("socket") === "1";
  try {
    const store = await cookies();
    const token = store.get("rec_token")?.value ?? null;
    if (!token) {
      // Sin access token: intentar refresh silencioso si hay refresh token
      const refreshToken = store.get("rec_refresh")?.value ?? null;
      if (refreshToken) {
        return attemptSilentRefresh(refreshToken, req, forSocket);
      }
      return NextResponse.json({ ok: false, role: null, userId: null });
    }

    try {
      const { userId, role } = await verifyAccessToken(token);
      return NextResponse.json({
        ok: true,
        role,
        userId,
        ...(forSocket ? { accessToken: token } : {}),
      });
    } catch {
      // Access token expirado/inválido: intentar refresh antes de limpiar sesión
      const refreshToken = store.get("rec_refresh")?.value ?? null;
      if (refreshToken) {
        return attemptSilentRefresh(refreshToken, req, forSocket);
      }
      const res = NextResponse.json({ ok: false, role: null, userId: null });
      clearSessionCookies(res);
      return res;
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

async function attemptSilentRefresh(
  refreshToken: string,
  req: NextRequest,
  forSocket = false,
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const { headers: rlHeaders, setVisitorCookie } = buildRateLimitForwardHeaders(req, cookieStore);
  try {
    const base = getUpstreamBaseUrl();
    const fetchHeaders = new Headers({ "Content-Type": "application/json" });
    for (const [k, v] of Object.entries(rlHeaders)) {
      fetchHeaders.set(k, v);
    }
    const upstream = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!upstream.ok) {
      const res = NextResponse.json({ ok: false, role: null, userId: null });
      clearSessionCookies(res);
      applyRateLimitVisitorCookie(res, setVisitorCookie);
      return res;
    }

    const body = (await upstream.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    const newAccess = body.access_token;
    const newRefresh = body.refresh_token;

    if (!newAccess) {
      const res = NextResponse.json({ ok: false, role: null, userId: null });
      clearSessionCookies(res);
      applyRateLimitVisitorCookie(res, setVisitorCookie);
      return res;
    }

    const verified = await verifyAccessToken(newAccess);
    const maxAge = cookieMaxAgeSeconds(verified.exp);
    const res = NextResponse.json({
      ok: true,
      role: verified.role,
      userId: verified.userId,
      ...(forSocket ? { accessToken: newAccess } : {}),
    });
    res.cookies.set("rec_token", newAccess, sessionCookieOpts(maxAge));
    res.cookies.set("rec_role", verified.role, sessionCookieOpts(maxAge));
    res.cookies.set(
      "rec_uid",
      String(verified.userId),
      sessionCookieOpts(maxAge),
    );
    if (newRefresh) {
      res.cookies.set(
        "rec_refresh",
        newRefresh,
        sessionCookieOpts(60 * 60 * 24 * 7),
      );
    }
    applyRateLimitVisitorCookie(res, setVisitorCookie);
    return res;
  } catch {
    const res = NextResponse.json({ ok: false, role: null, userId: null });
    clearSessionCookies(res);
    applyRateLimitVisitorCookie(res, setVisitorCookie);
    return res;
  }
}
