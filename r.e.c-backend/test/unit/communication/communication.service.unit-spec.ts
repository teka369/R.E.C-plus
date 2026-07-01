import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommunicationService } from '../../../src/communication/communication.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';
import type { Actor } from '../../../src/common/tenant';

describe('CommunicationService (unit)', () => {
  const prisma = {
    feedback: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    feedbackStrength: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    feedbackImprovement: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    teacherAssignment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    group: { findFirst: jest.fn() },
    user: { findFirst: jest.fn(), findUnique: jest.fn() },
    studentGroup: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const appGatewayService = {
    emitToUser: jest.fn(),
    emitToTenant: jest.fn(),
  };

  const usersService = {
    getPushTokensByUser: jest.fn().mockResolvedValue([]),
  };

  const firebaseAdmin = {
    sendToTokens: jest.fn().mockResolvedValue(undefined),
  };

  let service: CommunicationService;

  const profesorActor: Actor = {
    userId: 5,
    role: UserRole.PROFESOR,
    institutionId: 100,
  };

  const secretariaActor: Actor = {
    userId: 1,
    role: UserRole.SECRETARIA,
    institutionId: 100,
  };

  const estudianteActor: Actor = {
    userId: 20,
    role: UserRole.ESTUDIANTE,
    institutionId: 100,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const superAdminActor: Actor = {
    userId: 99,
    role: UserRole.SUPER_ADMIN,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommunicationService(prisma as never, appGatewayService as never, usersService as never, firebaseAdmin as never);
  });

  // ─── Feedback ─────────────────────────────────────────────────────────

  describe('createFeedback', () => {
    it('crea feedback como profesor con asignación válida', async () => {
      prisma.teacherAssignment.findFirst.mockResolvedValue({ id: 30 });
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.user.findFirst.mockResolvedValue({
        id: 20,
        institutionId: 100,
      });
      prisma.studentGroup.findFirst.mockResolvedValue({ id: 100 });
      prisma.feedback.create.mockResolvedValue({
        id: 1,
        teacherId: 5,
        studentId: 20,
      });

      const result = await service.createFeedback(
        {
          groupId: 10,
          studentId: 20,
          title: 'Buen desempeño',
          content: 'Excelente trabajo',
        },
        profesorActor,
      );

      expect(result.id).toBe(1);
    });

    it('rechaza si el actor no es PROFESOR', async () => {
      await expect(
        service.createFeedback(
          { groupId: 10, studentId: 20, title: 'T', content: 'C' },
          secretariaActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si el profesor no tiene asignación al grupo', async () => {
      prisma.teacherAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.createFeedback(
          { groupId: 10, studentId: 20, title: 'T', content: 'C' },
          profesorActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si el estudiante no pertenece a la institución', async () => {
      prisma.teacherAssignment.findFirst.mockResolvedValue({ id: 30 });
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.createFeedback(
          { groupId: 10, studentId: 999, title: 'T', content: 'C' },
          profesorActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si el estudiante no está activo en el grupo', async () => {
      prisma.teacherAssignment.findFirst.mockResolvedValue({ id: 30 });
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.user.findFirst.mockResolvedValue({
        id: 20,
        institutionId: 100,
      });
      prisma.studentGroup.findFirst.mockResolvedValue(null);

      await expect(
        service.createFeedback(
          { groupId: 10, studentId: 20, title: 'T', content: 'C' },
          profesorActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateFeedback', () => {
    it('actualiza feedback del autor', async () => {
      prisma.feedback.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 5,
        group: { institutionId: 100 },
      });
      prisma.feedback.update.mockResolvedValue({
        id: 1,
        title: 'Actualizado',
      });

      const result = await service.updateFeedback(
        1,
        { title: 'Actualizado' },
        profesorActor,
      );

      expect(result.title).toBe('Actualizado');
    });

    it('rechaza si el feedback no existe', async () => {
      prisma.feedback.findUnique.mockResolvedValue(null);

      await expect(
        service.updateFeedback(999, { title: 'X' }, profesorActor),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza si el feedback es de otra institución', async () => {
      prisma.feedback.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 5,
        group: { institutionId: 200 },
      });

      await expect(
        service.updateFeedback(1, { title: 'X' }, profesorActor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si el actor no es el autor', async () => {
      prisma.feedback.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 999,
        group: { institutionId: 100 },
      });

      await expect(
        service.updateFeedback(1, { title: 'X' }, profesorActor),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteFeedback', () => {
    it('elimina feedback del autor', async () => {
      prisma.feedback.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 5,
        group: { institutionId: 100 },
      });
      prisma.feedback.delete.mockResolvedValue({ id: 1 });

      const result = await service.deleteFeedback(1, profesorActor);

      expect(result).toEqual({ deleted: true });
    });

    it('rechaza si no existe', async () => {
      prisma.feedback.findUnique.mockResolvedValue(null);

      await expect(service.deleteFeedback(999, profesorActor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza profesor que no es autor ni admin', async () => {
      prisma.feedback.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 999,
        group: { institutionId: 100 },
      });

      await expect(service.deleteFeedback(1, profesorActor)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('listFeedbackByGroup', () => {
    it('SECRETARIA puede listar feedback del grupo', async () => {
      prisma.feedback.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.feedback.count.mockResolvedValue(1);

      const result = await service.listFeedbackByGroup(10, secretariaActor);

      expect(result.data).toHaveLength(1);
    });

    it('PROFESOR con asignación puede listar', async () => {
      prisma.teacherAssignment.findFirst.mockResolvedValue({ id: 30 });
      prisma.feedback.findMany.mockResolvedValue([]);
      prisma.feedback.count.mockResolvedValue(0);

      const result = await service.listFeedbackByGroup(10, profesorActor);

      expect(result.data).toHaveLength(0);
    });

    it('PROFESOR sin asignación recibe ForbiddenException', async () => {
      prisma.teacherAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.listFeedbackByGroup(10, profesorActor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ESTUDIANTE recibe ForbiddenException', async () => {
      await expect(
        service.listFeedbackByGroup(10, estudianteActor),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Mensajes ─────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    it('envía mensaje a destinatario de la misma institución', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 20,
        institutionId: 100,
      });
      prisma.message.create.mockResolvedValue({
        id: 1,
        senderId: 5,
        recipientId: 20,
      });

      const result = await service.sendMessage(
        { recipientId: 20, content: 'Hola' },
        profesorActor,
      );

      expect(result.senderId).toBe(5);
    });

    it('rechaza si el destinatario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage(
          { recipientId: 999, content: 'Hola' },
          profesorActor,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza mensajería entre instituciones diferentes', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 20,
        institutionId: 200,
      });

      await expect(
        service.sendMessage(
          { recipientId: 20, content: 'Hola' },
          profesorActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('inbox', () => {
    it('retorna mensajes recibidos paginados', async () => {
      prisma.message.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.message.count.mockResolvedValue(1);

      const result = await service.inbox(profesorActor);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('sent', () => {
    it('retorna mensajes enviados paginados', async () => {
      prisma.message.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.message.count.mockResolvedValue(1);

      const result = await service.sent(profesorActor);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('markMessageRead', () => {
    it('marca mensaje como leído por el destinatario', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 1,
        recipientId: 5,
      });
      prisma.message.update.mockResolvedValue({ id: 1, readAt: new Date() });

      const result = await service.markMessageRead(1, profesorActor);

      expect(result.readAt).toBeDefined();
    });

    it('rechaza si el mensaje no existe', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(service.markMessageRead(999, profesorActor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si el actor no es el destinatario', async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 1,
        recipientId: 999,
      });

      await expect(service.markMessageRead(1, profesorActor)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── Notificaciones ───────────────────────────────────────────────────

  describe('createNotification', () => {
    it('SECRETARIA crea notificación', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 20,
        institutionId: 100,
      });
      prisma.notification.create.mockResolvedValue({
        id: 1,
        userId: 20,
        title: 'Aviso',
      });

      const result = await service.createNotification(
        { userId: 20, title: 'Aviso', body: 'Cuerpo' },
        secretariaActor,
      );

      expect(result.title).toBe('Aviso');
    });

    it('rechaza si el actor no es SECRETARIA ni SUPER_ADMIN', async () => {
      await expect(
        service.createNotification(
          { userId: 20, title: 'X', body: 'Y' },
          profesorActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si el usuario destino no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createNotification(
          { userId: 999, title: 'X', body: 'Y' },
          secretariaActor,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza notificación cross-tenant', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 20,
        institutionId: 200,
      });

      await expect(
        service.createNotification(
          { userId: 20, title: 'X', body: 'Y' },
          secretariaActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listNotifications', () => {
    it('retorna notificaciones paginadas', async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.notification.count.mockResolvedValue(1);

      const result = await service.listNotifications(profesorActor);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('markNotificationRead', () => {
    it('marca notificación como leída', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
      });
      prisma.notification.update.mockResolvedValue({
        id: 1,
        readAt: new Date(),
      });

      const result = await service.markNotificationRead(1, profesorActor);

      expect(result.readAt).toBeDefined();
    });

    it('rechaza si la notificación no existe', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(
        service.markNotificationRead(999, profesorActor),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza si el actor no es el dueño', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 1,
        userId: 999,
      });

      await expect(
        service.markNotificationRead(1, profesorActor),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listFeedbackByStudent', () => {
    it('SECRETARIA puede listar feedback por estudiante', async () => {
      prisma.feedback.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.feedback.count.mockResolvedValue(1);

      const result = await service.listFeedbackByStudent(20, secretariaActor);

      expect(result.data).toHaveLength(1);
    });

    it('El propio estudiante puede ver su feedback', async () => {
      prisma.feedback.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.feedback.count.mockResolvedValue(1);

      const result = await service.listFeedbackByStudent(20, estudianteActor);

      expect(result.data).toHaveLength(1);
    });
  });
});
