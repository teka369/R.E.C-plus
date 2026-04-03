import { ForbiddenException } from '@nestjs/common';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let service: Record<string, jest.Mock>;

  const secretariaReq = {
    user: {
      userId: 1,
      role: UserRole.SECRETARIA,
      email: 's@t.co',
      institutionId: 1,
    },
  };
  const studentReq = {
    user: {
      userId: 5,
      role: UserRole.ESTUDIANTE,
      email: 'e@t.co',
      institutionId: 1,
    },
  };
  const superReq = {
    user: { userId: 99, role: UserRole.SUPER_ADMIN, email: 'sa@t.co' },
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      bulkCreate: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneByPublicId: jest.fn(),
      update: jest.fn(),
      updateByPublicId: jest.fn(),
      remove: jest.fn(),
      removeByPublicId: jest.fn(),
      changePassword: jest.fn(),
      changePasswordByPublicId: jest.fn(),
      changePasswordWithValidation: jest.fn(),
      changePasswordWithValidationByPublicId: jest.fn(),
    };
    controller = new UsersController(service as unknown as UsersService);
  });

  describe('create', () => {
    it('delegates to service.create', () => {
      const dto = {
        nombre: 'A',
        email: 'a@b.co',
        role: UserRole.ESTUDIANTE,
      } as any;
      controller.create(dto, secretariaReq as any);
      expect(service.create).toHaveBeenCalledWith(secretariaReq.user, dto);
    });
  });

  describe('bulkCreate', () => {
    it('delegates to service.bulkCreate', () => {
      const dtos = [{ nombre: 'A' }] as any;
      controller.bulkCreate(dtos, secretariaReq as any);
      expect(service.bulkCreate).toHaveBeenCalledWith(secretariaReq.user, dtos);
    });

    it('throws BadRequestException for empty array', () => {
      expect(() => controller.bulkCreate([], secretariaReq as any)).toThrow(
        'al menos 1 usuario',
      );
    });

    it('throws BadRequestException for >200 users', () => {
      const dtos = new Array(201).fill({ nombre: 'A' });
      expect(() => controller.bulkCreate(dtos, secretariaReq as any)).toThrow(
        'Máximo 200',
      );
    });
  });

  describe('findAll', () => {
    it('delegates with pagination and filters', () => {
      controller.findAll(
        UserRole.ESTUDIANTE,
        '1',
        '2',
        '10',
        secretariaReq as any,
      );
      expect(service.findAll).toHaveBeenCalledWith(
        secretariaReq.user,
        UserRole.ESTUDIANTE,
        1,
        {
          page: 2,
          limit: 10,
        },
      );
    });

    it('handles undefined query params', () => {
      controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        secretariaReq as any,
      );
      expect(service.findAll).toHaveBeenCalledWith(
        secretariaReq.user,
        undefined,
        undefined,
        {
          page: undefined,
          limit: undefined,
        },
      );
    });
  });

  describe('getProfile', () => {
    it('delegates to findOne with own userId', async () => {
      service.findOne.mockResolvedValue({ publicId: 'uuid-1' });
      await controller.getProfile(secretariaReq as any);
      expect(service.findOne).toHaveBeenCalledWith(secretariaReq.user, 1);
    });

    it('throws ForbiddenException when userId is missing', async () => {
      const badReq = { user: { userId: undefined, role: UserRole.SECRETARIA } };
      await expect(controller.getProfile(badReq as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('allows SECRETARIA to view any user by publicId', async () => {
      service.findOneByPublicId.mockResolvedValue({ publicId: 'uuid-99' });
      await controller.findOne('uuid-99', secretariaReq as any);
      expect(service.findOneByPublicId).toHaveBeenCalledWith(
        secretariaReq.user,
        'uuid-99',
      );
    });

    it('allows student to view own profile by publicId', async () => {
      service.findOne.mockResolvedValue({ publicId: 'uuid-5' });
      service.findOneByPublicId.mockResolvedValue({ publicId: 'uuid-5' });
      await controller.findOne('uuid-5', studentReq as any);
      expect(service.findOneByPublicId).toHaveBeenCalledWith(
        studentReq.user,
        'uuid-5',
      );
    });

    it('throws ForbiddenException when student views another user', async () => {
      service.findOne.mockResolvedValue({ publicId: 'uuid-5' });
      await expect(
        controller.findOne('uuid-99', studentReq as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows SUPER_ADMIN to view any user by publicId', async () => {
      service.findOneByPublicId.mockResolvedValue({ publicId: 'uuid-5' });
      await controller.findOne('uuid-5', superReq as any);
      expect(service.findOneByPublicId).toHaveBeenCalledWith(
        superReq.user,
        'uuid-5',
      );
    });
  });

  describe('update', () => {
    it('delegates to service.updateByPublicId', () => {
      const dto = { nombre: 'Updated' } as any;
      controller.update('uuid-5', dto, secretariaReq as any);
      expect(service.updateByPublicId).toHaveBeenCalledWith(
        secretariaReq.user,
        'uuid-5',
        dto,
      );
    });
  });

  describe('updateProfile', () => {
    it('delegates to service.update with own userId', async () => {
      const dto = { nombre: 'Me' } as any;
      await controller.updateProfile(dto, secretariaReq as any);
      expect(service.update).toHaveBeenCalledWith(secretariaReq.user, 1, dto);
    });
  });

  describe('remove', () => {
    it('delegates to service.removeByPublicId', () => {
      controller.remove('uuid-5', secretariaReq as any);
      expect(service.removeByPublicId).toHaveBeenCalledWith(
        secretariaReq.user,
        'uuid-5',
      );
    });
  });

  describe('changePassword', () => {
    it('admin changes password without currentPassword', async () => {
      service.findOneByPublicId.mockResolvedValue({ publicId: 'uuid-5' });
      service.changePasswordByPublicId.mockResolvedValue(undefined);
      const dto = { newPassword: 'new123' } as any;
      await controller.changePassword('uuid-5', dto, secretariaReq as any);
      expect(service.changePasswordByPublicId).toHaveBeenCalledWith(
        'uuid-5',
        'new123',
      );
    });

    it('SUPER_ADMIN can also change password without currentPassword', async () => {
      service.findOneByPublicId.mockResolvedValue({ publicId: 'uuid-5' });
      service.changePasswordByPublicId.mockResolvedValue(undefined);
      const dto = { newPassword: 'new123' } as any;
      await controller.changePassword('uuid-5', dto, superReq as any);
      expect(service.changePasswordByPublicId).toHaveBeenCalledWith(
        'uuid-5',
        'new123',
      );
    });

    it('user changes own password with validation', async () => {
      service.findOne.mockResolvedValue({ publicId: 'uuid-5' });
      service.changePasswordWithValidationByPublicId.mockResolvedValue(
        undefined,
      );
      const dto = { currentPassword: 'old', newPassword: 'new123' } as any;
      await controller.changePassword('uuid-5', dto, studentReq as any);
      expect(
        service.changePasswordWithValidationByPublicId,
      ).toHaveBeenCalledWith('uuid-5', 'old', 'new123');
    });

    it('throws ForbiddenException when user changes another users password', async () => {
      service.findOne.mockResolvedValue({ publicId: 'uuid-5' });
      const dto = { currentPassword: 'old', newPassword: 'new' } as any;
      await expect(
        controller.changePassword('uuid-99', dto, studentReq as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when own password change lacks currentPassword', async () => {
      service.findOne.mockResolvedValue({ publicId: 'uuid-5' });
      const dto = { newPassword: 'new' } as any;
      await expect(
        controller.changePassword('uuid-5', dto, studentReq as any),
      ).rejects.toThrow('La contraseña actual es requerida');
    });
  });
});
