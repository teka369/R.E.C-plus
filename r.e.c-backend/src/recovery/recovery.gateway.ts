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
import { RecoveryService } from './recovery.service';
import { CreateRecoveryMessageDto } from './dto';
import { UserRole } from '../users/dto/user-role.enum';

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

type RecoverySocket = Socket & {
  data: {
    user?: WsUser;
    requestId?: number;
    room?: string;
  };
};

@WebSocketGateway({
  namespace: '/recovery',
  cors: {
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3001')
      .split(/[\s,]+/)
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  },
})
// Deprecated: mantener temporalmente mientras AppGateway se estabiliza.
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class RecoveryGateway
  implements OnGatewayConnection<RecoverySocket>, OnGatewayDisconnect<RecoverySocket>
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly recoveryService: RecoveryService,
  ) {}

  private getToken(client: RecoverySocket): string | null {
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

  private getRequestId(client: RecoverySocket): number | null {
    const raw = client.handshake.query?.requestId;
    const requestId =
      typeof raw === 'string' ? Number(raw) : Array.isArray(raw) ? Number(raw[0]) : NaN;
    return Number.isInteger(requestId) && requestId > 0 ? requestId : null;
  }

  async handleConnection(client: RecoverySocket) {
    try {
      const token = this.getToken(client);
      const requestId = this.getRequestId(client);
      if (!token || !requestId) {
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

      await this.recoveryService.assertRequestAccess(actor, requestId);

      const room = this.recoveryService.buildRecoveryRoom(actor.institutionId, requestId);
      client.data.user = actor;
      client.data.requestId = requestId;
      client.data.room = room;
      await client.join(room);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: RecoverySocket) {
    const room = client.data.room;
    if (room) {
      void client.leave(room);
    }
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @ConnectedSocket() client: RecoverySocket,
    @MessageBody() payload: { requestId?: number; body: string },
  ) {
    const actor = client.data.user;
    const requestId = payload.requestId ?? client.data.requestId;
    if (!actor || !requestId) return;

    await this.recoveryService.assertRequestAccess(actor, requestId);
    const saved = await this.recoveryService.createMessage(actor, requestId, {
      body: payload.body,
    } as CreateRecoveryMessageDto);
    const room = this.recoveryService.buildRecoveryRoom(actor.institutionId, requestId);
    this.server.to(room).emit('newMessage', saved);
    return saved;
  }
}
