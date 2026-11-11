import { createHmac, timingSafeEqual } from 'crypto';

const TTL_MS = 15 * 60 * 1000;

function signingSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'development'
  ) {
    return 'test-upload-secret-at-least-32-characters';
  }
  throw new Error('JWT_SECRET es obligatorio para firmar uploads');
}

export function signStudyUpload(
  teacherId: number,
  filePath: string,
  now = Date.now(),
): string {
  const exp = now + TTL_MS;
  const payload = `${teacherId}|${filePath}|${exp}`;
  const sig = createHmac('sha256', signingSecret())
    .update(payload)
    .digest('base64url');
  return `${exp}.${sig}`;
}

export function verifyStudyUpload(
  teacherId: number,
  filePath: string,
  token: string | undefined,
  now = Date.now(),
): boolean {
  if (!token || !filePath) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expRaw = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < now) return false;
  const payload = `${teacherId}|${filePath}|${exp}`;
  const expected = createHmac('sha256', signingSecret())
    .update(payload)
    .digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Path emitido por uploadStudyFile para este profesor. Sin `..` ni absoluto. */
export function isServerIssuedStudyPath(
  teacherId: number,
  filePath: string,
): boolean {
  if (!filePath || filePath.includes('..') || filePath.includes('\\'))
    return false;
  if (filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath)) return false;
  const pattern = new RegExp(
    `^study-materials/teacher-${teacherId}/\\d{4}-\\d{2}/\\d+-[0-9a-f-]{36}-[A-Za-z0-9._-]{1,100}$`,
  );
  return pattern.test(filePath);
}
