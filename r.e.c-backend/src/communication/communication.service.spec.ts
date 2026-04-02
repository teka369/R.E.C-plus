import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

describe('CommunicationService', () => {
  let service: CommunicationService;
  let prisma: {
    feedback: {
      findUnique: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    feedbackStrength: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    feedbackImprovement: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    message: {
      create: jest.Mock;
    };
    notification: {
      create: jest.Mock;
    };
    teacherAssignment: {
      findFirst: jest.Mock;
    };
    user: {
      findFirst: jest.Mock;
    };
    studentGroup: {
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
    $executeRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      feedback: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      feedbackStrength: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      feedbackImprovement: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      message: {
        create: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      teacherAssignment: {
        findFirst: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      studentGroup: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
      $executeRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createFeedback: validación de studentId ───────────────────────────────

  describe('createFeedback – validación de studentId (FASE 1 fix)', () => {
    const actor = { userId: 10, role: UserRole.PROFESOR, institutionId: 1 };
    const baseDto = {
      studentId: 99,
      groupId: 5,
      subjectId: undefined,
      title: 'Test',
      content: 'Contenido del feedback',
      tipo: 'INFORMATIVA',
      estado: 'PENDIENTE',
    };

    beforeEach(() => {
      // El profesor sí tiene asignación en el grupo de su institución
      prisma.teacherAssignment.findFirst.mockResolvedValue({ id: 1 });
    });

    it('crea feedback cuando estudiante pertenece a la institución y está en el grupo', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 99 });
      prisma.studentGroup.findFirst.mockResolvedValue({ id: 20 });
      prisma.feedback.create.mockResolvedValue({ id: 100, ...baseDto });

      const result = await service.createFeedback(baseDto as any, actor);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 99, institutionId: 1, role: UserRole.ESTUDIANTE },
        select: { id: true },
      });
      expect(prisma.studentGroup.findFirst).toHaveBeenCalledWith({
        where: { studentId: 99, groupId: 5, status: 'ACTIVE' },
        select: { id: true },
      });
      expect(prisma.feedback.create).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ id: 100 });
    });

    it('rechaza con ForbiddenException si el estudiante pertenece a otra institución', async () => {
      prisma.user.findFirst.mockResolvedValue(null); // no encontrado en institutionId=1
      prisma.studentGroup.findFirst.mockResolvedValue({ id: 20 });

      await expect(service.createFeedback(baseDto as any, actor)).rejects.toThrow(
        ForbiddenException,
      );

      expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
      // La verificación de grupo NO debe ejecutarse si el estudiante ya falló
      expect(prisma.studentGroup.findFirst).not.toHaveBeenCalled();
      expect(prisma.feedback.create).not.toHaveBeenCalled();
    });

    it('rechaza con ForbiddenException si el estudiante no está matriculado en el grupo', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 99 }); // estudiante de la institución correcta
      prisma.studentGroup.findFirst.mockResolvedValue(null); // pero no en este grupo

      await expect(service.createFeedback(baseDto as any, actor)).rejects.toThrow(
        ForbiddenException,
      );

      expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.studentGroup.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.feedback.create).not.toHaveBeenCalled();
    });
  });

  // ─── updateFeedback: validación tenant explícita (FASE 1 hardening) ─────────

  describe('updateFeedback – validación de institución (FASE 1 hardening)', () => {
    const actor = { userId: 10, role: UserRole.PROFESOR, institutionId: 1 };
    const dto = { title: 'Nuevo título' };

    it('permite editar cuando el profesor es el autor y el feedback es de su institución', async () => {
      prisma.feedback.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 10,
        group: { institutionId: 1 },
      });
      prisma.feedback.update.mockResolvedValue({ id: 1, title: 'Nuevo título' });

      const result = await service.updateFeedback(1, dto as any, actor);

      expect(prisma.feedback.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { group: { select: { institutionId: true } } },
      });
      expect(prisma.feedback.update).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ title: 'Nuevo título' });
    });

    it('rechaza con ForbiddenException si el feedback pertenece a otra institución', async () => {
      prisma.feedback.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 10,           // mismo autor
        group: { institutionId: 2 }, // pero otra institución
      });

      await expect(service.updateFeedback(1, dto as any, actor)).rejects.toThrow(
        ForbiddenException,
      );

      expect(prisma.feedback.update).not.toHaveBeenCalled();
      expect(prisma.feedbackStrength.deleteMany).not.toHaveBeenCalled();
      expect(prisma.feedbackImprovement.deleteMany).not.toHaveBeenCalled();
    });

    it('rechaza con ForbiddenException si el actor no es el autor', async () => {
      prisma.feedback.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 99,           // autor diferente
        group: { institutionId: 1 },
      });

      await expect(service.updateFeedback(1, dto as any, actor)).rejects.toThrow(
        ForbiddenException,
      );

      expect(prisma.feedback.update).not.toHaveBeenCalled();
    });
  });

  // ─── deleteFeedback: validación cross-tenant existente ────────────────────

  it('denies cross-institution deleteFeedback with zero side effects', async () => {
    const feedbackRow = {
      id: 55,
      teacherId: 2001,
      deletedAt: null,
      group: { institutionId: 200 },
    };
    prisma.feedback.findUnique.mockResolvedValue(feedbackRow);

    const actor = {
      userId: 2001,
      role: UserRole.PROFESOR,
      institutionId: 100,
    };

    await expect(service.deleteFeedback(55, actor)).rejects.toThrow(
      ForbiddenException,
    );

    expect(prisma.feedback.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.feedback.delete).not.toHaveBeenCalled();
    expect(prisma.feedback.update).not.toHaveBeenCalled();
    expect(prisma.feedbackStrength.deleteMany).not.toHaveBeenCalled();
    expect(prisma.feedbackImprovement.deleteMany).not.toHaveBeenCalled();
    expect(prisma.message.create).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
    expect(feedbackRow.deletedAt).toBeNull();
  });
});
