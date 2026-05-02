const isDev = process.env.NODE_ENV === "development";

/**
 * Dominio de cookie de sesión (p. ej. `recedu.co` sin protocolo).
 * En producción con front en recedu.co y API en api.recedu.co, definir el mismo
 * dominio registrable hace que el navegador envíe `rec_token` en el handshake WebSocket.
 */
function sessionCookieDomain(): string | undefined {
  const d = process.env.SESSION_COOKIE_DOMAIN?.trim();
  return d && d.length > 0 ? d : undefined;
}

export function sessionCookieOpts(maxAge: number) {
  const domain = sessionCookieDomain();
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !isDev,
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  };
}
