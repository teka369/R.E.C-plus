import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FeedbackEstado as PrismaFeedbackEstado,
  FeedbackTipo as PrismaFeedbackTipo,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { SendMessageDto } from './dto/message.dto';
import { CreateNotificationDto } from './dto/notification.dto';
import { ActivityFeedItemDto } from './dto/activity-feed-item.dto';
import { UserRole } from '../users/dto/user-role.enum';
import { Actor } from '../common/tenant';
import { TenantScopedService } from '../common/tenant-scoped.service';
import { AppGatewayService } from '../gateway/app-gateway.service';
import {
  PaginationQuery,
  paginateParams,
  buildPaginatedResult,
  PaginatedResult,
} from '../common/dto/pagination.dto';
import { FirebaseAdminService } from '../services/firebase-admin.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CommunicationService extends TenantScopedService {
  constructor(
    private prisma: PrismaService,
    private readonly appGatewayService: AppGatewayService,
    private readonly usersService: UsersService,
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
      await this.pushToUser(userId, title, body, type);
    } catch {
      /* best-effort */
    }
  }

  private async pushToUser(
    userId: number,
    title: string,
    body: string,
    type: string,
  ) {
    try {
      const tokens = await this.usersService.getPushTokensByUser(userId);
      await this.firebaseAdmin.sendToTokens(tokens, title, body, { type });
    } catch {
      /* best-effort */
    }
  }

  private async pushToGroup(
    groupId: number,
    title: string,
    body: string,
    type: string,
  ) {
    try {
      const students = await this.prisma.studentGroup.findMany({
        where: { groupId, status: 'ACTIVE' },
        select: { studentId: true },
      });
      await Promise.all(
        students.map((s) => this.pushToUser(s.studentId, title, body, type)),
      );
    } catch {
      /* best-effort */
    }
  }

  // Feedback
  async createFeedback(dto: CreateFeedbackDto, actor: Actor) {
    if (actor.role !== UserRole.PROFESOR) {
      throw new ForbiddenException('Solo profesores pueden crear feedback');
    }
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        teacherId: actor.userId,
        groupId: dto.groupId,
        group: { institutionId: this.getActorInstitutionId(actor) },
        ...(dto.subjectId ? { subjectId: dto.subjectId } : {}),
      },
    });
    if (!assignment) {
      throw new ForbiddenException(
        'No puede crear feedback para este grupo/materia',
      );
    }

    // Validación cross-tenant: verificar que grupo pertenece a la institución del actor
    const group = await this.prisma.group.findFirst({
      where: {
        id: dto.groupId,
        institutionId: this.getActorInstitutionId(actor),
      },
      select: { id: true, institutionId: true },
    });
    if (!group) {
      throw new ForbiddenException('El grupo no pertenece a su institución');
    }

    const student = await this.prisma.user.findFirst({
      where: {
        id: dto.studentId,
        institutionId: this.getActorInstitutionId(actor),
        role: UserRole.ESTUDIANTE,
      },
      select: { id: true, institutionId: true },
    });
    if (!student) {
      throw new ForbiddenException(
        'El estudiante no pertenece a su institución',
      );
    }

    // Defensa en profundidad: verificar consistencia tenant grupo-estudiante
    if (group.institutionId !== student.institutionId) {
      throw new ForbiddenException(
        'Inconsistencia detectada: grupo y estudiante no pertenecen a la misma institución',
      );
    }

    const enrollment = await this.prisma.studentGroup.findFirst({
      where: {
        studentId: dto.studentId,
        groupId: dto.groupId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    if (!enrollment) {
      throw new ForbiddenException('El estudiante no está activo en ese grupo');
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        teacherId: actor.userId,
        studentId: dto.studentId,
        groupId: dto.groupId,
        subjectId: dto.subjectId ?? null,
        title: dto.title,
        content: dto.content,
        tipo: (dto.tipo ??
          PrismaFeedbackTipo.INFORMATIVA) as PrismaFeedbackTipo,
        estado: (dto.estado ??
          PrismaFeedbackEstado.PENDIENTE) as PrismaFeedbackEstado,
        feedbackStrengths: dto.strengths?.items?.length
          ? {
              create: dto.strengths.items.map((texto, i) => ({
                texto,
                orden: i,
              })),
            }
          : undefined,
        feedbackImprovements: dto.improvements?.items?.length
          ? {
              create: dto.improvements.items.map((texto, i) => ({
                texto,
                orden: i,
              })),
            }
          : undefined,
      },
      include: {
        feedbackStrengths: { orderBy: { orden: 'asc' } },
        feedbackImprovements: { orderBy: { orden: 'asc' } },
      },
    });
    await this.notify(
      dto.studentId,
      '⭐ Nuevo feedback de tu profesor',
      `Tu profesor dejó feedback: "${dto.title}".`,
      'FEEDBACK',
    );
    return {
      ...feedback,
      strengths: {
        items: (feedback.feedbackStrengths ?? []).map((x) => x.texto),
      },
      improvements: {
        items: (feedback.feedbackImprovements ?? []).map((x) => x.texto),
      },
    };
  }

  async updateFeedback(
    feedbackId: number,
    dto: UpdateFeedbackDto,
    actor: Actor,
  ) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: { group: { select: { institutionId: true } } },
    });
    if (!existing) throw new NotFoundException('Feedback no encontrado');

    // Validación tenant-first: verificar boundary antes de permisos
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      existing.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException('Feedback fuera de su institución');
    }

    // Validación de autoría: solo el profesor que creó el feedback puede editarlo
    if (existing.teacherId !== actor.userId) {
      throw new ForbiddenException('Solo el autor puede editar este feedback');
    }
    if (dto.strengths !== undefined) {
      await this.prisma.feedbackStrength.deleteMany({ where: { feedbackId } });
      if (dto.strengths.items.length > 0) {
        await this.prisma.feedbackStrength.createMany({
          data: dto.strengths.items.map((texto, i) => ({
            feedbackId,
            texto,
            orden: i,
          })),
        });
      }
    }
    if (dto.improvements !== undefined) {
      await this.prisma.feedbackImprovement.deleteMany({
        where: { feedbackId },
      });
      if (dto.improvements.items.length > 0) {
        await this.prisma.feedbackImprovement.createMany({
          data: dto.improvements.items.map((texto, i) => ({
            feedbackId,
            texto,
            orden: i,
          })),
        });
      }
    }
    const updated = await this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.tipo !== undefined
          ? { tipo: dto.tipo as PrismaFeedbackTipo }
          : {}),
        ...(dto.estado !== undefined
          ? { estado: dto.estado as PrismaFeedbackEstado }
          : {}),
      },
      include: {
        feedbackStrengths: { orderBy: { orden: 'asc' } },
        feedbackImprovements: { orderBy: { orden: 'asc' } },
      },
    });
    await this.notify(
      existing.studentId,
      '⭐ Feedback actualizado',
      `Tu profesor actualizó el feedback "${existing.title}".`,
      'FEEDBACK',
    );
    return {
      ...updated,
      strengths: {
        items: (updated.feedbackStrengths ?? []).map((x) => x.texto),
      },
      improvements: {
        items: (updated.feedbackImprovements ?? []).map((x) => x.texto),
      },
    };
  }

  async deleteFeedback(feedbackId: number, actor: Actor) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: { group: { select: { institutionId: true } } },
    });
    if (!existing) throw new NotFoundException('Feedback no encontrado');

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      existing.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException('Feedback fuera de su institucion');
    }

    if (
      existing.teacherId !== actor.userId &&
      actor.role !== UserRole.SECRETARIA &&
      actor.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('No autorizado para eliminar este feedback');
    }
    await this.prisma.feedback.delete({ where: { id: feedbackId } });
    return { deleted: true };
  }

  async listFeedbackByGroup(
    groupId: number,
    actor: Actor,
    pagination: PaginationQuery = {},
  ) {
    const { skip, take, page, limit } = paginateParams(pagination);
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      const where = {
        groupId,
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { group: { institutionId: this.getActorInstitutionId(actor) } }),
      };
      const [data, total] = await Promise.all([
        this.prisma.feedback.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            feedbackStrengths: { orderBy: { orden: 'asc' } },
            feedbackImprovements: { orderBy: { orden: 'asc' } },
          },
          skip,
          take,
        }),
        this.prisma.feedback.count({ where }),
      ]);
      return buildPaginatedResult(
        data.map((fb) => ({
          ...fb,
          strengths: {
            items: (fb.feedbackStrengths ?? []).map((x) => x.texto),
          },
          improvements: {
            items: (fb.feedbackImprovements ?? []).map((x) => x.texto),
          },
        })),
        total,
        page,
        limit,
      );
    }
    if (actor.role === UserRole.PROFESOR) {
      const teaches = await this.prisma.teacherAssignment.findFirst({
        where: {
          teacherId: actor.userId,
          groupId,
          group: { institutionId: this.getActorInstitutionId(actor) },
        },
      });
      if (!teaches) throw new ForbiddenException('No enseña en este grupo');
      const where = {
        groupId,
        group: { institutionId: this.getActorInstitutionId(actor) },
      };
      const [data, total] = await Promise.all([
        this.prisma.feedback.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            feedbackStrengths: { orderBy: { orden: 'asc' } },
            feedbackImprovements: { orderBy: { orden: 'asc' } },
          },
          skip,
          take,
        }),
        this.prisma.feedback.count({ where }),
      ]);
      return buildPaginatedResult(
        data.map((fb) => ({
          ...fb,
          strengths: {
            items: (fb.feedbackStrengths ?? []).map((x) => x.texto),
          },
          improvements: {
            items: (fb.feedbackImprovements ?? []).map((x) => x.texto),
          },
        })),
        total,
        page,
        limit,
      );
    }
    throw new ForbiddenException('No autorizado');
  }

  async listFeedbackByStudent(
    studentId: number,
    actor: Actor,
    pagination: PaginationQuery = {},
  ) {
    const { skip, take, page, limit } = paginateParams(pagination);
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN ||
      actor.userId === studentId
    ) {
      const where = {
        studentId,
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { group: { institutionId: this.getActorInstitutionId(actor) } }),
      };
      const [data, total] = await Promise.all([
        this.prisma.feedback.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            feedbackStrengths: { orderBy: { orden: 'asc' } },
            feedbackImprovements: { orderBy: { orden: 'asc' } },
          },
          skip,
          take,
        }),
        this.prisma.feedback.count({ where }),
      ]);
      return buildPaginatedResult(
        data.map((fb) => ({
          ...fb,
          strengths: {
            items: (fb.feedbackStrengths ?? []).map((x) => x.texto),
          },
          improvements: {
            items: (fb.feedbackImprovements ?? []).map((x) => x.texto),
          },
        })),
        total,
        page,
        limit,
      );
    }
    // Profesor: solo puede ver feedback de grupos donde efectivamente enseña.
    const studentGroups = await this.prisma.studentGroup.findMany({
      where: {
        studentId,
        group: { institutionId: this.getActorInstitutionId(actor) },
      },
      select: { groupId: true },
    });
    const groupIds = studentGroups.map((g) => g.groupId);
    if (groupIds.length === 0) {
      return buildPaginatedResult([], 0, page, limit);
    }
    const teacherGroups = await this.prisma.teacherAssignment.findMany({
      where: { teacherId: actor.userId, groupId: { in: groupIds } },
      select: { groupId: true },
    });
    const allowedGroupIds = teacherGroups.map((row) => row.groupId);
    if (allowedGroupIds.length === 0) {
      throw new ForbiddenException(
        'No autorizado para ver feedback de este estudiante',
      );
    }
    const where = { studentId, groupId: { in: allowedGroupIds } };
    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.feedback.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  // Mensajes
  async sendMessage(dto: SendMessageDto, actor: Actor) {
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
      select: { id: true, institutionId: true },
    });
    if (!recipient) throw new NotFoundException('Destinatario no encontrado');

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      recipient.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException(
        'No autorizado para mensajeria entre instituciones',
      );
    }

    // Ignorar senderId del payload y usar el actor
    const message = await this.prisma.message.create({
      data: {
        senderId: actor.userId,
        recipientId: dto.recipientId,
        content: dto.content,
      },
    });
    await this.notify(
      dto.recipientId,
      '💬 Nuevo mensaje',
      `Tienes un nuevo mensaje en Recedu.`,
      'MESSAGE',
    );
    return message;
  }

  async inbox(
    actor: Actor,
    pagination?: PaginationQuery,
  ): Promise<PaginatedResult<object>> {
    const where = {
      recipientId: actor.userId,
      ...(actor.role === UserRole.SUPER_ADMIN
        ? {}
        : {
            recipient: { institutionId: this.getActorInstitutionId(actor) },
          }),
    };
    const { skip, take, page, limit } = paginateParams(pagination ?? {});
    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  async sent(
    actor: Actor,
    pagination?: PaginationQuery,
  ): Promise<PaginatedResult<object>> {
    const where = {
      senderId: actor.userId,
      ...(actor.role === UserRole.SUPER_ADMIN
        ? {}
        : { sender: { institutionId: this.getActorInstitutionId(actor) } }),
    };
    const { skip, take, page, limit } = paginateParams(pagination ?? {});
    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  async markMessageRead(messageId: number, actor: Actor) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!msg) throw new NotFoundException('Mensaje no encontrado');
    if (msg.recipientId !== actor.userId)
      throw new ForbiddenException(
        'Solo el destinatario puede marcar como leído',
      );
    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }

  // Notificaciones
  async getActivityFeed(
    actor: Actor,
    limit: number,
  ): Promise<ActivityFeedItemDto[]> {
    const institutionId = this.getActorInstitutionId(actor);

    const [students, teacherAssignments, groups, recoveries] = await Promise.all([
      this.prisma.user.findMany({
        where: { institutionId, role: UserRole.ESTUDIANTE },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, nombres: true, apellidos: true, createdAt: true },
      }),
      this.prisma.teacherAssignment.findMany({
        where: { group: { institutionId } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          teacher: { select: { nombres: true, apellidos: true } },
          group: { select: { nombre: true } },
          subject: { select: { nombre: true } },
        },
      }),
      this.prisma.group.findMany({
        where: { institutionId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, nombre: true, createdAt: true },
      }),
      this.prisma.recoveryRequest.findMany({
        where: { group: { institutionId } },
        orderBy: { requestedAt: 'desc' },
        take: limit,
        include: {
          student: { select: { nombres: true, apellidos: true } },
          subject: { select: { nombre: true } },
        },
      }),
    ]);

    const studentItems: ActivityFeedItemDto[] = students.map((student) => ({
      type: 'STUDENT_ENROLLED',
      description: `Estudiante ${student.nombres} ${student.apellidos} matriculado`,
      date: student.createdAt.toISOString(),
      href: `/secretaria/estudiantes/${student.id}`,
    }));

    const teacherAssignmentItems: ActivityFeedItemDto[] = teacherAssignments.map(
      (assignment) => ({
        type: 'TEACHER_ASSIGNED',
        description: `${assignment.teacher.nombres} ${assignment.teacher.apellidos} asignado a ${assignment.group.nombre} — ${assignment.subject.nombre}`,
        date: assignment.createdAt.toISOString(),
        href: '/secretaria/docentes',
      }),
    );

    const groupItems: ActivityFeedItemDto[] = groups.map((group) => ({
      type: 'GROUP_CREATED',
      description: `Grupo ${group.nombre} creado`,
      date: group.createdAt.toISOString(),
      href: '/secretaria/academico?tab=resumen',
    }));

    const recoveryItems: ActivityFeedItemDto[] = recoveries.map((recovery) => ({
      type: 'RECOVERY_REQUESTED',
      description: `Recuperación de ${recovery.student.nombres} ${recovery.student.apellidos} en ${recovery.subject.nombre}`,
      date: recovery.requestedAt.toISOString(),
      href: '/secretaria/recuperaciones',
    }));

    return [
      ...studentItems,
      ...teacherAssignmentItems,
      ...groupItems,
      ...recoveryItems,
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async listNotifications(
    actor: Actor,
    pagination?: PaginationQuery,
  ): Promise<PaginatedResult<object>> {
    const where = {
      userId: actor.userId,
      ...(actor.role === UserRole.SUPER_ADMIN
        ? {}
        : { user: { institutionId: this.getActorInstitutionId(actor) } }),
    };
    const { skip, take, page, limit } = paginateParams(pagination ?? {});
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  async createNotification(dto: CreateNotificationDto, actor: Actor) {
    if (
      actor.role !== UserRole.SECRETARIA &&
      actor.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Solo SECRETARIA puede crear notificaciones',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, institutionId: true },
    });
    if (!target) throw new NotFoundException('Usuario destino no encontrado');

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      target.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException(
        'No autorizado para crear notificaciones cruzadas',
      );
    }

    const saved = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        type: dto.type ?? undefined,
      },
    });
    if (saved.userId) {
      this.appGatewayService.emitToUser(saved.userId, 'notification:new', saved);
    } else {
      this.appGatewayService.emitToTenant(
        this.getActorInstitutionId(actor),
        'notification:new',
        saved,
      );
    }
    return saved;
  }

  async markNotificationRead(notificationId: number, actor: Actor) {
    const notif = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notif) throw new NotFoundException('Notificación no encontrada');
    if (notif.userId !== actor.userId)
      throw new ForbiddenException('No autorizado');
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
}
