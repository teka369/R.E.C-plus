import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import * as os from 'node:os';
import { PrismaService } from '../prisma/prisma.service';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';

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

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @SkipThrottle()
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
      dbStatus === 'down'
        ? 'down'
        : dbStatus === 'degraded'
          ? 'degraded'
          : 'ok';

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

  @UseGuards(InternalApiKeyGuard)
  @Get('metrics')
  metrics() {
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
      cpu: {
        percent: this.approxSystemCpuPercent(),
      },
    };
  }

  /** Porcentaje aproximado de CPU ocupada (todas las CPUs), a partir de tiempos acumulados del SO. */
  private approxSystemCpuPercent(): number {
    const cpus = os.cpus();
    if (cpus.length === 0) {
      return 0;
    }
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      const t = cpu.times;
      idle += t.idle;
      total += t.user + t.nice + t.sys + t.idle + t.irq;
    }
    if (total <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((1 - idle / total) * 100)));
  }
}
