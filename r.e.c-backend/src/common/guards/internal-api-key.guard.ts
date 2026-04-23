import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * Protege rutas internas (p. ej. GET /health/metrics) con un secreto compartido.
 *
 * El cliente debe enviar el mismo valor que `INTERNAL_API_KEY` en el header
 * `x-internal-key` (comparación en tiempo constante). La variable debe estar
 * definida en entornos distintos de `test` (validación en `HealthModule.onModuleInit`).
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.INTERNAL_API_KEY?.trim();
    if (!expected) {
      throw new UnauthorizedException();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const raw = req.headers['x-internal-key'];
    const provided =
      typeof raw === 'string'
        ? raw.trim()
        : Array.isArray(raw)
          ? (raw[0]?.trim() ?? '')
          : '';

    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
