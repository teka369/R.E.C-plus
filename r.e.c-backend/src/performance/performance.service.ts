import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';
import { UpsertGradePerformanceDto } from './dto/performance.dto';
import { UpsertStudentAcademicDto } from './dto/student-academic.dto';

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

type Actor = { userId: number; role: UserRole };

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

  private async ensureWriteAccess(actor: Actor, groupId: number) {
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

  private average(values: Array<number | null | undefined>) {
    const present = values.filter((x): x is number => typeof x === 'number');
    if (present.length === 0) return null;
    const total = present.reduce((sum, item) => sum + item, 0);
    return Number((total / present.length).toFixed(2));
  }

  private async ensureCanViewStudentAcademic(actor: Actor, studentId: number) {
    if (actor.role === UserRole.SECRETARIA) return;
    if (actor.role === UserRole.ESTUDIANTE) {
      if (actor.userId !== studentId)
        throw new ForbiddenException('No autorizado');
      return;
    }

    const assignment = await this.prisma.studentGroup.findFirst({
      where: { studentId },
      select: { groupId: true },
    });
    if (!assignment)
      throw new NotFoundException('Estudiante sin grupo asignado');

    const isDirector = await this.prisma.group.findFirst({
      where: { id: assignment.groupId, directorId: actor.userId },
      select: { id: true },
    });
    if (isDirector) return;

    const teacherAssignment = await this.prisma.teacherAssignment.findFirst({
      where: { groupId: assignment.groupId, teacherId: actor.userId },
      select: { id: true },
    });
    if (!teacherAssignment) throw new ForbiddenException('No autorizado');
  }

  private async ensureCanManageGroupAcademic(actor: Actor, groupId: number) {
    if (actor.role === UserRole.SECRETARIA) return;

    const isDirector = await this.prisma.group.findFirst({
      where: { id: groupId, directorId: actor.userId },
      select: { id: true },
    });
    if (isDirector) return;

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { groupId, teacherId: actor.userId },
      select: { id: true },
    });
    if (!assignment)
      throw new ForbiddenException('No autorizado para este grupo');
  }

  private async ensureCanUpdateSubject(
    actor: Actor,
    groupId: number,
    subjectId: number,
  ) {
    if (actor.role === UserRole.SECRETARIA) return;

    const isDirector = await this.prisma.group.findFirst({
      where: { id: groupId, directorId: actor.userId },
      select: { id: true },
    });
    if (isDirector) return;

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        groupId,
        subjectId,
        teacherId: actor.userId,
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new ForbiddenException(
        'No autorizado para editar esta materia en el grupo',
      );
    }
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
    actor: Actor,
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

  async getStudentAcademic(actor: Actor, studentId: number) {
    await this.ensureCanViewStudentAcademic(actor, studentId);

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
      },
    });

    if (!student) throw new NotFoundException('Estudiante no encontrado');

    const studentGroup = await this.prisma.studentGroup.findFirst({
      where: { studentId },
      include: { group: { include: { grade: true } } },
    });

    if (!studentGroup)
      throw new NotFoundException('Estudiante sin grupo asignado');

    const records = await this.prisma.studentAcademicRecord.findMany({
      where: {
        studentId,
        groupId: studentGroup.groupId,
      },
      include: {
        subject: true,
      },
      orderBy: { subject: { nombre: 'asc' } },
    });

    const normalized = records.map((record) => {
      const promedioMateria = this.average([
        record.parcial1,
        record.parcial2,
        record.parcial3,
        record.parcial4,
      ]);

      return {
        id: record.id,
        subjectId: record.subjectId,
        subject: { id: record.subject.id, nombre: record.subject.nombre },
        parcial1: record.parcial1,
        parcial2: record.parcial2,
        parcial3: record.parcial3,
        parcial4: record.parcial4,
        notaFinal: record.notaFinal,
        promedioMateria,
        progresoMateria: record.progresoMateria,
        inasistenciasJustificadas: record.inasistenciasJustificadas,
        inasistenciasInjustificadas: record.inasistenciasInjustificadas,
        totalInasistencias:
          record.inasistenciasJustificadas + record.inasistenciasInjustificadas,
        observaciones: record.observaciones,
        updatedAt: record.updatedAt,
      };
    });

    const promedioGeneral = this.average(
      normalized.map((item) =>
        item.notaFinal != null ? item.notaFinal : item.promedioMateria,
      ),
    );

    const totalJustificadas = normalized.reduce(
      (acc, item) => acc + item.inasistenciasJustificadas,
      0,
    );
    const totalInjustificadas = normalized.reduce(
      (acc, item) => acc + item.inasistenciasInjustificadas,
      0,
    );

    return {
      student,
      group: {
        id: studentGroup.group.id,
        nombre: studentGroup.group.nombre,
        grade: {
          id: studentGroup.group.grade.id,
          nombre: studentGroup.group.grade.nombre,
        },
      },
      summary: {
        promedioGeneral,
        materiasConRegistro: normalized.length,
        inasistenciasJustificadas: totalJustificadas,
        inasistenciasInjustificadas: totalInjustificadas,
        totalInasistencias: totalJustificadas + totalInjustificadas,
      },
      records: normalized,
    };
  }

  async getGroupAcademicOverview(actor: Actor, groupId: number) {
    await this.ensureCanManageGroupAcademic(actor, groupId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        grade: true,
        subjects: { include: { subject: true } },
      },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const students = await this.prisma.studentGroup.findMany({
      where: { groupId },
      include: {
        student: {
          select: { id: true, nombres: true, apellidos: true, email: true },
        },
      },
      orderBy: { student: { apellidos: 'asc' } },
    });

    const records = await this.prisma.studentAcademicRecord.findMany({
      where: { groupId },
      include: { subject: true },
    });

    const byStudent = new Map<number, typeof records>();
    records.forEach((record) => {
      const list = byStudent.get(record.studentId) ?? [];
      list.push(record);
      byStudent.set(record.studentId, list);
    });

    const normalizedStudents = students.map((item) => {
      const studentRecords = byStudent.get(item.student.id) ?? [];

      const normalizedRecords = studentRecords.map((record) => {
        const promedioMateria = this.average([
          record.parcial1,
          record.parcial2,
          record.parcial3,
          record.parcial4,
        ]);
        return {
          id: record.id,
          subjectId: record.subjectId,
          subject: { id: record.subject.id, nombre: record.subject.nombre },
          parcial1: record.parcial1,
          parcial2: record.parcial2,
          parcial3: record.parcial3,
          parcial4: record.parcial4,
          notaFinal: record.notaFinal,
          promedioMateria,
          progresoMateria: record.progresoMateria,
          inasistenciasJustificadas: record.inasistenciasJustificadas,
          inasistenciasInjustificadas: record.inasistenciasInjustificadas,
          observaciones: record.observaciones,
          updatedAt: record.updatedAt,
        };
      });

      const promedioGeneral = this.average(
        normalizedRecords.map((record) =>
          record.notaFinal != null ? record.notaFinal : record.promedioMateria,
        ),
      );

      return {
        student: item.student,
        promedioGeneral,
        records: normalizedRecords,
      };
    });

    return {
      group: {
        id: group.id,
        nombre: group.nombre,
        grade: { id: group.grade.id, nombre: group.grade.nombre },
      },
      subjects: group.subjects.map((item) => ({
        id: item.subject.id,
        nombre: item.subject.nombre,
      })),
      students: normalizedStudents,
    };
  }

  async upsertStudentAcademic(
    actor: Actor,
    groupId: number,
    studentId: number,
    subjectId: number,
    dto: UpsertStudentAcademicDto,
  ) {
    await this.ensureCanManageGroupAcademic(actor, groupId);
    await this.ensureCanUpdateSubject(actor, groupId, subjectId);

    const studentGroup = await this.prisma.studentGroup.findFirst({
      where: { studentId, groupId },
      select: { id: true },
    });
    if (!studentGroup) {
      throw new NotFoundException('El estudiante no pertenece a ese grupo');
    }

    const groupSubject = await this.prisma.groupSubject.findFirst({
      where: { groupId, subjectId },
      select: { id: true },
    });
    if (!groupSubject) {
      throw new NotFoundException('La materia no está asignada a ese grupo');
    }

    const result = await this.prisma.studentAcademicRecord.upsert({
      where: {
        studentId_groupId_subjectId: {
          studentId,
          groupId,
          subjectId,
        },
      },
      update: {
        parcial1: dto.parcial1,
        parcial2: dto.parcial2,
        parcial3: dto.parcial3,
        parcial4: dto.parcial4,
        notaFinal: dto.notaFinal,
        progresoMateria: dto.progresoMateria,
        inasistenciasJustificadas: dto.inasistenciasJustificadas ?? 0,
        inasistenciasInjustificadas: dto.inasistenciasInjustificadas ?? 0,
        observaciones: dto.observaciones,
        updatedByTeacherId: actor.userId,
      },
      create: {
        studentId,
        groupId,
        subjectId,
        parcial1: dto.parcial1,
        parcial2: dto.parcial2,
        parcial3: dto.parcial3,
        parcial4: dto.parcial4,
        notaFinal: dto.notaFinal,
        progresoMateria: dto.progresoMateria,
        inasistenciasJustificadas: dto.inasistenciasJustificadas ?? 0,
        inasistenciasInjustificadas: dto.inasistenciasInjustificadas ?? 0,
        observaciones: dto.observaciones,
        updatedByTeacherId: actor.userId,
      },
      include: { subject: true },
    });

    const promedioMateria = this.average([
      result.parcial1,
      result.parcial2,
      result.parcial3,
      result.parcial4,
    ]);

    return {
      id: result.id,
      studentId: result.studentId,
      groupId: result.groupId,
      subjectId: result.subjectId,
      subject: { id: result.subject.id, nombre: result.subject.nombre },
      parcial1: result.parcial1,
      parcial2: result.parcial2,
      parcial3: result.parcial3,
      parcial4: result.parcial4,
      notaFinal: result.notaFinal,
      promedioMateria,
      progresoMateria: result.progresoMateria,
      inasistenciasJustificadas: result.inasistenciasJustificadas,
      inasistenciasInjustificadas: result.inasistenciasInjustificadas,
      observaciones: result.observaciones,
      updatedAt: result.updatedAt,
    };
  }
}
