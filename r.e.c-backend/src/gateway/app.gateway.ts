import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { RecoveryService } from '../recovery/recovery.service';
import { UserRole } from '../users/dto/user-role.enum';
import { AppGatewayService } from './app-gateway.service';

type JwtPayload = {
  sub: number;
  role: UserRole;
  email: string;
  institutionId?: number | null;
};

type WsUser = {
  userId: number;
  role: UserRole;
  institutionId?: number | null;
};

type AppSocket = Socket & {
  data: {
    user?: WsUser;
  };
};

@WebSocketGateway({
  namespace: '/app',
  cors: {
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001')
      .split(/[\s,]+/)
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class AppGateway
  implements OnGatewayConnection<AppSocket>, OnGatewayDisconnect<AppSocket>
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly recoveryService: RecoveryService,
    private readonly appGatewayService: AppGatewayService,
  ) {}

  private getToken(client: AppSocket): string | null {
    const authToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : null;
    if (authToken) return authToken;

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
      return header.slice(7).trim();
    }

    const queryToken =
      typeof client.handshake.query?.token === 'string'
        ? client.handshake.query.token
        : null;
    return queryToken;
  }

  private getRecoveryRoom(actor: WsUser, requestId: number) {
    return this.recoveryService.buildRecoveryRoom(actor.institutionId, requestId);
  }

  async handleConnection(client: AppSocket) {
    try {
      const token = this.getToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      const actor: WsUser = {
        userId: payload.sub,
        role: payload.role,
        institutionId: payload.institutionId ?? null,
      };

      client.data.user = actor;
      await client.join(`tenant-${actor.institutionId ?? 'global'}`);
      await client.join(`user-${actor.userId}`);
      this.appGatewayService.setServer(this.server);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    // Socket.IO libera rooms al desconectar; no cleanup adicional requerido.
  }

  @SubscribeMessage('joinRecovery')
  async onJoinRecovery(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() payload: { requestId: number },
  ) {
    const actor = client.data.user;
    if (!actor || !payload?.requestId) return;
    await this.recoveryService.assertRequestAccess(actor, payload.requestId);
    await client.join(this.getRecoveryRoom(actor, payload.requestId));
  }

  @SubscribeMessage('leaveRecovery')
  async onLeaveRecovery(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() payload: { requestId: number },
  ) {
    const actor = client.data.user;
    if (!actor || !payload?.requestId) return;
    await client.leave(this.getRecoveryRoom(actor, payload.requestId));
  }

  @SubscribeMessage('sendRecoveryMessage')
  async onSendRecoveryMessage(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() payload: { requestId: number; body: string },
  ) {
    const actor = client.data.user;
    if (!actor || !payload?.requestId) return;

    await this.recoveryService.assertRequestAccess(actor, payload.requestId);
    const saved = await this.recoveryService.createMessage(actor, payload.requestId, {
      body: payload.body,
    });
    const room = this.getRecoveryRoom(actor, payload.requestId);
    this.server.to(room).emit('recovery:newMessage', saved);
    return saved;
  }
}
