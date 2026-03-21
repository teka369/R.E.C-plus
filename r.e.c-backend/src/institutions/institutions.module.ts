import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstitutionsService } from './institutions.service';
import { InstitutionsController } from './institutions.controller';

@Module({
  imports: [PrismaModule],
  providers: [InstitutionsService],
  controllers: [InstitutionsController],
})
export class InstitutionsModule {}
