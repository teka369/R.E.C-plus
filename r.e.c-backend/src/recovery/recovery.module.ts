import { Module, forwardRef } from '@nestjs/common';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './recovery.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RecoveryGateway } from './recovery.gateway';
import { GatewayModule } from '../gateway/gateway.module';
import { FirebaseModule } from '../services/firebase.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => GatewayModule),
    FirebaseModule,
    UsersModule,
  ],
  controllers: [RecoveryController],
  providers: [RecoveryService, RecoveryGateway],
  exports: [RecoveryService],
})
export class RecoveryModule {}
