import { authRouteThrottle } from '../../../src/auth/auth-throttle';
import { retryAfterSeconds } from '../../../src/common/guards/retry-after';

describe('authRouteThrottle', () => {
  const previous = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = previous;
  });

  it('conserva el límite de producción fuera de test', () => {
    process.env.NODE_ENV = 'production';
    const spec = authRouteThrottle(5, 900_000).default;
    expect(spec.limit()).toBe(5);
    expect(spec.ttl()).toBe(900_000);
  });

  it('relaja el límite en test para que la suite no comparta un cupo de 5 logins', () => {
    process.env.NODE_ENV = 'test';
    const spec = authRouteThrottle(5, 900_000).default;
    expect(spec.limit()).toBe(10_000);
    expect(spec.ttl()).toBe(1_000);
  });
});

describe('retryAfterSeconds', () => {
  it('no convierte 900 segundos en 1', () => {
    expect(
      retryAfterSeconds({
        timeToExpire: 900,
        timeToBlockExpire: 900,
        isBlocked: true,
      }),
    ).toBe(900);
  });

  it('usa al menos 1 segundo', () => {
    expect(
      retryAfterSeconds({
        timeToExpire: 0,
        timeToBlockExpire: 0,
        isBlocked: true,
      }),
    ).toBe(1);
  });
});
