import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantBoundaryGuard } from '../../../src/common/guards/tenant-boundary.guard';
import { UserRole } from '../../../src/users/dto/user-role.enum';
import { AppLoggerService } from '../../../src/logger/logger.service';

describe('TenantBoundaryGuard', () => {
  const mockLogger = {
    logTenantViolation: jest.fn(),
  } as unknown as AppLoggerService;

  const mockPrisma = {
    institution: {
      findUnique: jest.fn().mockResolvedValue({ activa: true }),
    },
  };

  const mockCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const guard = new TenantBoundaryGuard(
    { verify: () => ({}) } as unknown as JwtService,
    mockLogger,
    mockPrisma as any,
    mockCache as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.institution.findUnique.mockResolvedValue({ activa: true });
    mockCache.get.mockResolvedValue(null);
  });

  function buildContext(
    user?: {
      userId: number;
      role: UserRole;
      institutionId?: number | null;
    },
    requestOverrides?: {
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
      headers?: Record<string, unknown>;
    },
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, ...requestOverrides }),
      }),
    } as ExecutionContext;
  }

  it('debe rechazar acceso cross-institution cuando institutionId objetivo no coincide', async () => {
    await expect(
      guard.canActivate(
        buildContext(
          { userId: 9, role: UserRole.SECRETARIA, institutionId: 10 },
          { params: { institutionId: 20 } },
        ),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('debe permitir rutas publicas sin user', async () => {
    await expect(guard.canActivate(buildContext(undefined))).resolves.toBe(true);
  });

  it('debe permitir SUPER_ADMIN sin institutionId', async () => {
    await expect(
      guard.canActivate(
        buildContext({
          userId: 1,
          role: UserRole.SUPER_ADMIN,
          institutionId: null,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('debe rechazar actor tenant sin institutionId', async () => {
    await expect(
      guard.canActivate(
        buildContext({
          userId: 2,
          role: UserRole.SECRETARIA,
          institutionId: null,
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('debe permitir actor tenant con institutionId', async () => {
    await expect(
      guard.canActivate(
        buildContext({ userId: 3, role: UserRole.PROFESOR, institutionId: 10 }),
      ),
    ).resolves.toBe(true);
  });

  it('debe rechazar si la institución está inactiva', async () => {
    mockPrisma.institution.findUnique.mockResolvedValue({ activa: false });
    await expect(
      guard.canActivate(
        buildContext({ userId: 4, role: UserRole.SECRETARIA, institutionId: 10 }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe usar caché para el estado de la institución', async () => {
    mockCache.get.mockResolvedValue(true);
    await guard.canActivate(
      buildContext({ userId: 5, role: UserRole.PROFESOR, institutionId: 10 }),
    );
    expect(mockPrisma.institution.findUnique).not.toHaveBeenCalled();
  });
});
