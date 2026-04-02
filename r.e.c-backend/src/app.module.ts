import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { RedisCacheModule } from './common/cache/cache.module';
import { HealthModule } from './health/health.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppLoggerService } from './logger/logger.service';
import { LoggerModule as CustomLoggerModule } from './logger/logger.module';

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
    // ttl en milisegundos (v5+): 60_000ms = 60 segundos, 100 req/min global
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
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
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
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
export class AppModule {}
