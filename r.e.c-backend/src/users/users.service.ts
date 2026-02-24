import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '@prisma/client';
import { UserRole } from './dto/user-role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    // Validar que profesores tengan teléfono
    if (data.role === UserRole.PROFESOR && !data.telefono) {
      throw new BadRequestException('El teléfono es requerido para profesores');
    }

    // Para estudiantes, usar documento_identidad como contraseña inicial
    // Para profesores, la contraseña es requerida
    let password = data.password;
    
    if (data.role === UserRole.ESTUDIANTE || !data.role) {
      // Si es estudiante y no se proporciona contraseña, usar documento_identidad
      password = data.password || data.documento_identidad;
    } else if (data.role === UserRole.PROFESOR && !data.password) {
      throw new BadRequestException('La contraseña es requerida para profesores');
    }

    if (!password) {
      throw new BadRequestException('La contraseña es requerida');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      nombres: data.nombres,
      apellidos: data.apellidos,
      email: data.email,
      documento_identidad: data.documento_identidad,
      telefono: data.telefono || null,
      password: hashedPassword,
      role: data.role || UserRole.ESTUDIANTE,
    };

    return this.prisma.user.create({ data: userData as any });
  }

  async findAll(role?: UserRole) {
    return this.prisma.user.findMany({ 
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        documento_identidad: true,
        telefono: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // No incluir password en las consultas
      }
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({ 
      where: { id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        documento_identidad: true,
        telefono: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // No incluir password
      }
    });
  }

  async update(id: number, data: UpdateUserDto) {
    return this.prisma.user.update({ 
      where: { id }, 
      data: data as any,
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        documento_identidad: true,
        telefono: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  // Registro masivo de usuarios con transacción
  async bulkCreate(items: CreateUserDto[]) {
    const results: { index: number; id?: number; error?: string }[] = [];
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < items.length; i++) {
        const dto = items[i];
        try {
          // Reutiliza la lógica de create, pero usando el tx en lugar de prisma directo
          // Copiamos la lógica de validación/hasheo aquí para evitar salir del transaction
          if (dto.role === UserRole.PROFESOR && !dto.telefono) {
            throw new BadRequestException('El teléfono es requerido para profesores');
          }

          let password = dto.password;
          if (dto.role === UserRole.ESTUDIANTE || !dto.role) {
            password = dto.password || dto.documento_identidad;
          } else if (dto.role === UserRole.PROFESOR && !dto.password) {
            throw new BadRequestException('La contraseña es requerida para profesores');
          }
          if (!password) {
            throw new BadRequestException('La contraseña es requerida');
          }
          const hashedPassword = await bcrypt.hash(password, 10);

          const userData = {
            nombres: dto.nombres,
            apellidos: dto.apellidos,
            email: dto.email,
            documento_identidad: dto.documento_identidad,
            telefono: dto.telefono || null,
            password: hashedPassword,
            role: dto.role || UserRole.ESTUDIANTE,
          } as any;

          const created = await tx.user.create({ data: userData });
          results.push({ index: i, id: created.id });
        } catch (e: any) {
          const msg = e?.message || 'Error desconocido';
          results.push({ index: i, error: msg });
        }
      }
    });
    const created = results.filter(r => r.id).length;
    const failed = results.filter(r => r.error).length;
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
      }
    });
  }

  // Cambiar contraseña validando la actual (para el propio usuario)
  async changePasswordWithValidation(id: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    // Validación estricta: la contraseña almacenada debe estar hasheada
    const isHashed = typeof user.password === 'string' && user.password.startsWith('$2');
    if (!isHashed) {
      // Rechazar flujos inseguros: solicitar restablecimiento administrativo
      throw new BadRequestException('La contraseña almacenada es inválida. Solicite un restablecimiento a Secretaría.');
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('La contraseña actual no es correcta');

    const hashed = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashed },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
      }
    });
  }
}
