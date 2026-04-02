import {
  Injectable,
  BadRequestException,
  ForbiddenException,
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

import { Actor } from '../common/tenant';
import { TenantScopedService } from '../common/tenant-scoped.service';
import {
  PaginationQuery,
  paginateParams,
  buildPaginatedResult,
} from '../common/dto/pagination.dto';
import { RedisCacheService } from '../common/cache/cache.service';

@Injectable()
export class AcademicService extends TenantScopedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {
    super();
  }

  // Grados
  async createGrade(actor: Actor, dto: CreateGradeDto) {
    const result = await this.prisma.grade.create({
      data: {
        institutionId: this.getActorInstitutionId(actor),
        nombre: dto.nombre,
      },
    });
    await this.cache.delByPattern('grades:*');
    return result;
  }

  async listGrades(actor: Actor, pagination: PaginationQuery = {}) {
    const instId =
      actor.role === UserRole.SUPER_ADMIN
        ? 'global'
        : this.getActorInstitutionId(actor);
    const { skip, take, page, limit } = paginateParams(pagination);
    const cacheKey = `grades:${instId}:${page}:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where = this.scopeToInstitution(actor);
    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        include: { groups: true },
        skip,
        take,
      }),
      this.prisma.grade.count({ where }),
    ]);
    const result = buildPaginatedResult(data, total, page, limit);
    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  async getGrade(actor: Actor, id: number) {
    const grade = await this.prisma.grade.findFirst({
      where: { id, ...this.scopeToInstitution(actor) },
      include: { groups: true },
    });
    if (!grade) throw new NotFoundException('Grado no encontrado');
    return grade;
  }

  async updateGrade(actor: Actor, id: number, dto: { nombre: string }) {
    await this.getGrade(actor, id);
    const result = await this.prisma.grade.update({
      where: { id },
      data: { nombre: dto.nombre },
    });
    await this.cache.delByPattern('grades:*');
    return result;
  }

  async deleteGrade(actor: Actor, id: number) {
    await this.getGrade(actor, id);
    const result = await this.prisma.grade.delete({ where: { id } });
    await this.cache.delByPattern('grades:*');
    return result;
  }

  // Grupos
  async createGroup(actor: Actor, dto: CreateGroupDto) {
    const grade = await this.prisma.grade.findFirst({
      where: { id: dto.gradeId, ...this.scopeToInstitution(actor) },
      select: { id: true, institutionId: true },
    });
    if (!grade) throw new BadRequestException('Grado no encontrado');

    const result = await this.prisma.group.create({
      data: {
        institutionId: grade.institutionId,
        nombre: dto.nombre,
        gradeId: dto.gradeId,
      },
    });
    await this.cache.delByPattern('groups:*');
    return result;
  }

  async listGroups(actor: Actor, pagination: PaginationQuery = {}) {
    const instId =
      actor.role === UserRole.SUPER_ADMIN
        ? 'global'
        : this.getActorInstitutionId(actor);
    const { skip, take, page, limit } = paginateParams(pagination);
    const cacheKey = `groups:${instId}:${page}:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where = this.scopeToInstitution(actor);
    const [data, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        include: { grade: true, subjects: true },
        skip,
        take,
      }),
      this.prisma.group.count({ where }),
    ]);
    const result = buildPaginatedResult(data, total, page, limit);
    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  async getGroup(actor: Actor, id: number) {
    const group = await this.prisma.group.findFirst({
      where: { id, ...this.scopeToInstitution(actor) },
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
        where: { id: dto.gradeId, ...this.scopeToInstitution(actor) },
        select: { id: true },
      });
      if (!grade) throw new BadRequestException('Grado destino no encontrado');
    }

    const result = await this.prisma.group.update({
      where: { id },
      data: {
        ...(dto.nombre ? { nombre: dto.nombre } : {}),
        ...(dto.gradeId ? { gradeId: dto.gradeId } : {}),
      },
    });
    await this.cache.delByPattern('groups:*');
    return result;
  }

  async deleteGroup(actor: Actor, id: number) {
    await this.getGroup(actor, id);
    const result = await this.prisma.group.delete({ where: { id } });
    await this.cache.delByPattern('groups:*');
    return result;
  }

  // Materias
  async createSubject(actor: Actor, dto: CreateSubjectDto) {
    const result = await this.prisma.subject.create({
      data: {
        institutionId: this.getActorInstitutionId(actor),
        nombre: dto.nombre,
        codigo: dto.codigo,
      },
    });
    await this.cache.delByPattern('subjects:*');
    return result;
  }

  async listSubjects(actor: Actor, pagination: PaginationQuery = {}) {
    const instId =
      actor.role === UserRole.SUPER_ADMIN
        ? 'global'
        : this.getActorInstitutionId(actor);
    const { skip, take, page, limit } = paginateParams(pagination);
    const cacheKey = `subjects:${instId}:${page}:${limit}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const where = this.scopeToInstitution(actor);
    const [data, total] = await Promise.all([
      this.prisma.subject.findMany({ where, skip, take }),
      this.prisma.subject.count({ where }),
    ]);
    const result = buildPaginatedResult(data, total, page, limit);
    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  async getSubject(actor: Actor, id: number) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, ...this.scopeToInstitution(actor) },
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
    const result = await this.prisma.subject.update({
      where: { id },
      data: {
        ...(dto.nombre ? { nombre: dto.nombre } : {}),
        ...(dto.codigo !== undefined ? { codigo: dto.codigo } : {}),
      },
    });
    await this.cache.delByPattern('subjects:*');
    return result;
  }

  async deleteSubject(actor: Actor, id: number) {
    await this.getSubject(actor, id);
    const result = await this.prisma.subject.delete({ where: { id } });
    await this.cache.delByPattern('subjects:*');
    return result;
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
        where: {
          estado: AcademicPeriodStatus.ACTIVE,
          ...this.scopeToInstitution(actor),
        },
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
    if (!gs)
      throw new NotFoundException('Asignacion grupo-materia no encontrada');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      gs.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException(
        'Asignacion fuera del alcance de su institucion',
      );
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
      throw new ForbiddenException(
        'Estudiante fuera del alcance de su institucion',
      );
    }

    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
      select: { id: true, institutionId: true },
    });
    if (!group) throw new BadRequestException('Grupo no encontrado');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException('Grupo fuera del alcance de su institucion');
    }

    // Defensa en profundidad: verificar consistencia tenant estudiante-grupo
    // Crítico incluso para SUPER_ADMIN: no debe crear relaciones cross-tenant inválidas
    if (student.institutionId !== group.institutionId) {
      throw new ForbiddenException(
        'Inconsistencia detectada: estudiante y grupo no pertenecen a la misma institución',
      );
    }

    // Resolver período académico activo (requerido — StudentGroup.academicPeriodId NOT NULL)
    const activePeriod = await this.prisma.academicPeriod.findFirst({
      where: {
        estado: AcademicPeriodStatus.ACTIVE,
        ...this.scopeToInstitution(actor),
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
      if (
        !student ||
        student.institutionId !== this.getActorInstitutionId(actor)
      ) {
        throw new BadRequestException(
          'Estudiante fuera del alcance de su institucion',
        );
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
      if (
        !student ||
        student.institutionId !== this.getActorInstitutionId(actor)
      ) {
        throw new BadRequestException(
          'Estudiante fuera del alcance de su institucion',
        );
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
      if (
        !student ||
        student.institutionId !== this.getActorInstitutionId(actor)
      ) {
        throw new BadRequestException(
          'Estudiante fuera del alcance de su institucion',
        );
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
      throw new BadRequestException(
        'Profesor fuera del alcance de su institucion',
      );
    }

    const group = await this.getGroup(actor, dto.groupId);
    const subject = await this.getSubject(actor, dto.subjectId);

    // Defensa en profundidad: verificar consistencia tenant profesor-grupo-materia
    // Crítico incluso para SUPER_ADMIN: no debe crear relaciones cross-tenant inválidas
    if (
      teacher.institutionId !== group.institutionId ||
      teacher.institutionId !== subject.institutionId
    ) {
      throw new ForbiddenException(
        'Inconsistencia detectada: profesor, grupo y materia deben pertenecer a la misma institución',
      );
    }

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
          ...this.scopeToInstitution(actor),
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
      if (
        !teacher ||
        teacher.institutionId !== this.getActorInstitutionId(actor)
      ) {
        throw new BadRequestException(
          'Profesor fuera del alcance de su institucion',
        );
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
    if (!existing)
      throw new NotFoundException('Asignacion docente no encontrada');

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      existing.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException(
        'Asignacion fuera del alcance de su institucion',
      );
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
      where: { id: groupId, ...this.scopeToInstitution(actor) },
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
      throw new BadRequestException(
        'Usuario fuera del alcance de su institucion',
      );
    }
    if (user.role !== 'PROFESOR')
      throw new BadRequestException('El usuario no es PROFESOR');

    // Defensa en profundidad: verificar consistencia tenant director-grupo
    // Crítico incluso para SUPER_ADMIN: no debe crear relaciones cross-tenant inválidas
    if (user.institutionId !== group.institutionId) {
      throw new ForbiddenException(
        'Inconsistencia detectada: director y grupo deben pertenecer a la misma institución',
      );
    }

    return this.prisma.group.update({
      where: { id: groupId },
      data: { directorId },
    });
  }

  // Listar estudiantes de un grupo
  async listGroupStudents(actor: Actor, groupId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ...this.scopeToInstitution(actor) },
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
      codigo: x.student.codigo,
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
      where: { id: dto.sourceGradeId, ...this.scopeToInstitution(actor) },
    });
    const targetGrade = await this.prisma.grade.findFirst({
      where: { id: dto.targetGradeId, ...this.scopeToInstitution(actor) },
    });
    if (!sourceGrade)
      throw new BadRequestException('Grado origen no encontrado');
    if (!targetGrade)
      throw new BadRequestException('Grado destino no encontrado');

    const summary: PromotionSummaryItem[] = [];

    for (const map of dto.mappings) {
      const src = await this.prisma.group.findFirst({
        where: { id: map.sourceGroupId, ...this.scopeToInstitution(actor) },
      });
      const dst = await this.prisma.group.findFirst({
        where: { id: map.targetGroupId, ...this.scopeToInstitution(actor) },
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

  async listAcademicPeriods(actor: Actor, pagination: PaginationQuery = {}) {
    const where = this.scopeToInstitution(actor);
    const { skip, take, page, limit } = paginateParams(pagination);
    const [data, total] = await Promise.all([
      this.prisma.academicPeriod.findMany({
        where,
        orderBy: { fechaInicio: 'desc' },
        skip,
        take,
      }),
      this.prisma.academicPeriod.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  async getAcademicPeriod(actor: Actor, id: number) {
    const p = await this.prisma.academicPeriod.findFirst({
      where: { id, ...this.scopeToInstitution(actor) },
    });
    if (!p) throw new NotFoundException('Período académico no encontrado');
    return p;
  }

  async getActivePeriod(actor: Actor) {
    const instId =
      actor.role === UserRole.SUPER_ADMIN
        ? 'global'
        : this.getActorInstitutionId(actor);
    const cacheKey = `activePeriod:${instId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const p = await this.prisma.academicPeriod.findFirst({
      where: {
        estado: AcademicPeriodStatus.ACTIVE,
        ...this.scopeToInstitution(actor),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!p) throw new NotFoundException('No hay período académico activo');
    await this.cache.set(cacheKey, p, 300);
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
        ...this.scopeToInstitution(actor),
      },
      data: { estado: AcademicPeriodStatus.CLOSED },
    });
    const result = await this.prisma.academicPeriod.update({
      where: { id },
      data: { estado: AcademicPeriodStatus.ACTIVE },
    });
    await this.cache.delByPattern('activePeriod:*');
    return result;
  }

  async closeAcademicPeriod(actor: Actor, id: number) {
    await this.getAcademicPeriod(actor, id);
    const result = await this.prisma.academicPeriod.update({
      where: { id },
      data: { estado: AcademicPeriodStatus.CLOSED, fechaCierre: new Date() },
    });
    await this.cache.delByPattern('activePeriod:*');
    return result;
  }

  // ─── Ofertas Académicas (AcademicOffering) ──────────────────────────────────

  async listGroupOfferings(actor: Actor, groupId: number, periodId?: number) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ...this.scopeToInstitution(actor) },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    let academicPeriodId = periodId;
    if (!academicPeriodId) {
      const active = await this.prisma.academicPeriod.findFirst({
        where: {
          estado: AcademicPeriodStatus.ACTIVE,
          ...this.scopeToInstitution(actor),
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

  async updateEvaluation(
    actor: Actor,
    evalId: number,
    dto: UpdateAcademicEvaluationDto,
  ) {
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
      ev.academicOffering.group.institutionId !==
        this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException(
        'Evaluacion fuera del alcance de su institucion',
      );
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
      ev.academicOffering.group.institutionId !==
        this.getActorInstitutionId(actor)
    ) {
      throw new BadRequestException(
        'Evaluacion fuera del alcance de su institucion',
      );
    }
    await this.prisma.academicEvaluation.delete({ where: { id: evalId } });
    return { deleted: true };
  }

  // ─── Listado de ofertas de un profesor ─────────────────────────────────────

  async listTeacherOfferings(
    actor: Actor,
    teacherId: number,
    periodId?: number,
  ) {
    if (actor.role !== UserRole.SUPER_ADMIN && actor.userId !== teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: teacherId },
        select: { institutionId: true },
      });
      if (
        !teacher ||
        teacher.institutionId !== this.getActorInstitutionId(actor)
      ) {
        throw new BadRequestException(
          'Profesor fuera del alcance de su institucion',
        );
      }
    }

    let academicPeriodId = periodId;
    if (!academicPeriodId) {
      const active = await this.prisma.academicPeriod.findFirst({
        where: {
          estado: AcademicPeriodStatus.ACTIVE,
          ...this.scopeToInstitution(actor),
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
                  ? {
                      group: {
                        institutionId: this.getActorInstitutionId(actor),
                      },
                    }
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
      where: { id: dto.sourceGradeId, ...this.scopeToInstitution(actor) },
    });
    const targetGrade = await this.prisma.grade.findFirst({
      where: { id: dto.targetGradeId, ...this.scopeToInstitution(actor) },
    });
    if (!sourceGrade)
      throw new BadRequestException('Grado origen no encontrado');
    if (!targetGrade)
      throw new BadRequestException('Grado destino no encontrado');

    // Resolver período activo (NOT NULL en StudentGroup)
    const activePeriod = await this.prisma.academicPeriod.findFirst({
      where: {
        estado: AcademicPeriodStatus.ACTIVE,
        ...this.scopeToInstitution(actor),
      },
      select: { id: true },
    });
    if (!activePeriod)
      throw new BadRequestException('No hay período académico activo');

    const summary: PromotionSummaryItem[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const map of dto.mappings) {
        const src = await tx.group.findFirst({
          where: { id: map.sourceGroupId, ...this.scopeToInstitution(actor) },
        });
        const dst = await tx.group.findFirst({
          where: { id: map.targetGroupId, ...this.scopeToInstitution(actor) },
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
