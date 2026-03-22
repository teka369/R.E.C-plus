import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EvaluacionTipo, SyllabusStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';
import { UpsertGradePerformanceDto } from './dto/performance.dto';
import { UpsertStudentAcademicDto } from './dto/student-academic.dto';

type GradePerformanceRow = {
  id: number;
  groupId: number;
  academicPeriodId: number;
  promedioGeneral: number | null;
  asistenciaPromedio: number | null;
  aprobacion: number | null;
  mejorAsignatura: string | null;
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

type GradeRankingRow = {
  groupId: number;
  groupName: string;
  gradeId: number;
  gradeName: string;
  score: number;
  promedioGeneral: number | null;
  asistenciaPromedio: number | null;
  aprobacion: number | null;
  hasStats: boolean;
  scoreBreakdown: ScoreBreakdown;
  derivedSignals: DerivedSignals;
};

type ScoreComponent = {
  raw: number;
  normalized: number;
  weight: number;
  contribution: number;
};

type ScoreBreakdown = {
  promedio: ScoreComponent;
  asistencia: ScoreComponent;
  aprobacion: ScoreComponent;
  recuperacionAusencias: ScoreComponent;
  total: number;
};

type DerivedSignals = {
  recoveryCompletionRate: number | null;
  resourcesPerSubject: number;
  activeSyllabusRate: number;
};

type RecomputedGradePerformance = GradePerformanceRow & {
  leagueScore: number;
  scoreBreakdown: ScoreBreakdown;
  derivedSignals: DerivedSignals;
};

type Actor = {
  userId: number;
  role: UserRole;
  institutionId?: number | null;
};

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  private getActorInstitutionId(actor: Actor): number {
    if (actor.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Operacion no valida para SUPER_ADMIN sin contexto de institucion',
      );
    }
    if (!actor.institutionId) {
      throw new ForbiddenException('Usuario sin institucion asociada');
    }
    return actor.institutionId;
  }

  private groupWhere(actor: Actor): { institutionId?: number } {
    if (actor.role === UserRole.SUPER_ADMIN) return {};
    return { institutionId: this.getActorInstitutionId(actor) };
  }

  private async findGroupByGradeName(actor: Actor, grade: string) {
    const group = await this.prisma.group.findFirst({
      where: { nombre: grade, ...this.groupWhere(actor) },
    });
    if (!group) throw new NotFoundException('Grado/Grupo no encontrado');
    return group;
  }

  private async ensureWriteAccess(actor: Actor, groupId: number) {
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      const group = await this.prisma.group.findFirst({
        where: { id: groupId, ...this.groupWhere(actor) },
        select: { id: true },
      });
      if (!group) throw new ForbiddenException('Grupo fuera de su institucion');
      return;
    }

    if (actor.role === UserRole.PROFESOR) {
      const isDirector = await this.prisma.group.findFirst({
        where: {
          id: groupId,
          directorId: actor.userId,
          ...this.groupWhere(actor),
        },
      });
      if (isDirector) return;

      const assign = await this.prisma.teacherAssignment.findFirst({
        where: {
          groupId,
          teacherId: actor.userId,
          group: this.groupWhere(actor),
        },
      });
      if (assign) return;
    }

    throw new ForbiddenException(
      'No autorizado para editar estadísticas de este grupo',
    );
  }

  private async ensureCanViewGroupPerformance(actor: Actor, groupId: number) {
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      const group = await this.prisma.group.findFirst({
        where: { id: groupId, ...this.groupWhere(actor) },
        select: { id: true },
      });
      if (!group) throw new ForbiddenException('Grupo fuera de su institucion');
      return;
    }

    if (actor.role === UserRole.PROFESOR) {
      const isDirector = await this.prisma.group.findFirst({
        where: {
          id: groupId,
          directorId: actor.userId,
          ...this.groupWhere(actor),
        },
        select: { id: true },
      });
      if (isDirector) return;

      const assignment = await this.prisma.teacherAssignment.findFirst({
        where: {
          groupId,
          teacherId: actor.userId,
          group: this.groupWhere(actor),
        },
        select: { id: true },
      });
      if (assignment) return;
    }

    if (actor.role === UserRole.ESTUDIANTE) {
      const studentGroup = await this.prisma.studentGroup.findFirst({
        where: {
          studentId: actor.userId,
          group: this.groupWhere(actor),
        },
        select: { groupId: true },
      });
      if (studentGroup?.groupId === groupId) return;
    }

    throw new ForbiddenException('No autorizado');
  }

  private async ensureCanViewGradePerformance(actor: Actor, gradeId: number) {
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      const exists = await this.prisma.group.findFirst({
        where: { gradeId, ...this.groupWhere(actor) },
        select: { id: true },
      });
      if (!exists) throw new ForbiddenException('No autorizado');
      return;
    }

    if (actor.role === UserRole.PROFESOR) {
      const directorGroup = await this.prisma.group.findFirst({
        where: { gradeId, directorId: actor.userId, ...this.groupWhere(actor) },
        select: { id: true },
      });
      if (directorGroup) return;

      const assignment = await this.prisma.teacherAssignment.findFirst({
        where: {
          teacherId: actor.userId,
          group: { gradeId, ...this.groupWhere(actor) },
        },
        select: { id: true },
      });
      if (assignment) return;
    }

    if (actor.role === UserRole.ESTUDIANTE) {
      const studentGroup = await this.prisma.studentGroup.findFirst({
        where: {
          studentId: actor.userId,
          group: this.groupWhere(actor),
        },
        include: { group: true },
      });
      if (studentGroup?.group.gradeId === gradeId) return;
    }

    throw new ForbiddenException('No autorizado');
  }

  private clamp(value: number, min = 0, max = 100) {
    return Math.min(max, Math.max(min, value));
  }

  private getGradeScaleMax(value: number | null | undefined) {
    if (value == null) return 10;
    return value <= 5 ? 5 : 10;
  }

  private buildScoreBreakdown(input: {
    promedioGeneral: number | null;
    asistenciaPromedio: number | null;
    aprobacion: number | null;
    reduccionAusencias: number | null;
  }): ScoreBreakdown {
    const weights = {
      promedio: 0.45,
      asistencia: 0.25,
      aprobacion: 0.25,
      recuperacionAusencias: 0.05,
    };

    const scaleMax = this.getGradeScaleMax(input.promedioGeneral);
    const promedioNormalized = this.clamp(
      ((input.promedioGeneral ?? 0) / scaleMax) * 100,
    );
    const asistenciaNormalized = this.clamp(input.asistenciaPromedio ?? 0);
    const aprobacionNormalized = this.clamp(input.aprobacion ?? 0);
    const recuperacionAusenciasNormalized = this.clamp(
      input.reduccionAusencias ?? 0,
    );

    const promedioContribution = Number(
      (promedioNormalized * weights.promedio).toFixed(2),
    );
    const asistenciaContribution = Number(
      (asistenciaNormalized * weights.asistencia).toFixed(2),
    );
    const aprobacionContribution = Number(
      (aprobacionNormalized * weights.aprobacion).toFixed(2),
    );
    const recuperacionAusenciasContribution = Number(
      (recuperacionAusenciasNormalized * weights.recuperacionAusencias).toFixed(
        2,
      ),
    );

    const total = Number(
      (
        promedioContribution +
        asistenciaContribution +
        aprobacionContribution +
        recuperacionAusenciasContribution
      ).toFixed(1),
    );

    return {
      promedio: {
        raw: input.promedioGeneral ?? 0,
        normalized: Number(promedioNormalized.toFixed(2)),
        weight: weights.promedio,
        contribution: promedioContribution,
      },
      asistencia: {
        raw: input.asistenciaPromedio ?? 0,
        normalized: Number(asistenciaNormalized.toFixed(2)),
        weight: weights.asistencia,
        contribution: asistenciaContribution,
      },
      aprobacion: {
        raw: input.aprobacion ?? 0,
        normalized: Number(aprobacionNormalized.toFixed(2)),
        weight: weights.aprobacion,
        contribution: aprobacionContribution,
      },
      recuperacionAusencias: {
        raw: input.reduccionAusencias ?? 0,
        normalized: Number(recuperacionAusenciasNormalized.toFixed(2)),
        weight: weights.recuperacionAusencias,
        contribution: recuperacionAusenciasContribution,
      },
      total,
    };
  }

  private buildEmptyBreakdown(): ScoreBreakdown {
    return this.buildScoreBreakdown({
      promedioGeneral: 0,
      asistenciaPromedio: 0,
      aprobacion: 0,
      reduccionAusencias: 0,
    });
  }

  private buildDefaultSignals(): DerivedSignals {
    return {
      recoveryCompletionRate: null,
      resourcesPerSubject: 0,
      activeSyllabusRate: 0,
    };
  }

  private async getPersistedGroupPerformance(
    groupId: number,
    academicPeriodId: number,
  ) {
    return this.prisma.gradePerformance.findUnique({
      where: { groupId_academicPeriodId: { groupId, academicPeriodId } },
    });
  }

  private async recomputeGroupPerformance(
    groupId: number,
  ): Promise<RecomputedGradePerformance> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        grade: true,
        subjects: { include: { subject: true } },
      },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const activePeriod = await this.prisma.academicPeriod.findFirst({
      where: { estado: 'ACTIVE', institutionId: group.institutionId },
      select: { id: true },
    });
    if (!activePeriod) {
      throw new NotFoundException(
        'No hay período académico activo. Ejecute seed-active-period.js primero.',
      );
    }
    const previous = await this.getPersistedGroupPerformance(
      groupId,
      activePeriod.id,
    );

    const records = await this.prisma.studentAcademicRecord.findMany({
      where: { groupId },
      include: {
        subject: true,
        student: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
          },
        },
      },
    });

    // Batch-fetch evaluation grades para calcular promedios (reemplaza parcial1-4)
    const studentGroups = await this.prisma.studentGroup.findMany({
      where: { groupId },
      select: { id: true, studentId: true },
    });
    const sgByStudentId = new Map(
      studentGroups.map((sg) => [sg.studentId, sg.id]),
    );
    const offeringIds = Array.from(
      new Set(
        records
          .map((r) => r.academicOfferingId)
          .filter((id): id is number => id != null),
      ),
    );
    const allEvalGrades =
      offeringIds.length > 0
        ? await this.prisma.evaluationGrade.findMany({
            where: {
              studentGroupId: { in: studentGroups.map((sg) => sg.id) },
              academicEvaluation: { academicOfferingId: { in: offeringIds } },
            },
            include: {
              academicEvaluation: { select: { academicOfferingId: true } },
            },
          })
        : [];
    const evalGradesIndex = new Map<string, number[]>();
    allEvalGrades.forEach((g) => {
      const key = `${g.studentGroupId}_${g.academicEvaluation.academicOfferingId}`;
      const list = evalGradesIndex.get(key) ?? [];
      list.push(g.nota);
      evalGradesIndex.set(key, list);
    });

    const materialsCount = await this.prisma.studyMaterial.count({
      where: { groupId },
    });
    const activeSyllabiCount = await this.prisma.syllabus.count({
      where: { groupId, status: SyllabusStatus.ACTIVO },
    });
    const recoveryRows = await this.prisma.recoveryRequest.findMany({
      where: { groupId },
      select: { status: true },
    });

    const normalized = records.map((record) => {
      const sgId = sgByStudentId.get(record.studentId);
      const offeringId = record.academicOfferingId;
      const evalGrades =
        sgId != null && offeringId != null
          ? (evalGradesIndex.get(`${sgId}_${offeringId}`) ?? [])
          : [];
      const promedioMateria = this.computePromedioFromEvalGrades(evalGrades);
      const gradeValue =
        record.notaFinal != null ? record.notaFinal : promedioMateria;
      const ausenciasTotal =
        record.inasistenciasJustificadas + record.inasistenciasInjustificadas;
      return {
        record,
        gradeValue,
        promedioMateria,
        ausenciasTotal,
      };
    });

    const gradeValues = normalized
      .map((item) => item.gradeValue)
      .filter((v): v is number => typeof v === 'number');
    const maxObservedGrade =
      gradeValues.length > 0 ? Math.max(...gradeValues) : 10;
    const passingThreshold = maxObservedGrade <= 5 ? 3 : 7;

    const promedioGeneral = this.average(gradeValues);

    const aprobacion =
      gradeValues.length > 0
        ? Number(
            (
              (gradeValues.filter((value) => value >= passingThreshold).length /
                gradeValues.length) *
              100
            ).toFixed(2),
          )
        : null;

    const progressValues = normalized
      .map((item) => item.record.progresoMateria)
      .filter((v): v is number => typeof v === 'number');
    const asistenciaPromedio = this.average(progressValues);

    const inasistenciasJustificadas = normalized.reduce(
      (acc, item) => acc + item.record.inasistenciasJustificadas,
      0,
    );
    const inasistenciasInjustificadas = normalized.reduce(
      (acc, item) => acc + item.record.inasistenciasInjustificadas,
      0,
    );
    const totalAusencias =
      inasistenciasJustificadas + inasistenciasInjustificadas;

    const bySubject = new Map<
      number,
      { name: string; grades: number[]; progress: number[] }
    >();
    normalized.forEach((item) => {
      const subjectId = item.record.subjectId;
      const current = bySubject.get(subjectId) ?? {
        name: item.record.subject.nombre,
        grades: [],
        progress: [],
      };
      if (typeof item.gradeValue === 'number')
        current.grades.push(item.gradeValue);
      if (typeof item.record.progresoMateria === 'number') {
        current.progress.push(item.record.progresoMateria);
      }
      bySubject.set(subjectId, current);
    });

    let mejorAsignatura: string | null = null;
    let mejorAsignaturaAvg: number | null = null;
    let porcentajeCursoMayorAsistencia: number | null = null;

    bySubject.forEach((entry) => {
      const avgGrade = this.average(entry.grades);
      const avgProgress = this.average(entry.progress);
      if (
        avgGrade != null &&
        (mejorAsignaturaAvg == null || avgGrade > mejorAsignaturaAvg)
      ) {
        mejorAsignaturaAvg = avgGrade;
        mejorAsignatura = entry.name;
      }
      if (
        avgProgress != null &&
        (porcentajeCursoMayorAsistencia == null ||
          avgProgress > porcentajeCursoMayorAsistencia)
      ) {
        porcentajeCursoMayorAsistencia = avgProgress;
      }
    });

    const byStudent = new Map<number, { fullName: string; grades: number[] }>();
    normalized.forEach((item) => {
      const studentId = item.record.studentId;
      const existing = byStudent.get(studentId) ?? {
        fullName:
          `${item.record.student.nombres} ${item.record.student.apellidos}`.trim(),
        grades: [],
      };
      if (typeof item.gradeValue === 'number')
        existing.grades.push(item.gradeValue);
      byStudent.set(studentId, existing);
    });

    const topStudents = Array.from(byStudent.values())
      .map((entry) => ({
        fullName: entry.fullName,
        average: this.average(entry.grades),
      }))
      .filter(
        (entry): entry is { fullName: string; average: number } =>
          typeof entry.average === 'number',
      )
      .sort((a, b) => b.average - a.average)
      .slice(0, 3);

    const variacionPromedio =
      previous?.promedioGeneral != null && promedioGeneral != null
        ? Number((promedioGeneral - previous.promedioGeneral).toFixed(2))
        : null;

    const variacionAprobacion =
      previous?.aprobacion != null && aprobacion != null
        ? Number((aprobacion - previous.aprobacion).toFixed(2))
        : null;

    const previousTotalAusencias =
      (previous?.inasistenciasJustificadas ?? 0) +
      (previous?.inasistenciasInjustificadas ?? 0);
    const reduccionAusencias =
      previous != null && previousTotalAusencias > 0
        ? Number(
            (
              ((previousTotalAusencias - totalAusencias) /
                previousTotalAusencias) *
              100
            ).toFixed(2),
          )
        : null;

    const completedRecoveries = recoveryRows.filter(
      (row) => row.status === 'COMPLETED',
    ).length;
    const recoveryCompletionRate =
      recoveryRows.length > 0
        ? Number(((completedRecoveries / recoveryRows.length) * 100).toFixed(2))
        : null;
    const subjectsCount = Math.max(1, group.subjects.length);
    const resourcesPerSubject = Number(
      (materialsCount / subjectsCount).toFixed(2),
    );
    const activeSyllabusRate = Number(
      ((activeSyllabiCount / subjectsCount) * 100).toFixed(2),
    );

    const trendSignals = [
      variacionPromedio != null ? (variacionPromedio > 0 ? 1 : -1) : 0,
      variacionAprobacion != null ? (variacionAprobacion > 0 ? 1 : -1) : 0,
      reduccionAusencias != null ? (reduccionAusencias > 0 ? 1 : -1) : 0,
      recoveryCompletionRate != null
        ? recoveryCompletionRate >= 60
          ? 1
          : -1
        : 0,
      resourcesPerSubject >= 1 && activeSyllabusRate >= 50 ? 1 : 0,
    ].reduce((acc, value) => acc + value, 0);

    const tendenciaGeneral =
      trendSignals >= 3
        ? 'POSITIVA'
        : trendSignals >= 1
          ? 'ESTABLE'
          : trendSignals <= -2
            ? 'EN_RIESGO'
            : 'MIXTA';

    const updated = await this.prisma.gradePerformance.upsert({
      where: {
        groupId_academicPeriodId: {
          groupId,
          academicPeriodId: activePeriod.id,
        },
      },
      update: {
        promedioGeneral,
        asistenciaPromedio,
        aprobacion,
        mejorAsignatura,
        inasistenciasJustificadas,
        inasistenciasInjustificadas,
        porcentajeCursoMayorAsistencia,
        variacionPromedio,
        variacionAprobacion,
        reduccionAusencias,
        tendenciaGeneral,
      },
      create: {
        groupId,
        academicPeriodId: activePeriod.id,
        promedioGeneral,
        asistenciaPromedio,
        aprobacion,
        mejorAsignatura,
        inasistenciasJustificadas,
        inasistenciasInjustificadas,
        porcentajeCursoMayorAsistencia,
        variacionPromedio,
        variacionAprobacion,
        reduccionAusencias,
        tendenciaGeneral,
      },
    });

    // Sincronizar PerformanceTopStudent
    await this.prisma.performanceTopStudent.deleteMany({
      where: { gradePerformanceId: updated.id },
    });
    if (topStudents.length > 0) {
      await this.prisma.performanceTopStudent.createMany({
        data: topStudents.map((entry, index) => ({
          gradePerformanceId: updated.id,
          fullName: entry.fullName,
          average: entry.average,
          rank: index + 1,
        })),
      });
    }

    const row = updated as unknown as GradePerformanceRow;
    const scoreBreakdown = this.buildScoreBreakdown({
      promedioGeneral: row.promedioGeneral,
      asistenciaPromedio: row.asistenciaPromedio,
      aprobacion: row.aprobacion,
      reduccionAusencias: row.reduccionAusencias,
    });
    const derivedSignals: DerivedSignals = {
      recoveryCompletionRate,
      resourcesPerSubject,
      activeSyllabusRate,
    };

    return {
      ...row,
      leagueScore: scoreBreakdown.total,
      scoreBreakdown,
      derivedSignals,
    };
  }

  private average(values: Array<number | null | undefined>) {
    const present = values.filter((x): x is number => typeof x === 'number');
    if (present.length === 0) return null;
    const total = present.reduce((sum, item) => sum + item, 0);
    return Number((total / present.length).toFixed(2));
  }

  private computePromedioFromEvalGrades(grades: number[]): number | null {
    if (grades.length === 0) return null;
    return this.average(grades);
  }

  private async ensureCanViewStudentAcademic(actor: Actor, studentId: number) {
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      const belongs = await this.prisma.user.findFirst({
        where: { id: studentId, ...this.groupWhere(actor) },
        select: { id: true },
      });
      if (!belongs) throw new ForbiddenException('No autorizado');
      return;
    }
    if (actor.role === UserRole.ESTUDIANTE) {
      if (actor.userId !== studentId)
        throw new ForbiddenException('No autorizado');
      return;
    }

    const assignment = await this.prisma.studentGroup.findFirst({
      where: { studentId, group: this.groupWhere(actor) },
      select: { groupId: true },
    });
    if (!assignment)
      throw new NotFoundException('Estudiante sin grupo asignado');

    const isDirector = await this.prisma.group.findFirst({
      where: {
        id: assignment.groupId,
        directorId: actor.userId,
        ...this.groupWhere(actor),
      },
      select: { id: true },
    });
    if (isDirector) return;

    const teacherAssignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        groupId: assignment.groupId,
        teacherId: actor.userId,
        group: this.groupWhere(actor),
      },
      select: { id: true },
    });
    if (!teacherAssignment) throw new ForbiddenException('No autorizado');
  }

  private async ensureCanManageGroupAcademic(actor: Actor, groupId: number) {
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      const group = await this.prisma.group.findFirst({
        where: { id: groupId, ...this.groupWhere(actor) },
        select: { id: true },
      });
      if (!group) throw new ForbiddenException('No autorizado para este grupo');
      return;
    }

    const isDirector = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        directorId: actor.userId,
        ...this.groupWhere(actor),
      },
      select: { id: true },
    });
    if (isDirector) return;

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        groupId,
        teacherId: actor.userId,
        group: this.groupWhere(actor),
      },
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
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    )
      return;

    const isDirector = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        directorId: actor.userId,
        ...this.groupWhere(actor),
      },
      select: { id: true },
    });
    if (isDirector) return;

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        groupId,
        subjectId,
        teacherId: actor.userId,
        group: this.groupWhere(actor),
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new ForbiddenException(
        'No autorizado para editar esta materia en el grupo',
      );
    }
  }

  async getByGrade(actor: Actor, grade: string) {
    const group = await this.findGroupByGradeName(actor, grade);
    await this.ensureCanViewGroupPerformance(actor, group.id);
    return this.recomputeGroupPerformance(group.id);
  }

  async getByGroup(actor: Actor, groupId: number) {
    await this.ensureCanViewGroupPerformance(actor, groupId);
    return this.recomputeGroupPerformance(groupId);
  }

  async upsertByGrade(
    actor: Actor,
    grade: string,
    dto: UpsertGradePerformanceDto,
  ) {
    void dto;
    const group = await this.findGroupByGradeName(actor, grade);
    await this.ensureWriteAccess(actor, group.id);
    return this.recomputeGroupPerformance(group.id);
  }

  async getGradeRanking(actor: Actor, gradeId: number) {
    await this.ensureCanViewGradePerformance(actor, gradeId);

    const groups = await this.prisma.group.findMany({
      where: { gradeId, ...this.groupWhere(actor) },
      include: { grade: true },
      orderBy: { nombre: 'asc' },
    });

    const rows: GradeRankingRow[] = await Promise.all(
      groups.map(async (group) => {
        const perf = await this.recomputeGroupPerformance(group.id);
        return {
          groupId: group.id,
          groupName: group.nombre,
          gradeId: group.gradeId,
          gradeName: group.grade.nombre,
          score: perf.leagueScore,
          promedioGeneral: perf.promedioGeneral,
          asistenciaPromedio: perf.asistenciaPromedio,
          aprobacion: perf.aprobacion,
          hasStats: perf.promedioGeneral != null || perf.aprobacion != null,
          scoreBreakdown: perf.scoreBreakdown ?? this.buildEmptyBreakdown(),
          derivedSignals: perf.derivedSignals ?? this.buildDefaultSignals(),
        };
      }),
    );

    rows.sort(
      (a, b) =>
        b.score - a.score ||
        a.groupName.localeCompare(b.groupName, 'es', { sensitivity: 'base' }),
    );

    return rows;
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
        institutionId: true,
      },
    });

    if (!student) throw new NotFoundException('Estudiante no encontrado');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      student.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException('No autorizado');
    }

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

    // Batch-fetch evaluation grades para este estudiante
    const studentSgId = studentGroup.id;
    const recordOfferingIds = Array.from(
      new Set(
        records
          .map((r) => r.academicOfferingId)
          .filter((id): id is number => id != null),
      ),
    );
    const studentEvalGrades =
      recordOfferingIds.length > 0
        ? await this.prisma.evaluationGrade.findMany({
            where: {
              studentGroupId: studentSgId,
              academicEvaluation: {
                academicOfferingId: { in: recordOfferingIds },
              },
            },
            include: {
              academicEvaluation: {
                select: {
                  titulo: true,
                  tipo: true,
                  orden: true,
                  porcentaje: true,
                  academicOfferingId: true,
                },
              },
            },
            orderBy: { academicEvaluation: { orden: 'asc' } },
          })
        : [];
    const evalByOfferingForStudent = new Map<
      number,
      Array<{
        titulo: string;
        tipo: string;
        orden: number;
        porcentaje: number | null;
        nota: number;
      }>
    >();
    studentEvalGrades.forEach((g) => {
      const oid = g.academicEvaluation.academicOfferingId;
      const list = evalByOfferingForStudent.get(oid) ?? [];
      list.push({
        titulo: g.academicEvaluation.titulo,
        tipo: g.academicEvaluation.tipo,
        orden: g.academicEvaluation.orden,
        porcentaje: g.academicEvaluation.porcentaje,
        nota: g.nota,
      });
      evalByOfferingForStudent.set(oid, list);
    });

    const normalized = records.map((record) => {
      const evaluaciones =
        record.academicOfferingId != null
          ? (evalByOfferingForStudent.get(record.academicOfferingId) ?? [])
          : [];
      const promedioMateria = this.computePromedioFromEvalGrades(
        evaluaciones.map((e) => e.nota),
      );
      return {
        id: record.id,
        subjectId: record.subjectId,
        subject: { id: record.subject.id, nombre: record.subject.nombre },
        evaluaciones,
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
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      group.institutionId !== this.getActorInstitutionId(actor)
    ) {
      throw new ForbiddenException('No autorizado');
    }

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

    // Batch-fetch evaluation grades para todos los estudiantes del grupo
    const allSgIds = students.map((s) => s.id);
    const groupOfferingIds = Array.from(
      new Set(
        records
          .map((r) => r.academicOfferingId)
          .filter((id): id is number => id != null),
      ),
    );
    const groupEvalGrades =
      groupOfferingIds.length > 0 && allSgIds.length > 0
        ? await this.prisma.evaluationGrade.findMany({
            where: {
              studentGroupId: { in: allSgIds },
              academicEvaluation: {
                academicOfferingId: { in: groupOfferingIds },
              },
            },
            include: {
              academicEvaluation: {
                select: {
                  titulo: true,
                  tipo: true,
                  orden: true,
                  porcentaje: true,
                  academicOfferingId: true,
                },
              },
            },
          })
        : [];
    const groupEvalIndex = new Map<
      string,
      Array<{
        titulo: string;
        tipo: string;
        orden: number;
        porcentaje: number | null;
        nota: number;
      }>
    >();
    groupEvalGrades.forEach((g) => {
      const key = `${g.studentGroupId}_${g.academicEvaluation.academicOfferingId}`;
      const list = groupEvalIndex.get(key) ?? [];
      list.push({
        titulo: g.academicEvaluation.titulo,
        tipo: g.academicEvaluation.tipo,
        orden: g.academicEvaluation.orden,
        porcentaje: g.academicEvaluation.porcentaje,
        nota: g.nota,
      });
      groupEvalIndex.set(key, list);
    });

    const normalizedStudents = students.map((item) => {
      const studentRecords = byStudent.get(item.student.id) ?? [];

      const normalizedRecords = studentRecords.map((record) => {
        const evaluaciones =
          record.academicOfferingId != null
            ? (groupEvalIndex.get(`${item.id}_${record.academicOfferingId}`) ??
              [])
            : [];
        const promedioMateria = this.computePromedioFromEvalGrades(
          evaluaciones.map((e) => e.nota),
        );
        return {
          id: record.id,
          subjectId: record.subjectId,
          subject: { id: record.subject.id, nombre: record.subject.nombre },
          evaluaciones,
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

    // Lookup del período activo y offering para vincular EvaluationGrade
    const activePeriod = await this.prisma.academicPeriod.findFirst({
      where: {
        estado: 'ACTIVE',
        ...(actor.role === UserRole.SUPER_ADMIN
          ? {}
          : { institutionId: this.getActorInstitutionId(actor) }),
      },
      select: { id: true },
    });
    const offering = activePeriod
      ? await this.prisma.academicOffering.findUnique({
          where: {
            groupId_subjectId_academicPeriodId: {
              groupId,
              subjectId,
              academicPeriodId: activePeriod.id,
            },
          },
          select: { id: true },
        })
      : null;

    const result = await this.prisma.studentAcademicRecord.upsert({
      where: {
        studentId_groupId_subjectId: {
          studentId,
          groupId,
          subjectId,
        },
      },
      update: {
        notaFinal: dto.notaFinal,
        progresoMateria: dto.progresoMateria,
        inasistenciasJustificadas: dto.inasistenciasJustificadas ?? 0,
        inasistenciasInjustificadas: dto.inasistenciasInjustificadas ?? 0,
        observaciones: dto.observaciones,
        updatedByTeacherId: actor.userId,
        ...(offering ? { academicOfferingId: offering.id } : {}),
      },
      create: {
        studentId,
        groupId,
        subjectId,
        notaFinal: dto.notaFinal,
        progresoMateria: dto.progresoMateria,
        inasistenciasJustificadas: dto.inasistenciasJustificadas ?? 0,
        inasistenciasInjustificadas: dto.inasistenciasInjustificadas ?? 0,
        observaciones: dto.observaciones,
        updatedByTeacherId: actor.userId,
        ...(offering ? { academicOfferingId: offering.id } : {}),
      },
    });

    // Sincronizar EvaluationGrade para parciales provistos (backward compat con DTO)
    if (offering && studentGroup) {
      const parciales = [
        { titulo: 'Parcial 1', orden: 1, nota: dto.parcial1 },
        { titulo: 'Parcial 2', orden: 2, nota: dto.parcial2 },
        { titulo: 'Parcial 3', orden: 3, nota: dto.parcial3 },
        { titulo: 'Parcial 4', orden: 4, nota: dto.parcial4 },
      ];
      for (const p of parciales) {
        if (p.nota == null) continue;
        let evalTemplate = await this.prisma.academicEvaluation.findFirst({
          where: { academicOfferingId: offering.id, orden: p.orden },
          select: { id: true },
        });
        if (!evalTemplate) {
          evalTemplate = await this.prisma.academicEvaluation.create({
            data: {
              academicOfferingId: offering.id,
              titulo: p.titulo,
              tipo: EvaluacionTipo.PARCIAL,
              orden: p.orden,
            },
            select: { id: true },
          });
        }
        await this.prisma.evaluationGrade.upsert({
          where: {
            academicEvaluationId_studentGroupId: {
              academicEvaluationId: evalTemplate.id,
              studentGroupId: studentGroup.id,
            },
          },
          update: { nota: p.nota },
          create: {
            academicEvaluationId: evalTemplate.id,
            studentGroupId: studentGroup.id,
            nota: p.nota,
          },
        });
      }
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: result.subjectId },
      select: { id: true, nombre: true },
    });
    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    // Calcular promedio desde EvaluationGrade
    const evalGradesResult =
      offering && studentGroup
        ? await this.prisma.evaluationGrade.findMany({
            where: {
              studentGroupId: studentGroup.id,
              academicEvaluation: { academicOfferingId: offering.id },
            },
            include: {
              academicEvaluation: {
                select: {
                  titulo: true,
                  tipo: true,
                  orden: true,
                  porcentaje: true,
                },
              },
            },
            orderBy: { academicEvaluation: { orden: 'asc' } },
          })
        : [];
    const evaluaciones = evalGradesResult.map((g) => ({
      titulo: g.academicEvaluation.titulo,
      tipo: g.academicEvaluation.tipo,
      orden: g.academicEvaluation.orden,
      porcentaje: g.academicEvaluation.porcentaje,
      nota: g.nota,
    }));

    const promedioMateria = this.computePromedioFromEvalGrades(
      evaluaciones.map((e) => e.nota),
    );

    return {
      id: result.id,
      studentId: result.studentId,
      groupId: result.groupId,
      subjectId: result.subjectId,
      subject,
      evaluaciones,
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
