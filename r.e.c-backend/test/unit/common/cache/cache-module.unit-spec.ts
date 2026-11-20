import { shouldUseRedisCache } from '../../../../src/common/cache/cache.module';

describe('shouldUseRedisCache', () => {
  it('no abre Redis en test aunque REDIS_URL exista', () => {
    expect(
      shouldUseRedisCache({
        NODE_ENV: 'test',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toBe(false);
  });

  it('usa Redis fuera de test cuando hay URL', () => {
    expect(
      shouldUseRedisCache({
        NODE_ENV: 'production',
        REDIS_URL: 'redis://localhost:6379',
      }),
    ).toBe(true);
  });

  it('no usa Redis sin URL', () => {
    expect(shouldUseRedisCache({ NODE_ENV: 'production' })).toBe(false);
  });
});
