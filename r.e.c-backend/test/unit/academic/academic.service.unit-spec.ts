import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AcademicService } from '../../../src/academic/academic.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';
import type { Actor } from '../../../src/common/tenant';

describe('AcademicService (unit)', () => {
  const prisma = {
    grade: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    group: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subject: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupSubject: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    studentGroup: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    teacherAssignment: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teacherOfferingAssignment: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    academicPeriod: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    academicOffering: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    academicEvaluation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const cache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delByPattern: jest.fn().mockResolvedValue(undefined),
  };

  let service: AcademicService;

  const secretariaActor: Actor = {
    userId: 1,
    role: UserRole.SECRETARIA,
    institutionId: 100,
  };

  const superAdminActor: Actor = {
    userId: 99,
    role: UserRole.SUPER_ADMIN,
    institutionId: null,
  };

  const profesorActor: Actor = {
    userId: 5,
    role: UserRole.PROFESOR,
    institutionId: 100,
  };

  const estudianteActor: Actor = {
    userId: 20,
    role: UserRole.ESTUDIANTE,
    institutionId: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.studentGroup.updateMany.mockResolvedValue({ count: 0 });
    service = new AcademicService(prisma as never, cache as never);
  });

  // ─── Grados ────────────────────────────────────────────────────────────

  describe('createGrade', () => {
    it('crea un grado con institutionId del actor', async () => {
      prisma.grade.create.mockResolvedValue({
        id: 1,
        nombre: 'Primero',
        institutionId: 100,
      });

      const result = await service.createGrade(secretariaActor, {
        nombre: 'Primero',
      });

      expect(result.nombre).toBe('Primero');
      expect(prisma.grade.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { institutionId: 100, nombre: 'Primero' },
        }),
      );
      expect(cache.delByPattern).toHaveBeenCalledWith('grades:*');
    });

    it('lanza ForbiddenException para SUPER_ADMIN (sin institutionId)', async () => {
      await expect(
        service.createGrade(superAdminActor, { nombre: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listGrades', () => {
    it('retorna datos desde caché si existen', async () => {
      const cached = { data: [{ id: 1 }], meta: { total: 1 } };
      cache.get.mockResolvedValue(cached);

      const result = await service.listGrades(secretariaActor);

      expect(result).toEqual(cached);
      expect(prisma.grade.findMany).not.toHaveBeenCalled();
    });

    it('consulta DB y guarda en caché si no hay caché', async () => {
      cache.get.mockResolvedValue(null);
      prisma.grade.findMany.mockResolvedValue([
        { id: 1, nombre: 'Primero', groups: [] },
      ]);
      prisma.grade.count.mockResolvedValue(1);

      const result = (await service.listGrades(secretariaActor)) as any;

      expect(result.data).toHaveLength(1);
      expect(cache.set).toHaveBeenCalled();
    });

    it('SUPER_ADMIN no filtra por institución', async () => {
      cache.get.mockResolvedValue(null);
      prisma.grade.findMany.mockResolvedValue([]);
      prisma.grade.count.mockResolvedValue(0);

      await service.listGrades(superAdminActor);

      expect(prisma.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('getGrade', () => {
    it('retorna grado con grupos incluidos', async () => {
      prisma.grade.findFirst.mockResolvedValue({
        id: 1,
        nombre: 'Primero',
        groups: [],
      });

      const result = await service.getGrade(secretariaActor, 1);

      expect(result.nombre).toBe('Primero');
    });

    it('lanza NotFoundException si el grado no existe', async () => {
      prisma.grade.findFirst.mockResolvedValue(null);

      await expect(service.getGrade(secretariaActor, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateGrade', () => {
    it('actualiza el nombre del grado', async () => {
      prisma.grade.findFirst.mockResolvedValue({
        id: 1,
        nombre: 'Primero',
        groups: [],
      });
      prisma.grade.update.mockResolvedValue({
        id: 1,
        nombre: 'Primero A',
      });

      const result = await service.updateGrade(secretariaActor, 1, {
        nombre: 'Primero A',
      });

      expect(result.nombre).toBe('Primero A');
      expect(cache.delByPattern).toHaveBeenCalledWith('grades:*');
    });
  });

  describe('deleteGrade', () => {
    it('elimina el grado', async () => {
      prisma.grade.findFirst.mockResolvedValue({
        id: 1,
        nombre: 'Primero',
        groups: [],
      });
      prisma.grade.delete.mockResolvedValue({ id: 1 });

      const result = await service.deleteGrade(secretariaActor, 1);

      expect(result.id).toBe(1);
      expect(cache.delByPattern).toHaveBeenCalledWith('grades:*');
    });
  });

  // ─── Grupos ────────────────────────────────────────────────────────────

  describe('createGroup', () => {
    it('crea un grupo asociado a un grado existente', async () => {
      prisma.grade.findFirst.mockResolvedValue({
        id: 1,
        institutionId: 100,
      });
      prisma.group.create.mockResolvedValue({
        id: 10,
        nombre: '1A',
        gradeId: 1,
        institutionId: 100,
      });

      const result = await service.createGroup(secretariaActor, {
        nombre: '1A',
        gradeId: 1,
      });

      expect(result.nombre).toBe('1A');
      expect(cache.delByPattern).toHaveBeenCalledWith('groups:*');
    });

    it('lanza BadRequestException si el grado no existe', async () => {
      prisma.grade.findFirst.mockResolvedValue(null);

      await expect(
        service.createGroup(secretariaActor, { nombre: '1A', gradeId: 999 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listGroups', () => {
    it('retorna lista paginada de grupos', async () => {
      cache.get.mockResolvedValue(null);
      prisma.group.findMany.mockResolvedValue([{ id: 10, nombre: '1A' }]);
      prisma.group.count.mockResolvedValue(1);

      const result = (await service.listGroups(secretariaActor)) as any;

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getGroup', () => {
    it('lanza NotFoundException si el grupo no existe', async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect(service.getGroup(secretariaActor, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateGroup', () => {
    it('actualiza nombre del grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        nombre: '1A',
        grade: {},
        subjects: [],
      });
      prisma.group.update.mockResolvedValue({ id: 10, nombre: '1B' });

      const result = await service.updateGroup(secretariaActor, 10, {
        nombre: '1B',
      });

      expect(result.nombre).toBe('1B');
    });

    it('valida grado destino en cambio de grado', async () => {
      prisma.group.findFirst.mockResolvedValueOnce({
        id: 10,
        nombre: '1A',
        grade: {},
        subjects: [],
      });
      prisma.grade.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.updateGroup(secretariaActor, 10, { gradeId: 999 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteGroup', () => {
    it('elimina el grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        nombre: '1A',
        grade: {},
        subjects: [],
      });
      prisma.group.delete.mockResolvedValue({ id: 10 });

      await service.deleteGroup(secretariaActor, 10);

      expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });
  });

  // ─── Materias ──────────────────────────────────────────────────────────

  describe('createSubject', () => {
    it('crea una materia', async () => {
      prisma.subject.create.mockResolvedValue({
        id: 1,
        nombre: 'Matemáticas',
        codigo: 'MAT',
        institutionId: 100,
      });

      const result = await service.createSubject(secretariaActor, {
        nombre: 'Matemáticas',
        codigo: 'MAT',
      });

      expect(result.nombre).toBe('Matemáticas');
      expect(cache.delByPattern).toHaveBeenCalledWith('subjects:*');
    });
  });

  describe('listSubjects', () => {
    it('retorna materias paginadas', async () => {
      cache.get.mockResolvedValue(null);
      prisma.subject.findMany.mockResolvedValue([{ id: 1, nombre: 'Mat' }]);
      prisma.subject.count.mockResolvedValue(1);

      const result = (await service.listSubjects(secretariaActor)) as any;

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getSubject', () => {
    it('lanza NotFoundException si la materia no existe', async () => {
      prisma.subject.findFirst.mockResolvedValue(null);

      await expect(service.getSubject(secretariaActor, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteSubject', () => {
    it('elimina la materia', async () => {
      prisma.subject.findFirst.mockResolvedValue({ id: 1, nombre: 'Mat' });
      prisma.subject.delete.mockResolvedValue({ id: 1 });

      await service.deleteSubject(secretariaActor, 1);

      expect(prisma.subject.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ─── Asignar materia a grupo ──────────────────────────────────────────

  describe('assignSubjectToGroup', () => {
    it('asigna materia al grupo y enlaza AcademicOffering si hay período activo', async () => {
      // getGroup mock
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        nombre: '1A',
        grade: {},
        subjects: [],
      });
      // getSubject mock
      prisma.subject.findFirst.mockResolvedValue({ id: 1, nombre: 'Mat' });
      prisma.groupSubject.upsert.mockResolvedValue({
        id: 50,
        groupId: 10,
        subjectId: 1,
      });
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 5 });
      prisma.groupSubject.update.mockResolvedValue({ id: 50 });
      prisma.academicOffering.upsert.mockResolvedValue({ id: 200 });

      const result = await service.assignSubjectToGroup(secretariaActor, {
        groupId: 10,
        subjectId: 1,
      });

      expect(result).toHaveProperty('academicOfferingId', 200);
    });

    it('retorna groupSubject sin offering si no hay período activo', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        nombre: '1A',
        grade: {},
        subjects: [],
      });
      prisma.subject.findFirst.mockResolvedValue({ id: 1, nombre: 'Mat' });
      prisma.groupSubject.upsert.mockResolvedValue({
        id: 50,
        groupId: 10,
        subjectId: 1,
      });
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      const result = await service.assignSubjectToGroup(secretariaActor, {
        groupId: 10,
        subjectId: 1,
      });

      expect(result.id).toBe(50);
    });
  });

  // ─── Asignar estudiante a grupo ───────────────────────────────────────

  describe('assignStudentToGroup', () => {
    const studentUser = {
      id: 20,
      role: 'ESTUDIANTE',
      institutionId: 100,
    };

    it('asigna estudiante a grupo con período activo', async () => {
      prisma.user.findUnique.mockResolvedValue(studentUser);
      prisma.group.findUnique.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 5 });
      prisma.studentGroup.findFirst.mockResolvedValue(null);
      prisma.studentGroup.updateMany.mockResolvedValue({ count: 0 });
      prisma.studentGroup.create.mockResolvedValue({
        studentId: 20,
        groupId: 10,
        academicPeriodId: 5,
      });

      const result = await service.assignStudentToGroup(secretariaActor, {
        studentId: 20,
        groupId: 10,
      });

      expect(result.groupId).toBe(10);
      expect(prisma.studentGroup.updateMany).toHaveBeenCalled();
    });

    it('restaura asignación soft-deleted al mismo grupo sin create (evita P2002)', async () => {
      prisma.user.findUnique.mockResolvedValue(studentUser);
      prisma.group.findUnique.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 5 });
      prisma.studentGroup.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 77,
          studentId: 20,
          groupId: 10,
          academicPeriodId: 5,
        });
      prisma.studentGroup.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.assignStudentToGroup(secretariaActor, {
        studentId: 20,
        groupId: 10,
      });

      expect(result.id).toBe(77);
      expect(prisma.studentGroup.create).not.toHaveBeenCalled();
      expect(prisma.studentGroup.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: 20,
            groupId: 10,
            academicPeriodId: 5,
            deletedAt: { not: null },
          }),
        }),
      );
    });

    it('retorna asignación existente si el estudiante ya está en el mismo grupo', async () => {
      prisma.user.findUnique.mockResolvedValue(studentUser);
      prisma.group.findUnique.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 5 });
      prisma.studentGroup.findFirst.mockResolvedValue({
        studentId: 20,
        groupId: 10,
      });

      const result = await service.assignStudentToGroup(secretariaActor, {
        studentId: 20,
        groupId: 10,
      });

      expect(result.groupId).toBe(10);
      expect(prisma.studentGroup.create).not.toHaveBeenCalled();
    });

    it('rechaza si el estudiante ya tiene otro grupo asignado', async () => {
      prisma.user.findUnique.mockResolvedValue(studentUser);
      prisma.group.findUnique.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 5 });
      prisma.studentGroup.findFirst.mockResolvedValue({
        studentId: 20,
        groupId: 99,
      });

      await expect(
        service.assignStudentToGroup(secretariaActor, {
          studentId: 20,
          groupId: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el usuario no es ESTUDIANTE', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...studentUser,
        role: 'PROFESOR',
      });

      await expect(
        service.assignStudentToGroup(secretariaActor, {
          studentId: 20,
          groupId: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el estudiante no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignStudentToGroup(secretariaActor, {
          studentId: 999,
          groupId: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el grupo no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(studentUser);
      prisma.group.findUnique.mockResolvedValue(null);

      await expect(
        service.assignStudentToGroup(secretariaActor, {
          studentId: 20,
          groupId: 999,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si no hay período académico activo', async () => {
      prisma.user.findUnique.mockResolvedValue(studentUser);
      prisma.group.findUnique.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.academicPeriod.findFirst.mockResolvedValue(null);
      prisma.studentGroup.findFirst.mockResolvedValue(null);

      await expect(
        service.assignStudentToGroup(secretariaActor, {
          studentId: 20,
          groupId: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza cross-tenant: estudiante de otra institución', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...studentUser,
        institutionId: 200,
      });

      await expect(
        service.assignStudentToGroup(secretariaActor, {
          studentId: 20,
          groupId: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza cross-tenant: grupo de otra institución', async () => {
      prisma.user.findUnique.mockResolvedValue(studentUser);
      prisma.group.findUnique.mockResolvedValue({
        id: 10,
        institutionId: 200,
      });

      await expect(
        service.assignStudentToGroup(secretariaActor, {
          studentId: 20,
          groupId: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza inconsistencia tenant entre estudiante y grupo', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...studentUser,
        institutionId: 100,
      });
      prisma.group.findUnique.mockResolvedValue({
        id: 10,
        institutionId: 200,
      });

      await expect(
        service.assignStudentToGroup(
          { userId: 99, role: UserRole.SUPER_ADMIN },
          { studentId: 20, groupId: 10 },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Asignar profesor ─────────────────────────────────────────────────

  describe('assignTeacher', () => {
    const teacherUser = {
      id: 5,
      role: 'PROFESOR',
      institutionId: 100,
    };

    it('asigna profesor a grupo y materia', async () => {
      prisma.user.findUnique.mockResolvedValue(teacherUser);
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        institutionId: 100,
        grade: {},
        subjects: [],
      });
      prisma.subject.findFirst.mockResolvedValue({
        id: 1,
        institutionId: 100,
      });
      prisma.teacherAssignment.upsert.mockResolvedValue({
        id: 30,
        teacherId: 5,
        groupId: 10,
        subjectId: 1,
      });
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      const result = await service.assignTeacher(secretariaActor, {
        teacherId: 5,
        groupId: 10,
        subjectId: 1,
      });

      expect(result.teacherId).toBe(5);
    });

    it('rechaza si el usuario no es PROFESOR', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...teacherUser,
        role: 'ESTUDIANTE',
      });

      await expect(
        service.assignTeacher(secretariaActor, {
          teacherId: 5,
          groupId: 10,
          subjectId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el profesor no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignTeacher(secretariaActor, {
          teacherId: 999,
          groupId: 10,
          subjectId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza cross-tenant: profesor de otra institución', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...teacherUser,
        institutionId: 200,
      });

      await expect(
        service.assignTeacher(secretariaActor, {
          teacherId: 5,
          groupId: 10,
          subjectId: 1,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Director de grupo ────────────────────────────────────────────────

  describe('assignGroupDirector', () => {
    it('asigna director al grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 5,
        role: 'PROFESOR',
        institutionId: 100,
      });
      prisma.group.update.mockResolvedValue({
        id: 10,
        directorId: 5,
      });

      const result = await service.assignGroupDirector(secretariaActor, 10, 5);

      expect(result.directorId).toBe(5);
      expect(cache.delByPattern).toHaveBeenCalledWith('groups:*');
    });

    it('rechaza si el usuario no es PROFESOR', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 5,
        role: 'ESTUDIANTE',
        institutionId: 100,
      });

      await expect(
        service.assignGroupDirector(secretariaActor, 10, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza cross-tenant: director de otra institución', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        institutionId: 100,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 5,
        role: 'PROFESOR',
        institutionId: 200,
      });

      await expect(
        service.assignGroupDirector(secretariaActor, 10, 5),
      ).rejects.toThrow();
    });
  });

  // ─── Listar estudiantes de grupo ──────────────────────────────────────

  describe('listGroupStudents', () => {
    it('retorna los estudiantes del grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      prisma.studentGroup.findMany.mockResolvedValue([
        {
          student: {
            id: 20,
            nombres: 'Juan',
            apellidos: 'Lopez',
            email: 'j@t.co',
            codigo: 'COD1',
            role: 'ESTUDIANTE',
          },
        },
      ]);

      const result = await service.listGroupStudents(secretariaActor, 10);

      expect(result).toHaveLength(1);
      expect(result[0].nombres).toBe('Juan');
    });

    it('lanza BadRequestException si el grupo no existe', async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect(
        service.listGroupStudents(secretariaActor, 999),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Períodos Académicos ──────────────────────────────────────────────

  describe('createAcademicPeriod', () => {
    it('crea un período académico en estado DRAFT', async () => {
      prisma.academicPeriod.create.mockResolvedValue({
        id: 1,
        nombre: '2026-1',
        estado: 'DRAFT',
      });

      const result = await service.createAcademicPeriod(secretariaActor, {
        nombre: '2026-1',
        codigo: 'P1',
        fechaInicio: '2026-01-15',
        fechaFin: '2026-06-15',
      });

      expect(result.estado).toBe('DRAFT');
      expect(prisma.academicPeriod.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            institutionId: 100,
            nombre: '2026-1',
            estado: 'DRAFT',
          }),
        }),
      );
    });
  });

  describe('listAcademicPeriods', () => {
    it('retorna períodos paginados', async () => {
      prisma.academicPeriod.findMany.mockResolvedValue([
        { id: 1, nombre: '2026-1' },
      ]);
      prisma.academicPeriod.count.mockResolvedValue(1);

      const result = await service.listAcademicPeriods(secretariaActor);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getAcademicPeriod', () => {
    it('lanza NotFoundException si el período no existe', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.getAcademicPeriod(secretariaActor, 999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActivePeriod', () => {
    it('retorna el período activo', async () => {
      cache.get.mockResolvedValue(null);
      prisma.academicPeriod.findFirst.mockResolvedValue({
        id: 1,
        nombre: '2026-1',
        estado: 'ACTIVE',
      });

      const result = (await service.getActivePeriod(secretariaActor)) as any;

      expect(result.estado).toBe('ACTIVE');
      expect(cache.set).toHaveBeenCalled();
    });

    it('lanza NotFoundException si no hay período activo', async () => {
      cache.get.mockResolvedValue(null);
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      await expect(service.getActivePeriod(secretariaActor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna desde caché si existe', async () => {
      const cached = { id: 1, estado: 'ACTIVE' };
      cache.get.mockResolvedValue(cached);

      const result = await service.getActivePeriod(secretariaActor);

      expect(result).toEqual(cached);
      expect(prisma.academicPeriod.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('activateAcademicPeriod', () => {
    it('cierra período anterior y activa el nuevo', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({
        id: 2,
        estado: 'DRAFT',
      });
      prisma.academicPeriod.updateMany.mockResolvedValue({ count: 1 });
      prisma.academicPeriod.update.mockResolvedValue({
        id: 2,
        estado: 'ACTIVE',
      });

      const result = await service.activateAcademicPeriod(secretariaActor, 2);

      expect(result.estado).toBe('ACTIVE');
      expect(prisma.academicPeriod.updateMany).toHaveBeenCalled();
      expect(cache.delByPattern).toHaveBeenCalledWith('activePeriod:*');
    });
  });

  describe('closeAcademicPeriod', () => {
    it('cierra el período y establece fechaCierre', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({
        id: 2,
        estado: 'ACTIVE',
      });
      prisma.academicPeriod.update.mockResolvedValue({
        id: 2,
        estado: 'CLOSED',
      });

      const result = await service.closeAcademicPeriod(secretariaActor, 2);

      expect(result.estado).toBe('CLOSED');
      expect(cache.delByPattern).toHaveBeenCalledWith('activePeriod:*');
    });
  });

  // ─── Evaluaciones ─────────────────────────────────────────────────────

  describe('createEvaluation', () => {
    it('crea una evaluación para una oferta válida', async () => {
      prisma.academicOffering.findFirst.mockResolvedValue({ id: 100 });
      prisma.academicEvaluation.findFirst.mockResolvedValue(null);
      prisma.academicEvaluation.create.mockResolvedValue({
        id: 1,
        titulo: 'Parcial 1',
        orden: 1,
      });

      const result = await service.createEvaluation(secretariaActor, 100, {
        titulo: 'Parcial 1',
        orden: 1,
      });

      expect(result.titulo).toBe('Parcial 1');
    });

    it('rechaza si la oferta no existe', async () => {
      prisma.academicOffering.findFirst.mockResolvedValue(null);

      await expect(
        service.createEvaluation(secretariaActor, 999, {
          titulo: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza orden duplicado', async () => {
      prisma.academicOffering.findFirst.mockResolvedValue({ id: 100 });
      prisma.academicEvaluation.findFirst.mockResolvedValue({
        id: 5,
        orden: 1,
      });

      await expect(
        service.createEvaluation(secretariaActor, 100, {
          titulo: 'Dup',
          orden: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteEvaluation', () => {
    it('elimina la evaluación', async () => {
      prisma.academicEvaluation.findUnique.mockResolvedValue({
        id: 1,
        academicOffering: { group: { institutionId: 100 } },
      });
      prisma.academicEvaluation.delete.mockResolvedValue({ id: 1 });

      const result = await service.deleteEvaluation(secretariaActor, 1);

      expect(result).toEqual({ deleted: true });
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.academicEvaluation.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteEvaluation(secretariaActor, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza evaluación de otra institución', async () => {
      prisma.academicEvaluation.findUnique.mockResolvedValue({
        id: 1,
        academicOffering: { group: { institutionId: 200 } },
      });

      await expect(
        service.deleteEvaluation(secretariaActor, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── deleteGroupSubject ───────────────────────────────────────────────

  describe('deleteGroupSubject', () => {
    it('elimina asignación grupo-materia', async () => {
      prisma.groupSubject.findUnique.mockResolvedValue({
        id: 50,
        group: { institutionId: 100 },
      });
      prisma.groupSubject.delete.mockResolvedValue({ id: 50 });

      await service.deleteGroupSubject(secretariaActor, 50);

      expect(prisma.groupSubject.delete).toHaveBeenCalledWith({
        where: { id: 50 },
      });
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.groupSubject.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteGroupSubject(secretariaActor, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza asignación de otra institución', async () => {
      prisma.groupSubject.findUnique.mockResolvedValue({
        id: 50,
        group: { institutionId: 200 },
      });

      await expect(
        service.deleteGroupSubject(secretariaActor, 50),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── deleteTeacherAssignment ──────────────────────────────────────────

  describe('deleteTeacherAssignment', () => {
    it('elimina asignación docente', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue({
        id: 30,
        teacherId: 5,
        group: { institutionId: 100 },
        academicOfferingId: null,
      });
      prisma.teacherAssignment.delete.mockResolvedValue({ id: 30 });

      await service.deleteTeacherAssignment(secretariaActor, 30);

      expect(prisma.teacherAssignment.delete).toHaveBeenCalled();
    });

    it('lanza NotFoundException si la asignación no existe', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteTeacherAssignment(secretariaActor, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('limpia relación canónica si tenía academicOfferingId y no quedan más', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue({
        id: 30,
        teacherId: 5,
        group: { institutionId: 100 },
        academicOfferingId: 200,
      });
      prisma.teacherAssignment.delete.mockResolvedValue({ id: 30 });
      prisma.teacherAssignment.findFirst.mockResolvedValue(null);
      prisma.teacherOfferingAssignment.deleteMany.mockResolvedValue({
        count: 1,
      });

      await service.deleteTeacherAssignment(secretariaActor, 30);

      expect(prisma.teacherOfferingAssignment.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: 5, academicOfferingId: 200 },
        }),
      );
    });
  });

  // ─── deleteStudentGroup ───────────────────────────────────────────────

  describe('deleteStudentGroup', () => {
    it('elimina asignación de estudiante', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 20,
        institutionId: 100,
      });
      prisma.studentGroup.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteStudentGroup(secretariaActor, 20);

      expect(result).toEqual({ deleted: 1 });
    });

    it('rechaza estudiante de otra institución', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 20,
        institutionId: 200,
      });

      await expect(
        service.deleteStudentGroup(secretariaActor, 20),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── previewPromoteGrade ──────────────────────────────────────────────

  describe('previewPromoteGrade', () => {
    it('rechaza si grado origen y destino son iguales', async () => {
      await expect(
        service.previewPromoteGrade(secretariaActor, {
          sourceGradeId: 1,
          targetGradeId: 1,
          mappings: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si grado origen no existe', async () => {
      prisma.grade.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.previewPromoteGrade(secretariaActor, {
          sourceGradeId: 1,
          targetGradeId: 2,
          mappings: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── updateEvaluation ─────────────────────────────────────────────────

  describe('updateEvaluation', () => {
    it('actualiza una evaluación', async () => {
      prisma.academicEvaluation.findUnique.mockResolvedValue({
        id: 1,
        orden: 1,
        academicOfferingId: 100,
        academicOffering: { group: { institutionId: 100 } },
      });
      prisma.academicEvaluation.update.mockResolvedValue({
        id: 1,
        titulo: 'Parcial 1 (mod)',
      });

      const result = await service.updateEvaluation(secretariaActor, 1, {
        titulo: 'Parcial 1 (mod)',
      });

      expect(result.titulo).toBe('Parcial 1 (mod)');
    });

    it('lanza NotFoundException si la evaluación no existe', async () => {
      prisma.academicEvaluation.findUnique.mockResolvedValue(null);

      await expect(
        service.updateEvaluation(secretariaActor, 999, { titulo: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza conflicto de orden', async () => {
      prisma.academicEvaluation.findUnique.mockResolvedValue({
        id: 1,
        orden: 1,
        academicOfferingId: 100,
        academicOffering: { group: { institutionId: 100 } },
      });
      prisma.academicEvaluation.findFirst.mockResolvedValue({
        id: 2,
        orden: 3,
      });

      await expect(
        service.updateEvaluation(secretariaActor, 1, { orden: 3 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── listGroupSubjects ────────────────────────────────────────────────

  describe('listGroupSubjects', () => {
    it('retorna materias del grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 10,
        grade: {},
        subjects: [],
      });
      prisma.groupSubject.findMany.mockResolvedValue([
        { id: 50, subject: { nombre: 'Mat' } },
      ]);

      const result = await service.listGroupSubjects(secretariaActor, 10);

      expect(result).toHaveLength(1);
    });
  });

  // ─── listStudentSubjects ──────────────────────────────────────────────

  describe('listStudentSubjects', () => {
    it('retorna vacío si el estudiante no tiene grupo', async () => {
      prisma.studentGroup.findFirst.mockResolvedValue(null);

      const result = await service.listStudentSubjects(estudianteActor, 20);

      expect(result).toEqual([]);
    });

    it('retorna materias del grupo del estudiante', async () => {
      prisma.studentGroup.findFirst.mockResolvedValue({
        studentId: 20,
        groupId: 10,
      });
      prisma.groupSubject.findMany.mockResolvedValue([
        { id: 50, subject: { nombre: 'Mat' } },
      ]);

      const result = await service.listStudentSubjects(estudianteActor, 20);

      expect(result).toHaveLength(1);
    });
  });

  // ─── getStudentGroup ──────────────────────────────────────────────────

  describe('getStudentGroup', () => {
    it('retorna grupo del estudiante', async () => {
      prisma.studentGroup.findFirst.mockResolvedValue({
        studentId: 20,
        groupId: 10,
        group: { id: 10, grade: { id: 1 } },
      });

      const result = await service.getStudentGroup(estudianteActor, 20);

      expect(result!.groupId).toBe(10);
    });
  });

  // ─── listTeacherAssignments ───────────────────────────────────────────

  describe('listTeacherAssignments', () => {
    it('retorna asignaciones del profesor actual', async () => {
      prisma.teacherAssignment.findMany.mockResolvedValue([
        { id: 30, teacherId: 5 },
      ]);

      const result = await service.listTeacherAssignments(profesorActor, 5);

      expect(result).toHaveLength(1);
    });

    it('rechaza consulta a profesor de otra institución', async () => {
      prisma.user.findUnique.mockResolvedValue({ institutionId: 200 });

      await expect(
        service.listTeacherAssignments(secretariaActor, 99),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── updateAcademicPeriod ─────────────────────────────────────────────

  describe('updateAcademicPeriod', () => {
    it('actualiza campos del período', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({
        id: 1,
        nombre: '2026-1',
      });
      prisma.academicPeriod.update.mockResolvedValue({
        id: 1,
        nombre: '2026-1 (mod)',
      });

      const result = await service.updateAcademicPeriod(secretariaActor, 1, {
        nombre: '2026-1 (mod)',
      });

      expect(result.nombre).toBe('2026-1 (mod)');
    });
  });

  // ─── updateSubject ────────────────────────────────────────────────────

  describe('updateSubject', () => {
    it('actualiza nombre de la materia', async () => {
      prisma.subject.findFirst.mockResolvedValue({ id: 1, nombre: 'Mat' });
      prisma.subject.update.mockResolvedValue({
        id: 1,
        nombre: 'Matemáticas',
      });

      const result = await service.updateSubject(secretariaActor, 1, {
        nombre: 'Matemáticas',
      });

      expect(result.nombre).toBe('Matemáticas');
      expect(cache.delByPattern).toHaveBeenCalledWith('subjects:*');
    });
  });
});
