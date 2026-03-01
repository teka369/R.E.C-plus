import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecoveryService } from './recovery.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

describe('RecoveryService', () => {
  let service: RecoveryService;
  let prisma: {
    recoveryActivity: { findUnique: jest.Mock; delete: jest.Mock };
    recoveryRequest: { findUnique: jest.Mock; delete: jest.Mock };
    group: { findFirst: jest.Mock };
    teacherAssignment: { findFirst: jest.Mock };
    studentGroup: { findFirst: jest.Mock };
    $queryRaw: jest.Mock;
    $executeRaw: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      recoveryActivity: { findUnique: jest.fn(), delete: jest.fn() },
      recoveryRequest: { findUnique: jest.fn(), delete: jest.fn() },
      group: { findFirst: jest.fn() },
      teacherAssignment: { findFirst: jest.fn() },
      studentGroup: { findFirst: jest.fn() },
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    };

    prisma.$queryRaw.mockResolvedValue([]);

    service = new RecoveryService(prisma as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects attachment upload when actor is not assigned teacher', async () => {
    prisma.recoveryActivity.findUnique.mockResolvedValue({
      id: 1,
      requestId: 50,
      teacherId: 10,
      request: { id: 50 },
    });

    await expect(
      service.uploadActivityAttachment(
        { userId: 99, role: UserRole.ESTUDIANTE },
        1,
        {
          originalname: 'doc.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('x'),
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects attachment download when actor is unrelated to request', async () => {
    prisma.recoveryActivity.findUnique.mockResolvedValue({
      id: 1,
      requestId: 50,
      teacherId: 10,
      request: { id: 50 },
    });
    prisma.recoveryRequest.findUnique.mockResolvedValue({
      id: 50,
      studentId: 20,
      teacherId: 10,
      groupId: 2,
      subjectId: 3,
      student: { id: 20, nombres: 'A', apellidos: 'B', email: 'a@b.c' },
      teacher: { id: 10, nombres: 'T', apellidos: 'C', email: 't@b.c' },
      subject: { id: 3, nombre: 'Math' },
      group: { id: 2, nombre: '10-1' },
    });

    await expect(
      service.getActivityAttachment({ userId: 33, role: UserRole.PROFESOR }, 1),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns not found when authorized actor requests missing attachment', async () => {
    prisma.recoveryActivity.findUnique.mockResolvedValue({
      id: 1,
      requestId: 50,
      teacherId: 10,
      request: { id: 50 },
    });
    prisma.recoveryRequest.findUnique.mockResolvedValue({
      id: 50,
      studentId: 20,
      teacherId: 10,
      groupId: 2,
      subjectId: 3,
      student: { id: 20, nombres: 'A', apellidos: 'B', email: 'a@b.c' },
      teacher: { id: 10, nombres: 'T', apellidos: 'C', email: 't@b.c' },
      subject: { id: 3, nombre: 'Math' },
      group: { id: 2, nombre: '10-1' },
    });
    prisma.$queryRaw.mockResolvedValue([]);

    await expect(
      service.getActivityAttachment(
        { userId: 20, role: UserRole.ESTUDIANTE },
        1,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows student to delete own pending request', async () => {
    prisma.recoveryRequest.findUnique.mockResolvedValue({
      id: 50,
      studentId: 20,
      teacherId: 10,
      status: 'PENDING',
      groupId: 2,
      subjectId: 3,
      student: { id: 20, nombres: 'A', apellidos: 'B', email: 'a@b.c' },
      teacher: { id: 10, nombres: 'T', apellidos: 'C', email: 't@b.c' },
      subject: { id: 3, nombre: 'Math' },
      group: { id: 2, nombre: '10-1' },
    });
    prisma.recoveryRequest.delete.mockResolvedValue({ id: 50 });

    await expect(
      service.deleteRequest({ userId: 20, role: UserRole.ESTUDIANTE }, 50),
    ).resolves.toEqual({ id: 50, deleted: true });
    expect(prisma.recoveryRequest.delete).toHaveBeenCalledWith({
      where: { id: 50 },
    });
  });

  it('rejects student deletion when request is not pending', async () => {
    prisma.recoveryRequest.findUnique.mockResolvedValue({
      id: 50,
      studentId: 20,
      teacherId: 10,
      status: 'APPROVED',
      groupId: 2,
      subjectId: 3,
      student: { id: 20, nombres: 'A', apellidos: 'B', email: 'a@b.c' },
      teacher: { id: 10, nombres: 'T', apellidos: 'C', email: 't@b.c' },
      subject: { id: 3, nombre: 'Math' },
      group: { id: 2, nombre: '10-1' },
    });

    await expect(
      service.deleteRequest({ userId: 20, role: UserRole.ESTUDIANTE }, 50),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows secretaria to delete activity', async () => {
    prisma.recoveryActivity.findUnique.mockResolvedValue({
      id: 7,
      requestId: 50,
      teacherId: 10,
      request: { id: 50 },
    });
    prisma.recoveryActivity.delete.mockResolvedValue({ id: 7 });

    await expect(
      service.deleteActivity({ userId: 1, role: UserRole.SECRETARIA }, 7),
    ).resolves.toEqual({ id: 7, deleted: true });
    expect(prisma.recoveryActivity.delete).toHaveBeenCalledWith({
      where: { id: 7 },
    });
  });

  it('rejects activity deletion when teacher is not owner', async () => {
    prisma.recoveryActivity.findUnique.mockResolvedValue({
      id: 7,
      requestId: 50,
      teacherId: 10,
      request: { id: 50 },
    });

    await expect(
      service.deleteActivity({ userId: 30, role: UserRole.PROFESOR }, 7),
    ).rejects.toThrow(ForbiddenException);
  });
});
