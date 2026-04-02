import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PerformanceService } from '../../../src/performance/performance.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';
import type { Actor } from '../../../src/common/tenant';

describe('PerformanceService (unit)', () => {
  const prisma = {
    group: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    user: { findFirst: jest.fn(), findUnique: jest.fn() },
    teacherAssignment: { findFirst: jest.fn() },
    studentGroup: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    gradePerformance: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    academicPeriod: { findFirst: jest.fn() },
    studentAcademicRecord: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    evaluationGrade: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    studyMaterial: { count: jest.fn() },
    syllabus: { count: jest.fn() },
    recoveryRequest: { findMany: jest.fn() },
    performanceTopStudent: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    academicOffering: { findUnique: jest.fn() },
    academicEvaluation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    subject: { findUnique: jest.fn() },
  };

  let service: PerformanceService;

  const secretariaActor: Actor = {
    userId: 1,
    role: UserRole.SECRETARIA,
    institutionId: 100,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const superAdminActor: Actor = {
    userId: 99,
    role: UserRole.SUPER_ADMIN,
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
    service = new PerformanceService(prisma as never);
  });

  // ─── ensureWriteAccess (vía upsertByGrade) ────────────────────────────

  describe('ensureWriteAccess — acceso de escritura', () => {
    it('permite SECRETARIA con grupo de su institución', async () => {
      // findGroupByGradeName
      prisma.group.findFirst
        .mockResolvedValueOnce({ id: 10, nombre: 'Primero' }) // findGroupByGradeName
        .mockResolvedValueOnce({ id: 10 }); // ensureWriteAccess (SECRETARIA check)
      setupRecompute();

      await expect(
        service.upsertByGrade(secretariaActor, 'Primero', {} as any),
      ).resolves.toBeDefined();
    });

    it('rechaza SECRETARIA si el grupo no es de su institución', async () => {
      prisma.group.findFirst
        .mockResolvedValueOnce({ id: 10, nombre: 'Primero' })
        .mockResolvedValueOnce(null);

      await expect(
        service.upsertByGrade(secretariaActor, 'Primero', {} as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite PROFESOR director del grupo', async () => {
      prisma.group.findFirst
        .mockResolvedValueOnce({ id: 10, nombre: 'Primero' }) // findGroupByGradeName
        .mockResolvedValueOnce({ id: 10, directorId: 5 }); // ensureWriteAccess — isDirector
      setupRecompute();

      await expect(
        service.upsertByGrade(profesorActor, 'Primero', {} as any),
      ).resolves.toBeDefined();
    });

    it('permite PROFESOR con teacherAssignment', async () => {
      prisma.group.findFirst
        .mockResolvedValueOnce({ id: 10, nombre: 'Primero' }) // findGroupByGradeName
        .mockResolvedValueOnce(null); // ensureWriteAccess — not director
      prisma.teacherAssignment.findFirst.mockResolvedValue({ id: 30 });
      setupRecompute();

      await expect(
        service.upsertByGrade(profesorActor, 'Primero', {} as any),
      ).resolves.toBeDefined();
    });

    it('rechaza PROFESOR sin dirección ni asignación', async () => {
      prisma.group.findFirst
        .mockResolvedValueOnce({ id: 10, nombre: 'Primero' })
        .mockResolvedValueOnce(null); // not director
      prisma.teacherAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.upsertByGrade(profesorActor, 'Primero', {} as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza ESTUDIANTE para escritura', async () => {
      prisma.group.findFirst.mockResolvedValueOnce({
        id: 10,
        nombre: 'Primero',
      });

      await expect(
        service.upsertByGrade(estudianteActor, 'Primero', {} as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── findGroupByGradeName ─────────────────────────────────────────────

  describe('getByGrade', () => {
    it('lanza NotFoundException si el grupo no existe', async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect(
        service.getByGrade(secretariaActor, 'NoExiste'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getByGroup ───────────────────────────────────────────────────────

  describe('getByGroup', () => {
    it('permite SECRETARIA ver performance de grupo de su institución', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      setupRecompute();

      const result = await service.getByGroup(secretariaActor, 10);

      expect(result).toBeDefined();
      expect(result.leagueScore).toBeDefined();
    });

    it('rechaza SECRETARIA si el grupo no existe en su institución', async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect(service.getByGroup(secretariaActor, 999)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('permite ESTUDIANTE si pertenece al grupo', async () => {
      prisma.group.findFirst.mockResolvedValue(null); // not SECRETARIA/SA check skipped
      prisma.studentGroup.findFirst.mockResolvedValue({
        groupId: 10,
        studentId: 20,
      });
      setupRecompute();

      await expect(
        service.getByGroup(estudianteActor, 10),
      ).resolves.toBeDefined();
    });

    it('rechaza ESTUDIANTE si no pertenece al grupo', async () => {
      prisma.group.findFirst.mockResolvedValue(null);
      prisma.studentGroup.findFirst.mockResolvedValue({ groupId: 99 });

      await expect(service.getByGroup(estudianteActor, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── recomputeGroupPerformance (indirectamente vía getByGroup) ─────

  describe('recomputeGroupPerformance', () => {
    it('calcula performance con registros vacíos', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      setupRecompute({ records: [], students: [] });

      const result = await service.getByGroup(secretariaActor, 10);

      expect(result.promedioGeneral).toBeNull();
      expect(result.aprobacion).toBeNull();
      expect(result.tendenciaGeneral).toBeDefined();
    });

    it('calcula promedioGeneral correctamente con registros', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      setupRecompute({
        records: [
          createRecord(20, 1, { notaFinal: 4.0, progresoMateria: 80 }),
          createRecord(21, 1, { notaFinal: 3.5, progresoMateria: 90 }),
        ],
        students: [
          { id: 100, studentId: 20 },
          { id: 101, studentId: 21 },
        ],
      });

      const result = await service.getByGroup(secretariaActor, 10);

      expect(result.promedioGeneral).toBe(3.75);
    });

    it('incluye scoreBreakdown con valores normalizados', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      setupRecompute({
        records: [
          createRecord(20, 1, {
            notaFinal: 4.0,
            progresoMateria: 85,
          }),
        ],
        students: [{ id: 100, studentId: 20 }],
      });

      const result = await service.getByGroup(secretariaActor, 10);

      expect(result.scoreBreakdown).toBeDefined();
      expect(result.scoreBreakdown.promedio.weight).toBe(0.45);
      expect(result.scoreBreakdown.asistencia.weight).toBe(0.25);
      expect(result.scoreBreakdown.aprobacion.weight).toBe(0.25);
    });

    it('calcula tendencia MIXTA cuando no hay datos previos', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      setupRecompute({
        records: [createRecord(20, 1, { notaFinal: 3.0 })],
        students: [{ id: 100, studentId: 20 }],
        previousPerformance: null,
      });

      const result = await service.getByGroup(secretariaActor, 10);

      expect(['MIXTA', 'ESTABLE', 'EN_RIESGO']).toContain(
        result.tendenciaGeneral,
      );
    });

    it('detecta mejorAsignatura correctamente', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      setupRecompute({
        records: [
          createRecord(20, 1, { notaFinal: 4.5 }, 'Matemáticas'),
          createRecord(20, 2, { notaFinal: 3.0 }, 'Español'),
        ],
        students: [{ id: 100, studentId: 20 }],
      });

      const result = await service.getByGroup(secretariaActor, 10);

      expect(result.mejorAsignatura).toBe('Matemáticas');
    });

    it('lanza NotFoundException si no hay período activo', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      prisma.group.findUnique.mockResolvedValue({
        id: 10,
        institutionId: 100,
        grade: { id: 1 },
        subjects: [],
      });
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      await expect(service.getByGroup(secretariaActor, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza NotFoundException si el grupo no existe en recompute', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      prisma.group.findUnique.mockResolvedValue(null);

      await expect(service.getByGroup(secretariaActor, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getGradeRanking ──────────────────────────────────────────────────

  describe('getGradeRanking', () => {
    it('retorna ranking ordenado por score', async () => {
      // ensureCanViewGradePerformance — SECRETARIA
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      // findMany para el ranking
      prisma.group.findMany.mockResolvedValue([
        {
          id: 10,
          nombre: '1A',
          gradeId: 1,
          grade: { id: 1, nombre: 'Primero' },
        },
        {
          id: 11,
          nombre: '1B',
          gradeId: 1,
          grade: { id: 1, nombre: 'Primero' },
        },
      ]);

      // Cada grupo llama a recomputeGroupPerformance
      prisma.group.findUnique
        .mockResolvedValueOnce({
          id: 10,
          institutionId: 100,
          grade: { id: 1 },
          subjects: [{ subject: { nombre: 'Mat' } }],
        })
        .mockResolvedValueOnce({
          id: 11,
          institutionId: 100,
          grade: { id: 1 },
          subjects: [{ subject: { nombre: 'Mat' } }],
        });

      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 5 });

      prisma.gradePerformance.findUnique.mockResolvedValue(null);
      prisma.studentAcademicRecord.findMany.mockResolvedValue([]);
      prisma.studentGroup.findMany.mockResolvedValue([]);
      prisma.evaluationGrade.findMany.mockResolvedValue([]);
      prisma.studyMaterial.count.mockResolvedValue(0);
      prisma.syllabus.count.mockResolvedValue(0);
      prisma.recoveryRequest.findMany.mockResolvedValue([]);
      prisma.gradePerformance.upsert.mockResolvedValue({
        id: 1,
        groupId: 10,
        promedioGeneral: null,
        asistenciaPromedio: null,
        aprobacion: null,
        mejorAsignatura: null,
        inasistenciasJustificadas: 0,
        inasistenciasInjustificadas: 0,
        porcentajeCursoMayorAsistencia: null,
        variacionPromedio: null,
        variacionAprobacion: null,
        reduccionAusencias: null,
        tendenciaGeneral: 'MIXTA',
      });
      prisma.performanceTopStudent.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.getGradeRanking(secretariaActor, 1);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('scoreBreakdown');
    });

    it('rechaza ESTUDIANTE sin grupo en el grado', async () => {
      prisma.group.findFirst.mockResolvedValue(null); // skip SECRETARIA/SA
      prisma.teacherAssignment.findFirst.mockResolvedValue(null); // skip PROFESOR
      prisma.studentGroup.findFirst.mockResolvedValue({
        group: { gradeId: 99 },
      });

      await expect(service.getGradeRanking(estudianteActor, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── getStudentAcademic ───────────────────────────────────────────────

  describe('getStudentAcademic', () => {
    it('retorna datos académicos del estudiante propio', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 20,
        nombres: 'Juan',
        apellidos: 'Lopez',
        email: 'juan@t.co',
        institutionId: 100,
      });
      prisma.studentGroup.findFirst.mockResolvedValue({
        id: 100,
        studentId: 20,
        groupId: 10,
        group: { id: 10, nombre: '1A', grade: { id: 1, nombre: 'Primero' } },
      });
      prisma.studentAcademicRecord.findMany.mockResolvedValue([
        {
          id: 1,
          studentId: 20,
          groupId: 10,
          subjectId: 1,
          notaFinal: 4.0,
          progresoMateria: 85,
          inasistenciasJustificadas: 1,
          inasistenciasInjustificadas: 2,
          observaciones: null,
          updatedAt: new Date(),
          academicOfferingId: null,
          subject: { id: 1, nombre: 'Matemáticas' },
        },
      ]);
      prisma.evaluationGrade.findMany.mockResolvedValue([]);

      const result = await service.getStudentAcademic(estudianteActor, 20);

      expect(result.student.id).toBe(20);
      expect(result.summary.promedioGeneral).toBe(4);
      expect(result.records).toHaveLength(1);
    });

    it('rechaza ESTUDIANTE viendo otro estudiante', async () => {
      await expect(
        service.getStudentAcademic(estudianteActor, 999),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si el estudiante no existe', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 30 }); // ensureCanView pass
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getStudentAcademic(secretariaActor, 30),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si el estudiante no tiene grupo', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 30 });
      prisma.user.findUnique.mockResolvedValue({
        id: 30,
        nombres: 'Test',
        apellidos: 'User',
        email: 't@t.co',
        institutionId: 100,
      });
      prisma.studentGroup.findFirst.mockResolvedValue(null);

      await expect(
        service.getStudentAcademic(secretariaActor, 30),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getGroupAcademicOverview ─────────────────────────────────────────

  describe('getGroupAcademicOverview', () => {
    it('retorna overview del grupo con estudiantes', async () => {
      // ensureCanManageGroupAcademic — SECRETARIA
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      prisma.group.findUnique.mockResolvedValue({
        id: 10,
        nombre: '1A',
        institutionId: 100,
        grade: { id: 1, nombre: 'Primero' },
        subjects: [{ subject: { id: 1, nombre: 'Mat' } }],
      });
      prisma.studentGroup.findMany.mockResolvedValue([
        {
          id: 100,
          student: {
            id: 20,
            nombres: 'Juan',
            apellidos: 'Lopez',
            email: 'j@t.co',
          },
        },
      ]);
      prisma.studentAcademicRecord.findMany.mockResolvedValue([
        {
          id: 1,
          studentId: 20,
          groupId: 10,
          subjectId: 1,
          notaFinal: 4.0,
          progresoMateria: 85,
          inasistenciasJustificadas: 0,
          inasistenciasInjustificadas: 1,
          observaciones: null,
          updatedAt: new Date(),
          academicOfferingId: null,
          subject: { id: 1, nombre: 'Mat' },
        },
      ]);
      prisma.evaluationGrade.findMany.mockResolvedValue([]);

      const result = await service.getGroupAcademicOverview(
        secretariaActor,
        10,
      );

      expect(result.group.id).toBe(10);
      expect(result.students).toHaveLength(1);
      expect(result.subjects).toHaveLength(1);
    });

    it('lanza NotFoundException si el grupo no existe', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      prisma.group.findUnique.mockResolvedValue(null);

      await expect(
        service.getGroupAcademicOverview(secretariaActor, 10),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza PROFESOR sin asignación al grupo', async () => {
      prisma.group.findFirst.mockResolvedValue(null); // not director
      prisma.teacherAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.getGroupAcademicOverview(profesorActor, 10),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── upsertStudentAcademic ────────────────────────────────────────────

  describe('upsertStudentAcademic', () => {
    it('crea/actualiza registro académico del estudiante', async () => {
      // ensureCanManageGroupAcademic — SECRETARIA
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      // ensureCanUpdateSubject — SECRETARIA (bypass)
      prisma.studentGroup.findFirst.mockResolvedValue({
        id: 100,
        studentId: 20,
        groupId: 10,
      });
      (prisma as any).groupSubject = {
        findFirst: jest.fn().mockResolvedValue({ id: 50 }),
      };
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 5 });
      prisma.academicOffering.findUnique.mockResolvedValue({ id: 200 });
      prisma.studentAcademicRecord.upsert.mockResolvedValue({
        id: 1,
        studentId: 20,
        groupId: 10,
        subjectId: 1,
        notaFinal: 4.0,
        progresoMateria: 85,
        inasistenciasJustificadas: 0,
        inasistenciasInjustificadas: 1,
        observaciones: null,
        updatedAt: new Date(),
      });
      prisma.subject.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Matemáticas',
      });
      prisma.evaluationGrade.findMany.mockResolvedValue([]);

      const result = await service.upsertStudentAcademic(
        secretariaActor,
        10,
        20,
        1,
        { notaFinal: 4.0, progresoMateria: 85, inasistenciasInjustificadas: 1 },
      );

      expect(result.notaFinal).toBe(4.0);
      expect(result.subject.nombre).toBe('Matemáticas');
    });

    it('rechaza si el estudiante no pertenece al grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 10 });
      prisma.studentGroup.findFirst.mockResolvedValue(null);
      (prisma as any).groupSubject = {
        findFirst: jest.fn().mockResolvedValue({ id: 50 }),
      };

      await expect(
        service.upsertStudentAcademic(secretariaActor, 10, 20, 1, {
          notaFinal: 4.0,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Helpers ──────────────────────────────────────────────────────────

  function createRecord(
    studentId: number,
    subjectId: number,
    overrides: {
      notaFinal?: number | null;
      progresoMateria?: number | null;
    } = {},
    subjectName = 'Materia',
  ) {
    return {
      id: Math.random(),
      studentId,
      groupId: 10,
      subjectId,
      notaFinal: overrides.notaFinal ?? null,
      progresoMateria: overrides.progresoMateria ?? null,
      inasistenciasJustificadas: 0,
      inasistenciasInjustificadas: 0,
      observaciones: null,
      updatedAt: new Date(),
      academicOfferingId: null,
      subject: { id: subjectId, nombre: subjectName },
      student: { id: studentId, nombres: 'Test', apellidos: 'User' },
    };
  }

  function setupRecompute(
    opts: {
      records?: ReturnType<typeof createRecord>[];
      students?: { id: number; studentId: number }[];
      previousPerformance?: object | null;
    } = {},
  ) {
    const records = opts.records ?? [];
    const students = opts.students ?? [];

    prisma.group.findUnique.mockResolvedValue({
      id: 10,
      institutionId: 100,
      grade: { id: 1, nombre: 'Primero' },
      subjects: [{ subject: { nombre: 'Mat' } }],
    });
    prisma.academicPeriod.findFirst.mockResolvedValue({ id: 5 });
    prisma.gradePerformance.findUnique.mockResolvedValue(
      opts.previousPerformance !== undefined ? opts.previousPerformance : null,
    );
    prisma.studentAcademicRecord.findMany.mockResolvedValue(records);
    prisma.studentGroup.findMany.mockResolvedValue(students);
    prisma.evaluationGrade.findMany.mockResolvedValue([]);
    prisma.studyMaterial.count.mockResolvedValue(0);
    prisma.syllabus.count.mockResolvedValue(0);
    prisma.recoveryRequest.findMany.mockResolvedValue([]);
    prisma.gradePerformance.upsert.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await
      async (args: any) => ({
        id: 1,
        groupId: 10,
        academicPeriodId: 5,
        ...args.create,
        ...args.update,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    prisma.performanceTopStudent.deleteMany.mockResolvedValue({ count: 0 });
    prisma.performanceTopStudent.createMany.mockResolvedValue({ count: 0 });
  }
});
