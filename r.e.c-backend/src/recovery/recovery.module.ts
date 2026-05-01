import { Module } from '@nestjs/common';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './recovery.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RecoveryGateway } from './recovery.gateway';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RecoveryController],
  providers: [RecoveryService, RecoveryGateway],
  exports: [RecoveryService],
})
export class RecoveryModule {}
