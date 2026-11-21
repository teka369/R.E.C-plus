import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { extractAccessTokenFromRequest } from './jwt-from-request.util';
import { UserRole } from '../users/dto/user-role.enum';
import { PrismaService } from '../prisma/prisma.service';

type JwtPayload = {
  sub: number;
  role: UserRole;
  email: string;
  institutionId?: number | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no está definido');
    }
    const jwtExtractor = (req?: Request): string | null =>
      extractAccessTokenFromRequest(req);

    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
      issuer: configService.get<string>('JWT_ISSUER'),
      audience: configService.get<string>('JWT_AUDIENCE'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new Error('JWT mal formado: falta sub (userId)');
    }

    // Revalidación contra la base de datos cuando Prisma está disponible.
    // Evita que tokens emitidos en el pasado mantengan permisos obsoletos
    // (usuario desactivado/eliminado, institución desactivada, cambio de rol).
    if (this.prisma && process.env.NODE_ENV !== 'test') {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, deletedAt: true, role: true, institutionId: true },
      });
      if (!user || user.deletedAt) {
        throw new UnauthorizedException(
          'Sesión inválida o usuario desactivado',
        );
      }
      if (
        user.institutionId &&
        user.institutionId !== (payload.institutionId ?? null)
      ) {
        throw new UnauthorizedException('Contexto de institución obsoleto');
      }
      if (String(user.role) !== String(payload.role)) {
        throw new UnauthorizedException(
          'Rol obsoleto; vuelve a iniciar sesión',
        );
      }
      // Verificar institución activa
      if (user.institutionId) {
        const inst = await this.prisma.institution.findUnique({
          where: { id: user.institutionId },
          select: { activa: true },
        });
        if (!inst?.activa) {
          throw new UnauthorizedException('Institución desactivada');
        }
      }
    }

    return {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
      institutionId: payload.institutionId ?? null,
    };
  }
}
