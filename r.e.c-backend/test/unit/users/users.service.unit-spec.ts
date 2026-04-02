import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

jest.mock('bcryptjs', () => ({
  hash: jest.fn((value: string) => Promise.resolve(`hashed:${value}`)),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  const prisma = {
    institution: { findUnique: jest.fn() },
    user: {
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as never);
  });

  it('rechaza creación de SUPER_ADMIN por actor tenant', async () => {
    await expect(
      service.create(
        { userId: 10, role: UserRole.SECRETARIA, institutionId: 1 },
        {
          nombres: 'Ana',
          apellidos: 'Diaz',
          email: 'ana@school.co',
          role: UserRole.SUPER_ADMIN,
          password: 'Password123!',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('genera password aleatoria si no se proporciona', async () => {
    prisma.user.create.mockResolvedValue({
      id: 100,
      role: UserRole.ESTUDIANTE,
    });

    const result = await service.create(
      { userId: 1, role: UserRole.SECRETARIA, institutionId: 4 },
      {
        nombres: 'Luis',
        apellidos: 'Paz',
        email: 'luis@school.co',
        role: UserRole.ESTUDIANTE,
      },
    );

    expect(bcrypt.hash).toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 100, role: UserRole.ESTUDIANTE });
  });

  it('permite crear profesor con password proporcionada', async () => {
    prisma.user.create.mockResolvedValue({
      id: 200,
      role: UserRole.PROFESOR,
    });

    const result = await service.create(
      { userId: 1, role: UserRole.SECRETARIA, institutionId: 4 },
      {
        nombres: 'Carlos',
        apellidos: 'Roa',
        email: 'carlos@school.co',
        role: UserRole.PROFESOR,
        password: 'Password123!',
      },
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
    expect(prisma.user.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 200, role: UserRole.PROFESOR });
  });
});
