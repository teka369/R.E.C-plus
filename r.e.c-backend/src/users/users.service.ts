import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './dto/user-role.enum';
import * as bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';
import {
  PaginationQuery,
  paginateParams,
  buildPaginatedResult,
  PaginatedResult,
} from '../common/dto/pagination.dto';

import { Actor } from '../common/tenant';
import { TenantScopedService } from '../common/tenant-scoped.service';

@Injectable()
export class UsersService extends TenantScopedService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private normalizeRole(role?: UserRole): UserRole {
    if (role === UserRole.SUPER_ADMIN) return UserRole.SUPER_ADMIN;
    if (role === UserRole.PROFESOR) return UserRole.PROFESOR;
    if (role === UserRole.SECRETARIA) return UserRole.SECRETARIA;
    return UserRole.ESTUDIANTE;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private resolveTargetInstitution(
    actor: Actor,
    dto: { institutionId?: number },
  ): number | null {
    if (actor.role === UserRole.SUPER_ADMIN) {
      if (dto.institutionId !== undefined) return dto.institutionId;
      return null;
    }

    return this.getActorInstitutionId(actor);
  }

  private async assertTenantVisibility(
    actor: Actor,
    userId: number,
  ): Promise<void> {
    if (actor.role === UserRole.SUPER_ADMIN) return;

    const actorInstitutionId = this.getActorInstitutionId(actor);
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { institutionId: true },
    });

    if (!target || target.institutionId !== actorInstitutionId) {
      throw new BadRequestException(
        'Usuario fuera del alcance de su institucion',
      );
    }
  }

  private async assertTenantVisibilityByPublicId(
    actor: Actor,
    publicId: string,
  ): Promise<void> {
    if (actor.role === UserRole.SUPER_ADMIN) return;

    const actorInstitutionId = this.getActorInstitutionId(actor);
    const target = await this.prisma.user.findUnique({
      where: { publicId },
      select: { institutionId: true },
    });

    if (!target || target.institutionId !== actorInstitutionId) {
      throw new BadRequestException(
        'Usuario fuera del alcance de su institucion',
      );
    }
  }

  private async resolveInternalId(publicId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { publicId },
      select: { id: true },
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    return user.id;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Error desconocido';
  }

  async create(actor: Actor, data: CreateUserDto) {
    const role = this.normalizeRole(data.role);
    if (actor.role !== UserRole.SUPER_ADMIN && role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Solo SUPER_ADMIN puede crear usuarios SUPER_ADMIN',
      );
    }

    const institutionId = this.resolveTargetInstitution(actor, data);

    // Validar límite de usuarios solo si NO es SECRETARIA
    if (institutionId && role !== UserRole.SECRETARIA) {
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId },
        select: { maxUsers: true },
      });

      if (institution) {
        const usersCount = await this.prisma.user.count({
          where: {
            institutionId,
            role: { not: 'SECRETARIA' },
          },
        });

        if (usersCount >= institution.maxUsers) {
          throw new BadRequestException(
            `Límite de usuarios alcanzado. Máximo: ${institution.maxUsers}, Actuales: ${usersCount}. Contacte al administrador para aumentar.`,
          );
        }
      }
    }

    // Si no se provee contraseña, usar el código como contraseña inicial
    const codigo = createId();
    const password = data.password || codigo;
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        institutionId,
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: this.normalizeEmail(data.email),
        password: hashedPassword,
        codigo,
        role,
      },
      select: {
        id: true,
        publicId: true,
        institutionId: true,
        nombres: true,
        apellidos: true,
        email: true,
        codigo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(
    actor: Actor,
    role?: UserRole,
    institutionId?: number,
    pagination?: PaginationQuery,
  ): Promise<PaginatedResult<object>> {
    const resolvedRole = role ? this.normalizeRole(role) : undefined;
    const where =
      actor.role === UserRole.SUPER_ADMIN
        ? {
            ...(resolvedRole ? { role: resolvedRole } : {}),
            ...(institutionId ? { institutionId } : {}),
          }
        : {
            ...(resolvedRole ? { role: resolvedRole } : {}),
            institutionId: this.getActorInstitutionId(actor),
          };

    const { skip, take, page, limit } = paginateParams(pagination ?? {});

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          publicId: true,
          institutionId: true,
          nombres: true,
          apellidos: true,
          email: true,
          codigo: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { id: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(actor: Actor, id: number) {
    await this.assertTenantVisibility(actor, id);

    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        publicId: true,
        institutionId: true,
        nombres: true,
        apellidos: true,
        email: true,
        codigo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        institution: { select: { dominio: true } },
      },
    });
  }

  async findOneByPublicId(actor: Actor, publicId: string) {
    await this.assertTenantVisibilityByPublicId(actor, publicId);

    return this.prisma.user.findUnique({
      where: { publicId },
      select: {
        id: true,
        publicId: true,
        institutionId: true,
        nombres: true,
        apellidos: true,
        email: true,
        codigo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        institution: { select: { dominio: true } },
      },
    });
  }

  async update(actor: Actor, id: number, data: UpdateUserDto) {
    // Validar que id sea un número válido
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) {
      throw new BadRequestException('ID de usuario inválido');
    }

    await this.assertTenantVisibility(actor, id);

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      data.role === UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException(
        'Solo SUPER_ADMIN puede asignar rol SUPER_ADMIN',
      );
    }

    const updateInstitutionId =
      actor.role === UserRole.SUPER_ADMIN
        ? data.institutionId
        : this.getActorInstitutionId(actor);

    return this.prisma.user.update({
      where: { id },
      data: {
        institutionId:
          updateInstitutionId !== undefined ? updateInstitutionId : undefined,
        nombres: data.nombres ?? undefined,
        apellidos: data.apellidos ?? undefined,
        email: data.email ? this.normalizeEmail(data.email) : undefined,
        role: data.role ? this.normalizeRole(data.role) : undefined,
      },
      select: {
        id: true,
        publicId: true,
        institutionId: true,
        nombres: true,
        apellidos: true,
        email: true,
        codigo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateByPublicId(actor: Actor, publicId: string, data: UpdateUserDto) {
    const internalId = await this.resolveInternalId(publicId);
    return this.update(actor, internalId, data);
  }

  async removeByPublicId(actor: Actor, publicId: string) {
    const internalId = await this.resolveInternalId(publicId);
    return this.remove(actor, internalId);
  }

  async remove(actor: Actor, id: number) {
    await this.assertTenantVisibility(actor, id);

    return this.prisma.user.delete({ where: { id } });
  }

  // Registro masivo de usuarios con transacción
  async bulkCreate(actor: Actor, items: CreateUserDto[]) {
    const results: {
      index: number;
      id?: number;
      codigo?: string;
      error?: string;
    }[] = [];
    const actorInstitutionId =
      actor.role === UserRole.SUPER_ADMIN
        ? null
        : this.getActorInstitutionId(actor);

    for (let i = 0; i < items.length; i++) {
      const dto = items[i];
      try {
        const role = this.normalizeRole(dto.role);
        if (
          actor.role !== UserRole.SUPER_ADMIN &&
          role === UserRole.SUPER_ADMIN
        ) {
          results.push({
            index: i,
            error: 'Solo SUPER_ADMIN puede crear usuarios SUPER_ADMIN',
          });
          continue;
        }

        const institutionId =
          actor.role === UserRole.SUPER_ADMIN
            ? (dto.institutionId ?? null)
            : actorInstitutionId;

        // Si no se provee contraseña, usar el código como contraseña inicial
        const codigo = createId();
        const password = dto.password || codigo;
        const hashedPassword = await bcrypt.hash(password, 10);

        const created = await this.prisma.user.create({
          data: {
            institutionId,
            nombres: dto.nombres,
            apellidos: dto.apellidos,
            email: this.normalizeEmail(dto.email),
            password: hashedPassword,
            codigo,
            role,
          },
        });
        results.push({ index: i, id: created.id, codigo: created.codigo });
      } catch (error: unknown) {
        const msg = this.getErrorMessage(error);
        results.push({ index: i, error: msg });
      }
    }
    const created = results.filter((r) => r.id).length;
    const failed = results.filter((r) => r.error).length;
    return { created, failed, results };
  }

  // Método para cambiar contraseña
  async changePassword(id: number, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashed },
      select: {
        publicId: true,
        nombres: true,
        apellidos: true,
        email: true,
      },
    });
  }

  // Cambiar contraseña validando la actual (para el propio usuario)
  async changePasswordWithValidation(
    id: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    // Validación estricta: la contraseña almacenada debe estar hasheada
    const isHashed =
      typeof user.password === 'string' && user.password.startsWith('$2');
    if (!isHashed) {
      // Rechazar flujos inseguros: solicitar restablecimiento administrativo
      throw new BadRequestException(
        'La contraseña almacenada es inválida. Solicite un restablecimiento a Secretaría.',
      );
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid)
      throw new BadRequestException('La contraseña actual no es correcta');

    const hashed = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashed },
      select: {
        publicId: true,
        nombres: true,
        apellidos: true,
        email: true,
      },
    });
  }

  async changePasswordByPublicId(publicId: string, newPassword: string) {
    const internalId = await this.resolveInternalId(publicId);
    return this.changePassword(internalId, newPassword);
  }

  async changePasswordWithValidationByPublicId(
    publicId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const internalId = await this.resolveInternalId(publicId);
    return this.changePasswordWithValidation(
      internalId,
      currentPassword,
      newPassword,
    );
  }
}
