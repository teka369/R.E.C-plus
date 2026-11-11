import { createHash, randomBytes } from 'crypto';

export function createPasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

/** SHA-256 hex. El valor en claro solo sale por correo; la DB guarda el hash. */
export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
