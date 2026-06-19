import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../users/dto/user-role.enum';
import { Actor } from '../tenant';

@Injectable()
export class PublicIdResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolveGroup(publicId: string, actor: Actor): Promise<number> {
    const group = await this.prisma.group.findFirst({
      where: {
        publicId,
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { institutionId: actor.institutionId! }),
      },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return group.id;
  }

  async resolveSubject(publicId: string, actor: Actor): Promise<number> {
    const subject = await this.prisma.subject.findFirst({
      where: {
        publicId,
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { institutionId: actor.institutionId! }),
      },
      select: { id: true },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    return subject.id;
  }

  async resolveGrade(publicId: string, actor: Actor): Promise<number> {
    const grade = await this.prisma.grade.findFirst({
      where: {
        publicId,
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { institutionId: actor.institutionId! }),
      },
      select: { id: true },
    });
    if (!grade) throw new NotFoundException('Grado no encontrado');
    return grade.id;
  }

  async resolveUser(publicId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { publicId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user.id;
  }

  async resolveStudent(publicId: string, actor: Actor): Promise<number> {
    const id = await this.resolveUser(publicId);
    const student = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.ESTUDIANTE,
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { institutionId: actor.institutionId! }),
      },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Estudiante no encontrado');
    return student.id;
  }
}
