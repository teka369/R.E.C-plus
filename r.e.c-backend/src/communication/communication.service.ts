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
import { UserRole } from '../users/dto/user-role.enum';

type Actor = {
  userId: number;
  role: UserRole;
  institutionId?: number | null;
};

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

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
    });
    return feedback;
  }

  async updateFeedback(
    feedbackId: number,
    dto: UpdateFeedbackDto,
    actor: Actor,
  ) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
    if (!existing) throw new NotFoundException('Feedback no encontrado');
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
    return this.prisma.feedback.update({
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
    });
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

  async listFeedbackByGroup(groupId: number, actor: Actor) {
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      return this.prisma.feedback.findMany({
        where: {
          groupId,
          ...(actor.role === UserRole.SUPER_ADMIN
            ? {}
            : { group: { institutionId: this.getActorInstitutionId(actor) } }),
        },
        orderBy: { createdAt: 'desc' },
      });
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
      return this.prisma.feedback.findMany({
        where: {
          groupId,
          group: { institutionId: this.getActorInstitutionId(actor) },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    throw new ForbiddenException('No autorizado');
  }

  async listFeedbackByStudent(studentId: number, actor: Actor) {
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN ||
      actor.userId === studentId
    ) {
      return this.prisma.feedback.findMany({
        where: {
          studentId,
          ...(actor.role === UserRole.SUPER_ADMIN
            ? {}
            : { group: { institutionId: this.getActorInstitutionId(actor) } }),
        },
        orderBy: { createdAt: 'desc' },
      });
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
      return [];
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
    return this.prisma.feedback.findMany({
      where: { studentId, groupId: { in: allowedGroupIds } },
      orderBy: { createdAt: 'desc' },
    });
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
    return message;
  }

  async inbox(actor: Actor) {
    return this.prisma.message.findMany({
      where: {
        recipientId: actor.userId,
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : {
              recipient: { institutionId: this.getActorInstitutionId(actor) },
            }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sent(actor: Actor) {
    return this.prisma.message.findMany({
      where: {
        senderId: actor.userId,
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { sender: { institutionId: this.getActorInstitutionId(actor) } }),
      },
      orderBy: { createdAt: 'desc' },
    });
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
  async listNotifications(actor: Actor) {
    return this.prisma.notification.findMany({
      where: {
        userId: actor.userId,
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { user: { institutionId: this.getActorInstitutionId(actor) } }),
      },
      orderBy: { createdAt: 'desc' },
    });
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

    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        type: dto.type ?? undefined,
      },
    });
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
