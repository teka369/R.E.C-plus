/** Límite alto solo en Jest: la suite comparte una IP y el límite de producción es 5/15 min. */
const TEST_LIMIT = 10_000;
const TEST_TTL_MS = 1_000;

export function isAuthThrottleRelaxed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV === 'test';
}

export function authRouteThrottle(prodLimit: number, prodTtlMs: number) {
  return {
    default: {
      limit: () => (isAuthThrottleRelaxed() ? TEST_LIMIT : prodLimit),
      ttl: () => (isAuthThrottleRelaxed() ? TEST_TTL_MS : prodTtlMs),
    },
  };
}
