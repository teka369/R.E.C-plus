import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from './dto/user-role.enum';

function makePrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    institution: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

const secretariaActor = {
  userId: 1,
  role: UserRole.SECRETARIA,
  institutionId: 10,
};
const superAdminActor = {
  userId: 2,
  role: UserRole.SUPER_ADMIN,
  institutionId: null,
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    beforeEach(() => {
      prisma.institution.findUnique.mockResolvedValue({ maxUsers: 100 });
      prisma.user.count.mockResolvedValue(5);
      prisma.user.create.mockResolvedValue({
        id: 20,
        institutionId: 10,
        nombres: 'Juan',
        apellidos: 'Pérez',
        email: 'juan@test.edu',
        codigo: 'mock-codigo-001',
        role: UserRole.ESTUDIANTE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('crea un usuario en la institución del actor (no SUPER_ADMIN)', async () => {
      const result = await service.create(secretariaActor, {
        nombres: 'Juan',
        apellidos: 'Pérez',
        email: 'juan@test.edu',
        password: 'pass1234',
        role: UserRole.ESTUDIANTE,
      });
      expect(result.id).toBe(20);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ institutionId: 10 }),
        }),
      );
    });

    it('lanza BadRequestException si actor no-SA intenta crear SUPER_ADMIN', async () => {
      await expect(
        service.create(secretariaActor, {
          nombres: 'X',
          apellidos: 'Y',
          email: 'x@y.com',
          password: 'p',
          role: UserRole.SUPER_ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('SUPER_ADMIN puede crear SUPER_ADMIN', async () => {
      prisma.user.create.mockResolvedValue({ id: 99, role: UserRole.SUPER_ADMIN });
      const r = await service.create(superAdminActor, {
        nombres: 'Root',
        apellidos: 'Admin',
        email: 'root@rec.edu',
        password: 'Pa$sw0rd!',
        role: UserRole.SUPER_ADMIN,
      });
      expect(r).toBeTruthy();
    });

    it('lanza BadRequestException si se alcanza el límite de usuarios', async () => {
      prisma.institution.findUnique.mockResolvedValue({ maxUsers: 5 });
      prisma.user.count.mockResolvedValue(5);
      await expect(
        service.create(secretariaActor, {
          nombres: 'Extra',
          apellidos: 'User',
          email: 'extra@test.edu',
          role: UserRole.ESTUDIANTE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('normaliza el email a lowercase sin espacios', async () => {
      await service.create(secretariaActor, {
        nombres: 'Juan',
        apellidos: 'P',
        email: '  JUAN@TEST.EDU  ',
        password: 'pw',
        role: UserRole.ESTUDIANTE,
      });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'juan@test.edu' }),
        }),
      );
    });

    it('hashea la contraseña (no guarda texto plano)', async () => {
      await service.create(secretariaActor, {
        nombres: 'Ana',
        apellidos: 'L',
        email: 'ana@test.edu',
        password: 'plaintext',
        role: UserRole.ESTUDIANTE,
      });
      const callData = prisma.user.create.mock.calls[0][0].data;
      expect(callData.password).not.toBe('plaintext');
      const valid = await bcrypt.compare('plaintext', callData.password);
      expect(valid).toBe(true);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({ id: 5, institutionId: 10 });
      prisma.user.update.mockResolvedValue({ id: 5, institutionId: 10, role: UserRole.ESTUDIANTE });
    });

    it('lanza BadRequestException si id no es entero positivo', async () => {
      await expect(service.update(secretariaActor, -1, {})).rejects.toThrow(BadRequestException);
      await expect(service.update(secretariaActor, 0, {})).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si el usuario está en otra institución', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 5, institutionId: 99 });
      await expect(service.update(secretariaActor, 5, {})).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si no-SA intenta asignar rol SUPER_ADMIN', async () => {
      await expect(
        service.update(secretariaActor, 5, { role: UserRole.SUPER_ADMIN }),
      ).rejects.toThrow(BadRequestException);
    });

    it('SUPER_ADMIN puede actualizar sin restricción de institución', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 5, institutionId: 999 });
      const r = await service.update(superAdminActor, 5, { nombres: 'Nuevo' });
      expect(r).toBeTruthy();
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('lanza si el usuario es de otra institución', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 7, institutionId: 99 });
      await expect(service.remove(secretariaActor, 7)).rejects.toThrow(BadRequestException);
    });

    it('elimina cuando el usuario está en la misma institución', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 7, institutionId: 10 });
      prisma.user.delete.mockResolvedValue({ id: 7 });
      await service.remove(secretariaActor, 7);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    });
  });

  // ─── changePasswordWithValidation ──────────────────────────────────────────
  describe('changePasswordWithValidation', () => {
    const hashed = bcrypt.hashSync('currentPass', 10);

    it('lanza si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.changePasswordWithValidation(1, 'currentPass', 'newPass'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza si la contraseña actual es incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, password: hashed });
      await expect(
        service.changePasswordWithValidation(1, 'wrongPass', 'newPass'),
      ).rejects.toThrow(BadRequestException);
    });

    it('actualiza la contraseña cuando la actual es correcta', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, password: hashed });
      prisma.user.update.mockResolvedValue({ id: 1 });
      await service.changePasswordWithValidation(1, 'currentPass', 'newPass');
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      const newHashed = prisma.user.update.mock.calls[0][0].data.password;
      expect(newHashed).not.toBe('newPass');
      expect(await bcrypt.compare('newPass', newHashed)).toBe(true);
    });

    it('lanza si la contraseña almacenada no está hasheada (no empieza con $2)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, password: 'plaintext' });
      await expect(
        service.changePasswordWithValidation(1, 'plaintext', 'newPass'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

