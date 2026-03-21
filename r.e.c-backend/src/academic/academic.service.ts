import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  AcademicPeriodType,
  EnrollmentStatus,
  EvaluacionTipo,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

// ─── Period interfaces ───────────────────────────────────────────────────────
interface CreateAcademicPeriodDto {
  nombre: string;
  codigo: string;
  tipo?: 'TERM' | 'RECOVERY' | 'INTERSESSION';
  fechaInicio: string;
  fechaFin: string;
  fechaCierre?: string;
}

interface UpdateAcademicPeriodDto {
  nombre?: string;
  codigo?: string;
  tipo?: 'TERM' | 'RECOVERY' | 'INTERSESSION';
  fechaInicio?: string;
  fechaFin?: string;
  fechaCierre?: string;
}

// ─── Evaluation interfaces ───────────────────────────────────────────────────
interface CreateAcademicEvaluationDto {
  titulo: string;
  tipo?: string;
  porcentaje?: number;
  orden?: number;
}

interface UpdateAcademicEvaluationDto {
  titulo?: string;
  tipo?: string;
  porcentaje?: number;
  orden?: number;
}

interface CreateGradeDto {
  nombre: string;
}

interface CreateGroupDto {
  nombre: string;
  gradeId: number;
}

interface CreateSubjectDto {
  nombre: string;
  codigo?: string;
}

interface AssignGroupSubjectDto {
  groupId: number;
  subjectId: number;
}

interface AssignStudentGroupDto {
  studentId: number;
  groupId: number;
}

interface AssignTeacherDto {
  teacherId: number;
  groupId: number;
  subjectId: number;
}

interface PromoteGradeDto {
  sourceGradeId: number;
  targetGradeId: number;
  mappings: {
    sourceGroupId: number;
    targetGroupId: number;
    repeatStudentIds: number[];
  }[];
}

type PromotionSummaryItem = {
  sourceGroupId: number;
  sourceGroupName?: string;
  targetGroupId: number;
  targetGroupName?: string;
  promotedCount: number;
  repeatCount: number;
  promotedStudentIds?: number[];
  repeatStudentIds?: number[];
  beforeCount?: number;
  afterCount?: number;
};

type Actor = {
  userId: number;
  role: UserRole;
  institutionId?: number | null;
};

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  private getActorInstitutionId(actor: Actor): number {
    if (actor.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Operacion no valida para SUPER_ADMIN sin contexto de institucion',
      );
    }
    if (!actor.institutionId) {
      throw new BadRequestException('Usuario sin institucion asociada');
    }
    return actor.institutionId;
  }

  private institutionWhere(actor: Actor): { institutionId?: number } {
    if (actor.role === UserRole.SUPER_ADMIN) return {};
    return { institutionId: this.getActorInstitutionId(actor) };
  }

  // Grados
  async createGrade(actor: Actor, dto: CreateGradeDto) {
    return this.prisma.grade.create({
      data: {
        institutionId: this.getActorInstitutionId(actor),
        nombre: dto.nombre,
      },
    });
  }

  async listGrades(actor: Actor) {
    return this.prisma.grade.findMany({
      where: this.institutionWhere(actor),
      include: { groups: true },
    });
  }

  async getGrade(actor: Actor, id: number) {
    const grade = await this.prisma.grade.findFirst({
      where: { id, ...this.institutionWhere(actor) },
      include: { groups: true },
    });
    if (!grade) throw new NotFoundException('Grado no encontrado');
    return grade;
  }

  async updateGrade(actor: Actor, id: number, dto: { nombre: string }) {
    await this.getGrade(actor, id);
    return this.prisma.grade.update({
      where: { id },
      data: { nombre: dto.nombre },
    });
  }

  async deleteGrade(actor: Actor, id: number) {
    await this.getGrade(actor, id);
    return this.prisma.grade.delete({ where: { id } });
  }

  // Grupos
  async createGroup(actor: Actor, dto: CreateGroupDto) {
    const grade = await this.prisma.grade.findFirst({
      where: { id: dto.gradeId, ...this.institutionWhere(actor) },
      select: { id: true, institutionId: true },
    });
    if (!grade) throw new BadRequestException('Grado no encontrado');

    return this.prisma.group.create({
      data: {
        institutionId: grade.institutionId,
        nombre: dto.nombre,
        gradeId: dto.gradeId,
      },
    });
  }

  async listGroups(actor: Actor) {
    return this.prisma.group.findMany({
      where: this.institutionWhere(actor),
      include: { grade: true, subjects: true },
    });
  }

  async getGroup(actor: Actor, id: number) {
    const group = await this.prisma.group.findFirst({
      where: { id, ...this.institutionWhere(actor) },
      include: { grade: true, subjects: true },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return group;
  }

  async updateGroup(
    actor: Actor,
    id: number,
    dto: { nombre?: string; gradeId?: number },
  ) {
    await this.getGroup(actor, id);

    if (dto.gradeId) {
      const grade = await this.prisma.grade.findFirst({
        where: { id: dto.gradeId, ...this.institutionWhere(actor) },
        select: { id: true },
      });
      if (!grade) throw new BadRequestException('Grado destino no encontrado');
    }

    return this.prisma.group.update({
      where: { id },
      data: {
        ...(dto.nombre ? { nombre: dto.nombre } : {}),
        ...(dto.gradeId ? { gradeId: dto.gradeId } : {}),
      },
    });
  }

  async deleteGroup(actor: Actor, id: number) {
    await this.getGroup(actor, id);
    return this.prisma.group.delete({ where: { id } });
  }

  // Materias
  async createSubject(actor: Actor, dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        institutionId: this.getActorInstitutionId(actor),
        nombre: dto.nombre,
        codigo: dto.codigo,
      },
    });
  }

  async listSubjects(actor: Actor) {
    return this.prisma.subject.findMany({
      where: this.institutionWhere(actor),
    });
  }

  async getSubject(actor: Actor, id: number) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, ...this.institutionWhere(actor) },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    return subject;
  }

  async updateSubject(
    actor: Actor,
    id: number,
    dto: { nombre?: string; codigo?: string },
  ) {
    await this.getSubject(actor, id);
    return this.prisma.subject.update({
      where: { id },
      data: {
        ...(dto.nombre ? { nombre: dto.nombre } : {}),
        ...(dto.codigo !== undefined ? { codigo: dto.codigo } : {}),
      },
    });
  }

  async deleteSubject(actor: Actor, id: number) {
    await this.getSubject(actor, id);
    return this.prisma.subject.delete({ where: { id } });
  }

  // Asignar materias a grupo
  async assignSubjectToGroup(actor: Actor, dto: AssignGroupSubjectDto) {
    await this.getGroup(actor, dto.groupId);
    await this.getSubject(actor, dto.subjectId);

    const gs = await this.prisma.groupSubject.upsert({
      where: {
        groupId_subjectId: { groupId: dto.groupId, subjectId: dto.subjectId },
      },
      update: { isActive: true },
      create: { groupId: dto.groupId, subjectId: dto.subjectId },
    });

    // Sincroniacion con AcademicOffering (best-effort, no rompe si falla)
    try {
      const activePeriod = await this.prisma.academicPeriod.findFirst({
        where: { estado: AcademicPeriodStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
      });
      if (activePeriod) {
        // Actualizar period en GroupSubject
        await this.prisma.groupSubject.update({
          where: { id: gs.id },
          data: { academicPeriodId: activePeriod.id },
        });
        const offering = await this.prisma.academicOffering.upsert({
          where: {
            groupId_subjectId_academicPeriodId: {
              groupId: dto.groupId,
              subjectId: dto.subjectId,
              academicPeriodId: activePeriod.id,
            },
          },
          update: { isActive: true, groupSubjectId: gs.id },
          create: {
            groupId: dto.groupId,
            subjectId: dto.subjectId,
            academicPeriodId: activePeriod.id,
            groupSubjectId: gs.id,
            isActive: true,
          },
        });
        return {
          ...gs,
          academicPeriodId: activePeriod.id,
          academicOfferingId: offering.id,
        };
      }
    } catch {
      // No critico: continuar sin enlazar
    }

    return gs;
  }

  async listGroupSubjects(actor: Actor, groupId: number) {
    await this.getGroup(actor, groupId);
    return this.prisma.groupSubject.findMany({
      where: { groupId },
      include: { subject: true },
    });
  }

  async deleteGroupSubject(actor: Actor, id: number) {
    const gs = await this.prisma.groupSubject.findUnique({
      where: { id },
      include: { group: { select: { institutionId: true } } },
    });
    if (!gs) throw new NotFoundException('Asignacion grupo-materia no encontrada');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      gs.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException('Asignacion fuera del alcance de su institucion');
    }
    return this.prisma.groupSubject.delete({ where: { id } });
  }

  // Asignar estudiante a grupo
  async assignStudentToGroup(actor: Actor, dto: AssignStudentGroupDto) {
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new BadRequestException('Estudiante no encontrado');
    if (student.role !== (UserRole.ESTUDIANTE as any))
      throw new BadRequestException('El usuario no es ESTUDIANTE');

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      student.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException('Estudiante fuera del alcance de su institucion');
    }

    const group = await this.prisma.group.findFirst({
      where: { id: dto.groupId, ...this.institutionWhere(actor) },
    });
    if (!group) throw new BadRequestException('Grupo no encontrado');

    // Resolver período académico activo (requerido — StudentGroup.academicPeriodId NOT NULL)
    const activePeriod = await this.prisma.academicPeriod.findFirst({
      where: {
        estado: AcademicPeriodStatus.ACTIVE,
        ...this.institutionWhere(actor),
      },
      select: { id: true },
    });
    if (!activePeriod)
      throw new BadRequestException('No hay período académico activo');

    // Verificar si ya existe una asignación previa
    const existing = await this.prisma.studentGroup.findFirst({
      where: { studentId: dto.studentId },
    });

    // Si ya está asignado al mismo grupo, devolver la asignación actual (idempotente)
    if (existing && existing.groupId === dto.groupId) {
      return existing;
    }

    // Si ya tiene otra asignación, no permitir reasignar sin eliminar primero
    if (existing && existing.groupId !== dto.groupId) {
      throw new BadRequestException(
        'El estudiante ya tiene un grupo asignado. Elimine la asignación antes de reasignar.',
      );
    }

    // Crear la asignación con el período activo
    return this.prisma.studentGroup.create({
      data: {
        studentId: dto.studentId,
        groupId: dto.groupId,
        academicPeriodId: activePeriod.id,
      },
    });
  }

  async listStudentSubjects(actor: Actor, studentId: number) {
    if (actor.role !== UserRole.SUPER_ADMIN && actor.userId !== studentId) {
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
        select: { institutionId: true },
      });
      if (!student || student.institutionId !== this.getActorInstitutionId(actor)) {
        throw new BadRequestException('Estudiante fuera del alcance de su institucion');
      }
    }

    const assignment = await this.prisma.studentGroup.findFirst({
      where: { studentId },
    });
    if (!assignment) return [];
    return this.prisma.groupSubject.findMany({
      where: { groupId: assignment.groupId },
      include: { subject: true },
    });
  }

  async getStudentGroup(actor: Actor, studentId: number) {
    if (actor.role !== UserRole.SUPER_ADMIN && actor.userId !== studentId) {
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
        select: { institutionId: true },
      });
      if (!student || student.institutionId !== this.getActorInstitutionId(actor)) {
        throw new BadRequestException('Estudiante fuera del alcance de su institucion');
      }
    }

    return this.prisma.studentGroup.findFirst({
      where: { studentId },
      include: { group: { include: { grade: true } } },
    });
  }

  async deleteStudentGroup(actor: Actor, studentId: number) {
    if (actor.role !== UserRole.SUPER_ADMIN) {
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
        select: { institutionId: true },
      });
      if (!student || student.institutionId !== this.getActorInstitutionId(actor)) {
        throw new BadRequestException('Estudiante fuera del alcance de su institucion');
      }
    }

    const res = await this.prisma.studentGroup.deleteMany({
      where: { studentId },
    });
    return { deleted: res.count };
  }

  // Asignar profesor a grupo y materia
  async assignTeacher(actor: Actor, dto: AssignTeacherDto) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
    });
    if (!teacher) throw new BadRequestException('Profesor no encontrado');
    if (teacher.role !== (UserRole.PROFESOR as any))
      throw new BadRequestException('El usuario no es PROFESOR');

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      teacher.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException('Profesor fuera del alcance de su institucion');
    }

    await this.getGroup(actor, dto.groupId);
    await this.getSubject(actor, dto.subjectId);

    const assignment = await this.prisma.teacherAssignment.upsert({
      where: {
        teacherId_groupId_subjectId: {
          teacherId: dto.teacherId,
          groupId: dto.groupId,
          subjectId: dto.subjectId,
        },
      },
      update: {},
      create: {
        teacherId: dto.teacherId,
        groupId: dto.groupId,
        subjectId: dto.subjectId,
      },
    });

    // Sincronizacion con AcademicOffering (best-effort, no rompe si falla)
    try {
      const activePeriod = await this.prisma.academicPeriod.findFirst({
        where: {
          estado: AcademicPeriodStatus.ACTIVE,
          ...this.institutionWhere(actor),
        },
        orderBy: { createdAt: 'desc' },
      });
      if (activePeriod) {
        const offering = await this.prisma.academicOffering.upsert({
          where: {
            groupId_subjectId_academicPeriodId: {
              groupId: dto.groupId,
              subjectId: dto.subjectId,
              academicPeriodId: activePeriod.id,
            },
          },
          update: {},
          create: {
            groupId: dto.groupId,
            subjectId: dto.subjectId,
            academicPeriodId: activePeriod.id,
            isActive: true,
          },
        });
        const synced = await this.prisma.teacherAssignment.update({
          where: { id: assignment.id },
          data: { academicOfferingId: offering.id },
        });

        // Fase 4FN: espejo canónico Docente<->Oferta
        await this.prisma.teacherOfferingAssignment.upsert({
          where: {
            teacherId_academicOfferingId: {
              teacherId: dto.teacherId,
              academicOfferingId: offering.id,
            },
          },
          update: {},
          create: {
            teacherId: dto.teacherId,
            academicOfferingId: offering.id,
          },
        });

        return synced;
      }
    } catch {
      // No critico: continuar sin enlazar
    }

    return assignment;
  }

  async listTeacherAssignments(actor: Actor, teacherId: number) {
    if (actor.role !== UserRole.SUPER_ADMIN && actor.userId !== teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: teacherId },
        select: { institutionId: true },
      });
      if (!teacher || teacher.institutionId !== this.getActorInstitutionId(actor)) {
        throw new BadRequestException('Profesor fuera del alcance de su institucion');
      }
    }

    return this.prisma.teacherAssignment.findMany({
      where: { teacherId },
      include: { group: { include: { grade: true } }, subject: true },
    });
  }

  async deleteTeacherAssignment(actor: Actor, id: number) {
    const existing = await this.prisma.teacherAssignment.findUnique({
      where: { id },
      include: { group: { select: { institutionId: true } } },
    });
    if (!existing) throw new NotFoundException('Asignacion docente no encontrada');

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      existing.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException('Asignacion fuera del alcance de su institucion');
    }

    const deleted = await this.prisma.teacherAssignment.delete({
      where: { id },
    });

    if (existing.academicOfferingId) {
      // Eliminar relación canónica solo si no queda otra asignación legacy equivalente
      const stillExists = await this.prisma.teacherAssignment.findFirst({
        where: {
          teacherId: existing.teacherId,
          academicOfferingId: existing.academicOfferingId,
        },
        select: { id: true },
      });
      if (!stillExists) {
        await this.prisma.teacherOfferingAssignment.deleteMany({
          where: {
            teacherId: existing.teacherId,
            academicOfferingId: existing.academicOfferingId,
          },
        });
      }
    }

    return deleted;
  }

  // Asignar director de grupo
  async assignGroupDirector(actor: Actor, groupId: number, directorId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ...this.institutionWhere(actor) },
    });
    if (!group) throw new BadRequestException('Grupo no encontrado');

    const user = await this.prisma.user.findUnique({
      where: { id: directorId },
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      user.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException('Usuario fuera del alcance de su institucion');
    }
    if (user.role !== 'PROFESOR')
      throw new BadRequestException('El usuario no es PROFESOR');

    return this.prisma.group.update({
      where: { id: groupId },
      data: { directorId },
    });
  }

  // Listar estudiantes de un grupo
  async listGroupStudents(actor: Actor, groupId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ...this.institutionWhere(actor) },
    });
    if (!group) throw new BadRequestException('Grupo no encontrado');
    const sg = await this.prisma.studentGroup.findMany({
      where: { groupId },
      include: { student: true },
    });
    return sg.map((x) => ({
      id: x.student.id,
      nombres: x.student.nombres,
      apellidos: x.student.apellidos,
      email: x.student.email,
      documento_identidad: x.student.documento_identidad,
      telefono: x.student.telefono ?? null,
      role: x.student.role,
    }));
  }

  // Promoción de grado (mover estudiantes entre grupos de grados consecutivos)
  async previewPromoteGrade(actor: Actor, dto: PromoteGradeDto) {
    if (dto.sourceGradeId === dto.targetGradeId) {
      throw new BadRequestException(
        'El grado de origen y destino no pueden ser iguales',
      );
    }

    const sourceGrade = await this.prisma.grade.findFirst({
      where: { id: dto.sourceGradeId, ...this.institutionWhere(actor) },
    });
    const targetGrade = await this.prisma.grade.findFirst({
      where: { id: dto.targetGradeId, ...this.institutionWhere(actor) },
    });
    if (!sourceGrade)
      throw new BadRequestException('Grado origen no encontrado');
    if (!targetGrade)
      throw new BadRequestException('Grado destino no encontrado');

    const summary: PromotionSummaryItem[] = [];

    for (const map of dto.mappings) {
      const src = await this.prisma.group.findFirst({
        where: { id: map.sourceGroupId, ...this.institutionWhere(actor) },
      });
      const dst = await this.prisma.group.findFirst({
        where: { id: map.targetGroupId, ...this.institutionWhere(actor) },
      });
      if (!src)
        throw new BadRequestException(
          `Grupo origen ${map.sourceGroupId} no existe`,
        );
      if (!dst)
        throw new BadRequestException(
          `Grupo destino ${map.targetGroupId} no existe`,
        );
      if (src.gradeId !== dto.sourceGradeId)
        throw new BadRequestException(
          `Grupo origen ${src.id} no pertenece al grado origen`,
        );
      if (dst.gradeId !== dto.targetGradeId)
        throw new BadRequestException(
          `Grupo destino ${dst.id} no pertenece al grado destino`,
        );

      const current = await this.prisma.studentGroup.findMany({
        where: { groupId: src.id },
      });
      const allIds = current.map((c) => c.studentId);
      const repeatSet = new Set(map.repeatStudentIds || []);
      const toPromote = allIds.filter((id) => !repeatSet.has(id));

      const promotedCount = toPromote.length;
      const beforeCount = await this.prisma.studentGroup.count({
        where: { groupId: dst.id },
      });
      const afterCount = beforeCount + promotedCount;
      summary.push({
        sourceGroupId: src.id,
        sourceGroupName: src.nombre,
        targetGroupId: dst.id,
        targetGroupName: dst.nombre,
        promotedCount,
        repeatCount: repeatSet.size,
        promotedStudentIds: toPromote,
        repeatStudentIds: Array.from(repeatSet),
        beforeCount,
        afterCount,
      });
    }

    return {
      ok: true,
      sourceGrade: { id: sourceGrade.id, nombre: sourceGrade.nombre },
      targetGrade: { id: targetGrade.id, nombre: targetGrade.nombre },
      summary,
    };
  }

  // ─── Períodos Académicos ────────────────────────────────────────────────────

  async createAcademicPeriod(actor: Actor, dto: CreateAcademicPeriodDto) {
    return this.prisma.academicPeriod.create({
      data: {
        institutionId: this.getActorInstitutionId(actor),
        nombre: dto.nombre,
        codigo: dto.codigo,
        tipo: (dto.tipo ?? AcademicPeriodType.TERM) as AcademicPeriodType,
        estado: AcademicPeriodStatus.DRAFT,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        fechaCierre: dto.fechaCierre ? new Date(dto.fechaCierre) : null,
      },
    });
  }

  async listAcademicPeriods(actor: Actor) {
    return this.prisma.academicPeriod.findMany({
      where: this.institutionWhere(actor),
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async getAcademicPeriod(actor: Actor, id: number) {
    const p = await this.prisma.academicPeriod.findFirst({
      where: { id, ...this.institutionWhere(actor) },
    });
    if (!p) throw new NotFoundException('Período académico no encontrado');
    return p;
  }

  async getActivePeriod(actor: Actor) {
    const p = await this.prisma.academicPeriod.findFirst({
      where: {
        estado: AcademicPeriodStatus.ACTIVE,
        ...this.institutionWhere(actor),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!p) throw new NotFoundException('No hay período académico activo');
    return p;
  }

  async updateAcademicPeriod(
    actor: Actor,
    id: number,
    dto: UpdateAcademicPeriodDto,
  ) {
    await this.getAcademicPeriod(actor, id);
    return this.prisma.academicPeriod.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
        ...(dto.codigo !== undefined ? { codigo: dto.codigo } : {}),
        ...(dto.tipo !== undefined
          ? { tipo: dto.tipo as AcademicPeriodType }
          : {}),
        ...(dto.fechaInicio ? { fechaInicio: new Date(dto.fechaInicio) } : {}),
        ...(dto.fechaFin ? { fechaFin: new Date(dto.fechaFin) } : {}),
        ...(dto.fechaCierre !== undefined
          ? { fechaCierre: dto.fechaCierre ? new Date(dto.fechaCierre) : null }
          : {}),
      },
    });
  }

  async activateAcademicPeriod(actor: Actor, id: number) {
    await this.getAcademicPeriod(actor, id);
    // Solo un período puede estar ACTIVE a la vez
    await this.prisma.academicPeriod.updateMany({
      where: {
        estado: AcademicPeriodStatus.ACTIVE,
        ...this.institutionWhere(actor),
      },
      data: { estado: AcademicPeriodStatus.CLOSED },
    });
    return this.prisma.academicPeriod.update({
      where: { id },
      data: { estado: AcademicPeriodStatus.ACTIVE },
    });
  }

  async closeAcademicPeriod(actor: Actor, id: number) {
    await this.getAcademicPeriod(actor, id);
    return this.prisma.academicPeriod.update({
      where: { id },
      data: { estado: AcademicPeriodStatus.CLOSED, fechaCierre: new Date() },
    });
  }

  // ─── Ofertas Académicas (AcademicOffering) ──────────────────────────────────

  async listGroupOfferings(actor: Actor, groupId: number, periodId?: number) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ...this.institutionWhere(actor) },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    let academicPeriodId = periodId;
    if (!academicPeriodId) {
      const active = await this.prisma.academicPeriod.findFirst({
        where: {
          estado: AcademicPeriodStatus.ACTIVE,
          ...this.institutionWhere(actor),
        },
        select: { id: true },
      });
      academicPeriodId = active?.id;
    }

    return this.prisma.academicOffering.findMany({
      where: {
        groupId,
        ...(academicPeriodId ? { academicPeriodId } : {}),
        ...(actor.role !== UserRole.SUPER_ADMIN
          ? { group: { institutionId: this.getActorInstitutionId(actor) } }
          : {}),
      },
      include: {
        subject: { select: { id: true, nombre: true, codigo: true } },
        academicPeriod: { select: { id: true, nombre: true, estado: true } },
        teacherAssignments: {
          include: {
            teacher: { select: { id: true, nombres: true, apellidos: true } },
          },
        },
        academicEvaluations: {
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { subject: { nombre: 'asc' } },
    });
  }

  async getOfferingDetail(actor: Actor, offeringId: number) {
    const offering = await this.prisma.academicOffering.findFirst({
      where: {
        id: offeringId,
        ...(actor.role !== UserRole.SUPER_ADMIN
          ? { group: { institutionId: this.getActorInstitutionId(actor) } }
          : {}),
      },
      include: {
        group: { include: { grade: true } },
        subject: true,
        academicPeriod: true,
        teacherAssignments: {
          include: {
            teacher: { select: { id: true, nombres: true, apellidos: true } },
          },
        },
        teacherOfferingAssignments: {
          include: {
            teacher: { select: { id: true, nombres: true, apellidos: true } },
          },
        },
        academicEvaluations: { orderBy: { orden: 'asc' } },
        studyMaterials: { orderBy: { createdAt: 'desc' } },
        syllabi: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!offering)
      throw new NotFoundException('Oferta académica no encontrada');
    return offering;
  }

  // ─── Evaluaciones (AcademicEvaluation) ─────────────────────────────────────

  async listEvaluations(actor: Actor, offeringId: number) {
    const offering = await this.prisma.academicOffering.findFirst({
      where: {
        id: offeringId,
        ...(actor.role !== UserRole.SUPER_ADMIN
          ? { group: { institutionId: this.getActorInstitutionId(actor) } }
          : {}),
      },
    });
    if (!offering)
      throw new NotFoundException('Oferta académica no encontrada');
    return this.prisma.academicEvaluation.findMany({
      where: { academicOfferingId: offeringId },
      orderBy: { orden: 'asc' },
    });
  }

  async createEvaluation(
    actor: Actor,
    offeringId: number,
    dto: CreateAcademicEvaluationDto,
  ) {
    const offering = await this.prisma.academicOffering.findFirst({
      where: {
        id: offeringId,
        ...(actor.role !== UserRole.SUPER_ADMIN
          ? { group: { institutionId: this.getActorInstitutionId(actor) } }
          : {}),
      },
    });
    if (!offering)
      throw new NotFoundException('Oferta académica no encontrada');

    // Verificar que el orden no esté duplicado
    const orden = dto.orden ?? 0;
    const conflict = await this.prisma.academicEvaluation.findFirst({
      where: { academicOfferingId: offeringId, orden },
    });
    if (conflict) {
      throw new BadRequestException(
        `Ya existe una evaluación con orden ${orden} en esta oferta`,
      );
    }

    return this.prisma.academicEvaluation.create({
      data: {
        academicOfferingId: offeringId,
        titulo: dto.titulo,
        tipo: (dto.tipo ?? EvaluacionTipo.PARCIAL) as EvaluacionTipo,
        porcentaje: dto.porcentaje ?? null,
        orden,
      },
    });
  }

  async updateEvaluation(actor: Actor, evalId: number, dto: UpdateAcademicEvaluationDto) {
    const ev = await this.prisma.academicEvaluation.findUnique({
      where: { id: evalId },
      include: {
        academicOffering: {
          select: { group: { select: { institutionId: true } } },
        },
      },
    });
    if (!ev) throw new NotFoundException('Evaluación no encontrada');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      ev.academicOffering.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException('Evaluacion fuera del alcance de su institucion');
    }
    // Verificar conflicto de orden si se cambia
    if (dto.orden !== undefined && dto.orden !== ev.orden) {
      const conflict = await this.prisma.academicEvaluation.findFirst({
        where: { academicOfferingId: ev.academicOfferingId, orden: dto.orden },
      });
      if (conflict && conflict.id !== evalId) {
        throw new BadRequestException(
          `Ya existe una evaluación con orden ${dto.orden} en esta oferta`,
        );
      }
    }

    return this.prisma.academicEvaluation.update({
      where: { id: evalId },
      data: {
        ...(dto.titulo !== undefined ? { titulo: dto.titulo } : {}),
        ...(dto.tipo !== undefined ? { tipo: dto.tipo as EvaluacionTipo } : {}),
        ...(dto.porcentaje !== undefined ? { porcentaje: dto.porcentaje } : {}),
        ...(dto.orden !== undefined ? { orden: dto.orden } : {}),
      },
    });
  }

  async deleteEvaluation(actor: Actor, evalId: number) {
    const ev = await this.prisma.academicEvaluation.findUnique({
      where: { id: evalId },
      include: {
        academicOffering: {
          select: { group: { select: { institutionId: true } } },
        },
      },
    });
    if (!ev) throw new NotFoundException('Evaluación no encontrada');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      ev.academicOffering.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException('Evaluacion fuera del alcance de su institucion');
    }
    await this.prisma.academicEvaluation.delete({ where: { id: evalId } });
    return { deleted: true };
  }

  // ─── Listado de ofertas de un profesor ─────────────────────────────────────

  async listTeacherOfferings(actor: Actor, teacherId: number, periodId?: number) {
    if (actor.role !== UserRole.SUPER_ADMIN && actor.userId !== teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: teacherId },
        select: { institutionId: true },
      });
      if (!teacher || teacher.institutionId !== this.getActorInstitutionId(actor)) {
        throw new BadRequestException('Profesor fuera del alcance de su institucion');
      }
    }

    let academicPeriodId = periodId;
    if (!academicPeriodId) {
      const active = await this.prisma.academicPeriod.findFirst({
        where: {
          estado: AcademicPeriodStatus.ACTIVE,
          ...this.institutionWhere(actor),
        },
        select: { id: true },
      });
      academicPeriodId = active?.id;
    }
    return this.prisma.teacherOfferingAssignment.findMany({
      where: {
        teacherId,
        ...(actor.role !== UserRole.SUPER_ADMIN || academicPeriodId
          ? {
              academicOffering: {
                ...(actor.role !== UserRole.SUPER_ADMIN
                  ? { group: { institutionId: this.getActorInstitutionId(actor) } }
                  : {}),
                ...(academicPeriodId ? { academicPeriodId } : {}),
              },
            }
          : {}),
      },
      include: {
        academicOffering: {
          include: {
            group: { include: { grade: true } },
            subject: { select: { id: true, nombre: true } },
            academicPeriod: {
              select: { id: true, nombre: true, estado: true },
            },
            academicEvaluations: { orderBy: { orden: 'asc' } },
          },
        },
      },
    });
  }

  async promoteGrade(actor: Actor, dto: PromoteGradeDto) {
    if (dto.sourceGradeId === dto.targetGradeId) {
      throw new BadRequestException(
        'El grado de origen y destino no pueden ser iguales',
      );
    }

    const sourceGrade = await this.prisma.grade.findFirst({
      where: { id: dto.sourceGradeId, ...this.institutionWhere(actor) },
    });
    const targetGrade = await this.prisma.grade.findFirst({
      where: { id: dto.targetGradeId, ...this.institutionWhere(actor) },
    });
    if (!sourceGrade)
      throw new BadRequestException('Grado origen no encontrado');
    if (!targetGrade)
      throw new BadRequestException('Grado destino no encontrado');

    // Resolver período activo (NOT NULL en StudentGroup)
    const activePeriod = await this.prisma.academicPeriod.findFirst({
      where: {
        estado: AcademicPeriodStatus.ACTIVE,
        ...this.institutionWhere(actor),
      },
      select: { id: true },
    });
    if (!activePeriod)
      throw new BadRequestException('No hay período académico activo');

    const summary: PromotionSummaryItem[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const map of dto.mappings) {
        const src = await tx.group.findFirst({
          where: { id: map.sourceGroupId, ...this.institutionWhere(actor) },
        });
        const dst = await tx.group.findFirst({
          where: { id: map.targetGroupId, ...this.institutionWhere(actor) },
        });
        if (!src)
          throw new BadRequestException(
            `Grupo origen ${map.sourceGroupId} no existe`,
          );
        if (!dst)
          throw new BadRequestException(
            `Grupo destino ${map.targetGroupId} no existe`,
          );
        if (src.gradeId !== dto.sourceGradeId)
          throw new BadRequestException(
            `Grupo origen ${src.id} no pertenece al grado origen`,
          );
        if (dst.gradeId !== dto.targetGradeId)
          throw new BadRequestException(
            `Grupo destino ${dst.id} no pertenece al grado destino`,
          );

        const current = await tx.studentGroup.findMany({
          where: { groupId: src.id },
          select: { studentId: true },
        });
        const allIds = current.map((c) => c.studentId);
        const repeatSet = new Set(map.repeatStudentIds || []);
        const toPromote = allIds.filter((id) => !repeatSet.has(id));

        if (toPromote.length > 0) {
          // Cerrar matrículas antiguas
          await tx.studentGroup.updateMany({
            where: { groupId: src.id, studentId: { in: toPromote } },
            data: { status: EnrollmentStatus.PROMOTED, endedAt: new Date() },
          });
          // Crear nuevas matrículas en grupo destino con período activo
          await tx.studentGroup.createMany({
            data: toPromote.map((studentId) => ({
              studentId,
              groupId: dst.id,
              academicPeriodId: activePeriod.id,
              status: EnrollmentStatus.ACTIVE,
            })),
            skipDuplicates: true,
          });
        }

        summary.push({
          sourceGroupId: src.id,
          sourceGroupName: src.nombre,
          targetGroupId: dst.id,
          targetGroupName: dst.nombre,
          promotedCount: toPromote.length,
          repeatCount: repeatSet.size,
        });
      }
    });

    return {
      ok: true,
      sourceGrade: { id: sourceGrade.id, nombre: sourceGrade.nombre },
      targetGrade: { id: targetGrade.id, nombre: targetGrade.nombre },
      summary,
    };
  }
}
