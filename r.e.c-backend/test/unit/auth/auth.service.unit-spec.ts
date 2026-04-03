import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  AuthService,
  type AuthTokensResponse,
} from '../../../src/auth/auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService (unit)', () => {
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    authSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const jwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };

  const mail = {
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };

  let service: AuthService;
  const compareMock = bcrypt.compare as jest.Mock;
  const hashMock = bcrypt.hash as jest.Mock;

  const fakeUser = {
    id: 10,
    publicId: 'uuid-user-10',
    nombres: 'Ana',
    apellidos: 'Perez',
    email: 'ana@test.dev',
    password: 'hash-db',
    role: 'SECRETARIA',
    institutionId: 2,
    institution: { id: 2, nombre: 'Colegio', slug: 'colegio', activa: true },
  };

  const setupTokenIssuance = () => {
    jwt.signAsync
      .mockResolvedValueOnce('access-token-1')
      .mockResolvedValueOnce('refresh-token-1');
    jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    hashMock.mockResolvedValue('refresh-hash-1');
    prisma.authSession.create.mockResolvedValue({ id: 999 });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'unit-secret';
    process.env.JWT_REFRESH_SECRET = 'unit-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES = '30d';
    prisma.authSession.create.mockResolvedValue({ id: 999 });
    service = new AuthService(prisma as never, jwt as never, mail as never);
  });

  // ─── login ─────────────────────────────────────────────────────────────

  describe('login', () => {
    it('entrega access y refresh y persiste sesión', async () => {
      prisma.user.findUnique.mockResolvedValue(fakeUser);
      compareMock.mockResolvedValue(true);
      setupTokenIssuance();

      const result: AuthTokensResponse = await service.login(
        ' ana@test.dev ',
        'Password!',
      );

      expect(result.access_token).toBe('access-token-1');
      expect(result.refresh_token).toBe('refresh-token-1');
      expect(prisma.authSession.create).toHaveBeenCalled();
      expect(result.user).toMatchObject({
        id: 'uuid-user-10',
        role: 'SECRETARIA',
        institutionId: 2,
      });
    });

    it('normaliza email con trim y toLowerCase', async () => {
      prisma.user.findUnique.mockResolvedValue(fakeUser);
      compareMock.mockResolvedValue(true);
      setupTokenIssuance();

      await service.login('  ANA@Test.DEV  ', 'Password!');

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'ana@test.dev' },
        }),
      );
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('noexiste@test.dev', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue(fakeUser);
      compareMock.mockResolvedValue(false);

      await expect(service.login('ana@test.dev', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lanza UnauthorizedException si la institución está inactiva', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...fakeUser,
        institution: { ...fakeUser.institution, activa: false },
      });
      compareMock.mockResolvedValue(true);

      await expect(service.login('ana@test.dev', 'Password!')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('permite login de SUPER_ADMIN con institución inactiva', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...fakeUser,
        role: 'SUPER_ADMIN',
        institution: { ...fakeUser.institution, activa: false },
      });
      compareMock.mockResolvedValue(true);
      setupTokenIssuance();

      const result = await service.login('ana@test.dev', 'Password!');
      expect(result.access_token).toBeDefined();
    });

    it('mapea usuario sin institución correctamente', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...fakeUser,
        role: 'SUPER_ADMIN',
        institutionId: null,
        institution: null,
      });
      compareMock.mockResolvedValue(true);
      setupTokenIssuance();

      const result = await service.login('ana@test.dev', 'Password!');
      expect(result.user.institution).toBeNull();
      expect(result.user.institutionId).toBeNull();
    });
  });

  // ─── refresh ───────────────────────────────────────────────────────────

  describe('refresh', () => {
    const oldSession = {
      id: 50,
      userId: 10,
      jti: 'old-jti',
      tokenHash: 'old-hash',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };

    it('rota sesión, revoca token anterior y emite nuevos tokens', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: 'old-jti',
      });
      prisma.authSession.findUnique.mockResolvedValueOnce(oldSession);
      compareMock.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(fakeUser);
      jwt.signAsync
        .mockResolvedValueOnce('access-token-2')
        .mockResolvedValueOnce('new-refresh-token');
      jwt.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      hashMock.mockResolvedValue('refresh-hash-2');

      const result = await service.refresh('old-refresh-token');

      expect(result.access_token).toBe('access-token-2');
      expect(result.refresh_token).toBe('new-refresh-token');
      expect(prisma.authSession.update).toHaveBeenCalled();
      const updateCall = prisma.authSession.update.mock.calls[0][0];
      expect(updateCall.where.id).toBe(50);
      expect(updateCall.data.revokedAt).toBeInstanceOf(Date);
    });

    it('rechaza token con type distinto de refresh', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'access',
        jti: 'some-jti',
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza token sin jti', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: null,
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza si la sesión no existe', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: 'ghost-jti',
      });
      prisma.authSession.findUnique.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza si userId no coincide con la sesión', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 999,
        type: 'refresh',
        jti: 'old-jti',
      });
      prisma.authSession.findUnique.mockResolvedValue(oldSession);

      await expect(service.refresh('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza sesión revocada', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: 'old-jti',
      });
      prisma.authSession.findUnique.mockResolvedValue({
        ...oldSession,
        revokedAt: new Date(),
      });

      await expect(service.refresh('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza sesión expirada', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: 'old-jti',
      });
      prisma.authSession.findUnique.mockResolvedValue({
        ...oldSession,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(service.refresh('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza si tokenHash no coincide', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: 'old-jti',
      });
      prisma.authSession.findUnique.mockResolvedValue(oldSession);
      compareMock.mockResolvedValue(false);

      await expect(service.refresh('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza si el usuario ya no existe en DB', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: 'old-jti',
      });
      prisma.authSession.findUnique.mockResolvedValue(oldSession);
      compareMock.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── logout ────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revoca la sesión activa del refresh token', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: 'old-jti',
      });
      prisma.authSession.findUnique.mockResolvedValue({
        id: 50,
        userId: 10,
        jti: 'old-jti',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await service.logout('old-refresh-token');

      expect(prisma.authSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 50 },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('no hace update si la sesión no existe', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: 'ghost',
      });
      prisma.authSession.findUnique.mockResolvedValue(null);

      await service.logout('token');

      expect(prisma.authSession.update).not.toHaveBeenCalled();
    });

    it('no hace update si la sesión ya estaba revocada', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 10,
        type: 'refresh',
        jti: 'old-jti',
      });
      prisma.authSession.findUnique.mockResolvedValue({
        id: 50,
        revokedAt: new Date(),
      });

      await service.logout('token');

      expect(prisma.authSession.update).not.toHaveBeenCalled();
    });

    it('lanza si el token es inválido (sin jti)', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 10, type: 'refresh' });

      await expect(service.logout('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── recoverByCode ────────────────────────────────────────────────────

  describe('recoverByCode', () => {
    it('retorna token de reset para un usuario válido', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 5 });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({ token: 'tok' });

      const result = await service.recoverByCode('COD123');

      expect(result).toEqual(expect.any(String));
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });

    it('retorna null si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.recoverByCode('NOEXISTE');

      expect(result).toBeNull();
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('invalida tokens previos no usados', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 5 });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 2 });
      prisma.passwordResetToken.create.mockResolvedValue({ token: 'new' });

      await service.recoverByCode('COD123');

      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 5, usedAt: null },
        }),
      );
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('envía email de reset para un usuario existente', async () => {
      process.env.FRONTEND_URL = 'https://app.recedu.co';
      prisma.user.findUnique.mockResolvedValue({
        id: 5,
        email: 'ana@test.dev',
      });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({ token: 'tok' });

      await service.forgotPassword(' ANA@test.dev ');

      expect(mail.sendPasswordReset).toHaveBeenCalledWith(
        'ana@test.dev',
        expect.stringContaining('https://app.recedu.co/reset-password?token='),
      );
    });

    it('no envía email si el usuario no existe (anti-enumeración)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.forgotPassword('noexiste@test.dev');

      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('usa FRONTEND_URL por defecto si no está definida', async () => {
      delete process.env.FRONTEND_URL;
      prisma.user.findUnique.mockResolvedValue({
        id: 5,
        email: 'ana@test.dev',
      });
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({ token: 'tok' });

      await service.forgotPassword('ana@test.dev');

      expect(mail.sendPasswordReset).toHaveBeenCalledWith(
        'ana@test.dev',
        expect.stringContaining('http://localhost:3000/reset-password?token='),
      );
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('cambia la contraseña y marca el token como usado', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
        token: 'valid-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      hashMock.mockResolvedValue('new-hashed-pass');
      prisma.$transaction.mockResolvedValue([]);

      await service.resetPassword('valid-token', 'NewPassword123!');

      expect(hashMock).toHaveBeenCalledWith('NewPassword123!', 10);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('rechaza token expirado', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
        token: 'expired-token',
        usedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(
        service.resetPassword('expired-token', 'NewPass!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza token ya usado', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
        token: 'used-token',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.resetPassword('used-token', 'NewPass!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza token que no existe', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('ghost-token', 'NewPass!'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
