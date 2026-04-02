import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const HASHED_PASSWORD = bcrypt.hashSync('secret123', 10);

const baseUser = {
  id: 1,
  nombres: 'Ana',
  apellidos: 'Gómez',
  email: 'ana@test.edu',
  role: 'PROFESOR',
  password: HASHED_PASSWORD,
  institutionId: 10,
  institution: {
    id: 10,
    nombre: 'Colegio Test',
    slug: 'colegio-test',
    activa: true,
  },
};

function makePrisma() {
  return {
    user: {
      findUnique: jest.fn(),
    },
    authSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

function makeJwt() {
  return {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verifyAsync: jest.fn(),
    decode: jest
      .fn()
      .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let jwt: ReturnType<typeof makeJwt>;

  beforeEach(async () => {
    prisma = makePrisma();
    jwt = makeJwt();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: MailService, useValue: { sendPasswordReset: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── validateUser ───────────────────────────────────────────────────────────
  describe('validateUser', () => {
    it('retorna el usuario cuando credenciales son correctas', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const result = await service.validateUser('ana@test.edu', 'secret123');
      expect(result.id).toBe(1);
      expect(result.email).toBe('ana@test.edu');
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.validateUser('noexiste@test.edu', 'pass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await expect(
        service.validateUser('ana@test.edu', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la institución está inactiva', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        role: 'PROFESOR',
        institution: { ...baseUser.institution, activa: false },
      });
      await expect(
        service.validateUser('ana@test.edu', 'secret123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('SUPER_ADMIN puede loguear aunque institución esté inactiva', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        role: 'SUPER_ADMIN',
        institution: { ...baseUser.institution, activa: false },
      });
      const result = await service.validateUser('ana@test.edu', 'secret123');
      expect(result.role).toBe('SUPER_ADMIN');
    });

    it('normaliza el email (trim + lowercase) antes de buscar', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      await service.validateUser('  ANA@TEST.EDU  ', 'secret123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'ana@test.edu' } }),
      );
    });
  });

  // ─── login ──────────────────────────────────────────────────────────────────
  describe('login', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.authSession.create.mockResolvedValue({ id: 99 });
    });

    it('devuelve access_token, refresh_token y user', async () => {
      const result = await service.login('ana@test.edu', 'secret123');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.id).toBe(1);
      expect(result.user).not.toHaveProperty('password');
    });

    it('crea una AuthSession en la BD', async () => {
      await service.login('ana@test.edu', 'secret123');
      expect(prisma.authSession.create).toHaveBeenCalledTimes(1);
      expect(prisma.authSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 1 }),
        }),
      );
    });

    it('propaga UnauthorizedException si las credenciales son inválidas', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('x@test.edu', 'bad')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── refresh ────────────────────────────────────────────────────────────────
  describe('refresh', () => {
    const session = {
      id: 50,
      userId: 1,
      jti: 'jti-abc',
      tokenHash: bcrypt.hashSync('old-refresh', 10),
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      replacedById: null,
    };

    it('lanza UnauthorizedException si el payload no es tipo refresh', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 1, type: 'access', jti: 'x' });
      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lanza UnauthorizedException si la sesión fue revocada', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 1,
        type: 'refresh',
        jti: 'jti-abc',
      });
      prisma.authSession.findUnique.mockResolvedValue({
        ...session,
        revokedAt: new Date(),
      });
      await expect(service.refresh('any')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lanza UnauthorizedException si la sesión expiró', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 1,
        type: 'refresh',
        jti: 'jti-abc',
      });
      prisma.authSession.findUnique.mockResolvedValue({
        ...session,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.refresh('any')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lanza UnauthorizedException si el token no coincide con el hash', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 1,
        type: 'refresh',
        jti: 'jti-abc',
      });
      prisma.authSession.findUnique.mockResolvedValue(session);
      await expect(service.refresh('token-que-no-coincide')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lanza UnauthorizedException si el userId no coincide con sub', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 99,
        type: 'refresh',
        jti: 'jti-abc',
      });
      prisma.authSession.findUnique.mockResolvedValue(session); // userId: 1
      await expect(service.refresh('any')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── logout ─────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('revoca la sesión si existe y no está revocada', async () => {
      jwt.verifyAsync.mockResolvedValue({ jti: 'jti-abc' });
      prisma.authSession.findUnique.mockResolvedValue({
        id: 50,
        userId: 1,
        jti: 'jti-abc',
        revokedAt: null,
      });
      await service.logout('token');
      expect(prisma.authSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('no falla si la sesión ya no existe', async () => {
      jwt.verifyAsync.mockResolvedValue({ jti: 'jti-abc' });
      prisma.authSession.findUnique.mockResolvedValue(null);
      await expect(service.logout('token')).resolves.toBeUndefined();
    });

    it('no actualiza si la sesión ya estaba revocada', async () => {
      jwt.verifyAsync.mockResolvedValue({ jti: 'jti-abc' });
      prisma.authSession.findUnique.mockResolvedValue({
        id: 50,
        revokedAt: new Date(),
      });
      await service.logout('token');
      expect(prisma.authSession.update).not.toHaveBeenCalled();
    });
  });
});
