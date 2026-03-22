import { jwtVerify } from "jose";

const ROLES = ["SUPER_ADMIN", "SECRETARIA", "PROFESOR", "ESTUDIANTE"] as const;
export type AccessTokenRole = (typeof ROLES)[number];

function isRole(value: unknown): value is AccessTokenRole {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export type VerifiedAccessToken = {
  userId: number;
  role: AccessTokenRole;
  exp: number | null;
};

export async function verifyAccessToken(token: string): Promise<VerifiedAccessToken> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está definido en el frontend (servidor)");
  }

  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    algorithms: ["HS256"],
  });

  const sub = payload.sub;
  const userId =
    typeof sub === "string" ? Number(sub) : typeof sub === "number" ? sub : Number.NaN;
  const role = payload.role;

  if (!Number.isFinite(userId) || !isRole(role)) {
    throw new Error("Token de acceso inválido");
  }

  const exp = typeof payload.exp === "number" ? payload.exp : null;
  return { userId, role, exp };
}

export function cookieMaxAgeSeconds(exp: number | null): number {
  if (exp == null) return 60 * 60 * 24 * 7;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(60, exp - now);
}
