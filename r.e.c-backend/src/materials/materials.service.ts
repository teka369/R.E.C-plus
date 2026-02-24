import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudyMaterialDto } from './dto/create-study-material.dto';
import { UpdateStudyMaterialDto } from './dto/update-study-material.dto';
import { CreateSyllabusDto } from './dto/create-syllabus.dto';
import { UpdateSyllabusDto } from './dto/update-syllabus.dto';
import { UpdateGroupInfoDto } from './dto/update-group-info.dto';
import { UserRole } from '../users/dto/user-role.enum';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  // Utilidades
  private async ensureTeacherAssignment(teacherId: number, groupId: number, subjectId: number) {
    const assign = await this.prisma.teacherAssignment.findUnique({
      where: { teacherId_groupId_subjectId: { teacherId, groupId, subjectId } },
    });
    if (!assign) throw new ForbiddenException('No asignado a ese grupo/materia');
    return assign;
  }

  private async getActorContext(actor: { userId: number; role: UserRole }) {
    if (actor.role === UserRole.ESTUDIANTE) {
      const sg = await this.prisma.studentGroup.findFirst({ where: { studentId: actor.userId } });
      if (!sg) throw new ForbiddenException('Estudiante sin grupo asignado');
      const group = await this.prisma.group.findUnique({ where: { id: sg.groupId } });
      if (!group) throw new NotFoundException('Grupo no encontrado');
      return { groupId: group.id, gradeId: group.gradeId };
    }
    return null;
  }

  // Study Materials
  async createStudyMaterial(actor: { userId: number; role: UserRole }, dto: CreateStudyMaterialDto) {
    if (actor.role !== UserRole.PROFESOR) throw new ForbiddenException('Solo profesores');
    await this.ensureTeacherAssignment(actor.userId, dto.groupId, dto.subjectId);
    return this.prisma.studyMaterial.create({
      data: {
        subjectId: dto.subjectId,
        groupId: dto.groupId,
        teacherId: actor.userId,
        title: dto.title,
        description: dto.description,
        type: dto.type as any,
        resourceUrl: dto.resourceUrl,
        imageUrl: dto.imageUrl,
        filePath: dto.filePath,
        visibility: dto.visibility as any,
      },
    });
  }

  async updateStudyMaterial(actor: { userId: number; role: UserRole }, id: number, dto: UpdateStudyMaterialDto) {
    const material = await this.prisma.studyMaterial.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('Material no encontrado');
    if (actor.role !== UserRole.PROFESOR || material.teacherId !== actor.userId) {
      throw new ForbiddenException('Solo el autor puede editar');
    }
    return this.prisma.studyMaterial.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: (dto.type as any) ?? undefined,
        resourceUrl: dto.resourceUrl,
        imageUrl: dto.imageUrl,
        filePath: dto.filePath,
        visibility: (dto.visibility as any) ?? undefined,
      },
    });
  }

  async deleteStudyMaterial(actor: { userId: number; role: UserRole }, id: number) {
    const material = await this.prisma.studyMaterial.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('Material no encontrado');
    if (actor.role !== UserRole.PROFESOR || material.teacherId !== actor.userId) {
      throw new ForbiddenException('Solo el autor puede eliminar');
    }
    await this.prisma.studyMaterial.delete({ where: { id } });
    return { deleted: true };
  }

  async listStudyMaterials(actor: { userId: number; role: UserRole }) {
    if (actor.role === UserRole.SECRETARIA) {
      return this.prisma.studyMaterial.findMany({ orderBy: { id: 'desc' } });
    }
    if (actor.role === UserRole.PROFESOR) {
      // Materiales en grupos donde el profesor enseña
      const assigns = await this.prisma.teacherAssignment.findMany({ where: { teacherId: actor.userId } });
      const groupIds = assigns.map(a => a.groupId);
      const subjectIds = assigns.map(a => a.subjectId);
      return this.prisma.studyMaterial.findMany({
        where: { groupId: { in: groupIds }, subjectId: { in: subjectIds } },
        orderBy: { id: 'desc' },
      });
    }
    // Estudiante: visibilidad por grupo/grado
    const ctx = await this.getActorContext(actor);
    return this.prisma.studyMaterial.findMany({
      where: {
        OR: [
          { groupId: ctx!.groupId },
          {
            visibility: 'GRADE' as any,
            group: { gradeId: ctx!.gradeId },
          },
        ],
      },
      orderBy: { id: 'desc' },
    });
  }

  async getStudyMaterial(actor: { userId: number; role: UserRole }, id: number) {
    const material = await this.prisma.studyMaterial.findUnique({ where: { id }, include: { group: true } });
    if (!material) throw new NotFoundException('Material no encontrado');
    if (actor.role === UserRole.SECRETARIA) return material;
    if (actor.role === UserRole.PROFESOR) {
      const assign = await this.prisma.teacherAssignment.findUnique({
        where: { teacherId_groupId_subjectId: { teacherId: actor.userId, groupId: material.groupId, subjectId: material.subjectId } },
      });
      if (!assign) throw new ForbiddenException('No autorizado');
      return material;
    }
    const ctx = await this.getActorContext(actor);
    const allowed = material.groupId === ctx!.groupId || (material.visibility as any) === 'GRADE' && material.group.gradeId === ctx!.gradeId;
    if (!allowed) throw new ForbiddenException('No autorizado');
    return material;
  }

  // Syllabus
  async createSyllabus(actor: { userId: number; role: UserRole }, dto: CreateSyllabusDto) {
    if (actor.role !== UserRole.PROFESOR) throw new ForbiddenException('Solo profesores');
    await this.ensureTeacherAssignment(actor.userId, dto.groupId, dto.subjectId);
    return this.prisma.syllabus.create({
      data: {
        subjectId: dto.subjectId,
        groupId: dto.groupId,
        teacherId: actor.userId,
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async updateSyllabus(actor: { userId: number; role: UserRole }, id: number, dto: UpdateSyllabusDto) {
    const syl = await this.prisma.syllabus.findUnique({ where: { id } });
    if (!syl) throw new NotFoundException('Temario no encontrado');
    if (actor.role !== UserRole.PROFESOR || syl.teacherId !== actor.userId) {
      throw new ForbiddenException('Solo el autor puede editar');
    }
    return this.prisma.syllabus.update({ where: { id }, data: { title: dto.title, content: dto.content } });
  }

  async deleteSyllabus(actor: { userId: number; role: UserRole }, id: number) {
    const syl = await this.prisma.syllabus.findUnique({ where: { id } });
    if (!syl) throw new NotFoundException('Temario no encontrado');
    if (actor.role !== UserRole.PROFESOR || syl.teacherId !== actor.userId) {
      throw new ForbiddenException('Solo el autor puede eliminar');
    }
    await this.prisma.syllabus.delete({ where: { id } });
    return { deleted: true };
  }

  async listSyllabi(actor: { userId: number; role: UserRole }) {
    if (actor.role === UserRole.SECRETARIA) {
      return this.prisma.syllabus.findMany({ orderBy: { id: 'desc' } });
    }
    if (actor.role === UserRole.PROFESOR) {
      const assigns = await this.prisma.teacherAssignment.findMany({ where: { teacherId: actor.userId } });
      const groupIds = assigns.map(a => a.groupId);
      const subjectIds = assigns.map(a => a.subjectId);
      return this.prisma.syllabus.findMany({ where: { groupId: { in: groupIds }, subjectId: { in: subjectIds } }, orderBy: { id: 'desc' } });
    }
    const ctx = await this.getActorContext(actor);
    return this.prisma.syllabus.findMany({
      where: {
        OR: [
          { groupId: ctx!.groupId },
          { group: { gradeId: ctx!.gradeId } }, // Syllabus siempre visibles por grado del grupo
        ],
      },
      orderBy: { id: 'desc' },
    });
  }

  async getSyllabus(actor: { userId: number; role: UserRole }, id: number) {
    const syl = await this.prisma.syllabus.findUnique({ where: { id }, include: { group: true } });
    if (!syl) throw new NotFoundException('Temario no encontrado');
    if (actor.role === UserRole.SECRETARIA) return syl;
    if (actor.role === UserRole.PROFESOR) {
      const assign = await this.prisma.teacherAssignment.findUnique({
        where: { teacherId_groupId_subjectId: { teacherId: actor.userId, groupId: syl.groupId, subjectId: syl.subjectId } },
      });
      if (!assign) throw new ForbiddenException('No autorizado');
      return syl;
    }
    const ctx = await this.getActorContext(actor);
    const allowed = syl.groupId === ctx!.groupId || syl.group.gradeId === ctx!.gradeId;
    if (!allowed) throw new ForbiddenException('No autorizado');
    return syl;
  }

  // Group Info (Leagues)
  async getGroupInfo(groupId: number) {
    const info = await this.prisma.groupInfo.findUnique({ where: { groupId } });
    return info ?? { groupId, summary: null, highlights: [], metrics: {}, links: [] };
  }

  async updateGroupInfo(actor: { userId: number; role: UserRole }, groupId: number, dto: UpdateGroupInfoDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (actor.role !== UserRole.PROFESOR || group.directorId !== actor.userId) {
      throw new ForbiddenException('Solo el director del grupo puede actualizar');
    }
    return this.prisma.groupInfo.upsert({
      where: { groupId },
      update: {
        summary: dto.summary ?? undefined,
        highlights: dto.highlights ? (dto.highlights as any) : undefined,
        metrics: dto.metrics ? (dto.metrics as any) : undefined,
        links: dto.links ? (dto.links as any) : undefined,
      },
      create: {
        groupId,
        summary: dto.summary ?? null,
        highlights: (dto.highlights as any) ?? undefined,
        metrics: (dto.metrics as any) ?? undefined,
        links: (dto.links as any) ?? undefined,
      },
    });
  }

  async listGradeLeagues(gradeId: number) {
    const groups = await this.prisma.group.findMany({ where: { gradeId }, include: { info: true } });
    return groups.map(g => ({
      groupId: g.id,
      nombre: g.nombre,
      info: g.info ?? { summary: null, highlights: [], metrics: {}, links: [] },
    }));
  }
}
