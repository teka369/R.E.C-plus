const isDev = process.env.NODE_ENV === "development";

/**
 * Dominio de cookie de sesión. En Vercel + Render NO lo definas:
 * son hosts distintos y la cookie httpOnly debe quedar solo en el dominio de Vercel.
 * El socket no depende de esa cookie: el cliente pide el access token al BFF.
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
