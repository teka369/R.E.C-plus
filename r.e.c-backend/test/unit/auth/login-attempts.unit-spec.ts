import { LoginAttemptsService } from '../../../src/auth/login-attempts.service';
import {
  LoginAttemptsMemoryStore,
  clearLoginAttemptStateForTests,
} from '../../../src/auth/login-attempts-memory.store';
import { shouldUseLoginAttemptsRedis } from '../../../src/auth/login-attempts-redis';

describe('shouldUseLoginAttemptsRedis', () => {
  it('no usa Redis en test aunque REDIS_URL exista', () => {
    expect(
      shouldUseLoginAttemptsRedis({
        NODE_ENV: 'test',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toBe(false);
  });

  it('usa Redis en producción cuando hay URL', () => {
    expect(
      shouldUseLoginAttemptsRedis({
        NODE_ENV: 'production',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toBe(true);
  });

  it('no usa Redis sin URL', () => {
    expect(shouldUseLoginAttemptsRedis({ NODE_ENV: 'production' })).toBe(false);
  });
});

describe('LoginAttemptsService', () => {
  it('aplica el contador en memoria cuando no hay Redis', async () => {
    const memory = new LoginAttemptsMemoryStore();
    const service = new LoginAttemptsService(null, memory);

    for (let i = 1; i <= 5; i++) {
      const row = await service.increment('login:127.0.0.1');
      expect(row.count).toBe(i);
    }
    await expect(service.getCount('login:127.0.0.1')).resolves.toMatchObject({
      count: 5,
    });
  });

  it('incrementa y borra en Redis cuando el cliente existe', async () => {
    const counts = new Map<string, number>();
    const redis = {
      incr: jest.fn((key: string) => {
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        return next;
      }),
      expire: jest.fn(() => 1),
      ttl: jest.fn(() => 900),
      get: jest.fn((key: string) => {
        const value = counts.get(key);
        return value == null ? null : String(value);
      }),
      del: jest.fn((key: string) => {
        counts.delete(key);
        return 1;
      }),
    };
    const memory = new LoginAttemptsMemoryStore();
    const service = new LoginAttemptsService(redis as never, memory);

    await service.increment('login:10.0.0.8');
    await service.increment('login:10.0.0.8');
    expect(redis.expire).toHaveBeenCalledWith(
      'login_attempts:login:10.0.0.8',
      900,
    );
    await expect(service.getCount('login:10.0.0.8')).resolves.toMatchObject({
      count: 2,
    });
    await expect(memory.getCount('login:10.0.0.8')).resolves.toMatchObject({
      count: 0,
    });

    await service.reset('login:10.0.0.8');
    expect(redis.del).toHaveBeenCalledWith('login_attempts:login:10.0.0.8');
    await expect(service.getCount('login:10.0.0.8')).resolves.toMatchObject({
      count: 0,
    });
  });
});

describe('clearLoginAttemptStateForTests', () => {
  const previous = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = previous;
  });

  it('aísla suites: un bloqueo no sobrevive al siguiente test', async () => {
    process.env.NODE_ENV = 'test';
    const first = new LoginAttemptsMemoryStore();
    const second = new LoginAttemptsMemoryStore();
    await first.increment('login:127.0.0.1');
    await second.increment('login:127.0.0.1');

    clearLoginAttemptStateForTests();

    await expect(first.getCount('login:127.0.0.1')).resolves.toMatchObject({
      count: 0,
    });
    await expect(second.getCount('login:127.0.0.1')).resolves.toMatchObject({
      count: 0,
    });
  });

  it('rechaza limpiar fuera de test', () => {
    process.env.NODE_ENV = 'production';
    expect(() => clearLoginAttemptStateForTests()).toThrow(/NODE_ENV=test/);
  });
});
