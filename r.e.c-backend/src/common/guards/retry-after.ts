/**
 * `@nestjs/throttler` ya entrega `timeToExpire` y `timeToBlockExpire` en segundos
 * (`X-RateLimit-Reset` usa el mismo número). No dividir por 1000.
 */
export function retryAfterSeconds(detail: {
  timeToExpire: number;
  timeToBlockExpire: number;
  isBlocked: boolean;
}): number {
  const seconds =
    detail.isBlocked && detail.timeToBlockExpire > 0
      ? detail.timeToBlockExpire
      : detail.timeToExpire;
  if (!Number.isFinite(seconds) || seconds <= 0) return 1;
  return Math.max(1, Math.ceil(seconds));
}
