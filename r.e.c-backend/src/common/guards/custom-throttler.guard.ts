import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Usar el userId autenticado si disponible, de lo contrario IP del cliente
    const user = (req as unknown as Record<string, unknown>).user as
      | { userId?: number }
      | undefined;
    if (user?.userId) {
      return `user-${user.userId}`;
    }
    // req.ip respeta trust proxy si está habilitado
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerResponse: { timeToExpire: number; limit: number; ttl: number },
  ): Promise<void> {
    const res = context.switchToHttp().getResponse();
    const secondsRemaining = Math.ceil(throttlerResponse.timeToExpire / 1000);
    res.header('Retry-After', String(secondsRemaining));
    throw new ThrottlerException(
      `Has superado el número de intentos permitidos. Por favor, espera ${secondsRemaining} segundos antes de realizar una nueva solicitud.`,
    );
  }
}
