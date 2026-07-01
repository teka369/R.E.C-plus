import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';
import {
  EnrollmentStatus,
  RecoveryActivityStatus,
  RecoveryRequestStatus,
} from '@prisma/client';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  CreateRecoveryActivityDto,
  CreateRecoveryMessageDto,
  CreateRecoveryRequestDto,
  UpdateRecoveryActivityDto,
  UpdateRecoveryRequestStatusDto,
} from './dto';
import {
  PaginationQuery,
  paginateParams,
  buildPaginatedResult,
  PaginatedResult,
} from '../common/dto/pagination.dto';

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

import { Actor } from '../common/tenant';
import { TenantScopedService } from '../common/tenant-scoped.service';
import { AppGatewayService } from '../gateway/app-gateway.service';
import { FirebaseAdminService } from '../services/firebase-admin.service';

@Injectable()
export class RecoveryService extends TenantScopedService {
  private readonly logger = new Logger(RecoveryService.name);
  private readonly uploadsRoot = path.join(
    process.cwd(),
    'uploads',
    'recovery',
  );

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AppGatewayService))
    private readonly appGatewayService: AppGatewayService,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {
    super();
  }

  private async notify(
    userId: number,
    title: string,
    body: string,
    type:
      | 'GENERAL'
      | 'MATERIAL'
      | 'PERFORMANCE'
      | 'SCHEDULE'
      | 'MESSAGE'
      | 'FEEDBACK',
  ) {
    try {
      const n = await this.prisma.notification.create({
        data: { userId, title, body, type },
      });
      this.appGatewayService.emitToUser(userId, 'notification:new', n);
      const tokens = await this.prisma.pushToken.findMany({
        where: { userId },
        select: { token: true },
      });
      if (tokens.length > 0) {
        await this.firebaseAdmin.sendToTokens(
          tokens.map((t) => t.token),
          title,
          body,
          { type },
        );
      }
    } catch {
      /* best-effort */
    }
  }

  private async notifyGroup(
    groupId: number,
    title: string,
    body: string,
    type:
      | 'GENERAL'
      | 'MATERIAL'
      | 'PERFORMANCE'
      | 'SCHEDULE'
      | 'MESSAGE'
      | 'FEEDBACK',
  ) {
    try {
      const students = await this.prisma.studentGroup.findMany({
        where: { groupId, status: EnrollmentStatus.ACTIVE },
        select: { studentId: true },
      });
      await Promise.all(
        students.map((s) => this.notify(s.studentId, title, body, type)),
      );
    } catch {
      /* best-effort */
    }
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
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    )
      return;
    const active = await this.isRecoveryPeriodActive(actor);
    if (!active) {
      throw new BadRequestException('El periodo de recuperación está inactivo');
    }
  }

  private async ensureGroupViewAccess(actor: Actor, groupId: number) {
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

    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    )
      return;

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

  private async ensureRequestAccess(actor: Actor, requestId: number) {
    const request = await this.getRequestOrThrow(requestId);

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      request.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException('Solicitud fuera de su institucion');
    }

    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    )
      return request;
    if (actor.role === UserRole.PROFESOR && request.teacherId === actor.userId)
      return request;
    if (
      actor.role === UserRole.ESTUDIANTE &&
      request.studentId === actor.userId
    )
      return request;

    throw new ForbiddenException('No autorizado para esta solicitud');
  }

  async assertRequestAccess(actor: Actor, requestId: number) {
    return this.ensureRequestAccess(actor, requestId);
  }

  buildRecoveryRoom(tenantId: number | null | undefined, requestId: number) {
    return `recovery-${tenantId ?? 'global'}-${requestId}`;
  }

  private async getActivityOrThrow(id: number) {
    const activity = await this.prisma.recoveryActivity.findUnique({
      where: { id },
      include: { request: true },
    });

    if (!activity) throw new NotFoundException('Actividad no encontrada');
    return activity;
  }

  async createRequest(actor: Actor, dto: CreateRecoveryRequestDto) {
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

    const created = await this.prisma.recoveryRequest.create({
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

    await this.notify(
      assignment.teacherId,
      '🩺 Nueva solicitud de recuperación',
      `Un estudiante solicitó recuperación en ${dto.subjectId ? 'la materia asignada' : 'tu grupo'}.`,
      'GENERAL',
    );

    return created;
  }

  async listMyRequests(
    actor: Actor,
    pagination?: PaginationQuery,
  ): Promise<PaginatedResult<object>> {
    if (actor.role !== UserRole.ESTUDIANTE)
      throw new ForbiddenException('Solo estudiantes');

    const where = {
      studentId: actor.userId,
      group: { institutionId: this.getActorInstitutionId(actor) },
    };
    const { skip, take, page, limit } = paginateParams(pagination ?? {});
    const include = {
      subject: { select: { id: true, nombre: true } },
      group: { select: { id: true, nombre: true } },
      teacher: { select: { id: true, nombres: true, apellidos: true } },
    };
    const [data, total] = await Promise.all([
      this.prisma.recoveryRequest.findMany({
        where,
        include,
        skip,
        take,
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.recoveryRequest.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  async listGroupRequests(
    actor: Actor,
    groupId: number,
    pagination?: PaginationQuery,
  ): Promise<PaginatedResult<object>> {
    await this.ensureGroupViewAccess(actor, groupId);

    const where = {
      groupId,
      ...(actor.role === UserRole.PROFESOR ? { teacherId: actor.userId } : {}),
    };
    const { skip, take, page, limit } = paginateParams(pagination ?? {});
    const include = {
      student: { select: { id: true, nombres: true, apellidos: true } },
      subject: { select: { id: true, nombre: true } },
    };
    const [data, total] = await Promise.all([
      this.prisma.recoveryRequest.findMany({
        where,
        include,
        skip,
        take,
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.recoveryRequest.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  async getPendingCount(actor: Actor): Promise<{ pending: number }> {
    if (
      actor.role !== UserRole.ESTUDIANTE &&
      actor.role !== UserRole.PROFESOR &&
      actor.role !== UserRole.SECRETARIA
    ) {
      return { pending: 0 };
    }

    const pendingWhere = {
      status: RecoveryRequestStatus.PENDING,
      deletedAt: null,
    } as const;

    if (actor.role === UserRole.ESTUDIANTE) {
      const pending = await this.prisma.recoveryRequest.count({
        where: { ...pendingWhere, studentId: actor.userId },
      });
      return { pending };
    }

    if (actor.role === UserRole.PROFESOR) {
      const pending = await this.prisma.recoveryRequest.count({
        where: { ...pendingWhere, teacherId: actor.userId },
      });
      return { pending };
    }

    const institutionId = this.getActorInstitutionId(actor);
    const pending = await this.prisma.recoveryRequest.count({
      where: {
        ...pendingWhere,
        group: { institutionId },
      },
    });
    return { pending };
  }

  async updateRequestStatus(
    actor: Actor,
    id: number,
    dto: UpdateRecoveryRequestStatusDto,
  ) {
    await this.ensureRecoveryPeriodActive(actor);

    const request = await this.ensureRequestAccess(actor, id);

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

    const updated = await this.prisma.recoveryRequest.update({
      where: { id },
      data: {
        status: dto.status,
        teacherComment: dto.teacherComment,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        finalScore: dto.finalScore,
        respondedAt:
          dto.status === RecoveryRequestStatus.APPROVED ||
          dto.status === RecoveryRequestStatus.REJECTED ||
          dto.status === RecoveryRequestStatus.COMPLETED
            ? new Date()
            : request.respondedAt,
      },
    });

    const statusMessages: Record<string, { title: string; body: string }> = {
      APPROVED: {
        title: '✅ Recuperación aprobada',
        body: 'Tu solicitud de recuperación fue aprobada por tu profesor.',
      },
      REJECTED: {
        title: '❌ Recuperación rechazada',
        body: 'Tu solicitud de recuperación fue rechazada.',
      },
      COMPLETED: {
        title: '🎓 Recuperación completada',
        body: 'Tu proceso de recuperación fue marcado como completado.',
      },
      PENDING: {
        title: '⏳ Recuperación en revisión',
        body: 'Tu solicitud de recuperación está siendo revisada.',
      },
    };
    const msg = statusMessages[dto.status];
    if (msg) {
      await this.notify(request.studentId, msg.title, msg.body, 'GENERAL');
    }

    return updated;
  }

  async listActivities(actor: Actor, requestId: number) {
    await this.ensureRequestAccess(actor, requestId);

    const activities = await this.prisma.recoveryActivity.findMany({
      where: { requestId },
      orderBy: { dueAt: 'asc' },
    });

    if (activities.length === 0) return [];

    // N+1 fix: una sola consulta para todas las actividades en lugar de una por actividad
    const activityIds = activities.map((a) => a.id);
    const attachmentsWithIds =
      await this.prisma.recoveryActivityAttachment.findMany({
        where: { activityId: { in: activityIds } },
        select: { activityId: true },
        distinct: ['activityId'],
      });
    const attachmentMap = new Map(
      attachmentsWithIds.map((a) => [a.activityId, true]),
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

    const created = await this.prisma.recoveryActivity.create({
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

    await this.notify(
      request.studentId,
      '📝 Nueva actividad de recuperación',
      `Tu profesor asignó una nueva actividad: "${dto.title ?? 'Actividad'}" para tu recuperación.`,
      'GENERAL',
    );

    return created;
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

    const updated = await this.prisma.recoveryActivity.update({
      where: { id },
      data: {
        status: dto.status,
        score: dto.score,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        attachmentUrl: dto.attachmentUrl,
      },
    });

    await this.notify(
      activity.request.studentId,
      '📝 Actividad actualizada',
      `La actividad de tu recuperación fue actualizada por tu profesor.`,
      'GENERAL',
    );

    return updated;
  }

  async deleteRequest(actor: Actor, id: number) {
    await this.ensureRecoveryPeriodActive(actor);

    const request = await this.ensureRequestAccess(actor, id);

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
      await this.notify(
        request.teacherId,
        '🗑️ Solicitud cancelada',
        `Un estudiante canceló su solicitud de recuperación.`,
        'GENERAL',
      );
      await this.prisma.recoveryRequest.delete({ where: { id } });
      return { id, deleted: true };
    }

    throw new ForbiddenException('No autorizado para eliminar esta solicitud');
  }

  async deleteActivity(actor: Actor, id: number) {
    await this.ensureRecoveryPeriodActive(actor);

    const activity = await this.getActivityOrThrow(id);
    const request = await this.ensureRequestAccess(actor, activity.requestId);

    if (
      actor.role !== UserRole.SECRETARIA &&
      !(
        actor.role === UserRole.PROFESOR &&
        activity.teacherId === actor.userId &&
        request.teacherId === actor.userId
      )
    ) {
      throw new ForbiddenException(
        'No autorizado para eliminar esta actividad',
      );
    }

    await this.notify(
      request.studentId,
      '🗑️ Actividad eliminada',
      `Una actividad de tu recuperación fue eliminada por tu profesor.`,
      'GENERAL',
    );

    await this.prisma.recoveryActivity.delete({ where: { id } });
    return { id, deleted: true };
  }

  async uploadActivityAttachment(
    actor: Actor,
    activityId: number,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<{
    activityId: number;
    originalName: string;
    mimeType: string;
    uploadedAt: string;
  }> {
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

    const ext = path.extname(file.originalname) || '';
    const safeName = `${randomUUID()}${ext}`;
    const relDir = `attachments/activity-${activityId}`;
    const absDir = path.join(this.uploadsRoot, relDir);
    await fs.mkdir(absDir, { recursive: true });

    const filePath = path.join(absDir, safeName);
    await fs.writeFile(filePath, file.buffer);
    const dbPath = path.join(relDir, safeName);

    const saved = await this.prisma.recoveryActivityAttachment.upsert({
      where: { activityId },
      create: {
        activityId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        filePath: dbPath,
        uploadedById: actor.userId,
      },
      update: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        filePath: dbPath,
        uploadedById: actor.userId,
        uploadedAt: new Date(),
      },
    });

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
  ): Promise<{
    activityId: number;
    originalName: string;
    mimeType: string;
    fileContent: Buffer;
    uploadedAt: Date;
  }> {
    const activity = await this.getActivityOrThrow(activityId);
    await this.ensureRequestAccess(actor, activity.requestId);

    const attachment = await this.prisma.recoveryActivityAttachment.findUnique({
      where: { activityId },
    });

    if (!attachment) {
      throw new NotFoundException('La actividad no tiene archivo adjunto');
    }

    const absPath = path.join(this.uploadsRoot, attachment.filePath);
    try {
      const fileContent = await fs.readFile(absPath);
      return {
        activityId: attachment.activityId,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        fileContent,
        uploadedAt: attachment.uploadedAt,
      };
    } catch {
      this.logger.error(`Archivo adjunto no encontrado en disco: ${absPath}`);
      throw new NotFoundException(
        'El archivo adjunto no se encuentra en el servidor',
      );
    }
  }

  async listMessages(actor: Actor, requestId: number) {
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

    const message = await this.prisma.recoveryMessage.create({
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

    const req = await this.prisma.recoveryRequest.findUnique({
      where: { id: requestId },
      select: { studentId: true, teacherId: true },
    });
    if (req) {
      const recipientId =
        actor.userId === req.studentId ? req.teacherId : req.studentId;
      const bodyShort =
        dto.body.length > 80 ? `${dto.body.slice(0, 77)}...` : dto.body;
      await this.notify(
        recipientId,
        '💬 Nuevo mensaje en recuperación',
        bodyShort,
        'MESSAGE',
      );
    }

    return message;
  }

  async statsByGroup(actor: Actor, groupId: number) {
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

  async statsByStudent(actor: Actor, studentId: number) {
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
