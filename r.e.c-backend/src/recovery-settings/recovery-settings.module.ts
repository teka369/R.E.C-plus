import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RecoverySettingsController } from './recovery-settings.controller';
import { RecoverySettingsService } from './recovery-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecoverySettingsController],
  providers: [RecoverySettingsService],
})
export class RecoverySettingsModule {}
