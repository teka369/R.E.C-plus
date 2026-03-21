import { ForbiddenException } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let prisma: {
    group: { findFirst: jest.Mock };
    teacherAssignment: { findFirst: jest.Mock };
    $executeRaw: jest.Mock;
    $queryRaw: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      group: { findFirst: jest.fn() },
      teacherAssignment: { findFirst: jest.fn() },
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn(),
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
      { userId: 1, role: UserRole.SECRETARIA },
      '10-1',
      { promedioGeneral: 4.2 },
    );

    expect(result).toBeTruthy();
    expect(result?.groupId).toBe(1);
    expect(recomputeSpy).toHaveBeenCalledWith(1);
  });
});
