import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EvaluacionTipo, GradingMode, SyllabusStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../users/dto/user-role.enum';
import { UpsertGradePerformanceDto } from './dto/performance.dto';
import {
  UpsertStudentAcademicDto,
  UpsertStudentAcademicEvaluationDto,
} from './dto/student-academic.dto';

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

import { Actor } from '../common/tenant';
import { TenantScopedService } from '../common/tenant-scoped.service';

@Injectable()
export class PerformanceService extends TenantScopedService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private async findGroupByGradeName(actor: Actor, grade: string) {
    const group = await this.prisma.group.findFirst({
      where: { nombre: grade, ...this.scopeToInstitution(actor) },
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
        where: { id: groupId, ...this.scopeToInstitution(actor) },
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
          ...this.scopeToInstitution(actor),
        },
      });
      if (isDirector) return;

      const assign = await this.prisma.teacherAssignment.findFirst({
        where: {
          groupId,
          teacherId: actor.userId,
          group: this.scopeToInstitution(actor),
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
        where: { id: groupId, ...this.scopeToInstitution(actor) },
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
          ...this.scopeToInstitution(actor),
        },
        select: { id: true },
      });
      if (isDirector) return;

      const assignment = await this.prisma.teacherAssignment.findFirst({
        where: {
          groupId,
          teacherId: actor.userId,
          group: this.scopeToInstitution(actor),
        },
        select: { id: true },
      });
      if (assignment) return;
    }

    if (actor.role === UserRole.ESTUDIANTE) {
      const studentGroup = await this.prisma.studentGroup.findFirst({
        where: {
          studentId: actor.userId,
          group: this.scopeToInstitution(actor),
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
        where: { gradeId, ...this.scopeToInstitution(actor) },
        select: { id: true },
      });
      if (!exists) throw new ForbiddenException('No autorizado');
      return;
    }

    if (actor.role === UserRole.PROFESOR) {
      const directorGroup = await this.prisma.group.findFirst({
        where: {
          gradeId,
          directorId: actor.userId,
          ...this.scopeToInstitution(actor),
        },
        select: { id: true },
      });
      if (directorGroup) return;

      const assignment = await this.prisma.teacherAssignment.findFirst({
        where: {
          teacherId: actor.userId,
          group: { gradeId, ...this.scopeToInstitution(actor) },
        },
        select: { id: true },
      });
      if (assignment) return;
    }

    if (actor.role === UserRole.ESTUDIANTE) {
      const studentGroup = await this.prisma.studentGroup.findFirst({
        where: {
          studentId: actor.userId,
          group: this.scopeToInstitution(actor),
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

  private computeWeightedPromedio(input: Array<{ nota: number; porcentaje: number | null }>) {
    const valid = input.filter((i) => typeof i.nota === 'number');
    if (valid.length === 0) return null;
    const hasWeights = valid.some((i) => typeof i.porcentaje === 'number');
    if (!hasWeights) return this.computePromedioFromEvalGrades(valid.map((i) => i.nota));

    const weighted = valid
      .filter((i) => typeof i.porcentaje === 'number' && (i.porcentaje as number) > 0)
      .map((i) => ({ nota: i.nota, w: i.porcentaje as number }));
    if (weighted.length === 0) {
      return this.computePromedioFromEvalGrades(valid.map((i) => i.nota));
    }
    const totalW = weighted.reduce((acc, x) => acc + x.w, 0);
    if (totalW <= 0) return this.computePromedioFromEvalGrades(valid.map((i) => i.nota));
    const value = weighted.reduce((acc, x) => acc + x.nota * x.w, 0) / totalW;
    return Number(value.toFixed(2));
  }

  private computeCompetencyFinal(
    grades: Array<{ nota: number; competencyCategory: string | null }>,
    weights: Record<string, number>,
  ): number | null {
    const categories = [
      'COGNITIVE',
      'PROCEDURAL',
      'ATTITUDINAL',
      'SELF_EVAL',
      'CO_EVAL',
    ];

    const categoryAverages: Record<string, number | null> = {};
    for (const cat of categories) {
      const catGrades = grades.filter((g) => g.competencyCategory === cat);
      if (catGrades.length === 0) {
        categoryAverages[cat] = null;
        continue;
      }
      const avg =
        catGrades.reduce((sum, g) => sum + g.nota, 0) / catGrades.length;
      categoryAverages[cat] = Number(avg.toFixed(2));
    }

    const filledCategories = categories.filter(
      (c) => categoryAverages[c] !== null,
    );
    if (filledCategories.length === 0) return null;

    const totalWeight = filledCategories.reduce(
      (sum, c) => sum + (weights[c] ?? 0),
      0,
    );
    if (totalWeight === 0) return null;

    const weighted = filledCategories.reduce(
      (sum, c) =>
        sum +
        (categoryAverages[c]! * (weights[c] ?? 0)) / totalWeight,
      0,
    );

    return Number(weighted.toFixed(2));
  }

  /** Misma lógica de fallback que en upsertStudentAcademic (findUnique + defaults). */
  private async getInstitutionGradingPolicyWithWeights(institutionId: number) {
    const policy =
      (await this.prisma.institutionGradingPolicy.findUnique({
        where: { institutionId },
      })) ?? {
        allowClosedPeriodEdits: false,
        allowFinalOverride: true,
        gradeScaleMax: 5,
        passingThreshold: 3.0,
        gradingMode: GradingMode.SIMPLE,
        competencyWeights: {
          COGNITIVE: 30,
          PROCEDURAL: 30,
          ATTITUDINAL: 30,
          SELF_EVAL: 5,
          CO_EVAL: 5,
        },
      };

    const rawCompetencyWeights = policy.competencyWeights;
    const competencyWeightsRecord: Record<string, number> =
      rawCompetencyWeights &&
      typeof rawCompetencyWeights === 'object' &&
      !Array.isArray(rawCompetencyWeights)
        ? (rawCompetencyWeights as Record<string, number>)
        : {
            COGNITIVE: 30,
            PROCEDURAL: 30,
            ATTITUDINAL: 30,
            SELF_EVAL: 5,
            CO_EVAL: 5,
          };

    return { policy, competencyWeightsRecord };
  }

  private async ensureCanViewStudentAcademic(actor: Actor, studentId: number) {
    if (
      actor.role === UserRole.SECRETARIA ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      const belongs = await this.prisma.user.findFirst({
        where: { id: studentId, ...this.scopeToInstitution(actor) },
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
      where: { studentId, group: this.scopeToInstitution(actor) },
      select: { groupId: true },
    });
    if (!assignment)
      throw new NotFoundException('Estudiante sin grupo asignado');

    const isDirector = await this.prisma.group.findFirst({
      where: {
        id: assignment.groupId,
        directorId: actor.userId,
        ...this.scopeToInstitution(actor),
      },
      select: { id: true },
    });
    if (isDirector) return;

    const teacherAssignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        groupId: assignment.groupId,
        teacherId: actor.userId,
        group: this.scopeToInstitution(actor),
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
        where: { id: groupId, ...this.scopeToInstitution(actor) },
        select: { id: true },
      });
      if (!group) throw new ForbiddenException('No autorizado para este grupo');
      return;
    }

    const isDirector = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        directorId: actor.userId,
        ...this.scopeToInstitution(actor),
      },
      select: { id: true },
    });
    if (isDirector) return;

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        groupId,
        teacherId: actor.userId,
        group: this.scopeToInstitution(actor),
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
        ...this.scopeToInstitution(actor),
      },
      select: { id: true },
    });
    if (isDirector) return;

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        groupId,
        subjectId,
        teacherId: actor.userId,
        group: this.scopeToInstitution(actor),
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
      where: { gradeId, ...this.scopeToInstitution(actor) },
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

  async getStudentAcademic(actor: Actor, studentId: number, version = 1) {
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

    const institutionIdStudent =
      actor.role === UserRole.SUPER_ADMIN
        ? (student.institutionId ?? 0)
        : this.getActorInstitutionId(actor);

    const activeAcademicPeriodV2 =
      version === 2
        ? (await this.prisma.academicPeriod.findFirst({
            where: {
              estado: 'ACTIVE',
              institutionId: institutionIdStudent,
            },
            select: {
              id: true,
              nombre: true,
              codigo: true,
              tipo: true,
              estado: true,
              fechaInicio: true,
              fechaFin: true,
              fechaCierre: true,
            },
          })) ??
          (await this.prisma.academicPeriod.findFirst({
            where: {
              estado: 'CLOSED',
              institutionId: institutionIdStudent,
            },
            orderBy: { fechaCierre: 'desc' },
            select: {
              id: true,
              nombre: true,
              codigo: true,
              tipo: true,
              estado: true,
              fechaInicio: true,
              fechaFin: true,
              fechaCierre: true,
            },
          }))
        : null;

    const gradingPolicyV2 =
      version === 2
        ? await this.getInstitutionGradingPolicyWithWeights(institutionIdStudent)
        : null;

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
                  id: true,
                  titulo: true,
                  tipo: true,
                  orden: true,
                  termSlot: true,
                  porcentaje: true,
                  academicOfferingId: true,
                  competencyCategory: true,
                },
              },
            },
            orderBy: { academicEvaluation: { orden: 'asc' } },
          })
        : [];
    const evalByOfferingForStudent = new Map<number, Array<any>>();
    studentEvalGrades.forEach((g) => {
      const oid = g.academicEvaluation.academicOfferingId;
      const list = evalByOfferingForStudent.get(oid) ?? [];
      list.push(
        version === 2
          ? {
              evaluationId: g.academicEvaluation.id,
              title: g.academicEvaluation.titulo,
              type: g.academicEvaluation.tipo,
              orden: g.academicEvaluation.orden,
              termSlot: g.academicEvaluation.termSlot,
              weight: g.academicEvaluation.porcentaje,
              grade: g.nota,
              competencyCategory: g.academicEvaluation.competencyCategory ?? null,
              updatedAt: g.updatedAt,
              updatedByTeacherId: g.updatedByTeacherId,
            }
          : {
              titulo: g.academicEvaluation.titulo,
              tipo: g.academicEvaluation.tipo,
              orden: g.academicEvaluation.orden,
              porcentaje: g.academicEvaluation.porcentaje,
              nota: g.nota,
            },
      );
      evalByOfferingForStudent.set(oid, list);
    });

    const normalized = records.map((record) => {
      const evaluaciones =
        record.academicOfferingId != null
          ? (evalByOfferingForStudent.get(record.academicOfferingId) ?? [])
          : [];
      const promedioMateria = this.computePromedioFromEvalGrades(
        evaluaciones
          .map((e: any) => (version === 2 ? e.grade : e.nota))
          .filter((x: any): x is number => typeof x === 'number'),
      );
      return {
        id: record.publicId,
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
        finalSource: record.finalSource,
        finalOverride: record.finalOverride,
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

    let termSlotsAvailableV2: number[] | undefined;
    if (version === 2) {
      const offeringIdsInActivePeriod =
        activeAcademicPeriodV2 != null
          ? await this.prisma.academicOffering.findMany({
              where: {
                id: { in: recordOfferingIds },
                academicPeriodId: activeAcademicPeriodV2.id,
              },
              select: { id: true },
            })
          : [];
      const allowedOfferingIds = new Set(offeringIdsInActivePeriod.map((o) => o.id));
      const slots = new Set<number>();
      studentEvalGrades.forEach((g) => {
        const oid = g.academicEvaluation.academicOfferingId;
        if (!allowedOfferingIds.has(oid)) return;
        const slot = g.academicEvaluation.termSlot;
        if (typeof slot === 'number') slots.add(slot);
      });
      const derived = Array.from(slots).sort((a, b) => a - b);
      termSlotsAvailableV2 = derived.length > 0 ? derived : [1, 2, 3, 4];
    }

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
      ...(version === 2 && gradingPolicyV2
        ? {
            academicPeriod: activeAcademicPeriodV2,
            termSlotsAvailable: termSlotsAvailableV2,
            gradingMode: gradingPolicyV2.policy.gradingMode,
            competencyWeights: gradingPolicyV2.competencyWeightsRecord,
            simulatorInputs: {
              termSlotsAvailable: termSlotsAvailableV2,
              gradeScaleMax: gradingPolicyV2.policy.gradeScaleMax,
              passingThreshold: gradingPolicyV2.policy.passingThreshold,
            },
          }
        : {}),
    };
  }

  async getGroupAcademicOverview(actor: Actor, groupId: number, version = 1) {
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
                  id: true,
                  titulo: true,
                  tipo: true,
                  orden: true,
                  termSlot: true,
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
        evaluationId: number;
        titulo: string;
        tipo: string;
        orden: number;
        termSlot: number | null;
        porcentaje: number | null;
        nota: number;
      }>
    >();
    groupEvalGrades.forEach((g) => {
      const key = `${g.studentGroupId}_${g.academicEvaluation.academicOfferingId}`;
      const list = groupEvalIndex.get(key) ?? [];
      list.push({
        evaluationId: g.academicEvaluation.id,
        titulo: g.academicEvaluation.titulo,
        tipo: g.academicEvaluation.tipo,
        orden: g.academicEvaluation.orden,
        termSlot: g.academicEvaluation.termSlot,
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
          id: record.publicId,
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
          finalSource: record.finalSource,
          finalOverride: record.finalOverride,
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

    // Métricas canónicas de cabecera para UI (Fase A).
    // TODO(Fase B): mover umbrales/escala a InstitutionGradingPolicy.
    const passingThreshold = 3.0;
    const studentsWithGrade = normalizedStudents.filter(
      (s) => typeof s.promedioGeneral === 'number',
    );
    const groupAvg = this.average(studentsWithGrade.map((s) => s.promedioGeneral));
    const approvedCount = studentsWithGrade.filter(
      (s) => (s.promedioGeneral ?? 0) >= passingThreshold,
    ).length;
    const totalStudents = normalizedStudents.length;
    const coverageCount = studentsWithGrade.length;
    const approvalRate =
      totalStudents > 0 ? Number(((approvedCount / totalStudents) * 100).toFixed(2)) : 0;

    const institutionIdForPeriod =
      actor.role === UserRole.SUPER_ADMIN
        ? group.institutionId
        : this.getActorInstitutionId(actor);

    const academicPeriodV2 =
      version === 2
        ? (await this.prisma.academicPeriod.findFirst({
            where: {
              estado: 'ACTIVE',
              institutionId: institutionIdForPeriod,
            },
            select: {
              id: true,
              nombre: true,
              codigo: true,
              tipo: true,
              estado: true,
              fechaInicio: true,
              fechaFin: true,
              fechaCierre: true,
            },
          })) ??
          (await this.prisma.academicPeriod.findFirst({
            where: {
              estado: 'CLOSED',
              institutionId: institutionIdForPeriod,
            },
            orderBy: { fechaCierre: 'desc' },
            select: {
              id: true,
              nombre: true,
              codigo: true,
              tipo: true,
              estado: true,
              fechaInicio: true,
              fechaFin: true,
              fechaCierre: true,
            },
          }))
        : null;

    const termSlotsDerived = new Set<number>();
    groupEvalGrades.forEach((g) => {
      const ts = g.academicEvaluation.termSlot;
      if (typeof ts === 'number' && ts >= 1 && ts <= 4) termSlotsDerived.add(ts);
    });
    const termSlotsAvailableV2 =
      termSlotsDerived.size > 0
        ? Array.from(termSlotsDerived).sort((a, b) => a - b)
        : [1, 2, 3, 4];

    const gradingPolicyGroupV2 =
      version === 2
        ? await this.getInstitutionGradingPolicyWithWeights(institutionIdForPeriod)
        : null;

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
      ...(version === 2 && gradingPolicyGroupV2
        ? {
            academicPeriod: academicPeriodV2,
            termSlotsAvailable: termSlotsAvailableV2,
            gradingMode: gradingPolicyGroupV2.policy.gradingMode,
            competencyWeights: gradingPolicyGroupV2.competencyWeightsRecord,
          }
        : {}),
      stats: {
        passingThreshold,
        totalStudents,
        coverageCount,
        groupAverage: groupAvg,
        approvedCount,
        approvalRate,
      },
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
      select: { id: true, group: { select: { institutionId: true } } },
    });
    if (!groupSubject) {
      throw new NotFoundException('La materia no está asignada a ese grupo');
    }

    // Resolver policy institucional (defaults si falta por alguna razón)
    const institutionId =
      actor.role === UserRole.SUPER_ADMIN
        ? groupSubject.group.institutionId
        : this.getActorInstitutionId(actor);
    const { policy, competencyWeightsRecord } =
      await this.getInstitutionGradingPolicyWithWeights(institutionId);

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
          select: {
            id: true,
            academicPeriod: { select: { id: true, estado: true } },
          },
        })
      : null;

    if (offering?.academicPeriod?.estado === 'CLOSED' && !policy.allowClosedPeriodEdits) {
      throw new ForbiddenException(
        'El período académico está cerrado. Contacta a Secretaría.',
      );
    }

    const isV2 =
      Array.isArray((dto as { evaluations?: unknown }).evaluations) &&
      (dto as { evaluations?: unknown[] }).evaluations!.length >= 0;

    // Helpers: upsert template + grade
    const ensureParcialTemplate = async (orden: number) => {
      if (!offering) {
        throw new BadRequestException('No hay offering activo para esta materia');
      }
      return this.prisma.academicEvaluation.upsert({
        where: {
          academicOfferingId_orden: { academicOfferingId: offering.id, orden },
        },
        update: {
          titulo: `Parcial ${orden}`,
          tipo: EvaluacionTipo.PARCIAL,
          termSlot: orden,
        },
        create: {
          academicOfferingId: offering.id,
          titulo: `Parcial ${orden}`,
          tipo: EvaluacionTipo.PARCIAL,
          orden,
          termSlot: orden,
        },
        select: { id: true, porcentaje: true },
      });
    };

    const ensureV2Template = async (input: UpsertStudentAcademicEvaluationDto) => {
      if (!offering) {
        throw new BadRequestException('No hay offering activo para esta materia');
      }
      if (input.evaluationId) {
        const existing = await this.prisma.academicEvaluation.findUnique({
          where: { id: input.evaluationId },
          select: { id: true, academicOfferingId: true, porcentaje: true },
        });
        if (!existing || existing.academicOfferingId !== offering.id) {
          throw new NotFoundException('Evaluación no encontrada para esta oferta');
        }
        const updated = await this.prisma.academicEvaluation.update({
          where: { id: existing.id },
          data: {
            titulo: input.title,
            tipo: (input.type as any) ?? undefined,
            porcentaje: input.weight ?? undefined,
            termSlot: input.termSlot ?? undefined,
          },
          select: { id: true, porcentaje: true },
        });
        return updated;
      }

      // Evitar duplicados: intentar encontrar por (titulo exacto + termSlot) dentro del offering.
      const found = await this.prisma.academicEvaluation.findFirst({
        where: {
          academicOfferingId: offering.id,
          titulo: input.title,
          ...(input.termSlot === undefined ? {} : { termSlot: input.termSlot }),
        },
        select: { id: true, porcentaje: true },
      });
      if (found) {
        // Actualizar metadatos (tipo/peso) si se suministran
        const updated = await this.prisma.academicEvaluation.update({
          where: { id: found.id },
          data: {
            ...(input.type !== undefined ? { tipo: input.type as any } : {}),
            ...(input.weight !== undefined ? { porcentaje: input.weight } : {}),
          },
          select: { id: true, porcentaje: true },
        });
        return updated;
      }

      const last = await this.prisma.academicEvaluation.findFirst({
        where: { academicOfferingId: offering.id },
        orderBy: { orden: 'desc' },
        select: { orden: true },
      });
      const nextOrden = (last?.orden ?? 0) + 1;
      return this.prisma.academicEvaluation.create({
        data: {
          academicOfferingId: offering.id,
          titulo: input.title,
          tipo: ((input.type as any) ?? EvaluacionTipo.PARCIAL) as any,
          porcentaje: input.weight ?? null,
          orden: nextOrden,
          termSlot: input.termSlot ?? null,
        },
        select: { id: true, porcentaje: true },
      });
    };

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
        finalOverride: null,
        finalSource: 'NONE',
        finalUpdatedAt: null,
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
        finalOverride: null,
        finalSource: 'NONE',
        finalUpdatedAt: null,
        progresoMateria: dto.progresoMateria,
        inasistenciasJustificadas: dto.inasistenciasJustificadas ?? 0,
        inasistenciasInjustificadas: dto.inasistenciasInjustificadas ?? 0,
        observaciones: dto.observaciones,
        updatedByTeacherId: actor.userId,
        ...(offering ? { academicOfferingId: offering.id } : {}),
      },
    });

    // ── Guardado de evaluaciones ───────────────────────────────────────────────
    if (!offering) {
      throw new BadRequestException('No hay período académico activo u offering asociado');
    }

    if (isV2 && Array.isArray(dto.evaluations)) {
      // v2 tiene prioridad
      for (const evInput of dto.evaluations) {
        const template = await ensureV2Template(evInput);
        if (evInput.grade == null) {
          await this.prisma.evaluationGrade.deleteMany({
            where: {
              academicEvaluationId: template.id,
              studentGroupId: studentGroup.id,
            },
          });
          continue;
        }
        await this.prisma.evaluationGrade.upsert({
          where: {
            academicEvaluationId_studentGroupId: {
              academicEvaluationId: template.id,
              studentGroupId: studentGroup.id,
            },
          },
          update: { nota: evInput.grade, updatedByTeacherId: actor.userId },
          create: {
            academicEvaluationId: template.id,
            studentGroupId: studentGroup.id,
            nota: evInput.grade,
            updatedByTeacherId: actor.userId,
          },
        });
      }
    } else {
      // v1 compat: parciales 1..4 → evaluaciones canónicas
      const parciales = [
        { orden: 1, nota: dto.parcial1 },
        { orden: 2, nota: dto.parcial2 },
        { orden: 3, nota: dto.parcial3 },
        { orden: 4, nota: dto.parcial4 },
      ];
      for (const p of parciales) {
        if (p.nota == null) continue;
        const template = await ensureParcialTemplate(p.orden);
        await this.prisma.evaluationGrade.upsert({
          where: {
            academicEvaluationId_studentGroupId: {
              academicEvaluationId: template.id,
              studentGroupId: studentGroup.id,
            },
          },
          update: { nota: p.nota, updatedByTeacherId: actor.userId },
          create: {
            academicEvaluationId: template.id,
            studentGroupId: studentGroup.id,
            nota: p.nota,
            updatedByTeacherId: actor.userId,
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

    const evalGradesResult = await this.prisma.evaluationGrade.findMany({
      where: {
        studentGroupId: studentGroup.id,
        academicEvaluation: { academicOfferingId: offering.id },
      },
      include: {
        academicEvaluation: {
          select: {
            id: true,
            titulo: true,
            tipo: true,
            orden: true,
            termSlot: true,
            porcentaje: true,
            competencyCategory: true,
          },
        },
      },
      orderBy: { academicEvaluation: { orden: 'asc' } },
    });

    const evaluaciones = evalGradesResult.map((g) => ({
      id: g.academicEvaluation.id,
      title: g.academicEvaluation.titulo,
      type: g.academicEvaluation.tipo,
      orden: g.academicEvaluation.orden,
      termSlot: g.academicEvaluation.termSlot,
      weight: g.academicEvaluation.porcentaje,
      grade: g.nota,
      updatedAt: g.updatedAt,
      updatedByTeacherId: g.updatedByTeacherId,
    }));

    let computedFinal: number | null;
    if (policy.gradingMode === GradingMode.COMPETENCY) {
      computedFinal = this.computeCompetencyFinal(
        evalGradesResult.map((g) => ({
          nota: g.nota,
          competencyCategory: g.academicEvaluation.competencyCategory ?? null,
        })),
        competencyWeightsRecord,
      );
    } else {
      computedFinal = this.computeWeightedPromedio(
        evalGradesResult.map((g) => ({
          nota: g.nota,
          porcentaje: g.academicEvaluation.porcentaje,
        })),
      );
    }

    const wantsOverride = dto.finalOverride != null;
    const canOverride = Boolean(policy.allowFinalOverride);
    const finalValue =
      wantsOverride && canOverride ? dto.finalOverride : computedFinal;
    const finalSource =
      wantsOverride && canOverride
        ? 'OVERRIDE'
        : finalValue != null
          ? 'COMPUTED'
          : 'NONE';

    const updatedRecord = await this.prisma.studentAcademicRecord.upsert({
      where: {
        studentId_groupId_subjectId: { studentId, groupId, subjectId },
      },
      update: {
        notaFinal: finalValue,
        finalSource,
        finalOverride: wantsOverride && canOverride ? dto.finalOverride : null,
        finalUpdatedAt: new Date(),
      },
      create: {
        studentId,
        groupId,
        subjectId,
        notaFinal: finalValue,
        finalSource,
        finalOverride: wantsOverride && canOverride ? dto.finalOverride : null,
        finalUpdatedAt: new Date(),
        progresoMateria: dto.progresoMateria,
        inasistenciasJustificadas: dto.inasistenciasJustificadas ?? 0,
        inasistenciasInjustificadas: dto.inasistenciasInjustificadas ?? 0,
        observaciones: dto.observaciones,
        updatedByTeacherId: actor.userId,
        ...(offering ? { academicOfferingId: offering.id } : {}),
      },
      select: {
        id: true,
        publicId: true,
        studentId: true,
        groupId: true,
        subjectId: true,
        notaFinal: true,
        finalSource: true,
        finalOverride: true,
        finalUpdatedAt: true,
        progresoMateria: true,
        inasistenciasJustificadas: true,
        inasistenciasInjustificadas: true,
        observaciones: true,
        updatedAt: true,
        academicOfferingId: true,
      },
    });

    return {
      record: {
        id: updatedRecord.publicId,
        studentId: updatedRecord.studentId,
        groupId: updatedRecord.groupId,
        subjectId: updatedRecord.subjectId,
        subject,
        evaluaciones: evalGradesResult.map((g) => ({
          titulo: g.academicEvaluation.titulo,
          tipo: g.academicEvaluation.tipo,
          orden: g.academicEvaluation.orden,
          porcentaje: g.academicEvaluation.porcentaje,
          nota: g.nota,
        })),
        notaFinal: updatedRecord.notaFinal,
        promedioMateria: computedFinal,
        progresoMateria: updatedRecord.progresoMateria,
        inasistenciasJustificadas: updatedRecord.inasistenciasJustificadas,
        inasistenciasInjustificadas: updatedRecord.inasistenciasInjustificadas,
        observaciones: updatedRecord.observaciones,
        updatedAt: updatedRecord.updatedAt,
        finalSource: updatedRecord.finalSource,
        finalOverride: updatedRecord.finalOverride,
        finalUpdatedAt: updatedRecord.finalUpdatedAt,
      },
      evaluaciones,
      final: {
        value: finalValue,
        source: finalSource,
        override: wantsOverride && canOverride ? dto.finalOverride : null,
      },
    };
  }
}
