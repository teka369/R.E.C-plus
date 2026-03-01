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

  it('allows secretaria and returns upserted row', async () => {
    prisma.group.findFirst.mockResolvedValue({ id: 1, nombre: '10-1' });
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 1,
        groupId: 1,
        promedioGeneral: 4.2,
        asistenciaPromedio: 94,
        aprobacion: 88,
        mejorAsignatura: 'Matemáticas',
        estudiantesDestacados: 'Ana, Luis',
        inasistenciasJustificadas: 2,
        inasistenciasInjustificadas: 1,
        porcentajeCursoMayorAsistencia: 96,
        variacionPromedio: 0.3,
        variacionAprobacion: 2,
        reduccionAusencias: 1,
        tendenciaGeneral: 'Positiva',
        createdAt: new Date('2026-02-28T10:00:00.000Z'),
        updatedAt: new Date('2026-02-28T10:10:00.000Z'),
      },
    ]);

    const result = await service.upsertByGrade(
      { userId: 1, role: UserRole.SECRETARIA },
      '10-1',
      { promedioGeneral: 4.2 },
    );

    expect(result).toBeTruthy();
    expect(result?.groupId).toBe(1);
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });
});
