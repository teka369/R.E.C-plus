import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/')
  getRoot(): string {
    return 'R.E.C Backend API is running. Please refer to the documentation for available endpoints.';
  }

  /**
   * Misma semántica que GET /health (HealthController): el proceso responde
   * aunque Neon falle. No hay un segundo @Get aquí para no duplicar la ruta.
   */
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', service: 'r.e.c-backend', db: 'connected' };
    } catch {
      return {
        status: 'degraded',
        service: 'r.e.c-backend',
        db: 'disconnected',
      };
    }
  }
}
