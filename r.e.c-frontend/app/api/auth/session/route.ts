import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const isProd = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  try {
    const { token, role, userId } = await req.json();
    if (!token || !role || !userId) {
      return NextResponse.json({ ok: false, message: "token y role requeridos" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });
    // Cookies HttpOnly para que el cliente no pueda leerlas directamente
    res.cookies.set("rec_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
    // Token duplicado en cookie de cliente para adjuntar Authorization en llamadas cross-domain al backend.
    res.cookies.set("rec_token_client", token, {
      httpOnly: false,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.set("rec_role", role, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    // UID en cookie HttpOnly; se hidrata desde GET /api/auth/session en servidor
    res.cookies.set("rec_uid", String(userId), {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, message: "payload inválido" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("rec_token", "", { httpOnly: true, sameSite: "lax", secure: isProd, path: "/", maxAge: 0 });
  res.cookies.set("rec_token_client", "", { httpOnly: false, sameSite: "lax", secure: isProd, path: "/", maxAge: 0 });
  res.cookies.set("rec_role", "", { httpOnly: true, sameSite: "lax", secure: isProd, path: "/", maxAge: 0 });
  res.cookies.set("rec_uid", "", { httpOnly: true, sameSite: "lax", secure: isProd, path: "/", maxAge: 0 });
  return res;
}

export async function GET() {
  try {
    const store = await cookies();
    const token = store.get("rec_token")?.value ?? null;
    const role = store.get("rec_role")?.value ?? null;
    const uid = store.get("rec_uid")?.value ?? null;
    return NextResponse.json({ ok: !!token, role, userId: uid ? Number(uid) : null });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}