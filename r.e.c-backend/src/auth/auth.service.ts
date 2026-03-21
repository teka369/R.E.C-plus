import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        institution: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            activa: true,
            plan: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    // Comparación estricta con hashing (sin compatibilidad texto plano)
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    if (
      user.role !== 'SUPER_ADMIN' &&
      user.institution &&
      user.institution.activa === false
    ) {
      throw new UnauthorizedException('La institución está inactiva');
    }
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      institutionId: user.institutionId ?? null,
    };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId ?? null,
        institution: user.institution
          ? {
              id: user.institution.id,
              nombre: user.institution.nombre,
              slug: user.institution.slug,
              plan: user.institution.plan,
            }
          : null,
      },
    };
  }
}
