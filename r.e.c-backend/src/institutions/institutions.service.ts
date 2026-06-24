import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../common/cache/cache.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { ProvisionInstitutionDto } from './dto/provision-institution.dto';
import { UserRole } from '../users/dto/user-role.enum';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { AcademicPeriodStatus } from '@prisma/client';

function createId(): string {
  return 'c' + randomBytes(16).toString('hex');
}

@Injectable()
export class InstitutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  private institutionSelect = {
    publicId: true,
    nombre: true,
    slug: true,
    codigo: true,
    dominio: true,
    maxUsers: true,
    activa: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async create(dto: CreateInstitutionDto) {
    return this.prisma.institution.create({
      data: {
        nombre: dto.nombre,
        slug: dto.slug,
        codigo: dto.codigo,
        dominio: dto.dominio,

        maxUsers: dto.maxUsers ?? 500,
      },
      select: this.institutionSelect,
    });
  }

  async findAll() {
    // 2 queries fijas independientemente del número de instituciones (antes: 1 + N)
    const [institutions, countRows] = await Promise.all([
      this.prisma.institution.findMany({
        orderBy: { id: 'asc' },
        select: { ...this.institutionSelect, id: true },
      }),
      this.prisma.user.groupBy({
        by: ['institutionId'],
        where: { role: { not: 'SECRETARIA' }, institutionId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map(
      countRows.map((r) => [r.institutionId, r._count._all]),
    );

    return institutions.map(({ id: _id, ...inst }) => ({
      ...inst,
      usersCount: countMap.get(_id) ?? 0,
    }));
  }

  async findOne(id: number) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      select: this.institutionSelect,
    });

    if (!institution) {
      throw new NotFoundException('Institucion no encontrada');
    }

    // Agregar conteo de usuarios no-SECRETARIA
    const usersCount = await this.prisma.user.count({
      where: {
        institutionId: id,
        role: { not: 'SECRETARIA' },
      },
    });

    return { ...institution, usersCount };
  }

  async findOneByPublicId(publicId: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { publicId },
      select: { ...this.institutionSelect, id: true },
    });

    if (!institution) {
      throw new NotFoundException('Institucion no encontrada');
    }

    const usersCount = await this.prisma.user.count({
      where: {
        institutionId: institution.id,
        role: { not: 'SECRETARIA' },
      },
    });

    // Exclude internal `id` from response — expose publicId only
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = institution;
    return { ...rest, usersCount };
  }

  private async resolveInternalId(publicId: string): Promise<number> {
    const inst = await this.prisma.institution.findUnique({
      where: { publicId },
      select: { id: true },
    });
    if (!inst) throw new NotFoundException('Institucion no encontrada');
    return inst.id;
  }

  async update(id: number, dto: UpdateInstitutionDto) {
    const current = await this.findOne(id);

    const updated = await this.prisma.institution.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        slug: dto.slug,
        codigo: dto.codigo,
        dominio: dto.dominio,
        activa: dto.activa,
        maxUsers: dto.maxUsers,
      },
      select: this.institutionSelect,
    });

    // Si la institución se inactiva, revocar todas las sesiones activas de sus usuarios
    // e invalidar la caché de estado activo para que el guard lo detecte inmediatamente
    if (dto.activa === false && current.activa === true) {
      const userIds = await this.prisma.user.findMany({
        where: { institutionId: id },
        select: { id: true },
      });
      if (userIds.length > 0) {
        await this.prisma.authSession.updateMany({
          where: {
            userId: { in: userIds.map((u) => u.id) },
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      }
      // Invalidar caché para que TenantBoundaryGuard lo detecte de inmediato
      await this.cache.del(`inst_active:${id}`);
    }
    // Si se reactiva, también invalidar caché
    if (dto.activa === true && current.activa === false) {
      await this.cache.del(`inst_active:${id}`);
    }

    // Agregar conteo de usuarios no-SECRETARIA
    const usersCount = await this.prisma.user.count({
      where: {
        institutionId: id,
        role: { not: 'SECRETARIA' },
      },
    });

    return { ...updated, usersCount };
  }

  async updateByPublicId(publicId: string, dto: UpdateInstitutionDto) {
    const internalId = await this.resolveInternalId(publicId);
    return this.update(internalId, dto);
  }

  async provision(dto: ProvisionInstitutionDto) {
    if (!dto.secretarias || dto.secretarias.length === 0) {
      throw new BadRequestException(
        'Se requiere al menos una secretaria para provisionar la institución',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          nombre: dto.institution.nombre,
          slug: dto.institution.slug,
          codigo: dto.institution.codigo,
          dominio: dto.institution.dominio,
          maxUsers: dto.institution.maxUsers ?? 500,
        },
      });

      const secretarias = await Promise.all(
        dto.secretarias.map(async (sec) => {
          if (!sec.password || sec.password.length < 8) {
            throw new BadRequestException(
              'Cada secretaria debe tener una contraseña de al menos 8 caracteres',
            );
          }

          const codigo = createId();
          const hashedPassword = await bcrypt.hash(sec.password, 10);

          return tx.user.create({
            data: {
              institutionId: institution.id,
              nombres: sec.nombres,
              apellidos: sec.apellidos,
              email: sec.email.trim().toLowerCase(),
              password: hashedPassword,
              codigo,
              role: UserRole.SECRETARIA,
            },
            select: {
              publicId: true,
              nombres: true,
              apellidos: true,
              email: true,
              codigo: true,
              role: true,
              institutionId: true,
            },
          });
        }),
      );

      return {
        institution: {
          publicId: institution.publicId,
          nombre: institution.nombre,
          slug: institution.slug,
          maxUsers: institution.maxUsers,
          activa: institution.activa,
        },
        secretarias,
      };
    });
  }

  async deleteByPublicId(publicId: string) {
    const internalId = await this.resolveInternalId(publicId);
    return this.delete(internalId);
  }

  async listPeriodsByPublicId(publicId: string) {
    const internalId = await this.resolveInternalId(publicId);
    return this.listPeriods(internalId);
  }

  async getActivePeriodByPublicId(publicId: string) {
    const internalId = await this.resolveInternalId(publicId);
    return this.getActivePeriod(internalId);
  }

  async createPeriodByPublicId(
    publicId: string,
    dto: {
      nombre: string;
      codigo: string;
      tipo?: string;
      fechaInicio: string;
      fechaFin: string;
    },
  ) {
    const internalId = await this.resolveInternalId(publicId);
    return this.createPeriod(internalId, dto);
  }

  async activatePeriodByPublicId(publicId: string, periodId: number) {
    const internalId = await this.resolveInternalId(publicId);
    return this.activatePeriod(internalId, periodId);
  }

  async closePeriodByPublicId(publicId: string, periodId: number) {
    const internalId = await this.resolveInternalId(publicId);
    return this.closePeriod(internalId, periodId);
  }

  async updatePeriodByPublicId(
    publicId: string,
    periodId: number,
    dto: {
      nombre?: string;
      codigo?: string;
      tipo?: string;
      fechaInicio?: string;
      fechaFin?: string;
    },
  ) {
    const internalId = await this.resolveInternalId(publicId);
    return this.updatePeriod(internalId, periodId, dto);
  }

  async deletePeriodByPublicId(publicId: string, periodId: number) {
    const internalId = await this.resolveInternalId(publicId);
    return this.deletePeriod(internalId, periodId);
  }

  async listPeriods(institutionId: number) {
    return this.prisma.academicPeriod.findMany({
      where: { institutionId },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async getActivePeriod(institutionId: number) {
    return this.prisma.academicPeriod.findFirst({
      where: { institutionId, estado: AcademicPeriodStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPeriod(
    institutionId: number,
    dto: {
      nombre: string;
      codigo: string;
      tipo?: string;
      fechaInicio: string;
      fechaFin: string;
    },
  ) {
    const existing = await this.prisma.academicPeriod.findUnique({
      where: {
        institutionId_codigo: { institutionId, codigo: dto.codigo },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Ya existe un periodo con codigo "${dto.codigo}" en esta institucion`,
      );
    }

    return this.prisma.academicPeriod.create({
      data: {
        institutionId,
        nombre: dto.nombre,
        codigo: dto.codigo,
        tipo: (dto.tipo ?? 'TERM') as 'TERM' | 'RECOVERY' | 'INTERSESSION',
        estado: AcademicPeriodStatus.ACTIVE,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
      },
    });
  }

  async activatePeriod(institutionId: number, periodId: number) {
    const period = await this.prisma.academicPeriod.findFirst({
      where: { id: periodId, institutionId },
    });
    if (!period) throw new NotFoundException('Periodo no encontrado');

    await this.prisma.$transaction([
      this.prisma.academicPeriod.updateMany({
        where: { institutionId, estado: AcademicPeriodStatus.ACTIVE },
        data: { estado: AcademicPeriodStatus.CLOSED },
      }),
      this.prisma.academicPeriod.update({
        where: { id: periodId },
        data: { estado: AcademicPeriodStatus.ACTIVE },
      }),
    ]);

    return this.prisma.academicPeriod.findUnique({
      where: { id: periodId },
    });
  }

  async closePeriod(institutionId: number, periodId: number) {
    const period = await this.prisma.academicPeriod.findFirst({
      where: { id: periodId, institutionId },
    });
    if (!period) throw new NotFoundException('Periodo no encontrado');

    return this.prisma.academicPeriod.update({
      where: { id: periodId },
      data: {
        estado: AcademicPeriodStatus.CLOSED,
        fechaCierre: new Date(),
      },
    });
  }

  async updatePeriod(
    institutionId: number,
    periodId: number,
    dto: {
      nombre?: string;
      codigo?: string;
      tipo?: string;
      fechaInicio?: string;
      fechaFin?: string;
    },
  ) {
    const period = await this.prisma.academicPeriod.findFirst({
      where: { id: periodId, institutionId },
    });
    if (!period) throw new NotFoundException('Periodo no encontrado');

    return this.prisma.academicPeriod.update({
      where: { id: periodId },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
        ...(dto.codigo !== undefined ? { codigo: dto.codigo } : {}),
        ...(dto.tipo !== undefined
          ? { tipo: dto.tipo as 'TERM' | 'RECOVERY' | 'INTERSESSION' }
          : {}),
        ...(dto.fechaInicio
          ? { fechaInicio: new Date(dto.fechaInicio) }
          : {}),
        ...(dto.fechaFin ? { fechaFin: new Date(dto.fechaFin) } : {}),
      },
    });
  }

  async deletePeriod(institutionId: number, periodId: number) {
    const period = await this.prisma.academicPeriod.findFirst({
      where: { id: periodId, institutionId },
    });
    if (!period) throw new NotFoundException('Periodo no encontrado');

    return this.prisma.academicPeriod.delete({ where: { id: periodId } });
  }

  async delete(institutionId: number) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) throw new NotFoundException('Institucion no encontrada');

    await this.prisma.$transaction(async (tx) => {
      // Obtener IDs de usuarios de la institución
      const users = await tx.user.findMany({
        where: { institutionId },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      if (userIds.length > 0) {
        // Borrar datos de comunicación ligados a usuarios
        await tx.message.deleteMany({
          where: {
            OR: [
              { senderId: { in: userIds } },
              { recipientId: { in: userIds } },
            ],
          },
        });
        await tx.notification.deleteMany({
          where: { userId: { in: userIds } },
        });
        await tx.feedback.deleteMany({ where: { teacherId: { in: userIds } } });
        await tx.authSession.deleteMany({ where: { userId: { in: userIds } } });

        // Borrar recuperaciones ligadas a usuarios
        await tx.recoveryMessage.deleteMany({
          where: { authorId: { in: userIds } },
        });
        const recoveryRequests = await tx.recoveryRequest.findMany({
          where: {
            OR: [
              { studentId: { in: userIds } },
              { teacherId: { in: userIds } },
            ],
          },
          select: { id: true },
        });
        if (recoveryRequests.length > 0) {
          const rrIds = recoveryRequests.map((r) => r.id);
          const activities = await tx.recoveryActivity.findMany({
            where: { requestId: { in: rrIds } },
            select: { id: true },
          });
          if (activities.length > 0) {
            await tx.recoveryActivityAttachment.deleteMany({
              where: { activityId: { in: activities.map((a) => a.id) } },
            });
            await tx.recoveryActivity.deleteMany({
              where: { id: { in: activities.map((a) => a.id) } },
            });
          }
          await tx.recoveryRequest.deleteMany({ where: { id: { in: rrIds } } });
        }
      }

      // Obtener grupos de la institución para borrar en cascada
      const groups = await tx.group.findMany({
        where: { institutionId },
        select: { id: true },
      });
      const groupIds = groups.map((g) => g.id);

      if (groupIds.length > 0) {
        // Borrar asignaciones de estudiantes
        await tx.studentGroup.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        // Borrar asignaciones de profesores
        await tx.teacherAssignment.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        // Borrar horarios
        await tx.weeklyScheduleEntry.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        await tx.scheduleNote.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        await tx.scheduleEvent.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        // Borrar materiales de estudio
        await tx.studyMaterial.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        // Borrar ofrendas académicas
        await tx.academicOffering.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        // Borrar evaluaciones
        const offerings = await tx.academicOffering.findMany({
          where: { groupId: { in: groupIds } },
          select: { id: true },
        });
        if (offerings.length > 0) {
          await tx.academicEvaluation.deleteMany({
            where: { academicOfferingId: { in: offerings.map((o) => o.id) } },
          });
        }
        // Borrar rendimiento por grado
        await tx.gradePerformance.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        // Borrar registros académicos de estudiantes
        await tx.studentAcademicRecord.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        // Borrar relaciones grupo-materia
        await tx.groupSubject.deleteMany({
          where: { groupId: { in: groupIds } },
        });
        // Borrar info de grupo
        await tx.groupInfo.deleteMany({ where: { groupId: { in: groupIds } } });
      }

      // Borrar usuarios de la institución
      await tx.user.deleteMany({ where: { institutionId } });

      // Borrar períodos académicos (cascade maneja recoveryConfig, recoverySchedule, syllabus)
      await tx.academicPeriod.deleteMany({ where: { institutionId } });

      // Borrar materias de la institución
      await tx.subject.deleteMany({ where: { institutionId } });

      // Borrar grados de la institución
      await tx.grade.deleteMany({ where: { institutionId } });

      // Borrar grupos de la institución
      await tx.group.deleteMany({ where: { institutionId } });

      // Finalmente, borrar la institución
      await tx.institution.delete({ where: { id: institutionId } });
    });

    return { deleted: true, id: institutionId };
  }
}
