import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { ServerOptions } from 'socket.io';

function socketCorsOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001')
    .split(/[\s,]+/)
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * CORS del motor Socket.io alineado con `CORS_ORIGIN` (mismo origen que HTTP en main.ts).
 * Con Redis adapter multi-instancia si REDIS_URL está configurado.
 */
export class RecSocketIoAdapter extends IoAdapter {
  constructor(app: INestApplication) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const origins = socketCorsOrigins();
    const serverOptions = {
      ...options,
      cors: {
        origin: origins,
        credentials: true,
      },
    } as ServerOptions;

    const server = super.createIOServer(port, serverOptions);

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      const pubClient = new Redis(redisUrl);
      const subClient = pubClient.duplicate();
      server.adapter(createAdapter(pubClient, subClient));
    }

    return server;
  }
}
