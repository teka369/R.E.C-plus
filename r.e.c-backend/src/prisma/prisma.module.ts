import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditContextService } from '../common/audit-context.service';

@Module({
  providers: [AuditContextService, PrismaService],
  exports: [AuditContextService, PrismaService],
})
export class PrismaModule {}
