import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
// ConfigService no usado para evitar conflictos de versiones

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no está definido');
    }
    // Extrae JWT preferentemente desde cookie 'rec_token', con fallback al header Authorization
    const cookieExtractor = (req: any): string | null => {
      try {
        const raw = req?.headers?.cookie as string | undefined;
        if (!raw) return null;
        const part = raw
          .split(';')
          .map((s) => s.trim())
          .find((s) => s.startsWith('rec_token='));
        if (!part) return null;
        return decodeURIComponent(part.split('=').slice(1).join('='));
      } catch {
        return null;
      }
    };
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, role: payload.role, email: payload.email };
  }
}