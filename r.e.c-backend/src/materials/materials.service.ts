import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  AcademicPeriodStatus,
  EnrollmentStatus,
  MaterialType,
  Prisma,
  SyllabusStatus,
  Visibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppGatewayService } from '../gateway/app-gateway.service';
import { FirebaseAdminService } from '../services/firebase-admin.service';
import { UsersService } from '../users/users.service';
import { CreateStudyMaterialDto } from './dto/create-study-material.dto';
import { UpdateStudyMaterialDto } from './dto/update-study-material.dto';
import { CreateSyllabusDto } from './dto/create-syllabus.dto';
import { UpdateSyllabusDto } from './dto/update-syllabus.dto';
import { UpdateGroupInfoDto } from './dto/update-group-info.dto';
import { validateMimeFromBuffer } from '../common/validators/file-mime.validator';
import { UserRole } from '../users/dto/user-role.enum';
import {
  PaginationQuery,
  paginateParams,
  buildPaginatedResult,
  PaginatedResult,
} from '../common/dto/pagination.dto';

import { Actor } from '../common/tenant';
import { TenantScopedService } from '../common/tenant-scoped.service';

@Injectable()
export class MaterialsService extends TenantScopedService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appGatewayService: AppGatewayService,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly usersService: UsersService,
  ) {
    super();
  }

  private readonly uploadsRoot = path.join(process.cwd(), 'uploads');

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

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  // Utilidades
  private async ensureTeacherAssignment(
    actor: Actor,
    groupId: number,
    subjectId: number,
  ) {
    if (actor.role !== UserRole.PROFESOR) {
      throw new ForbiddenException('Solo profesores');
    }

    const assign = await this.prisma.teacherAssignment.findUnique({
      where: {
        teacherId_groupId_subjectId: {
          teacherId: actor.userId,
          groupId,
          subjectId,
        },
      },
      include: { group: { select: { institutionId: true } } },
    });
    if (!assign)
      throw new ForbiddenException('No asignado a ese grupo/materia');
    if (assign.group.institutionId !== this.getActorInstitutionId(actor)) {
      throw new ForbiddenException(
        'Asignacion fuera del alcance de su institucion',
      );
    }
    return assign;
  }

  private async getActorContext(actor: Actor) {
    if (actor.role === UserRole.ESTUDIANTE) {
      const sg = await this.prisma.studentGroup.findFirst({
        where: {
          studentId: actor.userId,
          group: this.scopeToInstitution(actor),
        },
      });
      if (!sg) throw new ForbiddenException('Estudiante sin grupo asignado');
      const group = await this.prisma.group.findFirst({
        where: { id: sg.groupId, ...this.scopeToInstitution(actor) },
      });
      if (!group) throw new NotFoundException('Grupo no encontrado');
      return { groupId: group.id, gradeId: group.gradeId };
    }
    return null;
  }

  // Study Materials
  async uploadStudyFile(
    actor: Actor,
    groupId: number,
    subjectId: number,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ) {
    if (actor.role !== UserRole.PROFESOR)
      throw new ForbiddenException('Solo profesores');
    await this.ensureTeacherAssignment(actor, groupId, subjectId);
    if (!file?.buffer || !file.originalname || !file.mimetype) {
      throw new BadRequestException('Archivo inválido');
    }
    if (file.buffer.length > 25 * 1024 * 1024) {
      throw new BadRequestException('El archivo supera el límite de 25MB');
    }

    const ALLOWED_MIME = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/ogg',
      'audio/wav',
    ]);
    const detectedMime = await validateMimeFromBuffer(
      file.buffer,
      ALLOWED_MIME,
      'Material de estudio',
    );

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
      mimeType: detectedMime,
      size: file.buffer.length,
    };
  }

  async createStudyMaterial(actor: Actor, dto: CreateStudyMaterialDto) {
    if (actor.role !== UserRole.PROFESOR)
      throw new ForbiddenException('Solo profesores');
    await this.ensureTeacherAssignment(actor, dto.groupId, dto.subjectId);
    let result = await this.prisma.studyMaterial.create({
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

    // Enlace a AcademicOffering (best-effort)
    try {
      const activePeriod = await this.prisma.academicPeriod.findFirst({
        where: {
          estado: AcademicPeriodStatus.ACTIVE,
          institutionId: this.getActorInstitutionId(actor),
        },
        orderBy: { createdAt: 'desc' },
      });
      if (activePeriod) {
        const offering = await this.prisma.academicOffering.findUnique({
          where: {
            groupId_subjectId_academicPeriodId: {
              groupId: dto.groupId,
              subjectId: dto.subjectId,
              academicPeriodId: activePeriod.id,
            },
          },
        });
        if (offering) {
          result = await this.prisma.studyMaterial.update({
            where: { id: result.id },
            data: { academicOfferingId: offering.id },
          });
        }
      }
    } catch {
      // No critico
    }

    await this.notifyGroup(
      dto.groupId,
      '📚 Nuevo material disponible',
      `Tu profesor publicó "${dto.title}" en ${result.type === 'PDF' ? 'PDF' : result.type === 'VIDEO' ? 'video' : 'enlace'}.`,
      'MATERIAL',
    );

    return result;
  }

  async updateStudyMaterial(
    actor: Actor,
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
    const updated = await this.prisma.studyMaterial.update({
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
    await this.notifyGroup(
      material.groupId,
      '📚 Material actualizado',
      `El material "${material.title}" fue actualizado por tu profesor.`,
      'MATERIAL',
    );
    return updated;
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

  async deleteStudyMaterial(actor: Actor, id: number) {
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
          this.logger.warn(`No se pudo eliminar archivo: ${absolutePath}`, e);
        }
      }
    }

    await this.notifyGroup(
      material.groupId,
      '🗑️ Material eliminado',
      `El material "${material.title}" fue eliminado.`,
      'MATERIAL',
    );

    await this.prisma.studyMaterial.delete({ where: { id } });
    return { deleted: true };
  }

  async listStudyMaterials(
    actor: Actor,
    pagination?: PaginationQuery,
  ): Promise<PaginatedResult<object>> {
    const { skip, take, page, limit } = paginateParams(pagination ?? {});

    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      const where =
        actor.role === UserRole.SUPER_ADMIN
          ? undefined
          : { group: this.scopeToInstitution(actor) };
      const [data, total] = await Promise.all([
        this.prisma.studyMaterial.findMany({
          where,
          skip,
          take,
          orderBy: { id: 'desc' },
        }),
        this.prisma.studyMaterial.count({ where }),
      ]);
      return buildPaginatedResult(data, total, page, limit);
    }
    if (actor.role === UserRole.PROFESOR) {
      const assigns = await this.prisma.teacherAssignment.findMany({
        where: {
          teacherId: actor.userId,
          group: this.scopeToInstitution(actor),
        },
      });
      const groupIds = assigns.map((a) => a.groupId);
      const subjectIds = assigns.map((a) => a.subjectId);
      const where = {
        groupId: { in: groupIds },
        subjectId: { in: subjectIds },
      };
      const [data, total] = await Promise.all([
        this.prisma.studyMaterial.findMany({
          where,
          skip,
          take,
          orderBy: { id: 'desc' },
        }),
        this.prisma.studyMaterial.count({ where }),
      ]);
      return buildPaginatedResult(data, total, page, limit);
    }
    const ctx = await this.getActorContext(actor);
    const where = {
      OR: [
        { groupId: ctx!.groupId },
        {
          visibility: Visibility.GRADE,
          group: { gradeId: ctx!.gradeId },
        },
      ],
    };
    const [data, total] = await Promise.all([
      this.prisma.studyMaterial.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
      }),
      this.prisma.studyMaterial.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  async getStudyMaterial(actor: Actor, id: number) {
    const material = await this.prisma.studyMaterial.findUnique({
      where: { id },
      include: { group: true },
    });
    if (!material) throw new NotFoundException('Material no encontrado');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      material.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException('No autorizado');
    }

    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      return material;
    }
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
    actor: Actor,
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

  async incrementStudyViews(actor: Actor, id: number) {
    await this.getStudyMaterial(actor, id);
    const updated = await this.prisma.studyMaterial.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { id: true, views: true, downloads: true },
    });
    return updated;
  }

  async incrementStudyDownloads(actor: Actor, id: number) {
    await this.getStudyMaterial(actor, id);
    const updated = await this.prisma.studyMaterial.update({
      where: { id },
      data: { downloads: { increment: 1 } },
      select: { id: true, views: true, downloads: true },
    });
    return updated;
  }

  // Syllabus
  async createSyllabus(actor: Actor, dto: CreateSyllabusDto) {
    if (actor.role !== UserRole.PROFESOR)
      throw new ForbiddenException('Solo profesores');
    await this.ensureTeacherAssignment(actor, dto.groupId, dto.subjectId);
    let result = await this.prisma.syllabus.create({
      data: {
        subjectId: dto.subjectId,
        groupId: dto.groupId,
        teacherId: actor.userId,
        title: dto.title,
        status:
          (dto.status as SyllabusStatus | undefined) ?? SyllabusStatus.BORRADOR,
        duration: dto.duration,
        content: dto.content,
      },
    });

    // Enlace a AcademicOffering (best-effort)
    try {
      const activePeriod = await this.prisma.academicPeriod.findFirst({
        where: {
          estado: AcademicPeriodStatus.ACTIVE,
          institutionId: this.getActorInstitutionId(actor),
        },
        orderBy: { createdAt: 'desc' },
      });
      if (activePeriod) {
        const offering = await this.prisma.academicOffering.findUnique({
          where: {
            groupId_subjectId_academicPeriodId: {
              groupId: dto.groupId,
              subjectId: dto.subjectId,
              academicPeriodId: activePeriod.id,
            },
          },
        });
        if (offering) {
          result = await this.prisma.syllabus.update({
            where: { id: result.id },
            data: { academicOfferingId: offering.id },
          });
        }
      }
    } catch {
      // No critico
    }

    await this.notifyGroup(
      dto.groupId,
      '📋 Nuevo temario publicado',
      `Tu profesor publicó el temario "${dto.title}".`,
      'MATERIAL',
    );

    return result;
  }

  async updateSyllabus(actor: Actor, id: number, dto: UpdateSyllabusDto) {
    const syl = await this.prisma.syllabus.findUnique({ where: { id } });
    if (!syl) throw new NotFoundException('Temario no encontrado');
    if (actor.role !== UserRole.PROFESOR || syl.teacherId !== actor.userId) {
      throw new ForbiddenException('Solo el autor puede editar');
    }
    const updated = await this.prisma.syllabus.update({
      where: { id },
      data: {
        title: dto.title,
        status: dto.status as SyllabusStatus | undefined,
        duration: dto.duration,
        content: dto.content,
      },
    });
    await this.notifyGroup(
      syl.groupId,
      '📋 Temario actualizado',
      `El temario "${syl.title}" fue actualizado.`,
      'MATERIAL',
    );
    return updated;
  }

  async deleteSyllabus(actor: Actor, id: number) {
    const syl = await this.prisma.syllabus.findUnique({ where: { id } });
    if (!syl) throw new NotFoundException('Temario no encontrado');
    if (actor.role !== UserRole.PROFESOR || syl.teacherId !== actor.userId) {
      throw new ForbiddenException('Solo el autor puede eliminar');
    }
    await this.notifyGroup(
      syl.groupId,
      '🗑️ Temario eliminado',
      `El temario "${syl.title}" fue eliminado.`,
      'MATERIAL',
    );
    await this.prisma.syllabus.delete({ where: { id } });
    return { deleted: true };
  }

  async listSyllabi(actor: Actor) {
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      return this.prisma.syllabus.findMany({
        where:
          actor.role === UserRole.SUPER_ADMIN
            ? undefined
            : { group: this.scopeToInstitution(actor) },
        orderBy: { id: 'desc' },
      });
    }
    if (actor.role === UserRole.PROFESOR) {
      const assigns = await this.prisma.teacherAssignment.findMany({
        where: {
          teacherId: actor.userId,
          group: this.scopeToInstitution(actor),
        },
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

  async getSyllabus(actor: Actor, id: number) {
    const syl = await this.prisma.syllabus.findUnique({
      where: { id },
      include: { group: true },
    });
    if (!syl) throw new NotFoundException('Temario no encontrado');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      syl.group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException('No autorizado');
    }

    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      return syl;
    }
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
  async getGroupInfo(actor: Actor, groupId: number) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ...this.scopeToInstitution(actor) },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const info = await this.prisma.groupInfo.findUnique({
      where: { groupId },
      include: {
        infoHighlights: { orderBy: { orden: 'asc' } },
        infoMetrics: { orderBy: { orden: 'asc' } },
        infoLinks: { orderBy: { orden: 'asc' } },
      },
    });
    if (!info)
      return { groupId, summary: null, highlights: [], metrics: {}, links: [] };
    return {
      groupId: info.groupId,
      summary: info.summary,
      highlights: info.infoHighlights.map((h) => h.texto),
      metrics: info.infoMetrics.reduce(
        (acc, m) => ({ ...acc, [m.etiqueta]: Number(m.valor) || m.valor }),
        {} as Record<string, unknown>,
      ),
      links: info.infoLinks.map((l) => l.url),
    };
  }

  async updateGroupInfo(
    actor: Actor,
    groupId: number,
    dto: UpdateGroupInfoDto,
  ) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, ...this.scopeToInstitution(actor) },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (actor.role !== UserRole.PROFESOR || group.directorId !== actor.userId) {
      throw new ForbiddenException(
        'Solo el director del grupo puede actualizar',
      );
    }
    // Upsert del registro raíz con solo el summary
    await this.prisma.groupInfo.upsert({
      where: { groupId },
      update: { summary: dto.summary ?? undefined },
      create: { groupId, summary: dto.summary ?? null },
    });
    // Sincronizar highlights
    if (dto.highlights !== undefined) {
      await this.prisma.groupInfoHighlight.deleteMany({ where: { groupId } });
      if (dto.highlights.length > 0) {
        await this.prisma.groupInfoHighlight.createMany({
          data: dto.highlights.map((texto, i) => ({
            groupId,
            texto,
            orden: i,
          })),
        });
      }
    }
    // Sincronizar metrics
    if (dto.metrics !== undefined && dto.metrics !== null) {
      await this.prisma.groupInfoMetric.deleteMany({ where: { groupId } });
      const metricRows = Object.entries(dto.metrics)
        .filter(([, v]) => v != null)
        .map(([k, v], i) => ({
          groupId,
          etiqueta: k,
          valor: String(v),
          orden: i,
        }));
      if (metricRows.length > 0) {
        await this.prisma.groupInfoMetric.createMany({ data: metricRows });
      }
    }
    // Sincronizar links
    if (dto.links !== undefined) {
      await this.prisma.groupInfoLink.deleteMany({ where: { groupId } });
      if (dto.links.length > 0) {
        await this.prisma.groupInfoLink.createMany({
          data: dto.links.map((url, i) => ({
            groupId,
            titulo: url,
            url,
            orden: i,
          })),
        });
      }
    }
    return this.getGroupInfo(actor, groupId);
  }

  async listGradeLeagues(actor: Actor, gradeId: number) {
    const groups = await this.prisma.group.findMany({
      where: {
        gradeId,
        ...this.scopeToInstitution(actor),
      },
      include: {
        info: {
          include: {
            infoHighlights: { orderBy: { orden: 'asc' } },
            infoMetrics: { orderBy: { orden: 'asc' } },
            infoLinks: { orderBy: { orden: 'asc' } },
          },
        },
      },
    });
    return groups.map((g) => ({
      groupId: g.id,
      nombre: g.nombre,
      info: g.info
        ? {
            summary: g.info.summary,
            highlights: g.info.infoHighlights.map((h) => h.texto),
            metrics: g.info.infoMetrics.reduce(
              (acc, m) => ({
                ...acc,
                [m.etiqueta]: Number(m.valor) || m.valor,
              }),
              {} as Record<string, unknown>,
            ),
            links: g.info.infoLinks.map((l) => l.url),
          }
        : { summary: null, highlights: [], metrics: {}, links: [] },
    }));
  }
}
