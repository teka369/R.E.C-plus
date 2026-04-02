import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

type HealthStatus = 'ok' | 'degraded' | 'down';

type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: HealthStatus;
      latency?: number;
    };
  };
};

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const startTime = Date.now();
    let dbStatus: HealthStatus = 'down';
    let dbLatency: number | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - startTime;
      dbStatus = dbLatency < 100 ? 'ok' : 'degraded';
    } catch {
      dbStatus = 'down';
    }

    const overallStatus: HealthStatus =
      dbStatus === 'down' ? 'down' : dbStatus === 'degraded' ? 'degraded' : 'ok';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      services: {
        database: {
          status: dbStatus,
          latency: dbLatency,
        },
      },
    };
  }

  @Get('metrics')
  async metrics() {
    const memoryUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
      },
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
    };
  }
}
