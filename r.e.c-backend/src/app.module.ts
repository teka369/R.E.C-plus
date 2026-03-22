import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
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
  ],
})
export class AppModule {}
