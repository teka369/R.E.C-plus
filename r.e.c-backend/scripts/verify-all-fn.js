/**
 * verify-all-fn.js
 * ─────────────────────────────────────────────────────────────────────
 * Script de verificación unificada: 1FN, 2FN, 3FN y 4FN
 *
 * 1FN – Atomicidad: no hay columnas multi-valor ni JSON sin normalizar.
 *        (verificado a nivel estructural; aquí validamos que las tablas
 *        hijo N no tienen filas huérfanas ni duplicados)
 *
 * 2FN – Dependencia total de la PK compuesta: todas las FKs compuestas
 *        críticas tienen sus constraints únicos correctos en la DB y no
 *        presentan duplicados.
 *
 * 3FN – Sin dependencias transitivas: columnas bridge NOT NULL cubiertas,
 *        sin duplicados en claves naturales con período.
 *
 * 4FN – Sin MVDs independientes: tabla canónica TeacherOfferingAssignment
 *        sin duplicados ni huérfanos; StudentGroup keyed con período;
 *        todos los TeacherAssignment vinculados a su offering.
 * ─────────────────────────────────────────────────────────────────────
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function scalar(sql) {
  const rows = await prisma.$queryRawUnsafe(sql);
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  return Number(rows[0][Object.keys(rows[0])[0]] ?? 0);
}

async function chk(label, sql) {
  const count = await scalar(sql);
  return { label, count };
}

async function main() {
  const results = [];

  // ─── 1FN: Atomicidad — sin filas huérfanas en tablas hijo ───────────
  results.push({ section: '1FN – Atomicidad (tablas hijo sin huerfanos)' });

  results.push(await chk(
    'GroupInfoHighlight huerfanos',
    `SELECT COUNT(*) FROM "GroupInfoHighlight" gih LEFT JOIN "GroupInfo" gi ON gi."groupId" = gih."groupId" WHERE gi."groupId" IS NULL`,
  ));
  results.push(await chk(
    'GroupInfoMetric huerfanos',
    `SELECT COUNT(*) FROM "GroupInfoMetric" gim LEFT JOIN "GroupInfo" gi ON gi."groupId" = gim."groupId" WHERE gi."groupId" IS NULL`,
  ));
  results.push(await chk(
    'GroupInfoLink huerfanos',
    `SELECT COUNT(*) FROM "GroupInfoLink" gil LEFT JOIN "GroupInfo" gi ON gi."groupId" = gil."groupId" WHERE gi."groupId" IS NULL`,
  ));
  results.push(await chk(
    'FeedbackStrength huerfanos',
    `SELECT COUNT(*) FROM "FeedbackStrength" fs LEFT JOIN "Feedback" f ON f.id = fs."feedbackId" WHERE f.id IS NULL`,
  ));
  results.push(await chk(
    'FeedbackImprovement huerfanos',
    `SELECT COUNT(*) FROM "FeedbackImprovement" fi LEFT JOIN "Feedback" f ON f.id = fi."feedbackId" WHERE f.id IS NULL`,
  ));
  results.push(await chk(
    'PerformanceTopStudent huerfanos',
    `SELECT COUNT(*) FROM "PerformanceTopStudent" pts LEFT JOIN "GradePerformance" gp ON gp.id = pts."gradePerformanceId" WHERE gp.id IS NULL`,
  ));

  // ─── 2FN: Dependencia total — sin duplicados en claves compuestas ────
  results.push({ section: '2FN – Dependencia total (sin duplicados en claves compuestas)' });

  results.push(await chk(
    'Duplicados AcademicOffering (groupId, subjectId, academicPeriodId)',
    `SELECT COUNT(*) FROM (SELECT "groupId","subjectId","academicPeriodId",COUNT(*) c FROM "AcademicOffering" GROUP BY 1,2,3 HAVING COUNT(*)>1) t`,
  ));
  results.push(await chk(
    'Duplicados AcademicEvaluation (academicOfferingId, orden)',
    `SELECT COUNT(*) FROM (SELECT "academicOfferingId","orden",COUNT(*) c FROM "AcademicEvaluation" GROUP BY 1,2 HAVING COUNT(*)>1) t`,
  ));
  results.push(await chk(
    'Duplicados EvaluationGrade (academicEvaluationId, studentGroupId)',
    `SELECT COUNT(*) FROM (SELECT "academicEvaluationId","studentGroupId",COUNT(*) c FROM "EvaluationGrade" GROUP BY 1,2 HAVING COUNT(*)>1) t`,
  ));
  results.push(await chk(
    'Duplicados TeacherAssignment (teacherId, groupId, subjectId)',
    `SELECT COUNT(*) FROM (SELECT "teacherId","groupId","subjectId",COUNT(*) c FROM "TeacherAssignment" GROUP BY 1,2,3 HAVING COUNT(*)>1) t`,
  ));
  results.push(await chk(
    'EvaluationGrade huerfanos por evaluacion',
    `SELECT COUNT(*) FROM "EvaluationGrade" eg LEFT JOIN "AcademicEvaluation" ae ON ae.id = eg."academicEvaluationId" WHERE ae.id IS NULL`,
  ));
  results.push(await chk(
    'EvaluationGrade huerfanos por matricula',
    `SELECT COUNT(*) FROM "EvaluationGrade" eg LEFT JOIN "StudentGroup" sg ON sg.id = eg."studentGroupId" WHERE sg.id IS NULL`,
  ));

  // ─── 3FN: Sin dependencias transitivas — bridges NOT NULL y sin dupl ─
  results.push({ section: '3FN – Sin dependencias transitivas (columnas bridge y periods)' });

  results.push(await chk(
    'StudentAcademicRecord sin academicOfferingId',
    `SELECT COUNT(*) FROM "StudentAcademicRecord" WHERE "academicOfferingId" IS NULL`,
  ));
  results.push(await chk(
    'Duplicados GradePerformance (groupId, academicPeriodId)',
    `SELECT COUNT(*) FROM (SELECT "groupId","academicPeriodId",COUNT(*) c FROM "GradePerformance" GROUP BY 1,2 HAVING COUNT(*)>1) t`,
  ));
  results.push(await chk(
    'RecoveryConfig academicPeriodId nulo',
    `SELECT COUNT(*) FROM "RecoveryConfig" WHERE "academicPeriodId" IS NULL`,
  ));
  results.push(await chk(
    'RecoverySchedule academicPeriodId nulo',
    `SELECT COUNT(*) FROM "RecoverySchedule" WHERE "academicPeriodId" IS NULL`,
  ));
  results.push(await chk(
    'Duplicados RecoveryConfig por periodo',
    `SELECT COUNT(*) FROM (SELECT "academicPeriodId",COUNT(*) c FROM "RecoveryConfig" GROUP BY 1 HAVING COUNT(*)>1) t`,
  ));
  results.push(await chk(
    'Duplicados RecoverySchedule por periodo',
    `SELECT COUNT(*) FROM (SELECT "academicPeriodId",COUNT(*) c FROM "RecoverySchedule" GROUP BY 1 HAVING COUNT(*)>1) t`,
  ));

  // ─── 4FN: Sin MVDs independientes — tabla canónica y StudentGroup ────
  results.push({ section: '4FN – Sin MVDs independientes (TeacherOfferingAssignment + StudentGroup)' });

  results.push(await chk(
    'Duplicados TeacherOfferingAssignment (teacherId, academicOfferingId)',
    `SELECT COUNT(*) FROM (SELECT "teacherId","academicOfferingId",COUNT(*) c FROM "TeacherOfferingAssignment" GROUP BY 1,2 HAVING COUNT(*)>1) t`,
  ));
  results.push(await chk(
    'TeacherOfferingAssignment huerfanos por docente',
    `SELECT COUNT(*) FROM "TeacherOfferingAssignment" toa LEFT JOIN "User" u ON u.id = toa."teacherId" WHERE u.id IS NULL`,
  ));
  results.push(await chk(
    'TeacherOfferingAssignment huerfanos por oferta',
    `SELECT COUNT(*) FROM "TeacherOfferingAssignment" toa LEFT JOIN "AcademicOffering" ao ON ao.id = toa."academicOfferingId" WHERE ao.id IS NULL`,
  ));
  results.push(await chk(
    'TeacherAssignment sin academicOfferingId',
    `SELECT COUNT(*) FROM "TeacherAssignment" WHERE "academicOfferingId" IS NULL`,
  ));
  results.push(await chk(
    'TeacherAssignment sin espejo en TeacherOfferingAssignment',
    `SELECT COUNT(*) FROM "TeacherAssignment" ta LEFT JOIN "TeacherOfferingAssignment" toa ON toa."teacherId"=ta."teacherId" AND toa."academicOfferingId"=ta."academicOfferingId" WHERE ta."academicOfferingId" IS NOT NULL AND toa.id IS NULL`,
  ));
  results.push(await chk(
    'StudentGroup sin academicPeriodId (NOT NULL)',
    `SELECT COUNT(*) FROM "StudentGroup" WHERE "academicPeriodId" IS NULL`,
  ));
  results.push(await chk(
    'Duplicados StudentGroup (studentId, groupId, academicPeriodId)',
    `SELECT COUNT(*) FROM (SELECT "studentId","groupId","academicPeriodId",COUNT(*) c FROM "StudentGroup" GROUP BY 1,2,3 HAVING COUNT(*)>1) t`,
  ));
  results.push(await chk(
    'StudentGroup huerfanos por periodo',
    `SELECT COUNT(*) FROM "StudentGroup" sg LEFT JOIN "AcademicPeriod" ap ON ap.id = sg."academicPeriodId" WHERE ap.id IS NULL`,
  ));

  // ─── Resumen ─────────────────────────────────────────────────────────
  let currentSection = '';
  let totalChecks = 0;
  let failed = 0;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       VERIFICACIÓN FORMAS NORMALES — 1FN · 2FN · 3FN · 4FN       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  for (const r of results) {
    if ('section' in r) {
      if (currentSection) console.log('');
      currentSection = r.section;
      console.log(`  ┌─ ${r.section}`);
      continue;
    }
    totalChecks++;
    const ok = r.count === 0;
    if (!ok) failed++;
    console.log(`  │ ${ok ? 'OK ' : 'ERR'} │ ${r.label}: ${r.count}`);
  }

  console.log('\n  ──────────────────────────────────────────────────────────');
  console.log(`  Total checks : ${totalChecks}`);
  console.log(`  Con incidencias: ${failed}`);
  console.log(`  Estado: ${failed === 0 ? '✅ CUMPLE 1FN · 2FN · 3FN · 4FN' : '❌ HAY INCIDENCIAS'}\n`);

  if (failed > 0) process.exitCode = 2;
}

main()
  .catch(err => { console.error('Error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
