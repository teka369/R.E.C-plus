import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'crypto';
import type { StringValue } from 'ms';

type AuthInstitution = {
  id: number;
  nombre: string;
  slug: string;
  activa: boolean;
};

type AuthUser = {
  id: number;
  publicId: string;
  nombres: string;
  apellidos: string;
  email: string;
  role: string;
  institutionId: number | null;
  institution: AuthInstitution | null;
  password?: string;
};

type AuthUserView = {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  role: string;
  institutionId: number | null;
  institution: AuthInstitution | null;
};

type TokenPayload = {
  sub: number;
  role: string;
  email: string;
  institutionId: number | null;
};

type RefreshPayload = {
  sub: number;
  type: 'refresh';
  jti: string;
};

type DecodedWithExp = {
  exp: number;
};

export type AuthTokensResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUserView;
};

function isDecodedWithExp(value: unknown): value is DecodedWithExp {
  if (!value || typeof value !== 'object' || !('exp' in value)) {
    return false;
  }
  const candidate = value as { exp?: unknown };
  return typeof candidate.exp === 'number';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  private getRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? '';
  }

  private getRefreshExpiresIn(): string {
    return process.env.JWT_REFRESH_EXPIRES ?? '30d';
  }

  private async issueAccessToken(payload: TokenPayload): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  private async createRefreshSession(userId: number): Promise<{
    refreshToken: string;
    jti: string;
    expiresAt: Date;
    tokenHash: string;
  }> {
    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, type: 'refresh', jti },
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshExpiresIn() as StringValue,
      },
    );

    const decoded: unknown = this.jwt.decode(refreshToken);
    if (!isDecodedWithExp(decoded)) {
      throw new UnauthorizedException('Token de refresh inválido');
    }

    return {
      refreshToken,
      jti,
      expiresAt: new Date(decoded.exp * 1000),
      tokenHash: await bcrypt.hash(refreshToken, 10),
    };
  }

  private mapUser(user: AuthUser): AuthUserView {
    return {
      id: user.publicId,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ?? null,
      institution: user.institution
        ? {
            id: user.institution.id,
            nombre: user.institution.nombre,
            slug: user.institution.slug,
            activa: user.institution.activa,
          }
        : null,
    };
  }

  private async issueTokensForUser(user: AuthUser): Promise<{
    response: AuthTokensResponse;
    sessionId: number;
  }> {
    const accessPayload: TokenPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      institutionId: user.institutionId ?? null,
    };
    const accessToken = await this.issueAccessToken(accessPayload);
    const refreshSession = await this.createRefreshSession(user.id);

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        jti: refreshSession.jti,
        tokenHash: refreshSession.tokenHash,
        expiresAt: refreshSession.expiresAt,
      },
    });

    return {
      response: {
        access_token: accessToken,
        refresh_token: refreshSession.refreshToken,
        user: this.mapUser(user),
      },
      sessionId: session.id,
    };
  }

  async validateUser(email: string, password: string): Promise<AuthUser> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        institution: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            activa: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    // Comparación estricta con hashing (sin compatibilidad texto plano)
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    if (
      user.role !== 'SUPER_ADMIN' &&
      user.institution &&
      user.institution.activa === false
    ) {
      throw new UnauthorizedException('La institución está inactiva');
    }
    return user;
  }

  async login(email: string, password: string): Promise<AuthTokensResponse> {
    const user = await this.validateUser(email, password);
    const issued = await this.issueTokensForUser({
      id: user.id,
      publicId: user.publicId,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ?? null,
      institution: user.institution
        ? {
            id: user.institution.id,
            nombre: user.institution.nombre,
            slug: user.institution.slug,
            activa: user.institution.activa,
          }
        : null,
    });
    return issued.response;
  }

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
      secret: this.getRefreshSecret(),
    });

    if (payload.type !== 'refresh' || !payload.jti || !payload.sub) {
      throw new UnauthorizedException('Token de refresh inválido');
    }

    const session = await this.prisma.authSession.findUnique({
      where: { jti: payload.jti },
    });
    if (!session) {
      throw new UnauthorizedException('Sesión inválida');
    }
    if (session.userId !== payload.sub) {
      throw new UnauthorizedException('Sesión inválida');
    }
    if (session.revokedAt) {
      throw new UnauthorizedException('Sesión revocada');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Sesión expirada');
    }
    const matches = await bcrypt.compare(refreshToken, session.tokenHash);
    if (!matches) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        institution: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            activa: true,
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Bloquear refresh si la institución fue inactivada
    if (user.institution && !user.institution.activa) {
      // Revocar la sesión actual para evitar reintentos
      await this.prisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('La institución está inactiva');
    }

    const issued = await this.issueTokensForUser({
      id: user.id,
      publicId: user.publicId,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId ?? null,
      institution: user.institution
        ? {
            id: user.institution.id,
            nombre: user.institution.nombre,
            slug: user.institution.slug,
            activa: user.institution.activa,
          }
        : null,
    });

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        replacedById: issued.sessionId,
      },
    });

    return issued.response;
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
      secret: this.getRefreshSecret(),
    });

    if (!payload.jti) {
      throw new UnauthorizedException('Token de refresh inválido');
    }

    const session = await this.prisma.authSession.findUnique({
      where: { jti: payload.jti },
    });
    if (!session) {
      return;
    }

    if (!session.revokedAt) {
      await this.prisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async recoverByCode(codigo: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { codigo },
    });

    // No revelar si el código existe
    if (!user) return null;

    // Invalidar tokens previos no usados
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    return token;
  }

  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Siempre responder OK para no revelar si el email existe
    if (!user) return;

    // Invalidar tokens previos no usados
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'FRONTEND_URL no está configurada. No se puede generar el enlace de recuperación en producción.',
        );
      }
      // Solo en desarrollo se permite fallback a localhost
    }
    const resetUrl = `${frontendUrl || 'http://localhost:3000'}/reset-password?token=${token}`;

    await this.mail.sendPasswordReset(user.email, resetUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'El enlace de restablecimiento es inválido o ha expirado.',
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revocar todas las sesiones activas del usuario
      this.prisma.authSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
