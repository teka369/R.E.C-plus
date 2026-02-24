import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
    res.cookies.set("rec_role", role, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    // Cookie no HttpOnly para hidratar el id del usuario en el cliente tras recarga
    res.cookies.set("rec_uid", String(userId), {
      httpOnly: false,
      sameSite: "lax",
      secure: false,
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
  res.cookies.set("rec_token", "", { httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: 0 });
  res.cookies.set("rec_role", "", { httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: 0 });
  res.cookies.set("rec_uid", "", { httpOnly: false, sameSite: "lax", secure: false, path: "/", maxAge: 0 });
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