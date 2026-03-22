import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecoveryService } from './recovery.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

describe('RecoveryService', () => {
  let service: RecoveryService;
  let prisma: {
    academicPeriod: { findFirst: jest.Mock };
    recoveryActivity: { findUnique: jest.Mock; delete: jest.Mock };
    recoveryRequest: { findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
    group: { findFirst: jest.Mock };
    teacherAssignment: { findFirst: jest.Mock };
    studentGroup: { findFirst: jest.Mock };
    $queryRaw: jest.Mock;
    $executeRaw: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      academicPeriod: { findFirst: jest.fn() },
      recoveryActivity: { findUnique: jest.fn(), delete: jest.fn() },
      recoveryRequest: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      group: { findFirst: jest.fn() },
      teacherAssignment: { findFirst: jest.fn() },
      studentGroup: { findFirst: jest.fn() },
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    };

    prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
    prisma.$queryRaw.mockResolvedValue([
      {
        startAt: new Date(Date.now() - 60_000),
        endAt: new Date(Date.now() + 60_000),
      },
    ]);

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
      group: { id: 2, nombre: '10-1', institutionId: 2 },
    });

    await expect(
      service.getActivityAttachment(
        { userId: 33, role: UserRole.PROFESOR, institutionId: 2 },
        1,
      ),
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
      group: { id: 2, nombre: '10-1', institutionId: 2 },
    });
    prisma.$queryRaw.mockResolvedValue([]);

    await expect(
      service.getActivityAttachment(
        { userId: 20, role: UserRole.ESTUDIANTE, institutionId: 2 },
        1,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('denies cross-institution request deletion with no side effects', async () => {
    prisma.recoveryRequest.findUnique.mockResolvedValue({
      id: 70,
      studentId: 20,
      teacherId: 10,
      status: 'PENDING',
      groupId: 2,
      subjectId: 3,
      student: { id: 20, nombres: 'A', apellidos: 'B', email: 'a@b.c' },
      teacher: { id: 10, nombres: 'T', apellidos: 'C', email: 't@b.c' },
      subject: { id: 3, nombre: 'Math' },
      group: { id: 2, nombre: '10-1', institutionId: 200 },
    });

    await expect(
      service.deleteRequest(
        { userId: 999, role: UserRole.SECRETARIA, institutionId: 100 },
        70,
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.recoveryRequest.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.recoveryRequest.delete).not.toHaveBeenCalled();
    expect(prisma.recoveryActivity.delete).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('denies cross-institution status update before any write', async () => {
    const requestRow = {
      id: 71,
      studentId: 20,
      teacherId: 10,
      status: 'PENDING',
      respondedAt: null,
      groupId: 2,
      subjectId: 3,
      student: { id: 20, nombres: 'A', apellidos: 'B', email: 'a@b.c' },
      teacher: { id: 10, nombres: 'T', apellidos: 'C', email: 't@b.c' },
      subject: { id: 3, nombre: 'Math' },
      group: { id: 2, nombre: '10-1', institutionId: 200 },
    };
    prisma.recoveryRequest.findUnique.mockResolvedValue(requestRow);

    await expect(
      service.updateRequestStatus(
        { userId: 901, role: UserRole.SECRETARIA, institutionId: 100 },
        71,
        { status: 'APPROVED' } as never,
      ),
    ).rejects.toThrow(ForbiddenException);

    // Confirma control de lectura previa al write.
    expect(prisma.recoveryRequest.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.recoveryRequest.update).not.toHaveBeenCalled();

    // Verifica ausencia de side effects y de mutacion parcial en memoria.
    expect(requestRow.status).toBe('PENDING');
    expect(requestRow.respondedAt).toBeNull();
    expect(prisma.recoveryRequest.delete).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('executes authorized request status happy path with exact write set', async () => {
    const requestRow = {
      id: 72,
      studentId: 20,
      teacherId: 10,
      status: 'PENDING',
      respondedAt: null,
      groupId: 2,
      subjectId: 3,
      student: { id: 20, nombres: 'A', apellidos: 'B', email: 'a@b.c' },
      teacher: { id: 10, nombres: 'T', apellidos: 'C', email: 't@b.c' },
      subject: { id: 3, nombre: 'Math' },
      group: { id: 2, nombre: '10-1', institutionId: 2 },
    };
    const requestRowSnapshot = JSON.parse(JSON.stringify(requestRow));

    prisma.recoveryRequest.findUnique.mockResolvedValue(requestRow);
    prisma.recoveryRequest.update.mockImplementation(async ({ where, data }) => ({
      id: where.id,
      status: data.status,
      teacherComment: data.teacherComment,
      dueDate: data.dueDate,
      finalScore: data.finalScore ?? null,
      respondedAt: data.respondedAt,
    }));

    const result = await service.updateRequestStatus(
      { userId: 10, role: UserRole.PROFESOR, institutionId: 2 },
      72,
      {
        status: 'APPROVED',
        teacherComment: 'Aprobada para recuperación guiada',
        dueDate: '2030-01-15T00:00:00.000Z',
      } as never,
    );

    expect(prisma.recoveryRequest.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.recoveryRequest.update).toHaveBeenCalledTimes(1);

    const findUniqueOrder = prisma.recoveryRequest.findUnique.mock.invocationCallOrder[0];
    const updateOrder = prisma.recoveryRequest.update.mock.invocationCallOrder[0];
    expect(findUniqueOrder).toBeLessThan(updateOrder);

    const updateArg = prisma.recoveryRequest.update.mock.calls[0][0];
    expect(updateArg).toMatchObject({
      where: { id: 72 },
      data: {
        status: 'APPROVED',
        teacherComment: 'Aprobada para recuperación guiada',
        dueDate: new Date('2030-01-15T00:00:00.000Z'),
      },
    });
    expect(updateArg.data.respondedAt).toBeInstanceOf(Date);

    expect(result).toEqual({
      id: 72,
      status: 'APPROVED',
      teacherComment: 'Aprobada para recuperación guiada',
      dueDate: new Date('2030-01-15T00:00:00.000Z'),
      finalScore: null,
      respondedAt: updateArg.data.respondedAt,
    });

    expect(prisma.recoveryRequest.delete).not.toHaveBeenCalled();
    expect(prisma.recoveryActivity.delete).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
    expect(requestRow).toEqual(requestRowSnapshot);
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
      group: { id: 2, nombre: '10-1', institutionId: 2 },
    });
    prisma.recoveryRequest.delete.mockResolvedValue({ id: 50 });

    await expect(
      service.deleteRequest(
        { userId: 20, role: UserRole.ESTUDIANTE, institutionId: 2 },
        50,
      ),
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
      group: { id: 2, nombre: '10-1', institutionId: 2 },
    });

    await expect(
      service.deleteRequest(
        { userId: 20, role: UserRole.ESTUDIANTE, institutionId: 2 },
        50,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows secretaria to delete activity', async () => {
    prisma.recoveryActivity.findUnique.mockResolvedValue({
      id: 7,
      requestId: 50,
      teacherId: 10,
      request: { id: 50 },
    });
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
      group: { id: 2, nombre: '10-1', institutionId: 2 },
    });
    prisma.recoveryActivity.delete.mockResolvedValue({ id: 7 });

    await expect(
      service.deleteActivity(
        { userId: 1, role: UserRole.SECRETARIA, institutionId: 2 },
        7,
      ),
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
      group: { id: 2, nombre: '10-1', institutionId: 2 },
    });

    await expect(
      service.deleteActivity(
        { userId: 30, role: UserRole.PROFESOR, institutionId: 2 },
        7,
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
