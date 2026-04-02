import { NextRequest, NextResponse } from "next/server";

type Role = "SUPER_ADMIN" | "SECRETARIA" | "PROFESOR" | "ESTUDIANTE";

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.pexels.com https://images.unsplash.com https://media2.giphy.com; font-src 'self'; frame-src 'self' https://www.google.com https://docs.google.com; connect-src 'self' https://*.sentry.io",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

function panelFor(role: Role | undefined): string {
  if (role === "SUPER_ADMIN") return "/super-admin";
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
  const isSuperAdmin = pathname.startsWith("/super-admin");

  // Si ya autenticado y está en páginas de login, redirigir al panel por rol
  if (token && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = panelFor(role);
    return setSecurityHeaders(NextResponse.redirect(url));
  }

  // Rutas protegidas: requieren token
  if (!token && (isSecretaria || isDocente || isEstudiante || isSuperAdmin)) {
    const url = request.nextUrl.clone();
    url.pathname = isSecretaria || isSuperAdmin ? "/acceso-secretaria" : "/login";
    return setSecurityHeaders(NextResponse.redirect(url));
  }

  // Enforce rol en paneles
  if (token && role) {
    if (isSecretaria && role !== "SECRETARIA") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return setSecurityHeaders(NextResponse.redirect(url));
    }
    if (isSuperAdmin && role !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return setSecurityHeaders(NextResponse.redirect(url));
    }
    if (isDocente && role !== "PROFESOR") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return setSecurityHeaders(NextResponse.redirect(url));
    }
    if (isEstudiante && role !== "ESTUDIANTE") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return setSecurityHeaders(NextResponse.redirect(url));
    }
  }

  return setSecurityHeaders(NextResponse.next());
}

export function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    "/(login|acceso-secretaria|super-admin|secretaria|docente|estudiante)(.*)",
  ],
};