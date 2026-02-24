import { NextRequest, NextResponse } from "next/server";

type Role = "SECRETARIA" | "PROFESOR" | "ESTUDIANTE";

function panelFor(role: Role | undefined): string {
  if (role === "SECRETARIA") return "/secretaria";
  if (role === "PROFESOR") return "/docente";
  if (role === "ESTUDIANTE") return "/estudiante";
  return "/login";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("rec_token")?.value;
  const role = request.cookies.get("rec_role")?.value as Role | undefined;

  const isLogin = pathname === "/login" || pathname === "/acceso-secretaria";
  const isSecretaria = pathname.startsWith("/secretaria");
  const isDocente = pathname.startsWith("/docente");
  const isEstudiante = pathname.startsWith("/estudiante");

  // Si ya autenticado y está en páginas de login, redirigir al panel por rol
  if (token && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = panelFor(role);
    return NextResponse.redirect(url);
  }

  // Rutas protegidas: requieren token
  if (!token && (isSecretaria || isDocente || isEstudiante)) {
    const url = request.nextUrl.clone();
    url.pathname = isSecretaria ? "/acceso-secretaria" : "/login";
    return NextResponse.redirect(url);
  }

  // Enforce rol en paneles
  if (token && role) {
    if (isSecretaria && role !== "SECRETARIA") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return NextResponse.redirect(url);
    }
    if (isDocente && role !== "PROFESOR") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return NextResponse.redirect(url);
    }
    if (isEstudiante && role !== "ESTUDIANTE") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    "/(login|acceso-secretaria|secretaria|docente|estudiante)(.*)",
  ],
};