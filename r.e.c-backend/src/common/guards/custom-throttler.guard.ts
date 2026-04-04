import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // Usar el userId autenticado si disponible, de lo contrario IP del cliente
    const user = req.user as { userId?: number } | undefined;
    if (user?.userId) {
      return `user-${user.userId}`;
    }
    // req.ip respeta trust proxy; x-forwarded-for como fallback
    const ip =
      (req.ip as string) ??
      (req.ips as string[] | undefined)?.[0] ??
      (req.socket as { remoteAddress?: string } | undefined)?.remoteAddress ??
      'unknown';
    return ip;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const res = context.switchToHttp().getResponse();
    const secondsRemaining = Math.ceil(
      throttlerLimitDetail.timeToExpire / 1000,
    );
    res.header('Retry-After', String(secondsRemaining));
    throw new ThrottlerException(
      `Has superado el número de intentos permitidos. Por favor, espera ${secondsRemaining} segundos antes de realizar una nueva solicitud.`,
    );
  }
}
