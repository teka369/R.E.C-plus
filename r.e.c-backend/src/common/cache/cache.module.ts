import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { RedisCacheService } from './cache.service';

/**
 * En test no se abre Redis: `@nestjs/cache-manager` v3 no cierra el cliente
 * creado por `redisStore()`, y ese handle impide que Jest termine.
 * El bloqueo de login sigue usando su propio cliente, que sí hace `quit()`.
 */
export function shouldUseRedisCache(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(env.REDIS_URL) && env.NODE_ENV !== 'test';
}

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl || !shouldUseRedisCache()) {
          return { ttl: 300_000 };
        }
        const store = await redisStore({ url: redisUrl });
        return { store, ttl: 300_000 };
      },
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
