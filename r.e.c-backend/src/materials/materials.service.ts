import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { MaterialType, Prisma, Visibility } from '@prisma/client';
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

  private readonly uploadsRoot = path.join(process.cwd(), 'uploads');

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  // Utilidades
  private async ensureTeacherAssignment(
    teacherId: number,
    groupId: number,
    subjectId: number,
  ) {
    const assign = await this.prisma.teacherAssignment.findUnique({
      where: { teacherId_groupId_subjectId: { teacherId, groupId, subjectId } },
    });
    if (!assign)
      throw new ForbiddenException('No asignado a ese grupo/materia');
    return assign;
  }

  private async getActorContext(actor: { userId: number; role: UserRole }) {
    if (actor.role === UserRole.ESTUDIANTE) {
      const sg = await this.prisma.studentGroup.findFirst({
        where: { studentId: actor.userId },
      });
      if (!sg) throw new ForbiddenException('Estudiante sin grupo asignado');
      const group = await this.prisma.group.findUnique({
        where: { id: sg.groupId },
      });
      if (!group) throw new NotFoundException('Grupo no encontrado');
      return { groupId: group.id, gradeId: group.gradeId };
    }
    return null;
  }

  // Study Materials
  async uploadStudyFile(
    actor: { userId: number; role: UserRole },
    groupId: number,
    subjectId: number,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    if (actor.role !== UserRole.PROFESOR)
      throw new ForbiddenException('Solo profesores');
    await this.ensureTeacherAssignment(actor.userId, groupId, subjectId);
    if (!file?.buffer || !file.originalname || !file.mimetype) {
      throw new BadRequestException('Archivo inválido');
    }
    if (file.buffer.length > 25 * 1024 * 1024) {
      throw new BadRequestException('El archivo supera el límite de 25MB');
    }

    const safeBaseName =
      path
        .basename(file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 100) || 'archivo';

    // Estructura: study-materials/teacher-{id}/{yyyy-mm}/ para escalabilidad
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const storedName = `${Date.now()}-${randomUUID()}-${safeBaseName}`;
    const relativePath = path.join(
      'study-materials',
      `teacher-${actor.userId}`,
      yearMonth,
      storedName,
    );
    const absolutePath = path.join(this.uploadsRoot, relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer);

    return {
      filePath: relativePath.replace(/\\/g, '/'),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.buffer.length,
    };
  }

  async createStudyMaterial(
    actor: { userId: number; role: UserRole },
    dto: CreateStudyMaterialDto,
  ) {
    if (actor.role !== UserRole.PROFESOR)
      throw new ForbiddenException('Solo profesores');
    await this.ensureTeacherAssignment(
      actor.userId,
      dto.groupId,
      dto.subjectId,
    );
    return this.prisma.studyMaterial.create({
      data: {
        subjectId: dto.subjectId,
        groupId: dto.groupId,
        teacherId: actor.userId,
        title: dto.title,
        description: dto.description,
        type: dto.type as MaterialType,
        resourceUrl: dto.resourceUrl,
        imageUrl: dto.imageUrl,
        filePath: dto.filePath,
        visibility: dto.visibility as Visibility,
      },
    });
  }

  async updateStudyMaterial(
    actor: { userId: number; role: UserRole },
    id: number,
    dto: UpdateStudyMaterialDto,
  ) {
    const material = await this.prisma.studyMaterial.findUnique({
      where: { id },
    });
    if (!material) throw new NotFoundException('Material no encontrado');
    if (
      actor.role !== UserRole.PROFESOR ||
      material.teacherId !== actor.userId
    ) {
      throw new ForbiddenException('Solo el autor puede editar');
    }
    return this.prisma.studyMaterial.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: (dto.type as MaterialType | undefined) ?? undefined,
        resourceUrl: dto.resourceUrl,
        imageUrl: dto.imageUrl,
        filePath: dto.filePath,
        visibility: (dto.visibility as Visibility | undefined) ?? undefined,
      },
    });
  }

  private async cleanupEmptyDirs(dirPath: string): Promise<void> {
    try {
      const uploadsResolved = path.resolve(this.uploadsRoot);
      const dirResolved = path.resolve(dirPath);

      // Seguridad: solo limpiar dentro de uploadsRoot
      if (!dirResolved.startsWith(uploadsResolved)) return;

      // Subir recursivamente limpiando directorios vacíos
      let currentDir = dirPath;
      while (
        currentDir.startsWith(uploadsResolved) &&
        currentDir !== uploadsResolved
      ) {
        try {
          const files = await fs.readdir(currentDir);
          if (files.length === 0) {
            await fs.rmdir(currentDir);
            currentDir = path.dirname(currentDir);
          } else {
            break; // Directorio no vacío, parar
          }
        } catch {
          break;
        }
      }
    } catch {
      // Ignorar errores de limpieza, no es crítico
    }
  }

  async deleteStudyMaterial(
    actor: { userId: number; role: UserRole },
    id: number,
  ) {
    const material = await this.prisma.studyMaterial.findUnique({
      where: { id },
    });
    if (!material) throw new NotFoundException('Material no encontrado');
    if (
      actor.role !== UserRole.PROFESOR ||
      material.teacherId !== actor.userId
    ) {
      throw new ForbiddenException('Solo el autor puede eliminar');
    }

    // Eliminar archivo si existe
    if (material.filePath) {
      const normalized = path
        .normalize(material.filePath)
        .replace(/^([.][./\\])+/, '');
      const absolutePath = path.resolve(this.uploadsRoot, normalized);
      const uploadsResolved = path.resolve(this.uploadsRoot);

      // Validar que la ruta esté dentro de uploadsRoot
      if (absolutePath.startsWith(uploadsResolved)) {
        try {
          await fs.unlink(absolutePath);
          // Limpiar directorios vacíos
          await this.cleanupEmptyDirs(path.dirname(absolutePath));
        } catch (e) {
          // Log pero no fallar
          console.warn(`No se pudo eliminar archivo: ${absolutePath}`, e);
        }
      }
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
      const assigns = await this.prisma.teacherAssignment.findMany({
        where: { teacherId: actor.userId },
      });
      const groupIds = assigns.map((a) => a.groupId);
      const subjectIds = assigns.map((a) => a.subjectId);
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
            visibility: Visibility.GRADE,
            group: { gradeId: ctx!.gradeId },
          },
        ],
      },
      orderBy: { id: 'desc' },
    });
  }

  async getStudyMaterial(
    actor: { userId: number; role: UserRole },
    id: number,
  ) {
    const material = await this.prisma.studyMaterial.findUnique({
      where: { id },
      include: { group: true },
    });
    if (!material) throw new NotFoundException('Material no encontrado');
    if (actor.role === UserRole.SECRETARIA) return material;
    if (actor.role === UserRole.PROFESOR) {
      const assign = await this.prisma.teacherAssignment.findUnique({
        where: {
          teacherId_groupId_subjectId: {
            teacherId: actor.userId,
            groupId: material.groupId,
            subjectId: material.subjectId,
          },
        },
      });
      if (!assign) throw new ForbiddenException('No autorizado');
      return material;
    }
    const ctx = await this.getActorContext(actor);
    const allowed =
      material.groupId === ctx!.groupId ||
      (material.visibility === Visibility.GRADE &&
        material.group.gradeId === ctx!.gradeId);
    if (!allowed) throw new ForbiddenException('No autorizado');
    return material;
  }

  async getStudyFile(
    actor: { userId: number; role: UserRole },
    id: number,
  ): Promise<{ originalName: string; mimeType: string; fileContent: Buffer }> {
    const material = await this.getStudyMaterial(actor, id);
    if (!material.filePath) {
      throw new NotFoundException('El material no tiene archivo local');
    }

    const normalized = path
      .normalize(material.filePath)
      .replace(/^([.][./\\])+/, '');
    const absolutePath = path.resolve(this.uploadsRoot, normalized);
    const uploadsResolved = path.resolve(this.uploadsRoot);
    if (!absolutePath.startsWith(uploadsResolved)) {
      throw new BadRequestException('Ruta de archivo inválida');
    }

    let fileContent: Buffer;
    try {
      fileContent = await fs.readFile(absolutePath);
    } catch {
      throw new NotFoundException('Archivo local no encontrado');
    }

    const ext = path.extname(material.filePath).toLowerCase();
    const mimeByExt: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    return {
      originalName: path.basename(material.filePath),
      mimeType: mimeByExt[ext] ?? 'application/octet-stream',
      fileContent,
    };
  }

  async incrementStudyViews(
    actor: { userId: number; role: UserRole },
    id: number,
  ) {
    await this.getStudyMaterial(actor, id);
    const updated = await this.prisma.studyMaterial.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { id: true, views: true, downloads: true },
    });
    return updated;
  }

  async incrementStudyDownloads(
    actor: { userId: number; role: UserRole },
    id: number,
  ) {
    await this.getStudyMaterial(actor, id);
    const updated = await this.prisma.studyMaterial.update({
      where: { id },
      data: { downloads: { increment: 1 } },
      select: { id: true, views: true, downloads: true },
    });
    return updated;
  }

  // Syllabus
  async createSyllabus(
    actor: { userId: number; role: UserRole },
    dto: CreateSyllabusDto,
  ) {
    if (actor.role !== UserRole.PROFESOR)
      throw new ForbiddenException('Solo profesores');
    await this.ensureTeacherAssignment(
      actor.userId,
      dto.groupId,
      dto.subjectId,
    );
    return this.prisma.syllabus.create({
      data: {
        subjectId: dto.subjectId,
        groupId: dto.groupId,
        teacherId: actor.userId,
        title: dto.title,
        period: dto.period,
        status: dto.status ?? 'BORRADOR',
        duration: dto.duration,
        content: dto.content,
      },
    });
  }

  async updateSyllabus(
    actor: { userId: number; role: UserRole },
    id: number,
    dto: UpdateSyllabusDto,
  ) {
    const syl = await this.prisma.syllabus.findUnique({ where: { id } });
    if (!syl) throw new NotFoundException('Temario no encontrado');
    if (actor.role !== UserRole.PROFESOR || syl.teacherId !== actor.userId) {
      throw new ForbiddenException('Solo el autor puede editar');
    }
    return this.prisma.syllabus.update({
      where: { id },
      data: {
        title: dto.title,
        period: dto.period,
        status: dto.status,
        duration: dto.duration,
        content: dto.content,
      },
    });
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
      const assigns = await this.prisma.teacherAssignment.findMany({
        where: { teacherId: actor.userId },
      });
      const groupIds = assigns.map((a) => a.groupId);
      const subjectIds = assigns.map((a) => a.subjectId);
      return this.prisma.syllabus.findMany({
        where: { groupId: { in: groupIds }, subjectId: { in: subjectIds } },
        orderBy: { id: 'desc' },
      });
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
    const syl = await this.prisma.syllabus.findUnique({
      where: { id },
      include: { group: true },
    });
    if (!syl) throw new NotFoundException('Temario no encontrado');
    if (actor.role === UserRole.SECRETARIA) return syl;
    if (actor.role === UserRole.PROFESOR) {
      const assign = await this.prisma.teacherAssignment.findUnique({
        where: {
          teacherId_groupId_subjectId: {
            teacherId: actor.userId,
            groupId: syl.groupId,
            subjectId: syl.subjectId,
          },
        },
      });
      if (!assign) throw new ForbiddenException('No autorizado');
      return syl;
    }
    const ctx = await this.getActorContext(actor);
    const allowed =
      syl.groupId === ctx!.groupId || syl.group.gradeId === ctx!.gradeId;
    if (!allowed) throw new ForbiddenException('No autorizado');
    return syl;
  }

  // Group Info (Leagues)
  async getGroupInfo(groupId: number) {
    const info = await this.prisma.groupInfo.findUnique({ where: { groupId } });
    return (
      info ?? { groupId, summary: null, highlights: [], metrics: {}, links: [] }
    );
  }

  async updateGroupInfo(
    actor: { userId: number; role: UserRole },
    groupId: number,
    dto: UpdateGroupInfoDto,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (actor.role !== UserRole.PROFESOR || group.directorId !== actor.userId) {
      throw new ForbiddenException(
        'Solo el director del grupo puede actualizar',
      );
    }
    return this.prisma.groupInfo.upsert({
      where: { groupId },
      update: {
        summary: dto.summary ?? undefined,
        highlights: dto.highlights
          ? this.toJsonValue(dto.highlights)
          : undefined,
        metrics: dto.metrics ? this.toJsonValue(dto.metrics) : undefined,
        links: dto.links ? this.toJsonValue(dto.links) : undefined,
      },
      create: {
        groupId,
        summary: dto.summary ?? null,
        highlights: dto.highlights
          ? this.toJsonValue(dto.highlights)
          : undefined,
        metrics: dto.metrics ? this.toJsonValue(dto.metrics) : undefined,
        links: dto.links ? this.toJsonValue(dto.links) : undefined,
      },
    });
  }

  async listGradeLeagues(gradeId: number) {
    const groups = await this.prisma.group.findMany({
      where: { gradeId },
      include: { info: true },
    });
    return groups.map((g) => ({
      groupId: g.id,
      nombre: g.nombre,
      info: g.info ?? { summary: null, highlights: [], metrics: {}, links: [] },
    }));
  }
}
