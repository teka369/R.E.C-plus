/**
 * backfill-academic-v2.ts
 *
 * B2 — Backfill idempotente para:
 *  1) InstitutionGradingPolicy (defaults)
 *  2) StudentAcademicRecord.finalSource/finalOverride basado en notaFinal vs EvaluationGrade
 *  3) AcademicEvaluation.termSlot para títulos exactos "Parcial N"
 *
 * IMPORTANTE:
 * - Script idempotente: se puede correr N veces.
 * - No asume que todos los StudentAcademicRecord tengan academicOfferingId.
 *
 * Ejecución sugerida:
 *   cd r.e.c-backend
 *   node -r ts-node/register scripts/backfill-academic-v2.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOLERANCE = 0.1;
const BATCH_SIZE = 200;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Number((sum / values.length).toFixed(2));
}

async function backfillPolicies() {
  // Parte 1: InstitutionGradingPolicy
  const institutionsWithoutPolicy = await prisma.institution.findMany({
    where: { gradingPolicy: null },
    select: { id: true },
  });

  if (institutionsWithoutPolicy.length === 0) {
    console.log('[B2] InstitutionGradingPolicy: no hay instituciones sin policy');
    return;
  }

  const data = institutionsWithoutPolicy.map((i) => ({
    institutionId: i.id,
    gradeScaleMax: 5,
    passingThreshold: 3.0,
    allowClosedPeriodEdits: false,
    allowFinalOverride: true,
  }));

  const created = await prisma.institutionGradingPolicy.createMany({
    data,
    skipDuplicates: true, // idempotencia por unique institutionId
  });

  console.log(
    `[B2] InstitutionGradingPolicy: creadas ${created.count} (de ${institutionsWithoutPolicy.length} candidatas)`,
  );
}

async function resolveEvaluationGradesForRecord(record: {
  studentId: number;
  groupId: number;
  subjectId: number;
  academicOfferingId: number | null;
}) {
  // Parte 2 (lookup): buscar EvaluationGrade asociadas
  // Regla: si hay academicOfferingId, preferir esa ruta.
  if (record.academicOfferingId) {
    const offering = await prisma.academicOffering.findUnique({
      where: { id: record.academicOfferingId },
      select: { id: true, academicPeriodId: true },
    });

    // Resolver StudentGroup del estudiante en el grupo; preferir mismo academicPeriodId si es posible.
    const studentGroup =
      (offering
        ? await prisma.studentGroup.findFirst({
            where: {
              studentId: record.studentId,
              groupId: record.groupId,
              academicPeriodId: offering.academicPeriodId,
              deletedAt: null,
            },
            select: { id: true },
          })
        : null) ??
      (await prisma.studentGroup.findFirst({
        where: {
          studentId: record.studentId,
          groupId: record.groupId,
          deletedAt: null,
        },
        select: { id: true },
      }));

    if (!studentGroup) return [];

    return prisma.evaluationGrade.findMany({
      where: {
        studentGroupId: studentGroup.id,
        academicEvaluation: { academicOfferingId: record.academicOfferingId },
      },
      select: { nota: true },
    });
  }

  // Fallback: por studentId + groupId + subjectId
  const studentGroups = await prisma.studentGroup.findMany({
    where: {
      studentId: record.studentId,
      groupId: record.groupId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (studentGroups.length === 0) return [];

  const offeringIds = await prisma.academicOffering.findMany({
    where: { groupId: record.groupId, subjectId: record.subjectId },
    select: { id: true },
  });
  if (offeringIds.length === 0) return [];

  return prisma.evaluationGrade.findMany({
    where: {
      studentGroupId: { in: studentGroups.map((sg) => sg.id) },
      academicEvaluation: { academicOfferingId: { in: offeringIds.map((o) => o.id) } },
    },
    select: { nota: true },
  });
}

async function backfillFinalSource() {
  // Parte 2: finalSource/finalOverride
  let processed = 0;
  let updatedComputed = 0;
  let updatedOverride = 0;

  let cursorId: number | undefined = undefined;

  while (true) {
    const rows = await prisma.studentAcademicRecord.findMany({
      where: {},
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      select: {
        id: true,
        studentId: true,
        groupId: true,
        subjectId: true,
        academicOfferingId: true,
        notaFinal: true,
        finalSource: true,
        finalOverride: true,
      },
    });

    if (rows.length === 0) break;

    for (const r of rows) {
      processed++;
      cursorId = r.id;

      // Si notaFinal es null: dejar default (NONE) y no tocar.
      if (r.notaFinal == null) continue;

      const grades = await resolveEvaluationGradesForRecord({
        studentId: r.studentId,
        groupId: r.groupId,
        subjectId: r.subjectId,
        academicOfferingId: r.academicOfferingId ?? null,
      });

      const values = grades.map((g) => g.nota).filter((n) => typeof n === 'number');
      const avg = average(values);

      const isComputed =
        avg != null && Math.abs(avg - r.notaFinal) <= TOLERANCE && values.length > 0;

      if (isComputed) {
        // Idempotencia: si ya está COMPUTED y override vacío, no tocar.
        if (r.finalSource === 'COMPUTED' && r.finalOverride == null) continue;
        await prisma.studentAcademicRecord.update({
          where: { id: r.id },
          data: {
            finalSource: 'COMPUTED',
            finalOverride: null,
            finalUpdatedAt: new Date(),
          },
        });
        updatedComputed++;
      } else {
        // OVERRIDE: guardar override solo si no coincide o no hay notas.
        if (r.finalSource === 'OVERRIDE' && r.finalOverride === r.notaFinal) continue;
        await prisma.studentAcademicRecord.update({
          where: { id: r.id },
          data: {
            finalSource: 'OVERRIDE',
            finalOverride: r.notaFinal,
            finalUpdatedAt: new Date(),
          },
        });
        updatedOverride++;
      }
    }

    if (rows.length < BATCH_SIZE) break;
  }

  console.log(
    `[B2] StudentAcademicRecord: procesados=${processed}, updated COMPUTED=${updatedComputed}, updated OVERRIDE=${updatedOverride}`,
  );
}

async function backfillTermSlot() {
  // Parte 3: termSlot en evaluaciones "Parcial N"
  let updated = 0;
  let cursorId: number | undefined = undefined;

  while (true) {
    const evaluations = await prisma.academicEvaluation.findMany({
      where: { termSlot: null },
      orderBy: { id: 'asc' },
      take: 500,
      ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      select: { id: true, titulo: true },
    });

    if (evaluations.length === 0) break;

    for (const ev of evaluations) {
      cursorId = ev.id;
      const title = (ev.titulo ?? '').trim();
      const match = title.match(/^parcial\s*(1|2|3|4)$/i);
      if (!match) continue;
      const slot = Number(match[1]);
      if (![1, 2, 3, 4].includes(slot)) continue;

      // Idempotencia: solo actualizar si sigue null.
      const res = await prisma.academicEvaluation.updateMany({
        where: { id: ev.id, termSlot: null },
        data: { termSlot: slot },
      });
      updated += res.count;
    }

    if (evaluations.length < 500) break;
  }

  console.log(`[B2] AcademicEvaluation.termSlot: actualizadas=${updated}`);
}

async function main() {
  console.log('[B2] Iniciando backfill academic v2...');

  await backfillPolicies();
  await backfillFinalSource();
  await backfillTermSlot();

  console.log('[B2] Backfill completado.');
}

main()
  .catch((e) => {
    console.error('[B2] Error:', e?.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

