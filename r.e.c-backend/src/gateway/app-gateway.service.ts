import { Injectable } from '@nestjs/common';
import { RecoveryService } from '../recovery/recovery.service';
import type { Server } from 'socket.io';

@Injectable()
export class AppGatewayService {
  private server: Server | null = null;

  constructor(private readonly recoveryService: RecoveryService) {}

  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: number, event: string, data: unknown) {
    if (!this.server || !Number.isInteger(userId) || userId <= 0) return;
    this.server.to(`user-${userId}`).emit(event, data);
  }

  emitToTenant(institutionId: number | null | undefined, event: string, data: unknown) {
    if (!this.server || !Number.isInteger(institutionId) || institutionId <= 0) return;
    this.server.to(`tenant-${institutionId}`).emit(event, data);
  }

  emitToRecovery(
    institutionId: number | null | undefined,
    requestId: number,
    event: string,
    data: unknown,
  ) {
    if (
      !this.server ||
      !Number.isInteger(institutionId) ||
      institutionId <= 0 ||
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      return;
    }
    const room = this.recoveryService.buildRecoveryRoom(institutionId, requestId);
    this.server.to(room).emit(event, data);
  }
}
