import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { ProvisionInstitutionDto } from './dto/provision-institution.dto';
import { UserRole } from '../users/dto/user-role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  private institutionSelect = {
    id: true,
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
    const institutions = await this.prisma.institution.findMany({
      orderBy: { id: 'asc' },
      select: this.institutionSelect,
    });

    // Agregar conteo de usuarios no-SECRETARIA por institución
    const enriched = await Promise.all(
      institutions.map(async (inst) => {
        const usersCount = await this.prisma.user.count({
          where: {
            institutionId: inst.id,
            role: { not: 'SECRETARIA' },
          },
        });
        return { ...inst, usersCount };
      }),
    );

    return enriched;
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

  async update(id: number, dto: UpdateInstitutionDto) {
    await this.findOne(id);

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

    // Agregar conteo de usuarios no-SECRETARIA
    const usersCount = await this.prisma.user.count({
      where: {
        institutionId: id,
        role: { not: 'SECRETARIA' },
      },
    });

    return { ...updated, usersCount };
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

          const hashedPassword = await bcrypt.hash(sec.password, 10);

          return tx.user.create({
            data: {
              institutionId: institution.id,
              nombres: sec.nombres,
              apellidos: sec.apellidos,
              email: sec.email.trim().toLowerCase(),
              documento_identidad: sec.documento_identidad,
              password: hashedPassword,
              role: UserRole.SECRETARIA,
            },
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              email: true,
              role: true,
              institutionId: true,
            },
          });
        }),
      );

      return {
        institution: {
          id: institution.id,
          nombre: institution.nombre,
          slug: institution.slug,
          maxUsers: institution.maxUsers,
          activa: institution.activa,
        },
        secretarias,
      };
    });
  }
}
