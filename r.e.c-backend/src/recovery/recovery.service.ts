import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';
import { RecoveryActivityStatus, RecoveryRequestStatus } from '@prisma/client';
import {
  CreateRecoveryActivityDto,
  CreateRecoveryMessageDto,
  CreateRecoveryRequestDto,
  UpdateRecoveryActivityDto,
  UpdateRecoveryRequestStatusDto,
} from './dto';

type RecoveryActivityAttachmentRow = {
  activityId: number;
  originalName: string;
  mimeType: string;
  fileContent: Buffer;
  uploadedAt: Date;
};

type RecoveryActivityAttachmentMeta = {
  activityId: number;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
};

const ALLOWED_RECOVERY_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);

type Actor = {
  userId: number;
  role: UserRole;
  institutionId?: number | null;
};

@Injectable()
export class RecoveryService {
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

  private async isRecoveryPeriodActive(actor: Actor) {
    const activePeriod = await this.prisma.academicPeriod.findFirst({
      where: {
        estado: 'ACTIVE',
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { institutionId: this.getActorInstitutionId(actor) }),
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!activePeriod) return false;

    const rows = await this.prisma.$queryRaw<{ startAt: Date; endAt: Date }[]>`
      SELECT "startAt", "endAt"
      FROM "RecoveryConfig"
      WHERE "academicPeriodId" = ${activePeriod.id}
      LIMIT 1
    `;

    const config = rows[0];
    if (!config) return false;

    const now = Date.now();
    return (
      now >= new Date(config.startAt).getTime() &&
      now <= new Date(config.endAt).getTime()
    );
  }

  private async ensureRecoveryPeriodActive(actor: Actor) {
    if (actor.role === UserRole.SECRETARIA || actor.role === UserRole.SUPER_ADMIN) return;
    const active = await this.isRecoveryPeriodActive(actor);
    if (!active) {
      throw new BadRequestException('El periodo de recuperación está inactivo');
    }
  }

  private async ensureGroupViewAccess(
    actor: Actor,
    groupId: number,
  ) {
    if (actor.role !== UserRole.SUPER_ADMIN) {
      const groupInScope = await this.prisma.group.findFirst({
        where: {
          id: groupId,
          institutionId: this.getActorInstitutionId(actor),
        },
        select: { id: true },
      });
      if (!groupInScope) {
        throw new ForbiddenException('Grupo fuera de su institucion');
      }
    }

    if (actor.role === UserRole.SECRETARIA || actor.role === UserRole.SUPER_ADMIN) return;

    if (actor.role === UserRole.PROFESOR) {
      const isDirector = await this.prisma.group.findFirst({
        where: { id: groupId, directorId: actor.userId },
      });
      if (isDirector) return;

      const hasAssignment = await this.prisma.teacherAssignment.findFirst({
        where: { teacherId: actor.userId, groupId },
      });
      if (hasAssignment) return;
    }

    if (actor.role === UserRole.ESTUDIANTE) {
      const member = await this.prisma.studentGroup.findFirst({
        where: { studentId: actor.userId, groupId },
      });
      if (member) return;
    }

    throw new ForbiddenException('No autorizado para este grupo');
  }

  private async getRequestOrThrow(id: number) {
    const request = await this.prisma.recoveryRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, nombres: true, apellidos: true, email: true },
        },
        teacher: {
          select: { id: true, nombres: true, apellidos: true, email: true },
        },
        subject: { select: { id: true, nombre: true } },
        group: { select: { id: true, nombre: true, institutionId: true } },
      },
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');
    return request;
  }

  private async ensureRequestAccess(
    actor: Actor,
    requestId: number,
  ) {
    const request = await this.getRequestOrThrow(requestId);

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      request.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException('Solicitud fuera de su institucion');
    }

    if (actor.role === UserRole.SECRETARIA || actor.role === UserRole.SUPER_ADMIN) return request;
    if (actor.role === UserRole.PROFESOR && request.teacherId === actor.userId)
      return request;
    if (
      actor.role === UserRole.ESTUDIANTE &&
      request.studentId === actor.userId
    )
      return request;

    throw new ForbiddenException('No autorizado para esta solicitud');
  }

  private async getActivityOrThrow(id: number) {
    const activity = await this.prisma.recoveryActivity.findUnique({
      where: { id },
      include: { request: true },
    });

    if (!activity) throw new NotFoundException('Actividad no encontrada');
    return activity;
  }

  async createRequest(
    actor: Actor,
    dto: CreateRecoveryRequestDto,
  ) {
    await this.ensureRecoveryPeriodActive(actor);

    if (actor.role !== UserRole.ESTUDIANTE) {
      throw new ForbiddenException('Solo estudiantes pueden crear solicitudes');
    }

    const studentGroup = await this.prisma.studentGroup.findFirst({
      where: {
        studentId: actor.userId,
        group: {
          institutionId: this.getActorInstitutionId(actor),
          subjects: {
            some: { subjectId: dto.subjectId },
          },
        },
      },
      include: { group: true },
    });

    if (!studentGroup) {
      throw new BadRequestException(
        'El estudiante no tiene la materia asociada a ningún grupo',
      );
    }

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        groupId: studentGroup.groupId,
        subjectId: dto.subjectId,
        group: { institutionId: this.getActorInstitutionId(actor) },
      },
    });

    if (!assignment) {
      throw new BadRequestException(
        'No hay profesor asignado a la materia en el grupo',
      );
    }

    return this.prisma.recoveryRequest.create({
      data: {
        studentId: actor.userId,
        teacherId: assignment.teacherId,
        groupId: studentGroup.groupId,
        subjectId: dto.subjectId,
        type: dto.type,
        reason: dto.reason,
      },
      include: {
        subject: { select: { id: true, nombre: true } },
        group: { select: { id: true, nombre: true } },
      },
    });
  }

  async listMyRequests(actor: Actor) {
    if (actor.role !== UserRole.ESTUDIANTE)
      throw new ForbiddenException('Solo estudiantes');

    return this.prisma.recoveryRequest.findMany({
      where: {
        studentId: actor.userId,
        group: { institutionId: this.getActorInstitutionId(actor) },
      },
      include: {
        subject: { select: { id: true, nombre: true } },
        group: { select: { id: true, nombre: true } },
        teacher: { select: { id: true, nombres: true, apellidos: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async listGroupRequests(
    actor: Actor,
    groupId: number,
  ) {
    await this.ensureGroupViewAccess(actor, groupId);

    return this.prisma.recoveryRequest.findMany({
      where: {
        groupId,
        ...(actor.role === UserRole.PROFESOR
          ? { teacherId: actor.userId }
          : {}),
      },
      include: {
        student: { select: { id: true, nombres: true, apellidos: true } },
        subject: { select: { id: true, nombre: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async updateRequestStatus(
    actor: Actor,
    id: number,
    dto: UpdateRecoveryRequestStatusDto,
  ) {
    await this.ensureRecoveryPeriodActive(actor);

    const request = await this.getRequestOrThrow(id);

    if (
      actor.role === UserRole.PROFESOR &&
      request.teacherId !== actor.userId
    ) {
      throw new ForbiddenException(
        'Solo el profesor asignado puede responder la solicitud',
      );
    }

    if (
      actor.role !== UserRole.PROFESOR &&
      actor.role !== UserRole.SECRETARIA
    ) {
      throw new ForbiddenException('No autorizado');
    }

    if (
      dto.status === RecoveryRequestStatus.COMPLETED &&
      dto.finalScore == null
    ) {
      throw new BadRequestException(
        'Para completar la solicitud debes enviar finalScore',
      );
    }

    return this.prisma.recoveryRequest.update({
      where: { id },
      data: {
        status: dto.status,
        teacherComment: dto.teacherComment,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        finalScore: dto.finalScore,
        respondedAt:
          dto.status === RecoveryRequestStatus.APPROVED ||
          dto.status === RecoveryRequestStatus.REJECTED
            ? new Date()
            : request.respondedAt,
      },
    });
  }

  async listActivities(
    actor: Actor,
    requestId: number,
  ) {
    await this.ensureRequestAccess(actor, requestId);

    const activities = await this.prisma.recoveryActivity.findMany({
      where: { requestId },
      orderBy: { dueAt: 'asc' },
    });

    if (activities.length === 0) return [];

    const hasAttachmentList = await Promise.all(
      activities.map(async (item) => {
        const rows = await this.prisma.$queryRaw<{ activityId: number }[]>`
					SELECT "activityId"
					FROM "RecoveryActivityAttachment"
					WHERE "activityId" = ${item.id}
					LIMIT 1
				`;
        return { activityId: item.id, hasAttachment: rows.length > 0 };
      }),
    );

    const attachmentMap = new Map(
      hasAttachmentList.map((item) => [item.activityId, item.hasAttachment]),
    );

    return activities.map((item) => ({
      ...item,
      hasAttachment: attachmentMap.get(item.id) ?? false,
    }));
  }

  async createActivity(
    actor: Actor,
    requestId: number,
    dto: CreateRecoveryActivityDto,
  ) {
    await this.ensureRecoveryPeriodActive(actor);

    const request = await this.getRequestOrThrow(requestId);

    if (
      actor.role !== UserRole.PROFESOR ||
      request.teacherId !== actor.userId
    ) {
      throw new ForbiddenException(
        'Solo el profesor asignado puede crear actividades',
      );
    }

    if (request.status === RecoveryRequestStatus.REJECTED) {
      throw new BadRequestException(
        'No se pueden agregar actividades a una solicitud rechazada',
      );
    }

    if (
      dto.startAt &&
      new Date(dto.startAt).getTime() >= new Date(dto.dueAt).getTime()
    ) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha límite',
      );
    }

    return this.prisma.recoveryActivity.create({
      data: {
        requestId,
        teacherId: actor.userId,
        title: dto.title,
        description: dto.description,
        activityType: dto.activityType,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        dueAt: new Date(dto.dueAt),
        attachmentUrl: dto.attachmentUrl ?? null,
      },
    });
  }

  async updateActivity(
    actor: Actor,
    id: number,
    dto: UpdateRecoveryActivityDto,
  ) {
    await this.ensureRecoveryPeriodActive(actor);

    const activity = await this.getActivityOrThrow(id);
    if (
      actor.role !== UserRole.PROFESOR ||
      activity.teacherId !== actor.userId
    ) {
      throw new ForbiddenException(
        'Solo el profesor creador puede editar la actividad',
      );
    }

    if (dto.status === RecoveryActivityStatus.EVALUATED && dto.score == null) {
      throw new BadRequestException(
        'Para evaluar la actividad debes enviar score',
      );
    }

    return this.prisma.recoveryActivity.update({
      where: { id },
      data: {
        status: dto.status,
        score: dto.score,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        attachmentUrl: dto.attachmentUrl,
      },
    });
  }

  async deleteRequest(actor: Actor, id: number) {
    await this.ensureRecoveryPeriodActive(actor);

    const request = await this.getRequestOrThrow(id);

    if (actor.role === UserRole.SECRETARIA) {
      await this.prisma.recoveryRequest.delete({ where: { id } });
      return { id, deleted: true };
    }

    if (
      actor.role === UserRole.PROFESOR &&
      request.teacherId === actor.userId
    ) {
      await this.prisma.recoveryRequest.delete({ where: { id } });
      return { id, deleted: true };
    }

    if (
      actor.role === UserRole.ESTUDIANTE &&
      request.studentId === actor.userId &&
      request.status === RecoveryRequestStatus.PENDING
    ) {
      await this.prisma.recoveryRequest.delete({ where: { id } });
      return { id, deleted: true };
    }

    throw new ForbiddenException('No autorizado para eliminar esta solicitud');
  }

  async deleteActivity(actor: Actor, id: number) {
    await this.ensureRecoveryPeriodActive(actor);

    const activity = await this.getActivityOrThrow(id);

    if (
      actor.role !== UserRole.SECRETARIA &&
      !(actor.role === UserRole.PROFESOR && activity.teacherId === actor.userId)
    ) {
      throw new ForbiddenException(
        'No autorizado para eliminar esta actividad',
      );
    }

    await this.prisma.recoveryActivity.delete({ where: { id } });
    return { id, deleted: true };
  }

  async uploadActivityAttachment(
    actor: Actor,
    activityId: number,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<RecoveryActivityAttachmentMeta> {
    await this.ensureRecoveryPeriodActive(actor);

    if (!file?.buffer || !file.originalname || !file.mimetype) {
      throw new BadRequestException('Archivo inválido');
    }

    if (!ALLOWED_RECOVERY_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    if (file.buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo supera el límite de 10MB');
    }

    const activity = await this.getActivityOrThrow(activityId);
    if (
      actor.role !== UserRole.PROFESOR ||
      activity.teacherId !== actor.userId
    ) {
      throw new ForbiddenException(
        'Solo el profesor creador puede adjuntar archivos',
      );
    }

    await this.prisma.$executeRaw`
			INSERT INTO "RecoveryActivityAttachment"
				("activityId", "originalName", "mimeType", "fileContent", "uploadedById", "uploadedAt")
			VALUES
				(${activityId}, ${file.originalname}, ${file.mimetype}, ${file.buffer}, ${actor.userId}, NOW())
			ON CONFLICT ("activityId")
			DO UPDATE SET
				"originalName" = EXCLUDED."originalName",
				"mimeType" = EXCLUDED."mimeType",
				"fileContent" = EXCLUDED."fileContent",
				"uploadedById" = EXCLUDED."uploadedById",
				"uploadedAt" = NOW()
		`;

    const rows = await this.prisma.$queryRaw<RecoveryActivityAttachmentRow[]>`
			SELECT "activityId", "originalName", "mimeType", "fileContent", "uploadedAt"
			FROM "RecoveryActivityAttachment"
			WHERE "activityId" = ${activityId}
			LIMIT 1
		`;
    const saved = rows[0];
    if (!saved) {
      throw new NotFoundException('No se pudo guardar el adjunto');
    }

    return {
      activityId: saved.activityId,
      originalName: saved.originalName,
      mimeType: saved.mimeType,
      uploadedAt: saved.uploadedAt.toISOString(),
    };
  }

  async getActivityAttachment(
    actor: Actor,
    activityId: number,
  ): Promise<RecoveryActivityAttachmentRow> {
    const activity = await this.getActivityOrThrow(activityId);
    await this.ensureRequestAccess(actor, activity.requestId);

    const rows = await this.prisma.$queryRaw<RecoveryActivityAttachmentRow[]>`
			SELECT "activityId", "originalName", "mimeType", "fileContent", "uploadedAt"
			FROM "RecoveryActivityAttachment"
			WHERE "activityId" = ${activityId}
			LIMIT 1
		`;

    const attachment = rows[0];
    if (!attachment) {
      throw new NotFoundException('La actividad no tiene archivo adjunto');
    }

    return attachment;
  }

  async listMessages(
    actor: Actor,
    requestId: number,
  ) {
    await this.ensureRequestAccess(actor, requestId);

    return this.prisma.recoveryMessage.findMany({
      where: { requestId },
      include: {
        author: {
          select: { id: true, nombres: true, apellidos: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMessage(
    actor: Actor,
    requestId: number,
    dto: CreateRecoveryMessageDto,
  ) {
    await this.ensureRecoveryPeriodActive(actor);

    await this.ensureRequestAccess(actor, requestId);

    return this.prisma.recoveryMessage.create({
      data: {
        requestId,
        authorId: actor.userId,
        body: dto.body,
      },
      include: {
        author: {
          select: { id: true, nombres: true, apellidos: true, role: true },
        },
      },
    });
  }

  async statsByGroup(
    actor: Actor,
    groupId: number,
  ) {
    await this.ensureGroupViewAccess(actor, groupId);

    const where = {
      groupId,
      ...(actor.role === UserRole.PROFESOR ? { teacherId: actor.userId } : {}),
    };

    const [total, byStatus, approvedOrCompleted] = await Promise.all([
      this.prisma.recoveryRequest.count({ where }),
      this.prisma.recoveryRequest.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.recoveryRequest.count({
        where: {
          ...where,
          status: {
            in: [
              RecoveryRequestStatus.APPROVED,
              RecoveryRequestStatus.COMPLETED,
            ],
          },
        },
      }),
    ]);

    const statusBreakdown = byStatus.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      },
      {},
    );

    return {
      groupId,
      total,
      statusBreakdown,
      approvalRate:
        total === 0
          ? 0
          : Number(((approvedOrCompleted / total) * 100).toFixed(2)),
    };
  }

  async statsByStudent(
    actor: Actor,
    studentId: number,
  ) {
    if (actor.role === UserRole.ESTUDIANTE && actor.userId !== studentId) {
      throw new ForbiddenException('No autorizado');
    }

    if (actor.role === UserRole.PROFESOR) {
      const linked = await this.prisma.recoveryRequest.count({
        where: {
          studentId,
          teacherId: actor.userId,
          group: { institutionId: this.getActorInstitutionId(actor) },
        },
      });
      if (linked === 0) throw new ForbiddenException('No autorizado');
    }

    if (actor.role === UserRole.SECRETARIA) {
      const linked = await this.prisma.recoveryRequest.count({
        where: {
          studentId,
          group: { institutionId: this.getActorInstitutionId(actor) },
        },
      });
      if (linked === 0) throw new ForbiddenException('No autorizado');
    }

    const [total, byStatus, avgFinalScore] = await Promise.all([
      this.prisma.recoveryRequest.count({
        where: {
          studentId,
          ...(actor.role === UserRole.SUPER_ADMIN
            ? {}
            : { group: { institutionId: this.getActorInstitutionId(actor) } }),
        },
      }),
      this.prisma.recoveryRequest.groupBy({
        by: ['status'],
        where: {
          studentId,
          ...(actor.role === UserRole.SUPER_ADMIN
            ? {}
            : { group: { institutionId: this.getActorInstitutionId(actor) } }),
        },
        _count: { _all: true },
      }),
      this.prisma.recoveryRequest.aggregate({
        where: {
          studentId,
          finalScore: { not: null },
          ...(actor.role === UserRole.SUPER_ADMIN
            ? {}
            : { group: { institutionId: this.getActorInstitutionId(actor) } }),
        },
        _avg: { finalScore: true },
      }),
    ]);

    const statusBreakdown = byStatus.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      },
      {},
    );

    return {
      studentId,
      total,
      statusBreakdown,
      avgFinalScore: avgFinalScore._avg.finalScore ?? null,
    };
  }
}
