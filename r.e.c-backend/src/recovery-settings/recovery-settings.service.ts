import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

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

type Actor = {
  userId: number;
  role: UserRole;
  institutionId?: number | null;
};

@Injectable()
export class RecoverySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private getActorInstitutionId(actor: Actor): number {
    if (actor.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Operacion no valida para SUPER_ADMIN sin contexto de institucion',
      );
    }
    if (!actor.institutionId) {
      throw new ForbiddenException('Usuario sin institucion asociada');
    }
    return actor.institutionId;
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
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      return {
        active: true,
        startAt: now.toISOString(),
        endAt: end.toISOString(),
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
      active: end.getTime() > Date.now(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    };
  }

  async getScheduleFile(actor: Actor): Promise<RecoveryScheduleFile> {
    const activePeriodId = await this.getActiveAcademicPeriodId(actor);
    if (!activePeriodId) {
      throw new NotFoundException('No hay período académico activo');
    }

    const fileRows = await this.prisma.$queryRaw<RecoveryScheduleFile[]>`
      SELECT "originalName", "mimeType", "fileContent"
      FROM "RecoverySchedule"
      WHERE "academicPeriodId" = ${activePeriodId}
      LIMIT 1
    `;
    const file = fileRows[0];
    if (!file) {
      throw new NotFoundException('No hay horario de recuperación cargado');
    }
    return file;
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

    const fileBytes = Uint8Array.from(file.buffer);
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
            fileContent: fileBytes,
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
              fileContent: fileBytes,
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
