import { Module } from '@nestjs/common'; 
import { RestoreController } from './restore.controller';
import { RestoreService } from './restore.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RestoreController],
  providers: [RestoreService],
})
export class RestoreModule {}
