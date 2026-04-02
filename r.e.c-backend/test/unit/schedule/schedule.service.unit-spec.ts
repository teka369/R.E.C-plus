import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ScheduleService } from '../../../src/schedule/schedule.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';
import { Actor } from '../../../src/common/tenant';

describe('ScheduleService (unit)', () => {
  const prisma = {
    group: { findUnique: jest.fn(), findFirst: jest.fn() },
    teacherAssignment: { findFirst: jest.fn() },
    studentGroup: { findFirst: jest.fn() },
    weeklyScheduleEntry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scheduleNote: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scheduleEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupSubject: { findUnique: jest.fn() },
  };

  let service: ScheduleService;

  const director: Actor = {
    userId: 10,
    role: UserRole.PROFESOR,
    institutionId: 1,
  };
  const secretaria: Actor = {
    userId: 20,
    role: UserRole.SECRETARIA,
    institutionId: 1,
  };
  const superAdmin: Actor = { userId: 1, role: UserRole.SUPER_ADMIN };
  const estudiante: Actor = {
    userId: 30,
    role: UserRole.ESTUDIANTE,
    institutionId: 1,
  };
  const otherProfesor: Actor = {
    userId: 40,
    role: UserRole.PROFESOR,
    institutionId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ScheduleService(prisma as never);
  });

  // --- Helper: configurar acceso de director ---
  function setupDirector(groupId = 5) {
    // eslint-disable-next-line @typescript-eslint/require-await
    prisma.group.findFirst.mockImplementation(async (args: any) => {
      if (args?.where?.directorId === director.userId) {
        return { id: groupId };
      }
      if (args?.where?.institutionId) return { id: groupId };
      return null;
    });
    prisma.group.findUnique.mockResolvedValue({ id: groupId });
  }

  // ===========================================
  // ENTRIES
  // ===========================================
  describe('listEntries', () => {
    it('retorna entradas para SUPER_ADMIN', async () => {
      prisma.group.findUnique.mockResolvedValue({ id: 5 });
      prisma.weeklyScheduleEntry.findMany.mockResolvedValue([
        { id: 1, dayOfWeek: 1, startMinutes: 480 },
      ]);

      const result = await service.listEntries(superAdmin, 5);

      expect(result).toHaveLength(1);
    });

    it('retorna entradas para director del grupo', async () => {
      setupDirector();
      prisma.weeklyScheduleEntry.findMany.mockResolvedValue([]);

      const result = await service.listEntries(director, 5);

      expect(result).toEqual([]);
    });

    it('permite acceso a profesor asignado al grupo', async () => {
      // eslint-disable-next-line @typescript-eslint/require-await
      prisma.group.findFirst.mockImplementation(async (args: any) => {
        if (args?.where?.directorId) return null;
        if (args?.where?.institutionId) return { id: 5 };
        return null;
      });
      prisma.teacherAssignment.findFirst.mockResolvedValue({ id: 1 });
      prisma.weeklyScheduleEntry.findMany.mockResolvedValue([]);

      const result = await service.listEntries(otherProfesor, 5);

      expect(result).toEqual([]);
    });

    it('permite acceso a estudiante del grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 5 });
      prisma.studentGroup.findFirst.mockResolvedValue({ id: 1 });
      prisma.weeklyScheduleEntry.findMany.mockResolvedValue([]);

      const result = await service.listEntries(estudiante, 5);

      expect(result).toEqual([]);
    });

    it('rechaza estudiante que no pertenece al grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 5 });
      prisma.studentGroup.findFirst.mockResolvedValue(null);

      await expect(service.listEntries(estudiante, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rechaza si grupo no existe para SUPER_ADMIN', async () => {
      prisma.group.findUnique.mockResolvedValue(null);

      await expect(service.listEntries(superAdmin, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si grupo fuera de institución', async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect(service.listEntries(secretaria, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createEntry', () => {
    it('crea entrada si es director', async () => {
      setupDirector();
      prisma.weeklyScheduleEntry.create.mockResolvedValue({
        id: 1,
        groupId: 5,
        dayOfWeek: 1,
        startMinutes: 480,
        endMinutes: 540,
      });

      const result = await service.createEntry(director, 5, {
        dayOfWeek: 1,
        startMinutes: 480,
        endMinutes: 540,
      });

      expect(result.id).toBe(1);
    });

    it('rechaza rango de tiempo inválido', async () => {
      setupDirector();

      await expect(
        service.createEntry(director, 5, {
          dayOfWeek: 1,
          startMinutes: 540,
          endMinutes: 480,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si no es director del grupo', async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect(
        service.createEntry(otherProfesor, 5, {
          dayOfWeek: 1,
          startMinutes: 480,
          endMinutes: 540,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si materia no pertenece al grupo', async () => {
      setupDirector();
      prisma.groupSubject.findUnique.mockResolvedValue(null);

      await expect(
        service.createEntry(director, 5, {
          dayOfWeek: 1,
          startMinutes: 480,
          endMinutes: 540,
          subjectId: 99,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si no es profesor', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 5 });

      await expect(
        service.createEntry(secretaria, 5, {
          dayOfWeek: 1,
          startMinutes: 480,
          endMinutes: 540,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateEntry', () => {
    it('actualiza entrada existente', async () => {
      prisma.weeklyScheduleEntry.findUnique.mockResolvedValue({
        id: 1,
        groupId: 5,
      });
      setupDirector();
      prisma.weeklyScheduleEntry.update.mockResolvedValue({
        id: 1,
        title: 'Nuevo titulo',
      });

      const result = await service.updateEntry(director, 1, {
        title: 'Nuevo titulo',
      });

      expect(result.title).toBe('Nuevo titulo');
    });

    it('lanza NotFoundException si la entrada no existe', async () => {
      prisma.weeklyScheduleEntry.findUnique.mockResolvedValue(null);

      await expect(
        service.updateEntry(director, 999, { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza rango de tiempo inválido en update', async () => {
      prisma.weeklyScheduleEntry.findUnique.mockResolvedValue({
        id: 1,
        groupId: 5,
      });
      setupDirector();

      await expect(
        service.updateEntry(director, 1, {
          startMinutes: 600,
          endMinutes: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteEntry', () => {
    it('elimina entrada existente', async () => {
      prisma.weeklyScheduleEntry.findUnique.mockResolvedValue({
        id: 1,
        groupId: 5,
      });
      setupDirector();
      prisma.weeklyScheduleEntry.delete.mockResolvedValue({});

      const result = await service.deleteEntry(director, 1);

      expect(result).toEqual({ deleted: true });
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.weeklyScheduleEntry.findUnique.mockResolvedValue(null);

      await expect(service.deleteEntry(director, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ===========================================
  // NOTES
  // ===========================================
  describe('listNotes', () => {
    it('retorna notas para secretaria', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 5 });
      prisma.scheduleNote.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await service.listNotes(secretaria, 5);

      expect(result).toHaveLength(1);
    });
  });

  describe('createNote', () => {
    it('crea nota como director', async () => {
      setupDirector();
      prisma.scheduleNote.create.mockResolvedValue({
        id: 1,
        content: 'Nota test',
      });

      const result = await service.createNote(director, 5, {
        content: 'Nota test',
      });

      expect(result.content).toBe('Nota test');
    });
  });

  describe('updateNote', () => {
    it('actualiza nota existente', async () => {
      prisma.scheduleNote.findUnique.mockResolvedValue({
        id: 1,
        groupId: 5,
      });
      setupDirector();
      prisma.scheduleNote.update.mockResolvedValue({
        id: 1,
        content: 'Editada',
      });

      const result = await service.updateNote(director, 1, {
        content: 'Editada',
      });

      expect(result.content).toBe('Editada');
    });

    it('lanza NotFoundException si la nota no existe', async () => {
      prisma.scheduleNote.findUnique.mockResolvedValue(null);

      await expect(
        service.updateNote(director, 999, { content: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteNote', () => {
    it('elimina nota existente', async () => {
      prisma.scheduleNote.findUnique.mockResolvedValue({
        id: 1,
        groupId: 5,
      });
      setupDirector();
      prisma.scheduleNote.delete.mockResolvedValue({});

      const result = await service.deleteNote(director, 1);

      expect(result).toEqual({ deleted: true });
    });

    it('lanza NotFoundException si la nota no existe', async () => {
      prisma.scheduleNote.findUnique.mockResolvedValue(null);

      await expect(service.deleteNote(director, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ===========================================
  // EVENTS
  // ===========================================
  describe('listEvents', () => {
    it('retorna eventos del grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 5 });
      prisma.scheduleEvent.findMany.mockResolvedValue([
        { id: 1, title: 'Examen' },
      ]);

      const result = await service.listEvents(secretaria, 5);

      expect(result).toHaveLength(1);
    });

    it('filtra por rango de fechas', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 5 });
      prisma.scheduleEvent.findMany.mockResolvedValue([]);

      const result = await service.listEvents(
        secretaria,
        5,
        '2026-01-01',
        '2026-06-30',
      );

      expect(result).toEqual([]);
      expect(prisma.scheduleEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startAt: expect.any(Object),
            endAt: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('createEvent', () => {
    it('crea evento como director', async () => {
      setupDirector();
      prisma.scheduleEvent.create.mockResolvedValue({
        id: 1,
        title: 'Examen final',
      });

      const result = await service.createEvent(director, 5, {
        title: 'Examen final',
        startAt: '2026-03-01T08:00:00Z',
        endAt: '2026-03-01T10:00:00Z',
      });

      expect(result.title).toBe('Examen final');
    });

    it('rechaza si fecha fin es anterior a inicio', async () => {
      setupDirector();

      await expect(
        service.createEvent(director, 5, {
          title: 'X',
          startAt: '2026-03-01T10:00:00Z',
          endAt: '2026-03-01T08:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateEvent', () => {
    it('actualiza evento existente', async () => {
      prisma.scheduleEvent.findUnique.mockResolvedValue({
        id: 1,
        groupId: 5,
      });
      setupDirector();
      prisma.scheduleEvent.update.mockResolvedValue({
        id: 1,
        title: 'Actualizado',
      });

      const result = await service.updateEvent(director, 1, {
        title: 'Actualizado',
      });

      expect(result.title).toBe('Actualizado');
    });

    it('lanza NotFoundException si el evento no existe', async () => {
      prisma.scheduleEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.updateEvent(director, 999, { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza rango de fechas inválido en update', async () => {
      prisma.scheduleEvent.findUnique.mockResolvedValue({
        id: 1,
        groupId: 5,
      });
      setupDirector();

      await expect(
        service.updateEvent(director, 1, {
          startAt: '2026-03-01T10:00:00Z',
          endAt: '2026-03-01T08:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteEvent', () => {
    it('elimina evento existente', async () => {
      prisma.scheduleEvent.findUnique.mockResolvedValue({
        id: 1,
        groupId: 5,
      });
      setupDirector();
      prisma.scheduleEvent.delete.mockResolvedValue({});

      const result = await service.deleteEvent(director, 1);

      expect(result).toEqual({ deleted: true });
    });

    it('lanza NotFoundException si el evento no existe', async () => {
      prisma.scheduleEvent.findUnique.mockResolvedValue(null);

      await expect(service.deleteEvent(director, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
