import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantBoundaryGuard } from '../../../src/common/guards/tenant-boundary.guard';
import { UserRole } from '../../../src/users/dto/user-role.enum';
import { AppLoggerService } from '../../../src/logger/logger.service';

describe('TenantBoundaryGuard', () => {
  const mockLogger = {
    logTenantViolation: jest.fn(),
  } as unknown as AppLoggerService;
  
  const guard = new TenantBoundaryGuard(
    { verify: () => ({}) } as unknown as JwtService,
    mockLogger,
  );

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

  it('debe rechazar acceso cross-institution cuando institutionId objetivo no coincide', () => {
    expect(() =>
      guard.canActivate(
        buildContext(
          { userId: 9, role: UserRole.SECRETARIA, institutionId: 10 },
          { params: { institutionId: 20 } },
        ),
      ),
    ).toThrow(ForbiddenException);
  });

  it('debe permitir rutas publicas sin user', () => {
    expect(guard.canActivate(buildContext(undefined))).toBe(true);
  });

  it('debe permitir SUPER_ADMIN sin institutionId', () => {
    expect(
      guard.canActivate(
        buildContext({
          userId: 1,
          role: UserRole.SUPER_ADMIN,
          institutionId: null,
        }),
      ),
    ).toBe(true);
  });

  it('debe rechazar actor tenant sin institutionId', () => {
    expect(() =>
      guard.canActivate(
        buildContext({
          userId: 2,
          role: UserRole.SECRETARIA,
          institutionId: null,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('debe permitir actor tenant con institutionId', () => {
    expect(
      guard.canActivate(
        buildContext({ userId: 3, role: UserRole.PROFESOR, institutionId: 10 }),
      ),
    ).toBe(true);
  });
});
