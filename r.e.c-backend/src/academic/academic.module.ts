import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
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
  controllers: [AcademicController],
  providers: [AcademicService],
})
export class AcademicModule {}
