import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './dto/user-role.enum';
import * as bcrypt from 'bcryptjs';

type Actor = {
  userId: number;
  role: UserRole;
  institutionId?: number | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeRole(role?: UserRole): UserRole {
    if (role === UserRole.SUPER_ADMIN) return UserRole.SUPER_ADMIN;
    if (role === UserRole.PROFESOR) return UserRole.PROFESOR;
    if (role === UserRole.SECRETARIA) return UserRole.SECRETARIA;
    return UserRole.ESTUDIANTE;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private ensureInstitutionForTenantActor(actor: Actor): number {
    if (actor.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Operacion valida solo para actores tenant',
      );
    }
    if (!actor.institutionId) {
      throw new BadRequestException(
        'El actor no tiene institucion asociada. Configure su cuenta antes de operar.',
      );
    }
    return actor.institutionId;
  }

  private resolveTargetInstitution(
    actor: Actor,
    dto: { institutionId?: number },
  ): number | null {
    if (actor.role === UserRole.SUPER_ADMIN) {
      if (dto.institutionId !== undefined) return dto.institutionId;
      return null;
    }

    return this.ensureInstitutionForTenantActor(actor);
  }

  private async assertTenantVisibility(
    actor: Actor,
    userId: number,
  ): Promise<void> {
    if (actor.role === UserRole.SUPER_ADMIN) return;

    const actorInstitutionId = this.ensureInstitutionForTenantActor(actor);
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

    // Validar que profesores tengan teléfono
    if (role === UserRole.PROFESOR && !data.telefono) {
      throw new BadRequestException('El teléfono es requerido para profesores');
    }

    // Para estudiantes, usar documento_identidad como contraseña inicial
    // Para profesores, la contraseña es requerida
    let password = data.password;

    if (role === UserRole.ESTUDIANTE) {
      // Si es estudiante y no se proporciona contraseña, usar documento_identidad
      password = data.password || data.documento_identidad;
    } else if (role === UserRole.PROFESOR && !data.password) {
      throw new BadRequestException(
        'La contraseña es requerida para profesores',
      );
    }

    if (!password) {
      throw new BadRequestException('La contraseña es requerida');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        institutionId,
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: this.normalizeEmail(data.email),
        documento_identidad: data.documento_identidad,
        telefono: data.telefono || null,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        institutionId: true,
        nombres: true,
        apellidos: true,
        email: true,
        documento_identidad: true,
        telefono: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(actor: Actor, role?: UserRole, institutionId?: number) {
    const resolvedRole = role ? this.normalizeRole(role) : undefined;
    const where =
      actor.role === UserRole.SUPER_ADMIN
        ? {
            ...(resolvedRole ? { role: resolvedRole } : {}),
            ...(institutionId ? { institutionId } : {}),
          }
        : {
            ...(resolvedRole ? { role: resolvedRole } : {}),
            institutionId: this.ensureInstitutionForTenantActor(actor),
          };

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        institutionId: true,
        nombres: true,
        apellidos: true,
        email: true,
        documento_identidad: true,
        telefono: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // No incluir password en las consultas
      },
    });
  }

  async findOne(actor: Actor, id: number) {
    await this.assertTenantVisibility(actor, id);

    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        institutionId: true,
        nombres: true,
        apellidos: true,
        email: true,
        documento_identidad: true,
        telefono: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // No incluir password
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
        : this.ensureInstitutionForTenantActor(actor);

    return this.prisma.user.update({
      where: { id },
      data: {
        institutionId:
          updateInstitutionId !== undefined ? updateInstitutionId : undefined,
        nombres: data.nombres ?? undefined,
        apellidos: data.apellidos ?? undefined,
        email: data.email ? this.normalizeEmail(data.email) : undefined,
        documento_identidad: data.documento_identidad ?? undefined,
        telefono: data.telefono ?? undefined,
        role: data.role ? this.normalizeRole(data.role) : undefined,
      },
      select: {
        id: true,
        institutionId: true,
        nombres: true,
        apellidos: true,
        email: true,
        documento_identidad: true,
        telefono: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(actor: Actor, id: number) {
    await this.assertTenantVisibility(actor, id);

    return this.prisma.user.delete({ where: { id } });
  }

  // Registro masivo de usuarios con transacción
  async bulkCreate(actor: Actor, items: CreateUserDto[]) {
    const results: { index: number; id?: number; error?: string }[] = [];
    const actorInstitutionId =
      actor.role === UserRole.SUPER_ADMIN
        ? null
        : this.ensureInstitutionForTenantActor(actor);

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < items.length; i++) {
        const dto = items[i];
        try {
          const role = this.normalizeRole(dto.role);
          if (
            actor.role !== UserRole.SUPER_ADMIN &&
            role === UserRole.SUPER_ADMIN
          ) {
            throw new BadRequestException(
              'Solo SUPER_ADMIN puede crear usuarios SUPER_ADMIN',
            );
          }

          const institutionId =
            actor.role === UserRole.SUPER_ADMIN
              ? (dto.institutionId ?? null)
              : actorInstitutionId;

          // Reutiliza la lógica de create, pero usando el tx en lugar de prisma directo
          // Copiamos la lógica de validación/hasheo aquí para evitar salir del transaction
          if (role === UserRole.PROFESOR && !dto.telefono) {
            throw new BadRequestException(
              'El teléfono es requerido para profesores',
            );
          }

          let password = dto.password;
          if (role === UserRole.ESTUDIANTE) {
            password = dto.password || dto.documento_identidad;
          } else if (role === UserRole.PROFESOR && !dto.password) {
            throw new BadRequestException(
              'La contraseña es requerida para profesores',
            );
          }
          if (!password) {
            throw new BadRequestException('La contraseña es requerida');
          }
          const hashedPassword = await bcrypt.hash(password, 10);

          const created = await tx.user.create({
            data: {
              institutionId,
              nombres: dto.nombres,
              apellidos: dto.apellidos,
              email: this.normalizeEmail(dto.email),
              documento_identidad: dto.documento_identidad,
              telefono: dto.telefono || null,
              password: hashedPassword,
              role,
            },
          });
          results.push({ index: i, id: created.id });
        } catch (error: unknown) {
          const msg = this.getErrorMessage(error);
          results.push({ index: i, error: msg });
        }
      }
    });
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
        id: true,
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
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
      },
    });
  }
}
