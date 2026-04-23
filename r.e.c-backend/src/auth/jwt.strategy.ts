import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { extractAccessTokenFromRequest } from './jwt-from-request.util';
import { UserRole } from '../users/dto/user-role.enum';
// ConfigService no usado para evitar conflictos de versiones

type JwtPayload = {
  sub: number;
  role: UserRole;
  email: string;
  institutionId?: number | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no está definido');
    }
    const jwtExtractor = (req?: Request): string | null =>
      extractAccessTokenFromRequest(req);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new Error('JWT mal formado: falta sub (userId)');
    }
    return {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
      institutionId: payload.institutionId ?? null,
    };
  }
}
