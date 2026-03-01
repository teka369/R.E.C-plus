import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { SendMessageDto } from './dto/message.dto';
import { CreateNotificationDto } from './dto/notification.dto';
import { UserRole } from '../users/dto/user-role.enum';

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

  // Feedback
  async createFeedback(
    dto: CreateFeedbackDto,
    actor: { userId: number; role: UserRole },
  ) {
    if (actor.role !== UserRole.PROFESOR) {
      throw new ForbiddenException('Solo profesores pueden crear feedback');
    }
    // Validar que el profesor enseña al grupo indicado
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        teacherId: actor.userId,
        groupId: dto.groupId,
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
        teacherId: actor.userId, // Ignorar teacherId del payload por seguridad
        studentId: dto.studentId,
        groupId: dto.groupId,
        subjectId: dto.subjectId ?? null,
        title: dto.title,
        content: dto.content,
        strengths: dto.strengths ? { items: dto.strengths.items } : undefined,
        improvements: dto.improvements
          ? { items: dto.improvements.items }
          : undefined,
      },
    });
    return feedback;
  }

  async listFeedbackByStudent(
    studentId: number,
    actor: { userId: number; role: UserRole },
  ) {
    if (actor.role === UserRole.SECRETARIA || actor.userId === studentId) {
      return this.prisma.feedback.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      });
    }
    // Profesor: validar que enseña al menos en uno de los grupos del estudiante
    const studentGroups = await this.prisma.studentGroup.findMany({
      where: { studentId },
    });
    const groupIds = studentGroups.map((g) => g.groupId);
    if (groupIds.length === 0) {
      return [];
    }
    const teaches = await this.prisma.teacherAssignment.findFirst({
      where: { teacherId: actor.userId, groupId: { in: groupIds } },
    });
    if (!teaches) {
      throw new ForbiddenException(
        'No autorizado para ver feedback de este estudiante',
      );
    }
    return this.prisma.feedback.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Mensajes
  async sendMessage(dto: SendMessageDto, actor: { userId: number }) {
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

  async inbox(actor: { userId: number }) {
    return this.prisma.message.findMany({
      where: { recipientId: actor.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sent(actor: { userId: number }) {
    return this.prisma.message.findMany({
      where: { senderId: actor.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markMessageRead(messageId: number, actor: { userId: number }) {
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
  async listNotifications(actor: { userId: number }) {
    return this.prisma.notification.findMany({
      where: { userId: actor.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNotification(
    dto: CreateNotificationDto,
    actor: { role: UserRole },
  ) {
    if (actor.role !== UserRole.SECRETARIA) {
      throw new ForbiddenException(
        'Solo SECRETARIA puede crear notificaciones',
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

  async markNotificationRead(
    notificationId: number,
    actor: { userId: number },
  ) {
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
