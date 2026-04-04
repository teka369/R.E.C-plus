import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
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
import { LoggerModule as CustomLoggerModule } from './logger/logger.module';
import { AuditContextMiddleware } from './common/audit-context.middleware';
import { RestoreModule } from './admin/restore/restore.module';

@Module({
  imports: [
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
    // Si REDIS_URL está configurado, persiste contadores en Redis (survives restarts)
    // Si no, usa in-memory (dev/test)
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        const isTest = process.env.NODE_ENV === 'test';
        return {
          throttlers: [{ ttl: 60_000, limit: isTest ? 10_000 : 100 }],
          storage:
            redisUrl && !isTest
              ? new ThrottlerStorageRedisService(redisUrl)
              : undefined,
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}
