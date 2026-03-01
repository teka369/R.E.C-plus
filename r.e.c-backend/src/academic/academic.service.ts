import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';

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

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  // Grados
  async createGrade(dto: CreateGradeDto) {
    return this.prisma.grade.create({ data: { nombre: dto.nombre } });
  }

  async listGrades() {
    return this.prisma.grade.findMany({ include: { groups: true } });
  }

  async getGrade(id: number) {
    return this.prisma.grade.findUnique({
      where: { id },
      include: { groups: true },
    });
  }

  async updateGrade(id: number, dto: { nombre: string }) {
    return this.prisma.grade.update({
      where: { id },
      data: { nombre: dto.nombre },
    });
  }

  async deleteGrade(id: number) {
    return this.prisma.grade.delete({ where: { id } });
  }

  // Grupos
  async createGroup(dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: { nombre: dto.nombre, gradeId: dto.gradeId },
    });
  }

  async listGroups() {
    return this.prisma.group.findMany({
      include: { grade: true, subjects: true },
    });
  }

  async getGroup(id: number) {
    return this.prisma.group.findUnique({
      where: { id },
      include: { grade: true, subjects: true },
    });
  }

  async updateGroup(id: number, dto: { nombre?: string; gradeId?: number }) {
    return this.prisma.group.update({
      where: { id },
      data: {
        ...(dto.nombre ? { nombre: dto.nombre } : {}),
        ...(dto.gradeId ? { gradeId: dto.gradeId } : {}),
      },
    });
  }

  async deleteGroup(id: number) {
    return this.prisma.group.delete({ where: { id } });
  }

  // Materias
  async createSubject(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: { nombre: dto.nombre, codigo: dto.codigo },
    });
  }

  async listSubjects() {
    return this.prisma.subject.findMany();
  }

  async getSubject(id: number) {
    return this.prisma.subject.findUnique({ where: { id } });
  }

  async updateSubject(id: number, dto: { nombre?: string; codigo?: string }) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        ...(dto.nombre ? { nombre: dto.nombre } : {}),
        ...(dto.codigo !== undefined ? { codigo: dto.codigo } : {}),
      },
    });
  }

  async deleteSubject(id: number) {
    return this.prisma.subject.delete({ where: { id } });
  }

  // Asignar materias a grupo
  async assignSubjectToGroup(dto: AssignGroupSubjectDto) {
    return this.prisma.groupSubject.create({
      data: { groupId: dto.groupId, subjectId: dto.subjectId },
    });
  }

  async listGroupSubjects(groupId: number) {
    return this.prisma.groupSubject.findMany({
      where: { groupId },
      include: { subject: true },
    });
  }

  async deleteGroupSubject(id: number) {
    return this.prisma.groupSubject.delete({ where: { id } });
  }

  // Asignar estudiante a grupo
  async assignStudentToGroup(dto: AssignStudentGroupDto) {
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new BadRequestException('Estudiante no encontrado');
    if (student.role !== (UserRole.ESTUDIANTE as any))
      throw new BadRequestException('El usuario no es ESTUDIANTE');

    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
    });
    if (!group) throw new BadRequestException('Grupo no encontrado');

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

    // Crear la asignación (no existen previas)
    return this.prisma.studentGroup.create({
      data: { studentId: dto.studentId, groupId: dto.groupId },
    });
  }

  async listStudentSubjects(studentId: number) {
    const assignment = await this.prisma.studentGroup.findFirst({
      where: { studentId },
    });
    if (!assignment) return [];
    return this.prisma.groupSubject.findMany({
      where: { groupId: assignment.groupId },
      include: { subject: true },
    });
  }

  async getStudentGroup(studentId: number) {
    return this.prisma.studentGroup.findFirst({
      where: { studentId },
      include: { group: { include: { grade: true } } },
    });
  }

  async deleteStudentGroup(studentId: number) {
    const res = await this.prisma.studentGroup.deleteMany({
      where: { studentId },
    });
    return { deleted: res.count };
  }

  // Asignar profesor a grupo y materia
  async assignTeacher(dto: AssignTeacherDto) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
    });
    if (!teacher) throw new BadRequestException('Profesor no encontrado');
    if (teacher.role !== (UserRole.PROFESOR as any))
      throw new BadRequestException('El usuario no es PROFESOR');

    return this.prisma.teacherAssignment.create({
      data: {
        teacherId: dto.teacherId,
        groupId: dto.groupId,
        subjectId: dto.subjectId,
      },
    });
  }

  async listTeacherAssignments(teacherId: number) {
    return this.prisma.teacherAssignment.findMany({
      where: { teacherId },
      include: { group: { include: { grade: true } }, subject: true },
    });
  }

  async deleteTeacherAssignment(id: number) {
    return this.prisma.teacherAssignment.delete({ where: { id } });
  }

  // Asignar director de grupo
  async assignGroupDirector(groupId: number, directorId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new BadRequestException('Grupo no encontrado');

    const user = await this.prisma.user.findUnique({
      where: { id: directorId },
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (user.role !== 'PROFESOR')
      throw new BadRequestException('El usuario no es PROFESOR');

    return this.prisma.group.update({
      where: { id: groupId },
      data: { directorId },
    });
  }

  // Listar estudiantes de un grupo
  async listGroupStudents(groupId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
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
  async previewPromoteGrade(dto: PromoteGradeDto) {
    if (dto.sourceGradeId === dto.targetGradeId) {
      throw new BadRequestException(
        'El grado de origen y destino no pueden ser iguales',
      );
    }

    const sourceGrade = await this.prisma.grade.findUnique({
      where: { id: dto.sourceGradeId },
    });
    const targetGrade = await this.prisma.grade.findUnique({
      where: { id: dto.targetGradeId },
    });
    if (!sourceGrade)
      throw new BadRequestException('Grado origen no encontrado');
    if (!targetGrade)
      throw new BadRequestException('Grado destino no encontrado');

    const summary: PromotionSummaryItem[] = [];

    for (const map of dto.mappings) {
      const src = await this.prisma.group.findUnique({
        where: { id: map.sourceGroupId },
      });
      const dst = await this.prisma.group.findUnique({
        where: { id: map.targetGroupId },
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

  async promoteGrade(dto: PromoteGradeDto) {
    if (dto.sourceGradeId === dto.targetGradeId) {
      throw new BadRequestException(
        'El grado de origen y destino no pueden ser iguales',
      );
    }

    const sourceGrade = await this.prisma.grade.findUnique({
      where: { id: dto.sourceGradeId },
    });
    const targetGrade = await this.prisma.grade.findUnique({
      where: { id: dto.targetGradeId },
    });
    if (!sourceGrade)
      throw new BadRequestException('Grado origen no encontrado');
    if (!targetGrade)
      throw new BadRequestException('Grado destino no encontrado');

    const summary: PromotionSummaryItem[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const map of dto.mappings) {
        const src = await tx.group.findUnique({
          where: { id: map.sourceGroupId },
        });
        const dst = await tx.group.findUnique({
          where: { id: map.targetGroupId },
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
        });
        const allIds = current.map((c) => c.studentId);
        const repeatSet = new Set(map.repeatStudentIds || []);
        const toPromote = allIds.filter((id) => !repeatSet.has(id));

        let promotedCount = 0;
        if (toPromote.length > 0) {
          const res = await tx.studentGroup.updateMany({
            where: { groupId: src.id, studentId: { in: toPromote } },
            data: { groupId: dst.id },
          });
          promotedCount = res.count;
        }

        const beforeCount = await tx.studentGroup.count({
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
    });

    return {
      ok: true,
      sourceGrade: { id: sourceGrade.id, nombre: sourceGrade.nombre },
      targetGrade: { id: targetGrade.id, nombre: targetGrade.nombre },
      summary,
    };
  }
}
