import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../src/auth/roles.guard';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function contextWithRole(role?: UserRole): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
        }),
      }),
    } as ExecutionContext;
  }

  it('permite cuando la ruta no define roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextWithRole())).toBe(true);
  });

  it('rechaza cuando falta user', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SECRETARIA]);
    expect(() => guard.canActivate(contextWithRole(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('permite SUPER_ADMIN siempre', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SECRETARIA]);
    expect(guard.canActivate(contextWithRole(UserRole.SUPER_ADMIN))).toBe(true);
  });

  it('rechaza rol fuera de la matriz', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SECRETARIA]);
    expect(() => guard.canActivate(contextWithRole(UserRole.ESTUDIANTE))).toThrow(
      ForbiddenException,
    );
  });
});
