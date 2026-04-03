import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuditContextService } from './audit-context.service';

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  constructor(
    private readonly auditContext: AuditContextService,
    private readonly jwtService: JwtService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    let userId: number | undefined;
    let institutionId: number | undefined;

    const auth = req.headers.authorization;
    if (typeof auth === 'string') {
      const [scheme, token] = auth.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && token) {
        try {
          const payload = this.jwtService.verify<{
            sub: number;
            institutionId?: number | null;
          }>(token);
          userId = payload.sub;
          institutionId = payload.institutionId ?? undefined;
        } catch {
          // Token inválido — continúa sin contexto de usuario
        }
      }
    }

    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.auditContext.run(
      { userId, institutionId, ipAddress, userAgent },
      () => next(),
    );
  }
}
