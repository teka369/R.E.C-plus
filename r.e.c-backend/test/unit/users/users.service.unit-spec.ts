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
          documento_identidad: '123456',
          role: UserRole.SUPER_ADMIN,
          password: 'Password123!',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('crea estudiante usando documento como password inicial', async () => {
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
        documento_identidad: 'DOC-999',
        role: UserRole.ESTUDIANTE,
      },
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('DOC-999', 10);
    expect(prisma.user.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 100, role: UserRole.ESTUDIANTE });
  });

  it('rechaza profesor sin telefono', async () => {
    await expect(
      service.create(
        { userId: 1, role: UserRole.SECRETARIA, institutionId: 4 },
        {
          nombres: 'Carlos',
          apellidos: 'Roa',
          email: 'carlos@school.co',
          documento_identidad: 'DOC-777',
          role: UserRole.PROFESOR,
          password: 'Password123!',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
