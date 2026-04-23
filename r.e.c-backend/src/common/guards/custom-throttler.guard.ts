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
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import type { Request } from 'express';
import { extractAccessTokenFromRequest } from '../../auth/jwt-from-request.util';

/** UUID v4 enviado por el BFF Next.js (cookie httpOnly `rec_rl_vid`) cuando la IP vista por Nest no distingue visitantes. */
const VISITOR_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
        const payload = await this.jwtService.verifyAsync<{ sub?: unknown }>(token);
        const uid = userIdFromJwtPayload(payload?.sub);
        if (uid != null) {
          return `user:${uid}`;
        }
      } catch {
        // Token inválido o expirado: continuar con visitor / IP
      }
    }

    const rawVisitor = r.headers['x-visitor-id'];
    const visitorId = Array.isArray(rawVisitor)
      ? rawVisitor[0]?.trim() ?? ''
      : typeof rawVisitor === 'string'
        ? rawVisitor.trim()
        : '';
    if (visitorId && VISITOR_UUID_RE.test(visitorId)) {
      return `visitor:${visitorId}`;
    }

    const xff = r.headers['x-forwarded-for'];
    const xffStr = Array.isArray(xff) ? xff.join(',') : xff;
    if (typeof xffStr === 'string' && xffStr.length > 0) {
      const first = xffStr.split(',')[0]?.trim();
      if (first) {
        return `ip:${first}`;
      }
    }

    const ip =
      r.ip ??
      (Array.isArray(r.ips) && r.ips.length > 0 ? r.ips[0] : undefined) ??
      r.socket?.remoteAddress ??
      'unknown';
    return `ip:${ip}`;
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
