import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RecoveryService } from '../../../src/recovery/recovery.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';
import { Actor } from '../../../src/common/tenant';

jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs');
  return {
    ...actual,
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue(Buffer.from('test')),
    },
  };
});

jest.mock('node:crypto', () => {
  const actual = jest.requireActual('node:crypto');
  return { ...actual, randomUUID: () => 'test-uuid' };
});

describe('RecoveryService (unit)', () => {
  const prisma = {
    academicPeriod: { findFirst: jest.fn() },
    $queryRaw: jest.fn(),
    group: { findFirst: jest.fn() },
    teacherAssignment: { findFirst: jest.fn() },
    studentGroup: { findFirst: jest.fn() },
    recoveryRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    recoveryActivity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    recoveryActivityAttachment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    recoveryMessage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: RecoveryService;

  const estudiante: Actor = {
    userId: 30,
    role: UserRole.ESTUDIANTE,
    institutionId: 1,
  };
  const profesor: Actor = {
    userId: 5,
    role: UserRole.PROFESOR,
    institutionId: 1,
  };
  const secretaria: Actor = {
    userId: 10,
    role: UserRole.SECRETARIA,
    institutionId: 1,
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const superAdmin: Actor = { userId: 1, role: UserRole.SUPER_ADMIN };

  const mockRequest = {
    id: 1,
    studentId: 30,
    teacherId: 5,
    groupId: 10,
    subjectId: 3,
    status: 'PENDING',
    student: { id: 30, nombres: 'Juan', apellidos: 'P', email: 'j@t.co' },
    teacher: { id: 5, nombres: 'Prof', apellidos: 'X', email: 'p@t.co' },
    subject: { id: 3, nombre: 'Matemáticas' },
    group: { id: 10, nombre: '1A', institutionId: 1 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecoveryService(prisma as never);
  });

  // Helper: simular periodo de recuperación activo
  function setupRecoveryPeriodActive() {
    prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
    const now = new Date();
    const future = new Date(now.getTime() + 86400000);
    const past = new Date(now.getTime() - 86400000);
    prisma.$queryRaw.mockResolvedValue([{ startAt: past, endAt: future }]);
  }

  function setupRecoveryPeriodInactive() {
    prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
    const past = new Date(Date.now() - 86400000 * 2);
    const yesterday = new Date(Date.now() - 86400000);
    prisma.$queryRaw.mockResolvedValue([{ startAt: past, endAt: yesterday }]);
  }

  // ======================================================
  // createRequest
  // ======================================================
  describe('createRequest', () => {
    it('crea solicitud como estudiante con período activo', async () => {
      setupRecoveryPeriodActive();
      prisma.studentGroup.findFirst.mockResolvedValue({
        groupId: 10,
        group: { id: 10 },
      });
      prisma.teacherAssignment.findFirst.mockResolvedValue({
        teacherId: 5,
      });
      prisma.recoveryRequest.create.mockResolvedValue({
        id: 1,
        studentId: 30,
        type: 'ACADEMIC',
      });

      const result = await service.createRequest(estudiante, {
        subjectId: 3,
        type: 'ACADEMIC',
        reason: 'Bajo rendimiento',
      } as never);

      expect(result.id).toBe(1);
    });

    it('rechaza si no es estudiante', async () => {
      setupRecoveryPeriodActive();

      await expect(
        service.createRequest(profesor, {
          subjectId: 3,
          type: 'ACADEMIC',
          reason: 'X',
        } as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si no hay grupo/materia asociada', async () => {
      setupRecoveryPeriodActive();
      prisma.studentGroup.findFirst.mockResolvedValue(null);

      await expect(
        service.createRequest(estudiante, {
          subjectId: 3,
          type: 'ACADEMIC',
          reason: 'X',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si no hay profesor asignado', async () => {
      setupRecoveryPeriodActive();
      prisma.studentGroup.findFirst.mockResolvedValue({
        groupId: 10,
        group: { id: 10 },
      });
      prisma.teacherAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.createRequest(estudiante, {
          subjectId: 3,
          type: 'ACADEMIC',
          reason: 'X',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si periodo de recuperación inactivo', async () => {
      setupRecoveryPeriodInactive();

      await expect(
        service.createRequest(estudiante, {
          subjectId: 3,
          type: 'ACADEMIC',
          reason: 'X',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ======================================================
  // listMyRequests
  // ======================================================
  describe('listMyRequests', () => {
    it('retorna solicitudes del estudiante', async () => {
      prisma.recoveryRequest.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.recoveryRequest.count.mockResolvedValue(1);

      const result = await service.listMyRequests(estudiante);

      expect(result.data).toHaveLength(1);
    });

    it('rechaza si no es estudiante', async () => {
      await expect(service.listMyRequests(profesor)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ======================================================
  // listGroupRequests
  // ======================================================
  describe('listGroupRequests', () => {
    it('retorna solicitudes del grupo para secretaria', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      prisma.recoveryRequest.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.recoveryRequest.count.mockResolvedValue(1);

      const result = await service.listGroupRequests(secretaria, 10);

      expect(result.data).toHaveLength(1);
    });

    it('rechaza si grupo fuera de institución', async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect(service.listGroupRequests(secretaria, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ======================================================
  // updateRequestStatus
  // ======================================================
  describe('updateRequestStatus', () => {
    it('profesor asignado aprueba solicitud', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.recoveryRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
      });

      const result = await service.updateRequestStatus(profesor, 1, {
        status: 'APPROVED',
      } as never);

      expect(result.status).toBe('APPROVED');
    });

    it('rechaza COMPLETED sin finalScore', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);

      await expect(
        service.updateRequestStatus(profesor, 1, {
          status: 'COMPLETED',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si no es profesor ni secretaria', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);

      await expect(
        service.updateRequestStatus(estudiante, 1, {
          status: 'APPROVED',
        } as never),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ======================================================
  // Activities
  // ======================================================
  describe('listActivities', () => {
    it('retorna actividades con hasAttachment', async () => {
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.recoveryActivity.findMany.mockResolvedValue([
        { id: 1, requestId: 1 },
        { id: 2, requestId: 1 },
      ]);
      prisma.recoveryActivityAttachment.findMany.mockResolvedValue([
        { activityId: 1 },
      ]);

      const result = await service.listActivities(profesor, 1);

      expect(result).toHaveLength(2);
      expect(result[0].hasAttachment).toBe(true);
      expect(result[1].hasAttachment).toBe(false);
    });

    it('retorna array vacío si no hay actividades', async () => {
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.recoveryActivity.findMany.mockResolvedValue([]);

      const result = await service.listActivities(profesor, 1);

      expect(result).toEqual([]);
    });
  });

  describe('createActivity', () => {
    it('profesor crea actividad en solicitud aprobada', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
      });
      prisma.recoveryActivity.create.mockResolvedValue({
        id: 1,
        title: 'Taller',
      });

      const result = await service.createActivity(profesor, 1, {
        title: 'Taller',
        dueAt: '2026-03-15T23:59:00Z',
        activityType: 'TALLER',
      } as never);

      expect(result.title).toBe('Taller');
    });

    it('rechaza en solicitud rechazada', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: 'REJECTED',
      });

      await expect(
        service.createActivity(profesor, 1, {
          title: 'X',
          dueAt: '2026-03-15',
          activityType: 'TALLER',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si startAt >= dueAt', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
      });

      await expect(
        service.createActivity(profesor, 1, {
          title: 'X',
          startAt: '2026-03-16T00:00:00Z',
          dueAt: '2026-03-15T23:59:00Z',
          activityType: 'TALLER',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si no es el profesor asignado', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        teacherId: 999,
      });

      await expect(
        service.createActivity(profesor, 1, {
          title: 'X',
          dueAt: '2026-03-15',
          activityType: 'TALLER',
        } as never),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateActivity', () => {
    it('actualiza actividad como profesor creador', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryActivity.findUnique.mockResolvedValue({
        id: 1,
        teacherId: profesor.userId,
        request: mockRequest,
      });
      prisma.recoveryActivity.update.mockResolvedValue({
        id: 1,
        status: 'SUBMITTED',
      });

      const result = await service.updateActivity(profesor, 1, {
        status: 'SUBMITTED',
      } as never);

      expect(result.status).toBe('SUBMITTED');
    });

    it('rechaza EVALUATED sin score', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryActivity.findUnique.mockResolvedValue({
        id: 1,
        teacherId: profesor.userId,
        request: mockRequest,
      });

      await expect(
        service.updateActivity(profesor, 1, {
          status: 'EVALUATED',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si no es el creador', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryActivity.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 999,
        request: mockRequest,
      });

      await expect(
        service.updateActivity(profesor, 1, {
          status: 'SUBMITTED',
        } as never),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ======================================================
  // deleteRequest
  // ======================================================
  describe('deleteRequest', () => {
    it('secretaria puede eliminar cualquier solicitud', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.recoveryRequest.delete.mockResolvedValue({});

      const result = await service.deleteRequest(secretaria, 1);

      expect(result.deleted).toBe(true);
    });

    it('estudiante solo puede eliminar solicitudes PENDING', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.recoveryRequest.delete.mockResolvedValue({});

      const result = await service.deleteRequest(estudiante, 1);

      expect(result.deleted).toBe(true);
    });

    it('estudiante no puede eliminar solicitud no-PENDING', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
      });

      await expect(service.deleteRequest(estudiante, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ======================================================
  // deleteActivity
  // ======================================================
  describe('deleteActivity', () => {
    it('secretaria puede eliminar actividad', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryActivity.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 5,
        requestId: 1,
        request: mockRequest,
      });
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.recoveryActivity.delete.mockResolvedValue({});

      const result = await service.deleteActivity(secretaria, 1);

      expect(result.deleted).toBe(true);
    });

    it('rechaza si no es secretaria ni profesor creador', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryActivity.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 999,
        requestId: 1,
        request: mockRequest,
      });
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);

      await expect(service.deleteActivity(estudiante, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ======================================================
  // Messages
  // ======================================================
  describe('listMessages', () => {
    it('retorna mensajes de la solicitud', async () => {
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.recoveryMessage.findMany.mockResolvedValue([
        { id: 1, body: 'Hola' },
      ]);

      const result = await service.listMessages(profesor, 1);

      expect(result).toHaveLength(1);
    });
  });

  describe('createMessage', () => {
    it('crea mensaje en solicitud', async () => {
      setupRecoveryPeriodActive();
      prisma.recoveryRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.recoveryMessage.create.mockResolvedValue({
        id: 1,
        body: 'Mensaje test',
      });

      const result = await service.createMessage(profesor, 1, {
        body: 'Mensaje test',
      });

      expect(result.body).toBe('Mensaje test');
    });
  });

  // ======================================================
  // Stats
  // ======================================================
  describe('statsByGroup', () => {
    it('retorna estadísticas del grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      prisma.recoveryRequest.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(3); // approvedOrCompleted
      prisma.recoveryRequest.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { _all: 2 } },
        { status: 'PENDING', _count: { _all: 3 } },
      ]);

      const result = await service.statsByGroup(secretaria, 10);

      expect(result.total).toBe(5);
      expect(result.approvalRate).toBe(60);
    });
  });

  describe('statsByStudent', () => {
    it('estudiante ve sus propias estadísticas', async () => {
      prisma.recoveryRequest.count.mockResolvedValue(3);
      prisma.recoveryRequest.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: { _all: 3 } },
      ]);
      prisma.recoveryRequest.aggregate.mockResolvedValue({
        _avg: { finalScore: 4.2 },
      });

      const result = await service.statsByStudent(estudiante, 30);

      expect(result.total).toBe(3);
      expect(result.avgFinalScore).toBe(4.2);
    });

    it('rechaza si estudiante intenta ver stats de otro', async () => {
      await expect(service.statsByStudent(estudiante, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('profesor ve stats de estudiante vinculado', async () => {
      prisma.recoveryRequest.count
        .mockResolvedValueOnce(1) // linked check
        .mockResolvedValueOnce(1); // total query
      prisma.recoveryRequest.groupBy.mockResolvedValue([]);
      prisma.recoveryRequest.aggregate.mockResolvedValue({
        _avg: { finalScore: null },
      });

      const result = await service.statsByStudent(profesor, 30);

      expect(result.studentId).toBe(30);
    });

    it('rechaza profesor sin vinculación', async () => {
      prisma.recoveryRequest.count.mockResolvedValue(0);

      await expect(service.statsByStudent(profesor, 30)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
