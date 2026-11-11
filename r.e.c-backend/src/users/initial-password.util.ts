import { randomBytes } from 'crypto';

/** Secreto de un solo uso. No es el código de usuario ni un identificador. */
export function generateInitialPassword(): string {
  return randomBytes(18).toString('base64url');
}
