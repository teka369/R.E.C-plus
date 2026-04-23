import { Injectable } from '@nestjs/common';

const WINDOW_MS = 900_000;

/**
 * Fallback en memoria cuando no hay REDIS_URL (misma ventana 900s que Redis).
 */
@Injectable()
export class LoginAttemptsMemoryStore {
  private readonly map = new Map<string, { count: number; windowEnd: number }>();

  async increment(tracker: string): Promise<{ count: number; ttl: number }> {
    const now = Date.now();
    let row = this.map.get(tracker);
    if (!row || row.windowEnd <= now) {
      row = { count: 0, windowEnd: now + WINDOW_MS };
    }
    row.count += 1;
    this.map.set(tracker, row);
    const ttl = Math.max(0, Math.ceil((row.windowEnd - now) / 1000));
    return { count: row.count, ttl };
  }

  async reset(tracker: string): Promise<void> {
    this.map.delete(tracker);
  }

  async getCount(tracker: string): Promise<{ count: number; ttl: number }> {
    const now = Date.now();
    const row = this.map.get(tracker);
    if (!row || row.windowEnd <= now) {
      return { count: 0, ttl: 0 };
    }
    return {
      count: row.count,
      ttl: Math.max(0, Math.ceil((row.windowEnd - now) / 1000)),
    };
  }
}
