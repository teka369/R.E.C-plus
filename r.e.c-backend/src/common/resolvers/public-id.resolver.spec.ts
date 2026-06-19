import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicIdResolver } from './public-id.resolver';
import { UserRole } from '../../users/dto/user-role.enum';
import type { Actor } from '../tenant';

describe('PublicIdResolver', () => {
  let resolver: PublicIdResolver;
  let prisma: PrismaService;

  const mockActor: Actor = {
    userId: 1,
    role: UserRole.PROFESOR,
    institutionId: 10,
  };

  const mockSuperAdmin: Actor = {
    userId: 2,
    role: UserRole.SUPER_ADMIN,
    institutionId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicIdResolver,
        {
          provide: PrismaService,
          useValue: {
            group: {
              findFirst: jest.fn().mockResolvedValue({ id: 42 }),
            },
            subject: {
              findFirst: jest.fn().mockResolvedValue({ id: 99 }),
            },
            grade: {
              findFirst: jest.fn().mockResolvedValue({ id: 7 }),
            },
            user: {
              findUnique: jest.fn().mockResolvedValue({ id: 5 }),
              findFirst: jest.fn().mockResolvedValue({ id: 5 }),
            },
          },
        },
      ],
    }).compile();

    resolver = module.get<PublicIdResolver>(PublicIdResolver);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('resolveGroup', () => {
    it('returns internal id for valid publicId', async () => {
      const result = await resolver.resolveGroup('uuid-group', mockActor);
      expect(result).toBe(42);
      expect(prisma.group.findFirst).toHaveBeenCalledWith({
        where: { publicId: 'uuid-group', institutionId: 10 },
        select: { id: true },
      });
    });

    it('bypasses institution filter for SUPER_ADMIN', async () => {
      await resolver.resolveGroup('uuid-group', mockSuperAdmin);
      expect(prisma.group.findFirst).toHaveBeenCalledWith({
        where: { publicId: 'uuid-group' },
        select: { id: true },
      });
    });

    it('throws NotFoundException when not found', async () => {
      jest.spyOn(prisma.group, 'findFirst').mockResolvedValue(null);
      await expect(
        resolver.resolveGroup('nonexistent', mockActor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveSubject', () => {
    it('returns internal id for valid publicId', async () => {
      const result = await resolver.resolveSubject('uuid-subject', mockActor);
      expect(result).toBe(99);
    });

    it('throws when not found', async () => {
      jest.spyOn(prisma.subject, 'findFirst').mockResolvedValue(null);
      await expect(
        resolver.resolveSubject('bad', mockActor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveGrade', () => {
    it('returns internal id for valid publicId', async () => {
      const result = await resolver.resolveGrade('uuid-grade', mockActor);
      expect(result).toBe(7);
    });
  });

  describe('resolveUser', () => {
    it('returns internal id for valid user publicId', async () => {
      const result = await resolver.resolveUser('uuid-user');
      expect(result).toBe(5);
    });
  });

  describe('resolveStudent', () => {
    it('filters by role and institution', async () => {
      const result = await resolver.resolveStudent('uuid-student', mockActor);
      expect(result).toBe(5);
    });
  });
});
