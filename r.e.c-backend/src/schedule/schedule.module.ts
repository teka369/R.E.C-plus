import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GatewayModule } from '../gateway/gateway.module';
import { FirebaseModule } from '../services/firebase.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GatewayModule,
    FirebaseModule,
    UsersModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
