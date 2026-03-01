import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

describe('MaterialsService', () => {
  let service: MaterialsService;
  let prisma: {
    studyMaterial: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    teacherAssignment: { findUnique: jest.Mock };
    studentGroup: { findFirst: jest.Mock };
    group: { findUnique: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      studyMaterial: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      teacherAssignment: { findUnique: jest.fn() },
      studentGroup: { findFirst: jest.fn() },
      group: { findUnique: jest.fn() },
    };

    service = new MaterialsService(prisma as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('increments views for authorized student', async () => {
    prisma.studyMaterial.findUnique.mockResolvedValue({
      id: 10,
      groupId: 3,
      subjectId: 5,
      teacherId: 99,
      visibility: 'GROUP',
      group: { id: 3, gradeId: 2 },
    });
    prisma.studentGroup.findFirst.mockResolvedValue({
      studentId: 20,
      groupId: 3,
    });
    prisma.group.findUnique.mockResolvedValue({ id: 3, gradeId: 2 });
    prisma.studyMaterial.update.mockResolvedValue({
      id: 10,
      views: 4,
      downloads: 1,
    });

    await expect(
      service.incrementStudyViews(
        { userId: 20, role: UserRole.ESTUDIANTE },
        10,
      ),
    ).resolves.toEqual({ id: 10, views: 4, downloads: 1 });
  });

  it('rejects view increment when student has no access', async () => {
    prisma.studyMaterial.findUnique.mockResolvedValue({
      id: 10,
      groupId: 99,
      subjectId: 5,
      teacherId: 99,
      visibility: 'GROUP',
      group: { id: 99, gradeId: 8 },
    });
    prisma.studentGroup.findFirst.mockResolvedValue({
      studentId: 20,
      groupId: 3,
    });
    prisma.group.findUnique.mockResolvedValue({ id: 3, gradeId: 2 });

    await expect(
      service.incrementStudyViews(
        { userId: 20, role: UserRole.ESTUDIANTE },
        10,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('increments downloads for authorized teacher assignment', async () => {
    prisma.studyMaterial.findUnique.mockResolvedValue({
      id: 10,
      groupId: 3,
      subjectId: 5,
      teacherId: 99,
      visibility: 'GROUP',
      group: { id: 3, gradeId: 2 },
    });
    prisma.teacherAssignment.findUnique.mockResolvedValue({
      teacherId: 40,
      groupId: 3,
      subjectId: 5,
    });
    prisma.studyMaterial.update.mockResolvedValue({
      id: 10,
      views: 4,
      downloads: 2,
    });

    await expect(
      service.incrementStudyDownloads(
        { userId: 40, role: UserRole.PROFESOR },
        10,
      ),
    ).resolves.toEqual({ id: 10, views: 4, downloads: 2 });
  });

  it('returns not found when material does not exist', async () => {
    prisma.studyMaterial.findUnique.mockResolvedValue(null);

    await expect(
      service.incrementStudyDownloads(
        { userId: 1, role: UserRole.SECRETARIA },
        999,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
