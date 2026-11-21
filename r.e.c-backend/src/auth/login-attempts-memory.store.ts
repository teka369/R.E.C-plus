import { Injectable } from '@nestjs/common';

const WINDOW_MS = 900_000;
const activeStores = new Set<LoginAttemptsMemoryStore>();

/** Limpia contadores de las apps de test. No hace nada útil en producción. */
export function clearLoginAttemptStateForTests(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      'clearLoginAttemptStateForTests solo puede usarse con NODE_ENV=test',
    );
  }
  for (const store of activeStores) store.clearAll();
}

/**
 * Fallback en memoria cuando no hay REDIS_URL (misma ventana 900s que Redis).
 */
@Injectable()
export class LoginAttemptsMemoryStore {
  private readonly map = new Map<
    string,
    { count: number; windowEnd: number }
  >();

  constructor() {
    if (process.env.NODE_ENV === 'test') activeStores.add(this);
  }

  clearAll(): void {
    this.map.clear();
  }

  increment(tracker: string): Promise<{ count: number; ttl: number }> {
    const now = Date.now();
    let row = this.map.get(tracker);
    if (!row || row.windowEnd <= now) {
      row = { count: 0, windowEnd: now + WINDOW_MS };
    }
    row.count += 1;
    this.map.set(tracker, row);
    const ttl = Math.max(0, Math.ceil((row.windowEnd - now) / 1000));
    return Promise.resolve({ count: row.count, ttl });
  }

  reset(tracker: string): Promise<void> {
    this.map.delete(tracker);
    return Promise.resolve();
  }

  getCount(tracker: string): Promise<{ count: number; ttl: number }> {
    const now = Date.now();
    const row = this.map.get(tracker);
    if (!row || row.windowEnd <= now) {
      return Promise.resolve({ count: 0, ttl: 0 });
    }
    return Promise.resolve({
      count: row.count,
      ttl: Math.max(0, Math.ceil((row.windowEnd - now) / 1000)),
    });
  }
}
