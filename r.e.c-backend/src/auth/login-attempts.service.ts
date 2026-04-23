import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';
import { LOGIN_ATTEMPTS_REDIS } from './login-attempts.constants';
import { LoginAttemptsMemoryStore } from './login-attempts-memory.store';

const KEY_PREFIX = 'login_attempts:';
const WINDOW_SEC = 900;

@Injectable()
export class LoginAttemptsService implements OnModuleDestroy {
  private readonly logger = new Logger(LoginAttemptsService.name);

  constructor(
    @Inject(LOGIN_ATTEMPTS_REDIS)
    private readonly redis: Redis | null,
    private readonly memory: LoginAttemptsMemoryStore,
  ) {}

  private key(tracker: string): string {
    return `${KEY_PREFIX}${tracker}`;
  }

  /** Si Redis falla, devuelve `fallback` y registra el error (degradación sin tumbar el login). */
  private async safeRedis<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Redis login attempts unavailable: ${msg}`,
        err instanceof Error ? err.stack : undefined,
      );
      return fallback;
    }
  }

  async increment(tracker: string): Promise<{ count: number; ttl: number }> {
    if (!this.redis) {
      return this.memory.increment(tracker);
    }
    const r = this.redis;
    return this.safeRedis(async () => {
      const k = this.key(tracker);
      const count = await r.incr(k);
      if (count === 1) {
        await r.expire(k, WINDOW_SEC);
      }
      let ttl = await r.ttl(k);
      if (ttl < 0) {
        ttl = WINDOW_SEC;
      }
      return { count, ttl };
    }, { count: 0, ttl: WINDOW_SEC });
  }

  async reset(tracker: string): Promise<void> {
    if (!this.redis) {
      await this.memory.reset(tracker);
      return;
    }
    const r = this.redis;
    await this.safeRedis(async () => {
      await r.del(this.key(tracker));
    }, undefined);
  }

  async getCount(tracker: string): Promise<{ count: number; ttl: number }> {
    if (!this.redis) {
      return this.memory.getCount(tracker);
    }
    const r = this.redis;
    return this.safeRedis(async () => {
      const k = this.key(tracker);
      const raw = await r.get(k);
      const count = raw ? parseInt(raw, 10) : 0;
      let ttl = await r.ttl(k);
      if (ttl < 0) {
        ttl = 0;
      }
      return { count: Number.isFinite(count) ? count : 0, ttl };
    }, { count: 0, ttl: 0 });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        /* noop */
      }
    }
  }
}
