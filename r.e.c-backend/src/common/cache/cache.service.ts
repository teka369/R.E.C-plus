import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.cache.get<T>(key);
    return value ?? null;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.cache.set(key, value, ttlSeconds * 1000);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const stores = this.cache.stores as unknown as {
      keys?: (pattern: string) => Promise<string[]>;
    }[];
    const store = stores?.[0];
    if (store && typeof store.keys === 'function') {
      const keys = await store.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map((k) => this.cache.del(k)));
      }
    }
  }
}
