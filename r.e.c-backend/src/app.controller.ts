import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/')
  getRoot(): string {
    return 'R.E.C Backend API is running. Please refer to the documentation for available endpoints.';
  }

  @Get('/health')
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', service: 'r.e.c-backend', db: 'connected' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'r.e.c-backend',
        db: 'disconnected',
      });
    }
  }
}
