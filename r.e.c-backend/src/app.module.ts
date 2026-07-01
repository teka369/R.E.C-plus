import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { UsersModule } from './users/users.module';
import { AcademicModule } from './academic/academic.module';
import { MaterialsModule } from './materials/materials.module';
import { RecoveryModule } from './recovery/recovery.module';
import { ScheduleModule } from './schedule/schedule.module';
import { CommunicationModule } from './communication/communication.module';
import { PerformanceModule } from './performance/performance.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RecoverySettingsModule } from './recovery-settings/recovery-settings.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { TenantBoundaryGuard } from './common/guards/tenant-boundary.guard';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { RedisCacheModule } from './common/cache/cache.module';
import { HealthModule } from './health/health.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { LoggerModule as CustomLoggerModule } from './logger/logger.module';
import { AuditContextMiddleware } from './common/audit-context.middleware';
import { RestoreModule } from './admin/restore/restore.module';
import { GatewayModule } from './gateway/gateway.module';
import { FirebaseModule } from './services/firebase.module';

const throttlerRedisLog = new Logger('ThrottlerRedis');

/** Si REDIS_URL está definido pero Redis no responde, evita 500 en login (throttler). */
async function redisThrottlerStorageOrUndefined(
  redisUrl: string,
): Promise<ThrottlerStorageRedisService | undefined> {
  const probe = new Redis(redisUrl, {
    connectTimeout: 2500,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  try {
    await probe.connect();
    await probe.ping();
    await probe.quit();
    return new ThrottlerStorageRedisService(redisUrl);
  } catch {
    try {
      probe.disconnect();
    } catch {
      /* noop */
    }
    return undefined;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_ISSUER: Joi.string().required(),
        JWT_AUDIENCE: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES: Joi.string().default('15m'),
      }).unknown(true),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        redact: ['req.headers.authorization'],
        serializers: {
          req(req: { method: string; url: string }) {
            return { method: req.method, url: req.url };
          },
        },
      },
    }),
    // ttl en milisegundos (v6+): 60_000ms = 60 segundos, 100 req/min global
    // Redis solo si REDIS_URL responde; si no, memoria (evita 500 con REDIS_URL mal o Redis caído)
    ThrottlerModule.forRootAsync({
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL;
        const isTest = process.env.NODE_ENV === 'test';
        let storage: ThrottlerStorageRedisService | undefined;
        if (redisUrl && !isTest) {
          storage = await redisThrottlerStorageOrUndefined(redisUrl);
          if (!storage) {
            throttlerRedisLog.warn(
              'Redis no alcanzable para rate limit; usando memoria del proceso',
            );
          }
        }
        return {
          throttlers: [{ ttl: 60_000, limit: isTest ? 10_000 : 100 }],
          storage,
        };
      },
    }),
    UsersModule,
    AcademicModule,
    MaterialsModule,
    RecoveryModule,
    ScheduleModule,
    CommunicationModule,
    PerformanceModule,
    RecoverySettingsModule,
    InstitutionsModule,
    AuthModule,
    PrismaModule,
    RedisCacheModule,
    HealthModule,
    CustomLoggerModule,
    RestoreModule,
    GatewayModule,
    FirebaseModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantBoundaryGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}
