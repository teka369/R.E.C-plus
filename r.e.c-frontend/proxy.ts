import { NextRequest, NextResponse } from "next/server";

type Role = "SUPER_ADMIN" | "SECRETARIA" | "PROFESOR" | "ESTUDIANTE";

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/** Orígenes ws/wss para Socket.io: mismo host que NEXT_PUBLIC_API_BASE_URL (URL http(s) completa). */
function connectSrcWebSocketFromApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return "";
  try {
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const { host } = new URL(href);
    return ` ws://${host} wss://${host}`;
  } catch {
    return "";
  }
}

/**
 * CSP compatible con el runtime de Next (App Router). Un `script-src` solo con `nonce-*`
 * bloquea scripts de arranque que Next no firma con ese nonce → hidratación rota y la UI
 * parece “sin estilos” (HTML con clases Tailwind pero sin aplicar bien en cliente).
 */
function setSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.pexels.com https://images.unsplash.com https://media2.giphy.com",
    "font-src 'self' data:",
    "frame-src 'self' https://www.google.com https://docs.google.com",
    `connect-src 'self' https://*.sentry.io ws://localhost:4001 wss://localhost:4001 ws://localhost:3000 wss://localhost:3000${connectSrcWebSocketFromApiBase()}`,
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
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
  const nonce = generateNonce();
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("rec_token")?.value;
  const role = request.cookies.get("rec_role")?.value as Role | undefined;

  const isLogin = pathname === "/login" || pathname === "/acceso-secretaria";
  const isSecretaria = pathname.startsWith("/secretaria");
  const isDocente = pathname.startsWith("/docente");
  const isEstudiante = pathname.startsWith("/estudiante");
  const isSuperAdmin = pathname.startsWith("/super-admin");
  const isProfile = pathname.startsWith("/profile");

  if (token && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = panelFor(role);
    return setSecurityHeaders(NextResponse.redirect(url), nonce);
  }

  if (
    !token &&
    (isSecretaria || isDocente || isEstudiante || isSuperAdmin || isProfile)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = isSecretaria || isSuperAdmin ? "/acceso-secretaria" : "/login";
    return setSecurityHeaders(NextResponse.redirect(url), nonce);
  }

  if (token && role) {
    if (isSecretaria && role !== "SECRETARIA") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return setSecurityHeaders(NextResponse.redirect(url), nonce);
    }
    if (isSuperAdmin && role !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return setSecurityHeaders(NextResponse.redirect(url), nonce);
    }
    if (isDocente && role !== "PROFESOR") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return setSecurityHeaders(NextResponse.redirect(url), nonce);
    }
    if (isEstudiante && role !== "ESTUDIANTE") {
      const url = request.nextUrl.clone();
      url.pathname = panelFor(role);
      return setSecurityHeaders(NextResponse.redirect(url), nonce);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  return setSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), nonce);
}

export const config = {
  matcher: [
    "/(login|acceso-secretaria|super-admin|secretaria|docente|estudiante|profile)(.*)",
  ],
};
