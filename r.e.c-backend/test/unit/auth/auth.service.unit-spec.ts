import { UnauthorizedException } from '@nestjs/common';
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
    user: { findUnique: jest.fn() },
    authSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };

  let service: AuthService;
  const compareMock = bcrypt.compare as jest.Mock;
  const hashMock = bcrypt.hash as jest.Mock;

  type AuthSessionCreateArgs = {
    data: {
      userId: number;
      jti: string;
      tokenHash: string;
      expiresAt: Date;
    };
  };

  type AuthSessionUpdateArgs = {
    where: { id: number };
    data: { revokedAt?: Date; replacedById?: number };
  };

  const firstCallArg = (mockFn: { mock: { calls: unknown[][] } }): unknown => {
    const { calls } = mockFn.mock;
    return calls[0]?.[0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'unit-secret';
    process.env.JWT_REFRESH_SECRET = 'unit-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES = '30d';
    prisma.authSession.create.mockResolvedValue({ id: 999 });
    service = new AuthService(prisma as never, jwt as never);
  });

  it('login entrega access y refresh y persiste sesion', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 10,
      nombres: 'Ana',
      apellidos: 'Perez',
      email: 'ana@test.dev',
      password: 'hash-db',
      role: 'SECRETARIA',
      institutionId: 2,
      institution: { id: 2, nombre: 'Colegio', slug: 'colegio', activa: true },
    });

    compareMock.mockResolvedValue(true);
    jwt.signAsync
      .mockResolvedValueOnce('access-token-1')
      .mockResolvedValueOnce('refresh-token-1');
    jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    hashMock.mockResolvedValue('refresh-hash-1');

    const result: AuthTokensResponse = await service.login(
      ' ana@test.dev ',
      'Password!',
    );

    expect(result.access_token).toBe('access-token-1');
    expect(result.refresh_token).toBe('refresh-token-1');
    expect(prisma.authSession.create).toHaveBeenCalled();
    const createArgs = firstCallArg(
      prisma.authSession.create,
    ) as AuthSessionCreateArgs;
    expect(createArgs.data.userId).toBe(10);
    expect(createArgs.data.tokenHash).toBe('refresh-hash-1');
    expect(typeof createArgs.data.jti).toBe('string');
    expect(createArgs.data.expiresAt instanceof Date).toBe(true);
    expect(result.user).toMatchObject({
      id: 10,
      role: 'SECRETARIA',
      institutionId: 2,
    });
  });

  it('refresh rota sesion, revoca token anterior y emite nuevos tokens', async () => {
    const oldSession = {
      id: 50,
      userId: 10,
      jti: 'old-jti',
      tokenHash: 'old-hash',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };

    jwt.verifyAsync.mockImplementation((token: string) => {
      if (token === 'old-refresh-token') {
        return Promise.resolve({ sub: 10, type: 'refresh', jti: 'old-jti' });
      }
      return Promise.reject(new Error('token inesperado'));
    });

    prisma.authSession.findUnique.mockResolvedValueOnce(oldSession);

    compareMock.mockResolvedValue(true);

    prisma.user.findUnique.mockResolvedValue({
      id: 10,
      nombres: 'Ana',
      apellidos: 'Perez',
      email: 'ana@test.dev',
      role: 'SECRETARIA',
      institutionId: 2,
      institution: { id: 2, nombre: 'Colegio', slug: 'colegio', activa: true },
    });

    jwt.signAsync
      .mockResolvedValueOnce('access-token-2')
      .mockResolvedValueOnce('new-refresh-token');
    jwt.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    hashMock.mockResolvedValue('refresh-hash-2');

    const result: AuthTokensResponse =
      await service.refresh('old-refresh-token');

    expect(result.access_token).toBe('access-token-2');
    expect(result.refresh_token).toBe('new-refresh-token');
    expect(prisma.authSession.update).toHaveBeenCalled();
    const updateArgs = firstCallArg(
      prisma.authSession.update,
    ) as AuthSessionUpdateArgs;
    expect(updateArgs.where.id).toBe(50);
    expect(updateArgs.data.revokedAt instanceof Date).toBe(true);
    expect(typeof updateArgs.data.replacedById).toBe('number');
    expect(prisma.authSession.create).toHaveBeenCalled();
  });

  it('refresh rechaza sesion revocada', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: 10,
      type: 'refresh',
      jti: 'old-jti',
    });
    prisma.authSession.findUnique.mockResolvedValue({
      id: 50,
      userId: 10,
      jti: 'old-jti',
      tokenHash: 'old-hash',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.refresh('old-refresh-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('logout revoca la sesion activa del refresh token', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: 10,
      type: 'refresh',
      jti: 'old-jti',
    });
    prisma.authSession.findUnique.mockResolvedValue({
      id: 50,
      userId: 10,
      jti: 'old-jti',
      tokenHash: 'old-hash',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await service.logout('old-refresh-token');

    expect(prisma.authSession.update).toHaveBeenCalled();
    const updateArgs = firstCallArg(
      prisma.authSession.update,
    ) as AuthSessionUpdateArgs;
    expect(updateArgs.where.id).toBe(50);
    expect(updateArgs.data.revokedAt instanceof Date).toBe(true);
  });
});
