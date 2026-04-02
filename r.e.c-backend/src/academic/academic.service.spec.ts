import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AcademicService } from './academic.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';
import { RedisCacheService } from '../common/cache/cache.service';

const secretariaActor = { userId: 1, role: UserRole.SECRETARIA, institutionId: 100 };
const profesorActor = { userId: 20, role: UserRole.PROFESOR, institutionId: 100 };
const superAdminActor = { userId: 99, role: UserRole.SUPER_ADMIN, institutionId: null };

describe('AcademicService', () => {
  let service: AcademicService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    grade: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock; count: jest.Mock };
    group: { findFirst: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; count: jest.Mock };
    subject: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock; count: jest.Mock };
    academicPeriod: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; count: jest.Mock };
    studentGroup: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; upsert: jest.Mock; findMany: jest.Mock };
    groupSubject: { upsert: jest.Mock; update: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    academicOffering: { upsert: jest.Mock; findMany: jest.Mock };
    teacherAssignment: { create: jest.Mock; update: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; delete: jest.Mock };
    $transaction: jest.Mock;
    $executeRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      grade: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      group: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
      subject: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      academicPeriod: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
      studentGroup: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn(), findMany: jest.fn() },
      groupSubject: { upsert: jest.fn(), update: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
      academicOffering: { upsert: jest.fn(), findMany: jest.fn() },
      teacherAssignment: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), delete: jest.fn() },
      $transaction: jest.fn(),
      $executeRaw: jest.fn(),
    };

    const mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      delByPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<AcademicService>(AcademicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── assignStudentToGroup ───────────────────────────────────────────────────
  describe('assignStudentToGroup', () => {
    it('denies cross-institution enrollment before any relational write', async () => {
      const studentRow = {
        id: 3001,
        role: UserRole.ESTUDIANTE,
        institutionId: 200,
        profile: { documents: ['ID-3001'] },
      };
      const groupRow = { id: 410, institutionId: 200, relations: { students: [3001] } };
      const studentBaseline = structuredClone(studentRow);
      const groupBaseline = structuredClone(groupRow);

      prisma.user.findUnique.mockResolvedValue(studentRow);
      prisma.group.findUnique.mockResolvedValue(groupRow);

      await expect(
        service.assignStudentToGroup(
          { userId: 9001, role: UserRole.SECRETARIA, institutionId: 100 },
          { studentId: 3001, groupId: 410 },
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.studentGroup.create).not.toHaveBeenCalled();
      expect(prisma.studentGroup.update).not.toHaveBeenCalled();
      expect(prisma.studentGroup.upsert).not.toHaveBeenCalled();
      expect(prisma.teacherAssignment.create).not.toHaveBeenCalled();
      expect(prisma.teacherAssignment.update).not.toHaveBeenCalled();
      expect(prisma.groupSubject.upsert).not.toHaveBeenCalled();
      expect(prisma.groupSubject.update).not.toHaveBeenCalled();
      expect(prisma.academicOffering.upsert).not.toHaveBeenCalled();
      expect(prisma.group.update).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
      expect(studentRow).toEqual(studentBaseline);
      expect(groupRow).toEqual(groupBaseline);
    });

    it('assigns student to group in-scope with exact expected write set', async () => {
      const studentRow = { id: 3002, role: UserRole.ESTUDIANTE, institutionId: 100, profile: { documents: ['ID-3002'] } };
      const groupRow = { id: 411, institutionId: 100, relations: { students: [] } };
      const activePeriod = { id: 77 };
      const createdEnrollment = { id: 9001, studentId: 3002, groupId: 411, academicPeriodId: 77, status: 'ACTIVE' };
      const studentBaseline = structuredClone(studentRow);
      const groupBaseline = structuredClone(groupRow);

      prisma.user.findUnique.mockResolvedValue(studentRow);
      prisma.group.findUnique.mockResolvedValue(groupRow);
      prisma.academicPeriod.findFirst.mockResolvedValue(activePeriod);
      prisma.studentGroup.findFirst.mockResolvedValue(null);
      prisma.studentGroup.create.mockResolvedValue(createdEnrollment);

      const result = await service.assignStudentToGroup(
        { userId: 9001, role: UserRole.SECRETARIA, institutionId: 100 },
        { studentId: 3002, groupId: 411 },
      );

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.group.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.academicPeriod.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.studentGroup.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.studentGroup.create).toHaveBeenCalledTimes(1);
      const userReadOrder = prisma.user.findUnique.mock.invocationCallOrder[0];
      const groupReadOrder = prisma.group.findUnique.mock.invocationCallOrder[0];
      const periodReadOrder = prisma.academicPeriod.findFirst.mock.invocationCallOrder[0];
      const existingReadOrder = prisma.studentGroup.findFirst.mock.invocationCallOrder[0];
      const createOrder = prisma.studentGroup.create.mock.invocationCallOrder[0];
      expect(userReadOrder).toBeLessThan(groupReadOrder);
      expect(groupReadOrder).toBeLessThan(periodReadOrder);
      expect(periodReadOrder).toBeLessThan(existingReadOrder);
      expect(existingReadOrder).toBeLessThan(createOrder);
      expect(prisma.studentGroup.create).toHaveBeenCalledWith({ data: { studentId: 3002, groupId: 411, academicPeriodId: 77 } });
      expect(result).toEqual(createdEnrollment);
      expect(prisma.studentGroup.update).not.toHaveBeenCalled();
      expect(prisma.studentGroup.upsert).not.toHaveBeenCalled();
      expect(studentRow).toEqual(studentBaseline);
      expect(groupRow).toEqual(groupBaseline);
    });

    it('lanza BadRequestException si el usuario no es ESTUDIANTE', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 5, role: UserRole.PROFESOR, institutionId: 100 });
      await expect(
        service.assignStudentToGroup(secretariaActor, { studentId: 5, groupId: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si no hay período activo', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 3, role: UserRole.ESTUDIANTE, institutionId: 100 });
      prisma.group.findUnique.mockResolvedValue({ id: 10, institutionId: 100 });
      prisma.academicPeriod.findFirst.mockResolvedValue(null);
      prisma.studentGroup.findFirst.mockResolvedValue(null);
      await expect(
        service.assignStudentToGroup(secretariaActor, { studentId: 3, groupId: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('es idempotente si el estudiante ya está en el mismo grupo', async () => {
      const existing = { id: 55, studentId: 3, groupId: 10, academicPeriodId: 1 };
      prisma.user.findUnique.mockResolvedValue({ id: 3, role: UserRole.ESTUDIANTE, institutionId: 100 });
      prisma.group.findUnique.mockResolvedValue({ id: 10, institutionId: 100 });
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      prisma.studentGroup.findFirst.mockResolvedValue(existing);
      const result = await service.assignStudentToGroup(secretariaActor, { studentId: 3, groupId: 10 });
      expect(result).toEqual(existing);
      expect(prisma.studentGroup.create).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si ya tiene otro grupo asignado', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 3, role: UserRole.ESTUDIANTE, institutionId: 100 });
      prisma.group.findUnique.mockResolvedValue({ id: 20, institutionId: 100 });
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      prisma.studentGroup.findFirst.mockResolvedValue({ id: 55, studentId: 3, groupId: 99 }); // otro grupo
      await expect(
        service.assignStudentToGroup(secretariaActor, { studentId: 3, groupId: 20 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── createGrade ────────────────────────────────────────────────────────────
  describe('createGrade', () => {
    it('crea grado con el institutionId del actor', async () => {
      prisma.grade.create.mockResolvedValue({ id: 1, nombre: '1°', institutionId: 100 });
      const result = await service.createGrade(secretariaActor, { nombre: '1°' });
      expect(prisma.grade.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ institutionId: 100 }) }),
      );
      expect(result.nombre).toBe('1°');
    });

    it('SUPER_ADMIN sin institutionId lanza ForbiddenException', async () => {
      await expect(
        service.createGrade({ userId: 99, role: UserRole.SUPER_ADMIN, institutionId: null }, { nombre: 'Grado X' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── listGrades ─────────────────────────────────────────────────────────────
  describe('listGrades', () => {
    it('devuelve resultado paginado con meta', async () => {
      prisma.grade.findMany.mockResolvedValue([{ id: 1, nombre: '1°' }]);
      prisma.grade.count.mockResolvedValue(1);
      const result = await service.listGrades(secretariaActor, { page: 1, limit: 20 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
    });

    it('SUPER_ADMIN no filtra por institución (where vacío)', async () => {
      prisma.grade.findMany.mockResolvedValue([]);
      prisma.grade.count.mockResolvedValue(0);
      await service.listGrades(superAdminActor, {});
      expect(prisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  // ─── getGrade ───────────────────────────────────────────────────────────────
  describe('getGrade', () => {
    it('lanza NotFoundException si el grado no existe en la institución', async () => {
      prisma.grade.findFirst.mockResolvedValue(null);
      await expect(service.getGrade(secretariaActor, 999)).rejects.toThrow(NotFoundException);
    });

    it('devuelve el grado si existe', async () => {
      prisma.grade.findFirst.mockResolvedValue({ id: 1, nombre: '2°', institutionId: 100, groups: [] });
      const result = await service.getGrade(secretariaActor, 1);
      expect(result.id).toBe(1);
    });
  });

  // ─── listGroups ─────────────────────────────────────────────────────────────
  describe('listGroups', () => {
    it('devuelve paginado con meta', async () => {
      prisma.group.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.group.count.mockResolvedValue(1);
      const result = await service.listGroups(secretariaActor, { page: 1, limit: 10 });
      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── listSubjects ───────────────────────────────────────────────────────────
  describe('listSubjects', () => {
    it('filtra por institución para actores no-SA', async () => {
      prisma.subject.findMany.mockResolvedValue([]);
      prisma.subject.count.mockResolvedValue(0);
      await service.listSubjects(secretariaActor, { page: 1, limit: 20 });
      expect(prisma.subject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { institutionId: 100 } }),
      );
    });
  });

  // ─── listAcademicPeriods ────────────────────────────────────────────────────
  describe('listAcademicPeriods', () => {
    it('devuelve períodos ordenados por fechaInicio desc', async () => {
      prisma.academicPeriod.findMany.mockResolvedValue([{ id: 2 }, { id: 1 }]);
      prisma.academicPeriod.count.mockResolvedValue(2);
      const result = await service.listAcademicPeriods(secretariaActor, {});
      expect(prisma.academicPeriod.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { fechaInicio: 'desc' } }),
      );
      expect(result.meta.total).toBe(2);
    });
  });
});


describe('AcademicService', () => {
  let service: AcademicService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    group: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    academicPeriod: {
      findFirst: jest.Mock;
    };
    studentGroup: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      upsert: jest.Mock;
    };
    groupSubject: {
      upsert: jest.Mock;
      update: jest.Mock;
    };
    academicOffering: {
      upsert: jest.Mock;
    };
    teacherAssignment: {
      create: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
    $executeRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      group: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      academicPeriod: {
        findFirst: jest.fn(),
      },
      studentGroup: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      groupSubject: {
        upsert: jest.fn(),
        update: jest.fn(),
      },
      academicOffering: {
        upsert: jest.fn(),
      },
      teacherAssignment: {
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
      $executeRaw: jest.fn(),
    };

    const mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      delByPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<AcademicService>(AcademicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('denies cross-institution enrollment before any relational write', async () => {
    const studentRow = {
      id: 3001,
      role: UserRole.ESTUDIANTE,
      institutionId: 200,
      profile: {
        documents: ['ID-3001'],
      },
    };
    const groupRow = {
      id: 410,
      institutionId: 200,
      relations: {
        students: [3001],
      },
    };

    const studentBaseline = structuredClone(studentRow);
    const groupBaseline = structuredClone(groupRow);

    prisma.user.findUnique.mockResolvedValue(studentRow);
    // Should not be reached in this specific denial path (student mismatch first).
    prisma.group.findUnique.mockResolvedValue(groupRow);

    await expect(
      service.assignStudentToGroup(
        { userId: 9001, role: UserRole.SECRETARIA, institutionId: 100 },
        { studentId: 3001, groupId: 410 },
      ),
    ).rejects.toThrow(ForbiddenException);

    // Read occurs to evaluate scope, then flow must halt.
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);

    // No enrollment write.
    expect(prisma.studentGroup.create).not.toHaveBeenCalled();
    expect(prisma.studentGroup.update).not.toHaveBeenCalled();
    expect(prisma.studentGroup.upsert).not.toHaveBeenCalled();

    // No secondary relationships or indirect side-effects.
    expect(prisma.teacherAssignment.create).not.toHaveBeenCalled();
    expect(prisma.teacherAssignment.update).not.toHaveBeenCalled();
    expect(prisma.groupSubject.upsert).not.toHaveBeenCalled();
    expect(prisma.groupSubject.update).not.toHaveBeenCalled();
    expect(prisma.academicOffering.upsert).not.toHaveBeenCalled();
    expect(prisma.group.update).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();

    // Defensive assertion: no hidden in-memory mutation.
    expect(studentRow).toEqual(studentBaseline);
    expect(groupRow).toEqual(groupBaseline);
  });

  it('assigns student to group in-scope with exact expected write set', async () => {
    const studentRow = {
      id: 3002,
      role: UserRole.ESTUDIANTE,
      institutionId: 100,
      profile: { documents: ['ID-3002'] },
    };
    const groupRow = {
      id: 411,
      institutionId: 100,
      relations: { students: [] },
    };
    const activePeriod = { id: 77 };
    const createdEnrollment = {
      id: 9001,
      studentId: 3002,
      groupId: 411,
      academicPeriodId: 77,
      status: 'ACTIVE',
    };

    const studentBaseline = structuredClone(studentRow);
    const groupBaseline = structuredClone(groupRow);

    prisma.user.findUnique.mockResolvedValue(studentRow);
    prisma.group.findUnique.mockResolvedValue(groupRow);
    prisma.academicPeriod.findFirst.mockResolvedValue(activePeriod);
    prisma.studentGroup.findFirst.mockResolvedValue(null);
    prisma.studentGroup.create.mockResolvedValue(createdEnrollment);

    const result = await service.assignStudentToGroup(
      { userId: 9001, role: UserRole.SECRETARIA, institutionId: 100 },
      { studentId: 3002, groupId: 411 },
    );

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.group.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.academicPeriod.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.studentGroup.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.studentGroup.create).toHaveBeenCalledTimes(1);

    const userReadOrder = prisma.user.findUnique.mock.invocationCallOrder[0];
    const groupReadOrder = prisma.group.findUnique.mock.invocationCallOrder[0];
    const periodReadOrder =
      prisma.academicPeriod.findFirst.mock.invocationCallOrder[0];
    const existingReadOrder =
      prisma.studentGroup.findFirst.mock.invocationCallOrder[0];
    const createOrder = prisma.studentGroup.create.mock.invocationCallOrder[0];

    expect(userReadOrder).toBeLessThan(groupReadOrder);
    expect(groupReadOrder).toBeLessThan(periodReadOrder);
    expect(periodReadOrder).toBeLessThan(existingReadOrder);
    expect(existingReadOrder).toBeLessThan(createOrder);

    expect(prisma.studentGroup.create).toHaveBeenCalledWith({
      data: {
        studentId: 3002,
        groupId: 411,
        academicPeriodId: 77,
      },
    });
    expect(result).toEqual(createdEnrollment);

    expect(prisma.studentGroup.update).not.toHaveBeenCalled();
    expect(prisma.studentGroup.upsert).not.toHaveBeenCalled();
    expect(prisma.teacherAssignment.create).not.toHaveBeenCalled();
    expect(prisma.teacherAssignment.update).not.toHaveBeenCalled();
    expect(prisma.groupSubject.upsert).not.toHaveBeenCalled();
    expect(prisma.groupSubject.update).not.toHaveBeenCalled();
    expect(prisma.academicOffering.upsert).not.toHaveBeenCalled();
    expect(prisma.group.update).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();

    expect(studentRow).toEqual(studentBaseline);
    expect(groupRow).toEqual(groupBaseline);
  });
});
