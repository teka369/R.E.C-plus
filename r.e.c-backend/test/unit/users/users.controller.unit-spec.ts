import { ForbiddenException } from '@nestjs/common';
import { UsersController } from '../../../src/users/users.controller';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('UsersController', () => {
  const usersService = {
    findOne: jest.fn(),
    changePassword: jest.fn(),
    changePasswordWithValidation: jest.fn(),
    update: jest.fn(),
  };

  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersService as never);
  });

  it('bloquea lectura de otro usuario si no es secretaria/superadmin', () => {
    expect(() =>
      controller.findOne('88', {
        user: {
          userId: 77,
          role: UserRole.ESTUDIANTE,
          email: 'me@school.co',
          institutionId: 1,
        },
      }),
    ).toThrow(ForbiddenException);
  });

  it('permite cambio administrativo de contraseña a secretaria', async () => {
    usersService.findOne.mockResolvedValue({ id: 99 });
    usersService.changePassword.mockResolvedValue({ id: 99 });

    const result = await controller.changePassword(
      '99',
      { newPassword: 'Password123!' },
      {
        user: {
          userId: 1,
          role: UserRole.SECRETARIA,
          email: 'sec@school.co',
          institutionId: 1,
        },
      },
    );

    expect(usersService.changePassword).toHaveBeenCalledWith(
      99,
      'Password123!',
    );
    expect(result).toEqual({ id: 99 });
  });

  it('exige contraseña actual para cambio propio', async () => {
    await expect(
      controller.changePassword(
        '22',
        { newPassword: 'Password123!' },
        {
          user: {
            userId: 22,
            role: UserRole.ESTUDIANTE,
            email: 'std@school.co',
            institutionId: 1,
          },
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
