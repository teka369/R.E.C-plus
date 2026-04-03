import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

jest.mock('bcryptjs', () => ({
  hash: jest.fn((value: string) => Promise.resolve(`hashed:${value}`)),
  compare: jest.fn(),
}));

describe('UsersService (unit)', () => {
  const prisma = {
    institution: { findUnique: jest.fn() },
    user: {
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: UsersService;

  const secretaria = {
    userId: 10,
    role: UserRole.SECRETARIA,
    institutionId: 1,
  };
  const superAdmin = { userId: 1, role: UserRole.SUPER_ADMIN };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as never);
  });

  // =========================================
  // CREATE
  // =========================================
  describe('create', () => {
    it('rechaza creación de SUPER_ADMIN por actor tenant', async () => {
      await expect(
        service.create(secretaria, {
          nombres: 'Ana',
          apellidos: 'Diaz',
          email: 'ana@school.co',
          role: UserRole.SUPER_ADMIN,
          password: 'Password123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('genera password aleatoria si no se proporciona', async () => {
      prisma.user.create.mockResolvedValue({
        id: 100,
        role: UserRole.ESTUDIANTE,
      });

      const result = await service.create(secretaria, {
        nombres: 'Luis',
        apellidos: 'Paz',
        email: 'luis@school.co',
        role: UserRole.ESTUDIANTE,
      });

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 100, role: UserRole.ESTUDIANTE });
    });

    it('permite crear profesor con password proporcionada', async () => {
      prisma.user.create.mockResolvedValue({
        id: 200,
        role: UserRole.PROFESOR,
      });

      const result = await service.create(secretaria, {
        nombres: 'Carlos',
        apellidos: 'Roa',
        email: 'carlos@school.co',
        role: UserRole.PROFESOR,
        password: 'Password123!',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(result).toEqual({ id: 200, role: UserRole.PROFESOR });
    });

    it('rechaza si se excede maxUsers de la institución', async () => {
      prisma.institution.findUnique.mockResolvedValue({ maxUsers: 2 });
      prisma.user.count.mockResolvedValue(2);

      await expect(
        service.create(secretaria, {
          nombres: 'Nuevo',
          apellidos: 'User',
          email: 'nuevo@school.co',
          role: UserRole.ESTUDIANTE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('SUPER_ADMIN puede crear otro SUPER_ADMIN', async () => {
      prisma.user.create.mockResolvedValue({
        id: 300,
        role: UserRole.SUPER_ADMIN,
      });

      const result = await service.create(superAdmin, {
        nombres: 'Admin',
        apellidos: 'Two',
        email: 'admin2@test.co',
        role: UserRole.SUPER_ADMIN,
        password: 'SecurePass!',
      });

      expect(result.role).toBe(UserRole.SUPER_ADMIN);
    });
  });

  // =========================================
  // FIND ALL
  // =========================================
  describe('findAll', () => {
    it('retorna resultados paginados para secretaria', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 1, nombres: 'A' },
        { id: 2, nombres: 'B' },
      ]);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.findAll(secretaria);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('filtra por rol', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(secretaria, UserRole.PROFESOR);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: UserRole.PROFESOR }),
        }),
      );
    });

    it('SUPER_ADMIN puede filtrar por institutionId', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(superAdmin, undefined, 5);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ institutionId: 5 }),
        }),
      );
    });
  });

  // =========================================
  // FIND ONE
  // =========================================
  describe('findOne', () => {
    it('retorna usuario dentro del tenant', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ institutionId: 1 }) // assertTenantVisibility
        .mockResolvedValueOnce({ id: 5, nombres: 'Test' });

      const result = await service.findOne(secretaria, 5);

      expect(result!.nombres).toBe('Test');
    });

    it('rechaza usuario fuera del tenant', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ institutionId: 2 });

      await expect(service.findOne(secretaria, 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('SUPER_ADMIN puede ver cualquier usuario', async () => {
      prisma.user.findUnique.mockResolvedValue({
        publicId: 'uuid-5',
        nombres: 'X',
      });

      const result = await service.findOne(superAdmin, 5);

      expect(result!.publicId).toBe('uuid-5');
    });
  });

  // =========================================
  // UPDATE
  // =========================================
  describe('update', () => {
    it('actualiza usuario del mismo tenant', async () => {
      prisma.user.findUnique.mockResolvedValue({ institutionId: 1 });
      prisma.user.update.mockResolvedValue({
        id: 5,
        nombres: 'Actualizado',
      });

      const result = await service.update(secretaria, 5, {
        nombres: 'Actualizado',
      });

      expect(result.nombres).toBe('Actualizado');
    });

    it('rechaza ID inválido', async () => {
      await expect(
        service.update(secretaria, -1, { nombres: 'X' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza asignar SUPER_ADMIN por actor no SUPER_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ institutionId: 1 });

      await expect(
        service.update(secretaria, 5, { role: UserRole.SUPER_ADMIN }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================
  // REMOVE
  // =========================================
  describe('remove', () => {
    it('elimina usuario del tenant', async () => {
      prisma.user.findUnique.mockResolvedValue({ institutionId: 1 });
      prisma.user.delete.mockResolvedValue({ id: 5 });

      const result = await service.remove(secretaria, 5);

      expect(result.id).toBe(5);
    });

    it('rechaza eliminar usuario de otro tenant', async () => {
      prisma.user.findUnique.mockResolvedValue({ institutionId: 99 });

      await expect(service.remove(secretaria, 5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // =========================================
  // BULK CREATE
  // =========================================
  describe('bulkCreate', () => {
    it('crea múltiples usuarios', async () => {
      prisma.user.create
        .mockResolvedValueOnce({ id: 100, codigo: 'C1' })
        .mockResolvedValueOnce({ id: 101, codigo: 'C2' });

      const result = await service.bulkCreate(secretaria, [
        {
          nombres: 'A',
          apellidos: 'B',
          email: 'a@t.co',
          role: UserRole.ESTUDIANTE,
        },
        {
          nombres: 'C',
          apellidos: 'D',
          email: 'c@t.co',
          role: UserRole.ESTUDIANTE,
        },
      ]);

      expect(result.created).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('captura errores individuales sin detener el lote', async () => {
      prisma.user.create
        .mockResolvedValueOnce({ id: 100, codigo: 'C1' })
        .mockRejectedValueOnce(new Error('Duplicate email'));

      const result = await service.bulkCreate(secretaria, [
        {
          nombres: 'A',
          apellidos: 'B',
          email: 'ok@t.co',
          role: UserRole.ESTUDIANTE,
        },
        {
          nombres: 'C',
          apellidos: 'D',
          email: 'dup@t.co',
          role: UserRole.ESTUDIANTE,
        },
      ]);

      expect(result.created).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('rechaza SUPER_ADMIN en bulk si actor no es SUPER_ADMIN', async () => {
      const result = await service.bulkCreate(secretaria, [
        {
          nombres: 'X',
          apellidos: 'Y',
          email: 'x@t.co',
          role: UserRole.SUPER_ADMIN,
        },
      ]);

      expect(result.failed).toBe(1);
      expect(result.results[0].error).toContain('SUPER_ADMIN');
    });
  });

  // =========================================
  // CHANGE PASSWORD
  // =========================================
  describe('changePassword', () => {
    it('cambia la contraseña hasheada', async () => {
      prisma.user.update.mockResolvedValue({
        publicId: 'uuid-5',
        nombres: 'Test',
      });

      const result = await service.changePassword(5, 'NewPass123!');

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123!', 10);
      expect(result.publicId).toBe('uuid-5');
    });
  });

  // =========================================
  // CHANGE PASSWORD WITH VALIDATION
  // =========================================
  describe('changePasswordWithValidation', () => {
    it('cambia password si la actual es correcta', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 5,
        password: '$2b$10$hashedOldPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({
        publicId: 'uuid-5',
        nombres: 'Test',
      });

      const result = await service.changePasswordWithValidation(
        5,
        'OldPass',
        'NewPass',
      );

      expect(result.publicId).toBe('uuid-5');
    });

    it('rechaza si usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePasswordWithValidation(5, 'old', 'new'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si la contraseña actual es incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 5,
        password: '$2b$10$hashedOldPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePasswordWithValidation(5, 'wrong', 'new'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si la contraseña almacenada no está hasheada', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 5,
        password: 'plaintext_password', // no empieza con $2
      });

      await expect(
        service.changePasswordWithValidation(5, 'plain', 'new'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
