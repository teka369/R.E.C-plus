import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import type { ServerOptions } from 'socket.io';

function socketCorsOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001')
    .split(/[\s,]+/)
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * CORS del motor Socket.io alineado con `CORS_ORIGIN` (mismo origen que HTTP en main.ts).
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
    return super.createIOServer(port, serverOptions);
  }
}
