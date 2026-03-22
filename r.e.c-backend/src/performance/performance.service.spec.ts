import { ForbiddenException } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

type StudentAcademicUpsertArgs = {
  where: {
    studentId_groupId_subjectId: {
      studentId: number;
      groupId: number;
      subjectId: number;
    };
  };
  update: Record<string, unknown>;
  create: Record<string, unknown>;
};

describe('PerformanceService', () => {
  let service: PerformanceService;
  let prisma: {
    group: { findFirst: jest.Mock };
    teacherAssignment: { findFirst: jest.Mock };
    studentGroup: { findFirst: jest.Mock };
    groupSubject: { findFirst: jest.Mock };
    academicPeriod: { findFirst: jest.Mock };
    academicOffering: { findUnique: jest.Mock };
    academicEvaluation: { findFirst: jest.Mock; create: jest.Mock };
    subject: { findUnique: jest.Mock };
    gradePerformance: { upsert: jest.Mock };
    performanceTopStudent: { deleteMany: jest.Mock; createMany: jest.Mock };
    studentAcademicRecord: { upsert: jest.Mock; update: jest.Mock };
    evaluationGrade: { upsert: jest.Mock; findMany: jest.Mock };
    $executeRaw: jest.Mock;
    $queryRaw: jest.Mock;
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      group: { findFirst: jest.fn() },
      teacherAssignment: { findFirst: jest.fn() },
      studentGroup: { findFirst: jest.fn() },
      groupSubject: { findFirst: jest.fn() },
      academicPeriod: { findFirst: jest.fn() },
      academicOffering: { findUnique: jest.fn() },
      academicEvaluation: { findFirst: jest.fn(), create: jest.fn() },
      subject: { findUnique: jest.fn() },
      gradePerformance: { upsert: jest.fn() },
      performanceTopStudent: { deleteMany: jest.fn(), createMany: jest.fn() },
      studentAcademicRecord: { upsert: jest.fn(), update: jest.fn() },
      evaluationGrade: { upsert: jest.fn(), findMany: jest.fn() },
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn(),
      $transaction: jest.fn(),
    };

    service = new PerformanceService(prisma as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('forbids professor without group access', async () => {
    prisma.group.findFirst
      .mockResolvedValueOnce({ id: 1, nombre: '10-1' })
      .mockResolvedValueOnce(null);
    prisma.teacherAssignment.findFirst.mockResolvedValue(null);

    await expect(
      service.upsertByGrade({ userId: 55, role: UserRole.PROFESOR }, '10-1', {
        promedioGeneral: 3.9,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows secretaria and returns recomputed row', async () => {
    prisma.group.findFirst.mockResolvedValue({ id: 1, nombre: '10-1' });
    const recomputeSpy = jest
      .spyOn(
        service as unknown as {
          recomputeGroupPerformance: (groupId: number) => Promise<unknown>;
        },
        'recomputeGroupPerformance',
      )
      .mockResolvedValue({
        id: 1,
        groupId: 1,
        academicPeriodId: 99,
        promedioGeneral: 4.2,
        asistenciaPromedio: 94,
        aprobacion: 88,
        mejorAsignatura: 'Matemáticas',
        inasistenciasJustificadas: 2,
        inasistenciasInjustificadas: 1,
        porcentajeCursoMayorAsistencia: 96,
        variacionPromedio: 0.3,
        variacionAprobacion: 2,
        reduccionAusencias: 1,
        tendenciaGeneral: 'Positiva',
        createdAt: new Date('2026-02-28T10:00:00.000Z'),
        updatedAt: new Date('2026-02-28T10:10:00.000Z'),
        leagueScore: 87,
        scoreBreakdown: {
          promedio: {
            raw: 4.2,
            normalized: 84,
            weight: 0.4,
            contribution: 33.6,
          },
          asistencia: {
            raw: 94,
            normalized: 94,
            weight: 0.2,
            contribution: 18.8,
          },
          aprobacion: {
            raw: 88,
            normalized: 88,
            weight: 0.3,
            contribution: 26.4,
          },
          recuperacionAusencias: {
            raw: 100,
            normalized: 100,
            weight: 0.1,
            contribution: 10,
          },
          total: 88.8,
        },
        derivedSignals: {
          recoveryCompletionRate: null,
          resourcesPerSubject: 0,
          activeSyllabusRate: 0,
        },
      });

    const result = await service.upsertByGrade(
      { userId: 1, role: UserRole.SECRETARIA, institutionId: 10 },
      '10-1',
      { promedioGeneral: 4.2 },
    );

    expect(result).toBeTruthy();
    expect(result?.groupId).toBe(1);
    expect(recomputeSpy).toHaveBeenCalledWith(1);
  });

  it('denies cross-tenant grade tampering before recompute or persistence', async () => {
    const targetGroup = {
      id: 9,
      nombre: '10-9',
      institutionId: 200,
    };
    const targetGroupBaseline = structuredClone(targetGroup);

    // Read stage: locate group by grade label (service-level call path).
    prisma.group.findFirst
      .mockResolvedValueOnce(targetGroup)
      // Authorization check stage (teacher is not director in target group).
      .mockResolvedValueOnce(null);
    prisma.teacherAssignment.findFirst.mockResolvedValue(null);

    const recomputeSpy = jest
      .spyOn(
        service as unknown as {
          recomputeGroupPerformance: (groupId: number) => Promise<unknown>;
        },
        'recomputeGroupPerformance',
      )
      .mockResolvedValue({});

    await expect(
      service.upsertByGrade(
        { userId: 5001, role: UserRole.PROFESOR, institutionId: 100 },
        '10-9',
        { promedioGeneral: 4.9 },
      ),
    ).rejects.toThrow(ForbiddenException);

    // Read happens, write path must never start.
    expect(prisma.group.findFirst).toHaveBeenCalledTimes(2);
    expect(prisma.teacherAssignment.findFirst).toHaveBeenCalledTimes(1);

    expect(recomputeSpy).not.toHaveBeenCalled();
    expect(prisma.gradePerformance.upsert).not.toHaveBeenCalled();
    expect(prisma.performanceTopStudent.deleteMany).not.toHaveBeenCalled();
    expect(prisma.performanceTopStudent.createMany).not.toHaveBeenCalled();
    expect(prisma.studentAcademicRecord.upsert).not.toHaveBeenCalled();
    expect(prisma.studentAcademicRecord.update).not.toHaveBeenCalled();
    expect(prisma.evaluationGrade.upsert).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();

    // Structural integrity: no silent in-memory mutation.
    expect(targetGroup).toEqual(targetGroupBaseline);
  });

  it('keeps student academic upsert idempotent without redundant create writes', async () => {
    const actor = { userId: 11, role: UserRole.SECRETARIA, institutionId: 10 };
    const payload = {
      parcial1: 4.2,
      parcial2: 4.5,
      notaFinal: 4.4,
      progresoMateria: 92,
      inasistenciasJustificadas: 1,
      inasistenciasInjustificadas: 0,
      observaciones: 'Seguimiento estable',
    };

    prisma.group.findFirst.mockResolvedValue({ id: 1 });
    prisma.studentGroup.findFirst.mockResolvedValue({ id: 701 });
    prisma.groupSubject.findFirst.mockResolvedValue({ id: 501 });
    prisma.academicPeriod.findFirst.mockResolvedValue({ id: 90 });
    prisma.academicOffering.findUnique.mockResolvedValue({ id: 600 });

    const fixedUpdatedAt = new Date('2030-01-20T10:00:00.000Z');
    prisma.studentAcademicRecord.upsert.mockResolvedValue({
      id: 800,
      studentId: 31,
      groupId: 1,
      subjectId: 21,
      notaFinal: 4.4,
      progresoMateria: 92,
      inasistenciasJustificadas: 1,
      inasistenciasInjustificadas: 0,
      observaciones: 'Seguimiento estable',
      updatedAt: fixedUpdatedAt,
    });

    prisma.academicEvaluation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 9101 });

    prisma.academicEvaluation.create
      .mockResolvedValueOnce({ id: 9101 })
      .mockResolvedValueOnce({ id: 9102 });

    prisma.evaluationGrade.upsert.mockResolvedValue({ id: 10001, nota: 4.2 });
    prisma.subject.findUnique.mockResolvedValue({
      id: 21,
      nombre: 'Matemáticas',
    });
    prisma.evaluationGrade.findMany.mockResolvedValue([
      {
        nota: 4.2,
        academicEvaluation: {
          titulo: 'Parcial 1',
          tipo: 'PARCIAL',
          orden: 1,
          porcentaje: null,
        },
      },
      {
        nota: 4.5,
        academicEvaluation: {
          titulo: 'Parcial 2',
          tipo: 'PARCIAL',
          orden: 2,
          porcentaje: null,
        },
      },
    ]);

    const first = await service.upsertStudentAcademic(
      actor,
      1,
      31,
      21,
      payload as never,
    );
    const createCallsAfterFirstRun =
      prisma.academicEvaluation.create.mock.calls.length;

    const second = await service.upsertStudentAcademic(
      actor,
      1,
      31,
      21,
      payload as never,
    );

    expect(first).toEqual(second);

    expect(prisma.studentAcademicRecord.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.evaluationGrade.upsert).toHaveBeenCalledTimes(4);

    expect(createCallsAfterFirstRun).toBe(2);
    expect(prisma.academicEvaluation.create).toHaveBeenCalledTimes(2);

    const [firstUpsertCall, secondUpsertCall] = prisma.studentAcademicRecord
      .upsert.mock.calls as [
      [StudentAcademicUpsertArgs],
      [StudentAcademicUpsertArgs],
    ];
    const [firstUpsertArg] = firstUpsertCall;
    const [secondUpsertArg] = secondUpsertCall;
    expect(secondUpsertArg).toEqual(firstUpsertArg);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
    expect(prisma.gradePerformance.upsert).not.toHaveBeenCalled();
    expect(prisma.performanceTopStudent.deleteMany).not.toHaveBeenCalled();
    expect(prisma.performanceTopStudent.createMany).not.toHaveBeenCalled();
    expect(prisma.studentAcademicRecord.update).not.toHaveBeenCalled();
  });
});
