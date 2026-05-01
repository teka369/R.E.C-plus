import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RecoveryModule } from '../recovery/recovery.module';
import { AppGateway } from './app.gateway';
import { AppGatewayService } from './app-gateway.service';

@Module({
  imports: [AuthModule, PrismaModule, RecoveryModule],
  providers: [AppGateway, AppGatewayService],
  exports: [AppGatewayService],
})
export class GatewayModule {}
