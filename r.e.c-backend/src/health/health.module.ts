import { Module, OnModuleInit } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [InternalApiKeyGuard],
})
export class HealthModule implements OnModuleInit {
  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const key = process.env.INTERNAL_API_KEY?.trim();
    if (!key) {
      throw new Error(
        'INTERNAL_API_KEY es obligatoria: protege GET /health/metrics (header x-internal-key).',
      );
    }
  }
}
