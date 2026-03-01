import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type RecoveryPeriodView = {
  active: boolean;
  startAt: string;
  endAt: string;
};

type RecoveryScheduleFile = {
  originalName: string;
  mimeType: string;
  fileContent: Buffer;
};

type RecoveryScheduleMeta = {
  id: number;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
};

@Injectable()
export class RecoverySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPeriod(): Promise<RecoveryPeriodView> {
    const configRows = await this.prisma.$queryRaw<
      { startAt: Date; endAt: Date }[]
    >`
      SELECT "startAt", "endAt"
      FROM "RecoveryConfig"
      WHERE id = 1
      LIMIT 1
    `;
    const config = configRows[0];

    if (!config) {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      return {
        active: true,
        startAt: now.toISOString(),
        endAt: end.toISOString(),
      };
    }

    const active = new Date(config.endAt).getTime() > Date.now();
    return {
      active,
      startAt: config.startAt.toISOString(),
      endAt: config.endAt.toISOString(),
    };
  }

  async setPeriod(
    actorId: number,
    startAt: string,
    endAt: string,
  ): Promise<RecoveryPeriodView> {
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

    await this.prisma.$executeRaw`
      INSERT INTO "RecoveryConfig" (id, "startAt", "endAt", "updatedById", "createdAt", "updatedAt")
      VALUES (1, ${start}, ${end}, ${actorId}, NOW(), NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        "startAt" = EXCLUDED."startAt",
        "endAt" = EXCLUDED."endAt",
        "updatedById" = EXCLUDED."updatedById",
        "updatedAt" = NOW()
    `;

    return {
      active: end.getTime() > Date.now(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
  }

  async getScheduleFile(): Promise<RecoveryScheduleFile> {
    const fileRows = await this.prisma.$queryRaw<RecoveryScheduleFile[]>`
      SELECT "originalName", "mimeType", "fileContent"
      FROM "RecoverySchedule"
      WHERE id = 1
      LIMIT 1
    `;
    const file = fileRows[0];
    if (!file) {
      throw new NotFoundException('No hay horario de recuperación cargado');
    }
    return file;
  }

  async uploadSchedule(
    actorId: number,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<RecoveryScheduleMeta> {
    if (!file?.buffer || !file.originalname || !file.mimetype) {
      throw new BadRequestException('Archivo inválido');
    }

    if (file.buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo supera el límite de 10MB');
    }

    await this.prisma.$executeRaw`
      INSERT INTO "RecoverySchedule" (id, "originalName", "mimeType", "fileContent", "uploadedById", "uploadedAt")
      VALUES (1, ${file.originalname}, ${file.mimetype}, ${file.buffer}, ${actorId}, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        "originalName" = EXCLUDED."originalName",
        "mimeType" = EXCLUDED."mimeType",
        "fileContent" = EXCLUDED."fileContent",
        "uploadedById" = EXCLUDED."uploadedById",
        "uploadedAt" = NOW()
    `;

    const savedRows = await this.prisma.$queryRaw<
      { id: number; originalName: string; mimeType: string; uploadedAt: Date }[]
    >`
      SELECT id, "originalName", "mimeType", "uploadedAt"
      FROM "RecoverySchedule"
      WHERE id = 1
      LIMIT 1
    `;
    const saved = savedRows[0];

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
