import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecoverySettingsService } from '../../../src/recovery-settings/recovery-settings.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';
import { Actor } from '../../../src/common/tenant';

jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs');
  return {
    ...actual,
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue(Buffer.from('schedule-data')),
    },
  };
});

jest.mock('node:crypto', () => {
  const actual = jest.requireActual('node:crypto');
  return { ...actual, randomUUID: () => 'test-uuid' };
});

describe('RecoverySettingsService (unit)', () => {
  const prisma = {
    academicPeriod: { findFirst: jest.fn() },
    $queryRaw: jest.fn(),
    recoveryConfig: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    recoverySchedule: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: RecoverySettingsService;

  const secretaria: Actor = {
    userId: 10,
    role: UserRole.SECRETARIA,
    institutionId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecoverySettingsService(prisma as never);
  });

  // ======================================================
  // getPeriod
  // ======================================================
  describe('getPeriod', () => {
    it('retorna período de recuperación desde config', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      const start = new Date('2026-03-01');
      const end = new Date('2026-04-01');
      prisma.$queryRaw.mockResolvedValue([{ startAt: start, endAt: end }]);

      const result = await service.getPeriod(secretaria);

      expect(result.startAt).toBe(start.toISOString());
      expect(result.endAt).toBe(end.toISOString());
    });

    it('retorna valores por defecto si no hay período académico', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      const result = await service.getPeriod(secretaria);

      expect(result.active).toBe(true);
      expect(result.startAt).toBeDefined();
    });

    it('retorna valores por defecto si no hay config', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getPeriod(secretaria);

      expect(result.active).toBe(true);
    });
  });

  // ======================================================
  // setPeriod
  // ======================================================
  describe('setPeriod', () => {
    it('crea config nueva', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      prisma.recoveryConfig.findUnique.mockResolvedValue(null);
      prisma.recoveryConfig.findFirst.mockResolvedValue(null);
      prisma.recoveryConfig.create.mockResolvedValue({});

      const result = await service.setPeriod(
        secretaria,
        '2026-03-01T00:00:00Z',
        '2026-04-01T00:00:00Z',
      );

      expect(result.startAt).toContain('2026-03');
    });

    it('actualiza config existente', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      prisma.recoveryConfig.findUnique.mockResolvedValue({ id: 10 });
      prisma.recoveryConfig.update.mockResolvedValue({});

      const result = await service.setPeriod(
        secretaria,
        '2026-03-01T00:00:00Z',
        '2026-04-01T00:00:00Z',
      );

      expect(result.startAt).toContain('2026-03');
    });

    it('rechaza si no hay período académico activo', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.setPeriod(secretaria, '2026-03-01', '2026-04-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si fecha fin <= fecha inicio', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        service.setPeriod(
          secretaria,
          '2026-04-01T00:00:00Z',
          '2026-03-01T00:00:00Z',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza fechas inválidas', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        service.setPeriod(secretaria, 'invalid', 'invalid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ======================================================
  // getScheduleFile
  // ======================================================
  describe('getScheduleFile', () => {
    it('retorna archivo de horario', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      prisma.recoverySchedule.findUnique.mockResolvedValue({
        originalName: 'horario.pdf',
        mimeType: 'application/pdf',
        filePath: 'schedules/test.pdf',
      });

      const result = await service.getScheduleFile(secretaria);

      expect(result.originalName).toBe('horario.pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('lanza si no hay período activo', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      await expect(service.getScheduleFile(secretaria)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza si no hay horario cargado', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      prisma.recoverySchedule.findUnique.mockResolvedValue(null);

      await expect(service.getScheduleFile(secretaria)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ======================================================
  // uploadSchedule
  // ======================================================
  describe('uploadSchedule', () => {
    it('sube horario nuevo', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      prisma.recoverySchedule.findUnique.mockResolvedValue(null);
      prisma.recoverySchedule.findFirst.mockResolvedValue(null);
      prisma.recoverySchedule.create.mockResolvedValue({
        id: 1,
        originalName: 'horario.pdf',
        mimeType: 'application/pdf',
        uploadedAt: new Date('2026-03-01'),
      });

      const result = await service.uploadSchedule(secretaria, {
        originalname: 'horario.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(1024),
      });

      expect(result.originalName).toBe('horario.pdf');
    });

    it('actualiza horario existente', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });
      prisma.recoverySchedule.findUnique.mockResolvedValue({ id: 5 });
      prisma.recoverySchedule.update.mockResolvedValue({
        id: 5,
        originalName: 'nuevo.pdf',
        mimeType: 'application/pdf',
        uploadedAt: new Date('2026-03-02'),
      });

      const result = await service.uploadSchedule(secretaria, {
        originalname: 'nuevo.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(500),
      });

      expect(result.originalName).toBe('nuevo.pdf');
    });

    it('rechaza si no hay período activo', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadSchedule(secretaria, {
          originalname: 'x.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.alloc(100),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza archivo inválido', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        service.uploadSchedule(secretaria, {
          originalname: '',
          mimetype: '',
          buffer: null as never,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza archivo que excede 10MB', async () => {
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        service.uploadSchedule(secretaria, {
          originalname: 'big.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.alloc(11 * 1024 * 1024),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
