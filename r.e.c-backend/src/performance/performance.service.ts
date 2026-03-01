import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';
import { UpsertGradePerformanceDto } from './dto/performance.dto';

type GradePerformanceRow = {
  id: number;
  groupId: number;
  promedioGeneral: number | null;
  asistenciaPromedio: number | null;
  aprobacion: number | null;
  mejorAsignatura: string | null;
  estudiantesDestacados: string | null;
  inasistenciasJustificadas: number | null;
  inasistenciasInjustificadas: number | null;
  porcentajeCursoMayorAsistencia: number | null;
  variacionPromedio: number | null;
  variacionAprobacion: number | null;
  reduccionAusencias: number | null;
  tendenciaGeneral: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async findGroupByGradeName(grade: string) {
    const group = await this.prisma.group.findFirst({
      where: { nombre: grade },
    });
    if (!group) throw new NotFoundException('Grado/Grupo no encontrado');
    return group;
  }

  private async ensureWriteAccess(
    actor: { userId: number; role: UserRole },
    groupId: number,
  ) {
    if (actor.role === UserRole.SECRETARIA) return;

    if (actor.role === UserRole.PROFESOR) {
      const isDirector = await this.prisma.group.findFirst({
        where: { id: groupId, directorId: actor.userId },
      });
      if (isDirector) return;

      const assign = await this.prisma.teacherAssignment.findFirst({
        where: { groupId, teacherId: actor.userId },
      });
      if (assign) return;
    }

    throw new ForbiddenException(
      'No autorizado para editar estadísticas de este grupo',
    );
  }

  async getByGrade(grade: string) {
    const group = await this.findGroupByGradeName(grade);
    const rows = await this.prisma.$queryRaw<GradePerformanceRow[]>`
			SELECT *
			FROM "GradePerformance"
			WHERE "groupId" = ${group.id}
			LIMIT 1
		`;
    return rows[0] ?? null;
  }

  async getByGroup(groupId: number) {
    const rows = await this.prisma.$queryRaw<GradePerformanceRow[]>`
			SELECT *
			FROM "GradePerformance"
			WHERE "groupId" = ${groupId}
			LIMIT 1
		`;
    return rows[0] ?? null;
  }

  async upsertByGrade(
    actor: { userId: number; role: UserRole },
    grade: string,
    dto: UpsertGradePerformanceDto,
  ) {
    const group = await this.findGroupByGradeName(grade);
    await this.ensureWriteAccess(actor, group.id);

    await this.prisma.$executeRaw`
			INSERT INTO "GradePerformance" (
				"groupId",
				"promedioGeneral",
				"asistenciaPromedio",
				"aprobacion",
				"mejorAsignatura",
				"estudiantesDestacados",
				"inasistenciasJustificadas",
				"inasistenciasInjustificadas",
				"porcentajeCursoMayorAsistencia",
				"variacionPromedio",
				"variacionAprobacion",
				"reduccionAusencias",
				"tendenciaGeneral",
				"createdAt",
				"updatedAt"
			)
			VALUES (
				${group.id},
				${dto.promedioGeneral ?? null},
				${dto.asistenciaPromedio ?? null},
				${dto.aprobacion ?? null},
				${dto.mejorAsignatura ?? null},
				${dto.estudiantesDestacados ?? null},
				${dto.inasistenciasJustificadas ?? null},
				${dto.inasistenciasInjustificadas ?? null},
				${dto.porcentajeCursoMayorAsistencia ?? null},
				${dto.variacionPromedio ?? null},
				${dto.variacionAprobacion ?? null},
				${dto.reduccionAusencias ?? null},
				${dto.tendenciaGeneral ?? null},
				NOW(),
				NOW()
			)
			ON CONFLICT ("groupId")
			DO UPDATE SET
				"promedioGeneral" = EXCLUDED."promedioGeneral",
				"asistenciaPromedio" = EXCLUDED."asistenciaPromedio",
				"aprobacion" = EXCLUDED."aprobacion",
				"mejorAsignatura" = EXCLUDED."mejorAsignatura",
				"estudiantesDestacados" = EXCLUDED."estudiantesDestacados",
				"inasistenciasJustificadas" = EXCLUDED."inasistenciasJustificadas",
				"inasistenciasInjustificadas" = EXCLUDED."inasistenciasInjustificadas",
				"porcentajeCursoMayorAsistencia" = EXCLUDED."porcentajeCursoMayorAsistencia",
				"variacionPromedio" = EXCLUDED."variacionPromedio",
				"variacionAprobacion" = EXCLUDED."variacionAprobacion",
				"reduccionAusencias" = EXCLUDED."reduccionAusencias",
				"tendenciaGeneral" = EXCLUDED."tendenciaGeneral",
				"updatedAt" = NOW()
		`;

    const rows = await this.prisma.$queryRaw<GradePerformanceRow[]>`
			SELECT *
			FROM "GradePerformance"
			WHERE "groupId" = ${group.id}
			LIMIT 1
		`;
    return rows[0] ?? null;
  }
}
