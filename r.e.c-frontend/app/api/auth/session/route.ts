import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  cookieMaxAgeSeconds,
  verifyAccessToken,
} from "@/lib/server/verify-access-token";

const isDev = process.env.NODE_ENV === "development";

function sessionCookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !isDev,
    path: "/",
    maxAge,
  };
}

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
          message:
            "JWT_SECRET no está definido en el servidor Next.js. Añádelo en r.e.c-frontend/.env.local con el mismo valor que JWT_SECRET en r.e.c-backend/.env",
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
          "[api/auth/session] JWT inválido o secreto distinto al backend. ¿JWT_SECRET en .env.local = backend?",
          err instanceof Error ? err.message : err,
        );
      }
      return NextResponse.json(
        {
          ok: false,
          message:
            "No se pudo validar el token. Comprueba que JWT_SECRET en r.e.c-frontend/.env.local sea idéntico a r.e.c-backend/.env",
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

export async function GET() {
  try {
    const store = await cookies();
    const token = store.get("rec_token")?.value ?? null;
    if (!token) {
      return NextResponse.json({ ok: false, role: null, userId: null });
    }

    try {
      const { userId, role } = await verifyAccessToken(token);
      return NextResponse.json({ ok: true, role, userId });
    } catch {
      const res = NextResponse.json({ ok: false, role: null, userId: null });
      clearSessionCookies(res);
      return res;
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
