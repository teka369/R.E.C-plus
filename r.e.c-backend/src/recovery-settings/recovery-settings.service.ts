import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

import { isRecoveryWindowActive } from '../recovery/recovery.utils';

type RecoveryPeriodView = {
  active: boolean;
  startAt: string | null;
  endAt: string | null;
};

type RecoveryScheduleMeta = {
  id: number;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
};

import { Actor } from '../common/tenant';
import { TenantScopedService } from '../common/tenant-scoped.service';

@Injectable()
export class RecoverySettingsService extends TenantScopedService {
  private readonly logger = new Logger(RecoverySettingsService.name);
  private readonly uploadsRoot = path.join(
    process.cwd(),
    'uploads',
    'recovery',
  );

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private async getActiveAcademicPeriodId(actor: Actor) {
    const institutionId = this.getActorInstitutionId(actor);
    const period = await this.prisma.academicPeriod.findFirst({
      where: { estado: 'ACTIVE', institutionId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    return period?.id ?? null;
  }

  async getPeriod(actor: Actor): Promise<RecoveryPeriodView> {
    const activePeriodId = await this.getActiveAcademicPeriodId(actor);
    if (!activePeriodId) {
      return {
        active: false,
        startAt: null,
        endAt: null,
      };
    }

    const configRows = await this.prisma.$queryRaw<
      { startAt: Date; endAt: Date }[]
    >`
      SELECT "startAt", "endAt"
      FROM "RecoveryConfig"
      WHERE "academicPeriodId" = ${activePeriodId}
      LIMIT 1
    `;
    const config = configRows[0];

    if (!config) {
      return {
        active: false,
        startAt: null,
        endAt: null,
      };
    }

    const active = isRecoveryWindowActive(config.startAt, config.endAt);
    return {
      active,
      startAt: config.startAt.toISOString(),
      endAt: config.endAt.toISOString(),
    };
  }

  async setPeriod(
    actor: Actor,
    startAt: string,
    endAt: string,
  ): Promise<RecoveryPeriodView> {
    const activePeriodId = await this.getActiveAcademicPeriodId(actor);
    if (!activePeriodId) {
      throw new BadRequestException(
        'No existe período académico activo para configurar recuperación',
      );
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException(
        'La fecha fin debe ser posterior a la fecha inicio',
      );
    }

    const existingConfig = await this.prisma.recoveryConfig.findUnique({
      where: { academicPeriodId: activePeriodId },
      select: { id: true },
    });

    if (existingConfig) {
      await this.prisma.recoveryConfig.update({
        where: { academicPeriodId: activePeriodId },
        data: {
          startAt: start,
          endAt: end,
          updatedById: actor.userId,
        },
      });
    } else {
      const lastConfig = await this.prisma.recoveryConfig.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      await this.prisma.recoveryConfig.create({
        data: {
          id: (lastConfig?.id ?? 0) + 1,
          startAt: start,
          endAt: end,
          updatedById: actor.userId,
          academicPeriodId: activePeriodId,
        },
      });
    }

    return {
      active: isRecoveryWindowActive(start, end),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
  }

  async getScheduleFile(
    actor: Actor,
  ): Promise<{ originalName: string; mimeType: string; fileContent: Buffer }> {
    const activePeriodId = await this.getActiveAcademicPeriodId(actor);
    if (!activePeriodId) {
      throw new NotFoundException('No hay período académico activo');
    }

    const schedule = await this.prisma.recoverySchedule.findUnique({
      where: { academicPeriodId: activePeriodId },
      select: { originalName: true, mimeType: true, filePath: true },
    });

    if (!schedule) {
      throw new NotFoundException('No hay horario de recuperación cargado');
    }

    const absPath = path.join(this.uploadsRoot, schedule.filePath);
    try {
      const fileContent = await fs.readFile(absPath);
      return {
        originalName: schedule.originalName,
        mimeType: schedule.mimeType,
        fileContent,
      };
    } catch {
      this.logger.error(
        `Archivo de horario no encontrado en disco: ${absPath}`,
      );
      throw new NotFoundException(
        'El archivo de horario no se encuentra en el servidor',
      );
    }
  }

  async uploadSchedule(
    actor: Actor,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<RecoveryScheduleMeta> {
    const activePeriodId = await this.getActiveAcademicPeriodId(actor);
    if (!activePeriodId) {
      throw new BadRequestException(
        'No existe período académico activo para cargar el horario',
      );
    }

    if (!file?.buffer || !file.originalname || !file.mimetype) {
      throw new BadRequestException('Archivo inválido');
    }

    if (file.buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo supera el límite de 10MB');
    }

    const ext = path.extname(file.originalname) || '';
    const safeName = `${randomUUID()}${ext}`;
    const relDir = 'schedules';
    const absDir = path.join(this.uploadsRoot, relDir);
    await fs.mkdir(absDir, { recursive: true });

    const diskPath = path.join(absDir, safeName);
    await fs.writeFile(diskPath, file.buffer);
    const dbPath = path.join(relDir, safeName);

    const existingSchedule = await this.prisma.recoverySchedule.findUnique({
      where: { academicPeriodId: activePeriodId },
      select: { id: true },
    });

    const saved = existingSchedule
      ? await this.prisma.recoverySchedule.update({
          where: { academicPeriodId: activePeriodId },
          data: {
            originalName: file.originalname,
            mimeType: file.mimetype,
            filePath: dbPath,
            uploadedById: actor.userId,
            uploadedAt: new Date(),
          },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            uploadedAt: true,
          },
        })
      : await (async () => {
          const lastSchedule = await this.prisma.recoverySchedule.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true },
          });
          return this.prisma.recoverySchedule.create({
            data: {
              id: (lastSchedule?.id ?? 0) + 1,
              originalName: file.originalname,
              mimeType: file.mimetype,
              filePath: dbPath,
              uploadedById: actor.userId,
              academicPeriodId: activePeriodId,
            },
            select: {
              id: true,
              originalName: true,
              mimeType: true,
              uploadedAt: true,
            },
          });
        })();

    if (!saved) {
      throw new NotFoundException(
        'No se pudo guardar el horario de recuperación',
      );
    }

    return {
      id: saved.id,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      uploadedAt: saved.uploadedAt.toISOString(),
    };
  }
}
