import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

type RequestWithUser = Request & {
  user?: { mustChangePassword?: boolean; userId?: number };
};

function isPasswordChangePath(req: Request): boolean {
  const path = (req.path || req.url || '').split('?')[0];
  const method = (req.method || '').toUpperCase();
  if (
    method === 'POST' &&
    (path === '/auth/logout' || path === '/auth/refresh')
  ) {
    return true;
  }
  if (method === 'GET' && path === '/users/me') return true;
  if (method === 'PATCH' && /^\/users\/[^/]+\/password$/.test(path))
    return true;
  if (method === 'GET' && (path === '/health' || path === '/')) return true;
  return false;
}

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    if (isPasswordChangePath(req)) return true;

    const fromUser = req.user?.mustChangePassword === true;
    const payload = fromUser
      ? { sub: req.user?.userId, mustChangePassword: true }
      : this.readClaim(req);
    if (!payload?.mustChangePassword || !payload.sub) return true;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { mustChangePassword: true },
    });
    if (!user?.mustChangePassword) return true;
    throw new ForbiddenException(
      'Debes cambiar la contraseña temporal antes de continuar.',
    );
  }

  private readClaim(
    req: Request,
  ): { sub: number; mustChangePassword: boolean } | null {
    const header = req.headers.authorization;
    if (
      typeof header !== 'string' ||
      !header.toLowerCase().startsWith('bearer ')
    ) {
      return null;
    }
    try {
      const payload = this.jwtService.verify<{
        sub?: number;
        mustChangePassword?: boolean;
      }>(header.slice(7).trim());
      if (typeof payload.sub !== 'number') return null;
      return {
        sub: payload.sub,
        mustChangePassword: payload.mustChangePassword === true,
      };
    } catch {
      return null;
    }
  }
}
