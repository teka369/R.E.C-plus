import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { UserRole } from '../users/dto/user-role.enum';
// ConfigService no usado para evitar conflictos de versiones

type JwtPayload = {
  sub: number;
  role: UserRole;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no está definido');
    }
    const jwtExtractor = (req?: Request): string | null => {
      try {
        const cookieHeader = req?.headers?.cookie;
        if (cookieHeader) {
          const part = cookieHeader
            .split(';')
            .map((value) => value.trim())
            .find((value) => value.startsWith('rec_token='));
          if (part) {
            return decodeURIComponent(part.split('=').slice(1).join('='));
          }
        }

        const authorization = req?.headers?.authorization;
        if (!authorization) return null;
        const [scheme, token] = authorization.split(' ');
        if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
        return token;
      } catch {
        return null;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, role: payload.role, email: payload.email };
  }
}
