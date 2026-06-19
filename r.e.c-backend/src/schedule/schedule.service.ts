import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';
import {
  CreateScheduleEntryDto,
  UpdateScheduleEntryDto,
} from './dto/entry.dto';
import { CreateScheduleNoteDto, UpdateScheduleNoteDto } from './dto/note.dto';
import {
  CreateScheduleEventDto,
  UpdateScheduleEventDto,
} from './dto/event.dto';
import { EnrollmentStatus, Prisma } from '@prisma/client';

import { Actor } from '../common/tenant';
import { TenantScopedService } from '../common/tenant-scoped.service';
import { AppGatewayService } from '../gateway/app-gateway.service';
import { FirebaseAdminService } from '../services/firebase-admin.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ScheduleService extends TenantScopedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appGatewayService: AppGatewayService,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly usersService: UsersService,
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
      // Push notification para cuando la app está cerrada
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

  private async ensureGroupInScope(actor: Actor, groupId: number) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true },
      });
      if (!group) throw new NotFoundException('Grupo no encontrado');
      return;
    }

    const group = await this.prisma.group.findFirst({
      where: { id: groupId, institutionId: this.getActorInstitutionId(actor) },
      select: { id: true },
    });
    if (!group) throw new ForbiddenException('Grupo fuera de su institucion');
  }

  private async ensureViewAccess(actor: Actor, groupId: number) {
    await this.ensureGroupInScope(actor, groupId);

    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    )
      return;
    if (actor.role === UserRole.PROFESOR) {
      const isDirector = await this.prisma.group.findFirst({
        where: {
          id: groupId,
          directorId: actor.userId,
          institutionId: this.getActorInstitutionId(actor),
        },
      });
      if (isDirector) return;
      const assign = await this.prisma.teacherAssignment.findFirst({
        where: {
          teacherId: actor.userId,
          groupId,
          group: { institutionId: this.getActorInstitutionId(actor) },
        },
      });
      if (!assign)
        throw new ForbiddenException('No autorizado a ver este grupo');
      return;
    }
    // Estudiante debe pertenecer al grupo
    const sg = await this.prisma.studentGroup.findFirst({
      where: {
        groupId,
        studentId: actor.userId,
        group: { institutionId: this.getActorInstitutionId(actor) },
      },
    });
    if (!sg) throw new ForbiddenException('No autorizado');
  }

  private async ensureManageAccess(actor: Actor, groupId: number) {
    await this.ensureGroupInScope(actor, groupId);

    if (actor.role !== UserRole.PROFESOR)
      throw new ForbiddenException('Solo profesores');
    const isDirector = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        directorId: actor.userId,
        institutionId: this.getActorInstitutionId(actor),
      },
    });
    if (!isDirector)
      throw new ForbiddenException(
        'Solo el director del grupo puede gestionar',
      );
  }

  // Entries
  async listEntries(actor: Actor, groupId: number) {
    await this.ensureViewAccess(actor, groupId);
    return this.prisma.weeklyScheduleEntry.findMany({
      where: { groupId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  async createEntry(
    actor: Actor,
    groupId: number,
    dto: CreateScheduleEntryDto,
  ) {
    await this.ensureManageAccess(actor, groupId);
    if (dto.endMinutes <= dto.startMinutes)
      throw new BadRequestException('Rango de tiempo inválido');
    // Si subjectId presente, validar que la materia pertenezca al grupo
    if (dto.subjectId) {
      const gs = await this.prisma.groupSubject.findUnique({
        where: { groupId_subjectId: { groupId, subjectId: dto.subjectId } },
      });
      if (!gs)
        throw new BadRequestException('La materia no pertenece al grupo');
    }
    const created = await this.prisma.weeklyScheduleEntry.create({
      data: {
        groupId,
        teacherId: actor.userId,
        dayOfWeek: dto.dayOfWeek,
        startMinutes: dto.startMinutes,
        endMinutes: dto.endMinutes,
        title: dto.title ?? null,
        subjectId: dto.subjectId ?? null,
        location: dto.location ?? null,
      },
    });
    await this.notifyGroup(
      groupId,
      '🗓️ Nueva clase en tu horario',
      `Se agregó una nueva clase a tu horario semanal.`,
      'SCHEDULE',
    );
    return created;
  }

  async updateEntry(actor: Actor, id: number, dto: UpdateScheduleEntryDto) {
    const entry = await this.prisma.weeklyScheduleEntry.findUnique({
      where: { id },
    });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    await this.ensureManageAccess(actor, entry.groupId);
    if (
      dto.startMinutes != null &&
      dto.endMinutes != null &&
      dto.endMinutes <= dto.startMinutes
    ) {
      throw new BadRequestException('Rango de tiempo inválido');
    }
    if (dto.subjectId) {
      const gs = await this.prisma.groupSubject.findUnique({
        where: {
          groupId_subjectId: {
            groupId: entry.groupId,
            subjectId: dto.subjectId,
          },
        },
      });
      if (!gs)
        throw new BadRequestException('La materia no pertenece al grupo');
    }
    const updated = await this.prisma.weeklyScheduleEntry.update({
      where: { id },
      data: {
        dayOfWeek: dto.dayOfWeek ?? undefined,
        startMinutes: dto.startMinutes ?? undefined,
        endMinutes: dto.endMinutes ?? undefined,
        title: dto.title ?? undefined,
        subjectId: dto.subjectId ?? undefined,
        location: dto.location ?? undefined,
      },
    });
    await this.notifyGroup(
      entry.groupId,
      '🗓️ Horario actualizado',
      `Una clase de tu horario fue modificada.`,
      'SCHEDULE',
    );
    return updated;
  }

  async deleteEntry(actor: Actor, id: number) {
    const entry = await this.prisma.weeklyScheduleEntry.findUnique({
      where: { id },
    });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    await this.ensureManageAccess(actor, entry.groupId);
    await this.notifyGroup(
      entry.groupId,
      '🗓️ Clase eliminada del horario',
      `Una clase fue eliminada de tu horario semanal.`,
      'SCHEDULE',
    );
    await this.prisma.weeklyScheduleEntry.delete({ where: { id } });
    return { deleted: true };
  }

  // Notes
  async listNotes(actor: Actor, groupId: number) {
    await this.ensureViewAccess(actor, groupId);
    return this.prisma.scheduleNote.findMany({
      where: { groupId },
      orderBy: { id: 'desc' },
    });
  }

  async createNote(actor: Actor, groupId: number, dto: CreateScheduleNoteDto) {
    await this.ensureManageAccess(actor, groupId);
    return this.prisma.scheduleNote.create({
      data: { groupId, teacherId: actor.userId, content: dto.content },
    });
  }

  async updateNote(actor: Actor, id: number, dto: UpdateScheduleNoteDto) {
    const note = await this.prisma.scheduleNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Nota no encontrada');
    await this.ensureManageAccess(actor, note.groupId);
    return this.prisma.scheduleNote.update({
      where: { id },
      data: { content: dto.content ?? undefined },
    });
  }

  async deleteNote(actor: Actor, id: number) {
    const note = await this.prisma.scheduleNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Nota no encontrada');
    await this.ensureManageAccess(actor, note.groupId);
    await this.prisma.scheduleNote.delete({ where: { id } });
    return { deleted: true };
  }

  // Events
  async listEvents(
    actor: Actor,
    groupId: number,
    startAt?: string,
    endAt?: string,
  ) {
    await this.ensureViewAccess(actor, groupId);
    const where: Prisma.ScheduleEventWhereInput = { groupId };
    if (startAt) {
      where.startAt = { gte: new Date(startAt) };
    }
    if (endAt) {
      where.endAt = { lte: new Date(endAt) };
    }
    return this.prisma.scheduleEvent.findMany({
      where,
      orderBy: { startAt: 'asc' },
    });
  }

  async createEvent(
    actor: Actor,
    groupId: number,
    dto: CreateScheduleEventDto,
  ) {
    await this.ensureManageAccess(actor, groupId);
    if (new Date(dto.endAt).getTime() <= new Date(dto.startAt).getTime()) {
      throw new BadRequestException('La fecha fin debe ser posterior a inicio');
    }
    const created = await this.prisma.scheduleEvent.create({
      data: {
        groupId,
        teacherId: actor.userId,
        title: dto.title,
        description: dto.description ?? null,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        location: dto.location ?? null,
      },
    });
    await this.notifyGroup(
      groupId,
      '📅 Nuevo evento institucional',
      `Nuevo evento: "${dto.title ?? 'Evento'}" fue agregado a tu calendario.`,
      'SCHEDULE',
    );
    return created;
  }

  async updateEvent(actor: Actor, id: number, dto: UpdateScheduleEventDto) {
    const ev = await this.prisma.scheduleEvent.findUnique({ where: { id } });
    if (!ev) throw new NotFoundException('Evento no encontrado');
    await this.ensureManageAccess(actor, ev.groupId);
    if (dto.startAt && dto.endAt) {
      if (new Date(dto.endAt).getTime() <= new Date(dto.startAt).getTime()) {
        throw new BadRequestException(
          'La fecha fin debe ser posterior a inicio',
        );
      }
    }
    const updated = await this.prisma.scheduleEvent.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        location: dto.location ?? undefined,
      },
    });
    await this.notifyGroup(
      ev.groupId,
      '📅 Evento actualizado',
      `El evento "${updated.title}" fue modificado.`,
      'SCHEDULE',
    );
    return updated;
  }

  async deleteEvent(actor: Actor, id: number) {
    const ev = await this.prisma.scheduleEvent.findUnique({ where: { id } });
    if (!ev) throw new NotFoundException('Evento no encontrado');
    await this.ensureManageAccess(actor, ev.groupId);
    await this.notifyGroup(
      ev.groupId,
      '📅 Evento cancelado',
      `El evento "${ev.title}" fue cancelado.`,
      'SCHEDULE',
    );
    await this.prisma.scheduleEvent.delete({ where: { id } });
    return { deleted: true };
  }
}
