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
import { Prisma } from '@prisma/client';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureViewAccess(
    actor: { userId: number; role: UserRole },
    groupId: number,
  ) {
    if (actor.role === UserRole.SECRETARIA) return;
    if (actor.role === UserRole.PROFESOR) {
      const isDirector = await this.prisma.group.findFirst({
        where: { id: groupId, directorId: actor.userId },
      });
      if (isDirector) return;
      const assign = await this.prisma.teacherAssignment.findFirst({
        where: { teacherId: actor.userId, groupId },
      });
      if (!assign)
        throw new ForbiddenException('No autorizado a ver este grupo');
      return;
    }
    // Estudiante debe pertenecer al grupo
    const sg = await this.prisma.studentGroup.findFirst({
      where: { groupId, studentId: actor.userId },
    });
    if (!sg) throw new ForbiddenException('No autorizado');
  }

  private async ensureManageAccess(
    actor: { userId: number; role: UserRole },
    groupId: number,
  ) {
    if (actor.role !== UserRole.PROFESOR)
      throw new ForbiddenException('Solo profesores');
    const isDirector = await this.prisma.group.findFirst({
      where: { id: groupId, directorId: actor.userId },
    });
    if (!isDirector)
      throw new ForbiddenException(
        'Solo el director del grupo puede gestionar',
      );
  }

  // Entries
  async listEntries(
    actor: { userId: number; role: UserRole },
    groupId: number,
  ) {
    await this.ensureViewAccess(actor, groupId);
    return this.prisma.weeklyScheduleEntry.findMany({
      where: { groupId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  async createEntry(
    actor: { userId: number; role: UserRole },
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
    return this.prisma.weeklyScheduleEntry.create({
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
  }

  async updateEntry(
    actor: { userId: number; role: UserRole },
    id: number,
    dto: UpdateScheduleEntryDto,
  ) {
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
    return this.prisma.weeklyScheduleEntry.update({
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
  }

  async deleteEntry(actor: { userId: number; role: UserRole }, id: number) {
    const entry = await this.prisma.weeklyScheduleEntry.findUnique({
      where: { id },
    });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    await this.ensureManageAccess(actor, entry.groupId);
    await this.prisma.weeklyScheduleEntry.delete({ where: { id } });
    return { deleted: true };
  }

  // Notes
  async listNotes(actor: { userId: number; role: UserRole }, groupId: number) {
    await this.ensureViewAccess(actor, groupId);
    return this.prisma.scheduleNote.findMany({
      where: { groupId },
      orderBy: { id: 'desc' },
    });
  }

  async createNote(
    actor: { userId: number; role: UserRole },
    groupId: number,
    dto: CreateScheduleNoteDto,
  ) {
    await this.ensureManageAccess(actor, groupId);
    return this.prisma.scheduleNote.create({
      data: { groupId, teacherId: actor.userId, content: dto.content },
    });
  }

  async updateNote(
    actor: { userId: number; role: UserRole },
    id: number,
    dto: UpdateScheduleNoteDto,
  ) {
    const note = await this.prisma.scheduleNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Nota no encontrada');
    await this.ensureManageAccess(actor, note.groupId);
    return this.prisma.scheduleNote.update({
      where: { id },
      data: { content: dto.content ?? undefined },
    });
  }

  async deleteNote(actor: { userId: number; role: UserRole }, id: number) {
    const note = await this.prisma.scheduleNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Nota no encontrada');
    await this.ensureManageAccess(actor, note.groupId);
    await this.prisma.scheduleNote.delete({ where: { id } });
    return { deleted: true };
  }

  // Events
  async listEvents(
    actor: { userId: number; role: UserRole },
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
    actor: { userId: number; role: UserRole },
    groupId: number,
    dto: CreateScheduleEventDto,
  ) {
    await this.ensureManageAccess(actor, groupId);
    if (new Date(dto.endAt).getTime() <= new Date(dto.startAt).getTime()) {
      throw new BadRequestException('La fecha fin debe ser posterior a inicio');
    }
    return this.prisma.scheduleEvent.create({
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
  }

  async updateEvent(
    actor: { userId: number; role: UserRole },
    id: number,
    dto: UpdateScheduleEventDto,
  ) {
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
    return this.prisma.scheduleEvent.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        location: dto.location ?? undefined,
      },
    });
  }

  async deleteEvent(actor: { userId: number; role: UserRole }, id: number) {
    const ev = await this.prisma.scheduleEvent.findUnique({ where: { id } });
    if (!ev) throw new NotFoundException('Evento no encontrado');
    await this.ensureManageAccess(actor, ev.groupId);
    await this.prisma.scheduleEvent.delete({ where: { id } });
    return { deleted: true };
  }
}
