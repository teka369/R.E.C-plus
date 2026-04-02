import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InstitutionsService } from '../../../src/institutions/institutions.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn((val: string) => Promise.resolve(`hashed:${val}`)),
}));

describe('InstitutionsService (unit)', () => {
  const prisma = {
    institution: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    academicPeriod: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
    // Modelos para delete cascade
    message: { deleteMany: jest.fn() },
    notification: { deleteMany: jest.fn() },
    feedback: { deleteMany: jest.fn() },
    authSession: { deleteMany: jest.fn() },
    recoveryMessage: { deleteMany: jest.fn() },
    recoveryRequest: { findMany: jest.fn(), deleteMany: jest.fn() },
    recoveryActivity: { findMany: jest.fn(), deleteMany: jest.fn() },
    recoveryActivityAttachment: { deleteMany: jest.fn() },
    group: { findMany: jest.fn(), deleteMany: jest.fn() },
    studentGroup: { deleteMany: jest.fn() },
    teacherAssignment: { deleteMany: jest.fn() },
    weeklyScheduleEntry: { deleteMany: jest.fn() },
    scheduleNote: { deleteMany: jest.fn() },
    scheduleEvent: { deleteMany: jest.fn() },
    studyMaterial: { deleteMany: jest.fn() },
    academicOffering: { findMany: jest.fn(), deleteMany: jest.fn() },
    academicEvaluation: { deleteMany: jest.fn() },
    gradePerformance: { deleteMany: jest.fn() },
    studentAcademicRecord: { deleteMany: jest.fn() },
    groupSubject: { deleteMany: jest.fn() },
    groupInfo: { deleteMany: jest.fn() },
    subject: { deleteMany: jest.fn() },
    grade: { deleteMany: jest.fn() },
  };

  let service: InstitutionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstitutionsService(prisma as never);
  });

  describe('create', () => {
    it('crea una institución con datos correctos', async () => {
      prisma.institution.create.mockResolvedValue({
        id: 1,
        nombre: 'Colegio Test',
        slug: 'colegio-test',
        activa: true,
      });

      const result = await service.create({
        nombre: 'Colegio Test',
        slug: 'colegio-test',
        codigo: 'CT',
        dominio: 'colegio.co',
      });

      expect(result.nombre).toBe('Colegio Test');
    });
  });

  describe('findAll', () => {
    it('retorna instituciones con conteo de usuarios', async () => {
      prisma.institution.findMany.mockResolvedValue([
        { id: 1, nombre: 'C1' },
        { id: 2, nombre: 'C2' },
      ]);
      prisma.user.groupBy.mockResolvedValue([
        { institutionId: 1, _count: { _all: 50 } },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].usersCount).toBe(50);
      expect(result[1].usersCount).toBe(0);
    });
  });

  describe('findOne', () => {
    it('retorna institución con conteo de usuarios', async () => {
      prisma.institution.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'C1',
      });
      prisma.user.count.mockResolvedValue(25);

      const result = await service.findOne(1);

      expect(result.nombre).toBe('C1');
      expect(result.usersCount).toBe(25);
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.institution.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza la institución', async () => {
      prisma.institution.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'C1',
      });
      prisma.user.count.mockResolvedValue(10);
      prisma.institution.update.mockResolvedValue({
        id: 1,
        nombre: 'C1 Updated',
      });

      const result = await service.update(1, { nombre: 'C1 Updated' });

      expect(result.nombre).toBe('C1 Updated');
    });
  });

  describe('provision', () => {
    it('crea institución con secretaria', async () => {
      prisma.$transaction.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/require-await
        async (fn: (tx: any) => any) =>
          fn({
            institution: {
              create: jest.fn().mockResolvedValue({
                id: 1,
                nombre: 'Nuevo Colegio',
                slug: 'nuevo',
                maxUsers: 500,
                activa: true,
              }),
            },
            user: {
              create: jest.fn().mockResolvedValue({
                id: 100,
                nombres: 'Maria',
                apellidos: 'Sec',
                email: 'sec@new.co',
                codigo: 'CODE1',
                role: 'SECRETARIA',
                institutionId: 1,
              }),
            },
          }),
      );

      const result = await service.provision({
        institution: {
          nombre: 'Nuevo Colegio',
          slug: 'nuevo',
          codigo: 'NC',
          dominio: 'nuevo.co',
        },
        secretarias: [
          {
            nombres: 'Maria',
            apellidos: 'Sec',
            email: 'sec@new.co',
            password: 'SecurePass123!',
          },
        ],
      });

      expect(result.institution.nombre).toBe('Nuevo Colegio');
      expect(result.secretarias).toHaveLength(1);
    });

    it('rechaza si no se proporcionan secretarias', async () => {
      await expect(
        service.provision({
          institution: {
            nombre: 'X',
            slug: 'x',
            codigo: 'X',
            dominio: 'x.co',
          },
          secretarias: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listPeriods', () => {
    it('retorna períodos de la institución', async () => {
      prisma.academicPeriod.findMany.mockResolvedValue([
        { id: 1, nombre: '2026-1' },
      ]);

      const result = await service.listPeriods(1);

      expect(result).toHaveLength(1);
    });
  });

  describe('getActivePeriod', () => {
    it('retorna período activo', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({
        id: 1,
        estado: 'ACTIVE',
      });

      const result = await service.getActivePeriod(1);

      expect(result!.estado).toBe('ACTIVE');
    });
  });

  describe('createPeriod', () => {
    it('crea un período nuevo', async () => {
      prisma.academicPeriod.findUnique.mockResolvedValue(null);
      prisma.academicPeriod.create.mockResolvedValue({
        id: 1,
        nombre: '2026-1',
        estado: 'ACTIVE',
      });

      const result = await service.createPeriod(1, {
        nombre: '2026-1',
        codigo: 'P1',
        fechaInicio: '2026-01-15',
        fechaFin: '2026-06-15',
      });

      expect(result.nombre).toBe('2026-1');
    });

    it('rechaza código duplicado', async () => {
      prisma.academicPeriod.findUnique.mockResolvedValue({
        id: 1,
        codigo: 'P1',
      });

      await expect(
        service.createPeriod(1, {
          nombre: '2026-1',
          codigo: 'P1',
          fechaInicio: '2026-01-15',
          fechaFin: '2026-06-15',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('activatePeriod', () => {
    it('activa un período cerrando el anterior', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({
        id: 2,
        institutionId: 1,
      });
      prisma.$transaction.mockResolvedValue([]);
      prisma.academicPeriod.findUnique.mockResolvedValue({
        id: 2,
        estado: 'ACTIVE',
      });

      const result = await service.activatePeriod(1, 2);

      expect(result!.estado).toBe('ACTIVE');
    });

    it('rechaza período inexistente', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      await expect(service.activatePeriod(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('closePeriod', () => {
    it('cierra un período', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({
        id: 2,
        institutionId: 1,
      });
      prisma.academicPeriod.update.mockResolvedValue({
        id: 2,
        estado: 'CLOSED',
      });

      const result = await service.closePeriod(1, 2);

      expect(result.estado).toBe('CLOSED');
    });

    it('rechaza período inexistente', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      await expect(service.closePeriod(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('lanza si la institución no existe', async () => {
      prisma.institution.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
