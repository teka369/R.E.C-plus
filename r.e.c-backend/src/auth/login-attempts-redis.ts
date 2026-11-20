/**
 * Redis solo fuera de test. En integración el contador es por IP y Redis
 * sobrevive entre apps de Jest, así que un bloqueo de una suite tumba las demás.
 * El límite de cinco fallos sigue en AuthService; en test lo aplica la memoria.
 */
export function shouldUseLoginAttemptsRedis(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV !== 'test' && Boolean(env.REDIS_URL);
}
