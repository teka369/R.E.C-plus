import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerLimitDetail,
  getOptionsToken,
  getStorageToken,
} from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import type { Request } from 'express';
import { extractAccessTokenFromRequest } from '../../auth/jwt-from-request.util';
import { clientIpFromExpressRequest } from '../../auth/client-ip.util';

function userIdFromJwtPayload(sub: unknown): number | null {
  if (typeof sub === 'number' && Number.isFinite(sub) && sub > 0) {
    return sub;
  }
  if (typeof sub === 'string') {
    const n = parseInt(sub, 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return null;
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    @Inject(getStorageToken()) storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const r = req as unknown as Request & { user?: { userId?: number } };
    const user = r.user;
    if (user?.userId != null) {
      return `user:${user.userId}`;
    }

    const token = extractAccessTokenFromRequest(r);
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub?: unknown }>(
          token,
        );
        const uid = userIdFromJwtPayload(payload?.sub);
        if (uid != null) {
          return `user:${uid}`;
        }
      } catch {
        // Token inválido o expirado: continuar con visitor / IP
      }
    }

    return `ip:${clientIpFromExpressRequest(r)}`;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const res = context.switchToHttp().getResponse<{
      header: (name: string, value: string) => void;
    }>();
    const secondsRemaining = Math.ceil(
      throttlerLimitDetail.timeToExpire / 1000,
    );
    res.header('Retry-After', String(secondsRemaining));
    await Promise.resolve();
    throw new ThrottlerException(
      `Has superado el número de intentos permitidos. Por favor, espera ${secondsRemaining} segundos antes de realizar una nueva solicitud.`,
    );
  }
}
