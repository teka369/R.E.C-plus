const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function scalar(query) {
  const rows = await prisma.$queryRawUnsafe(query);
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  const first = rows[0];
  const key = Object.keys(first)[0];
  return Number(first[key] ?? 0);
}

async function check(name, query) {
  const count = await scalar(query);
  return { name, count };
}

async function main() {
  const checks = [];

  // 1FN: no JSON/csv legacy columns (structure-level already removed); here we validate row-level bridges are populated.
  checks.push(
    await check(
      'StudentAcademicRecord sin academicOfferingId',
      'SELECT COUNT(*) FROM "StudentAcademicRecord" WHERE "academicOfferingId" IS NULL',
    ),
  );

  // 2FN/3FN: unique constraints should not have duplicates in data.
  checks.push(
    await check(
      'Duplicados GradePerformance (groupId, academicPeriodId)',
      'SELECT COUNT(*) FROM (SELECT "groupId", "academicPeriodId", COUNT(*) c FROM "GradePerformance" GROUP BY 1,2 HAVING COUNT(*) > 1) t',
    ),
  );

  checks.push(
    await check(
      'Duplicados RecoveryConfig por periodo',
      'SELECT COUNT(*) FROM (SELECT "academicPeriodId", COUNT(*) c FROM "RecoveryConfig" GROUP BY 1 HAVING COUNT(*) > 1) t',
    ),
  );

  checks.push(
    await check(
      'Duplicados RecoverySchedule por periodo',
      'SELECT COUNT(*) FROM (SELECT "academicPeriodId", COUNT(*) c FROM "RecoverySchedule" GROUP BY 1 HAVING COUNT(*) > 1) t',
    ),
  );

  checks.push(
    await check(
      'Duplicados AcademicEvaluation (academicOfferingId, orden)',
      'SELECT COUNT(*) FROM (SELECT "academicOfferingId", "orden", COUNT(*) c FROM "AcademicEvaluation" GROUP BY 1,2 HAVING COUNT(*) > 1) t',
    ),
  );

  checks.push(
    await check(
      'Duplicados EvaluationGrade (academicEvaluationId, studentGroupId)',
      'SELECT COUNT(*) FROM (SELECT "academicEvaluationId", "studentGroupId", COUNT(*) c FROM "EvaluationGrade" GROUP BY 1,2 HAVING COUNT(*) > 1) t',
    ),
  );

  // Referential integrity sanity checks (orphans)
  checks.push(
    await check(
      'PerformanceTopStudent huerfanos',
      'SELECT COUNT(*) FROM "PerformanceTopStudent" pts LEFT JOIN "GradePerformance" gp ON gp.id = pts."gradePerformanceId" WHERE gp.id IS NULL',
    ),
  );

  checks.push(
    await check(
      'EvaluationGrade huerfanos por evaluacion',
      'SELECT COUNT(*) FROM "EvaluationGrade" eg LEFT JOIN "AcademicEvaluation" ae ON ae.id = eg."academicEvaluationId" WHERE ae.id IS NULL',
    ),
  );

  checks.push(
    await check(
      'EvaluationGrade huerfanos por matricula',
      'SELECT COUNT(*) FROM "EvaluationGrade" eg LEFT JOIN "StudentGroup" sg ON sg.id = eg."studentGroupId" WHERE sg.id IS NULL',
    ),
  );

  checks.push(
    await check(
      'GroupInfo hijos huerfanos (highlights)',
      'SELECT COUNT(*) FROM "GroupInfoHighlight" gih LEFT JOIN "GroupInfo" gi ON gi."groupId" = gih."groupId" WHERE gi."groupId" IS NULL',
    ),
  );

  checks.push(
    await check(
      'GroupInfo hijos huerfanos (metrics)',
      'SELECT COUNT(*) FROM "GroupInfoMetric" gim LEFT JOIN "GroupInfo" gi ON gi."groupId" = gim."groupId" WHERE gi."groupId" IS NULL',
    ),
  );

  checks.push(
    await check(
      'GroupInfo hijos huerfanos (links)',
      'SELECT COUNT(*) FROM "GroupInfoLink" gil LEFT JOIN "GroupInfo" gi ON gi."groupId" = gil."groupId" WHERE gi."groupId" IS NULL',
    ),
  );

  checks.push(
    await check(
      'FeedbackStrength huerfanos',
      'SELECT COUNT(*) FROM "FeedbackStrength" fs LEFT JOIN "Feedback" f ON f.id = fs."feedbackId" WHERE f.id IS NULL',
    ),
  );

  checks.push(
    await check(
      'FeedbackImprovement huerfanos',
      'SELECT COUNT(*) FROM "FeedbackImprovement" fi LEFT JOIN "Feedback" f ON f.id = fi."feedbackId" WHERE f.id IS NULL',
    ),
  );

  // Non-null requirements introduced for 3FN recovery configs
  checks.push(
    await check(
      'RecoveryConfig academicPeriodId nulo',
      'SELECT COUNT(*) FROM "RecoveryConfig" WHERE "academicPeriodId" IS NULL',
    ),
  );

  checks.push(
    await check(
      'RecoverySchedule academicPeriodId nulo',
      'SELECT COUNT(*) FROM "RecoverySchedule" WHERE "academicPeriodId" IS NULL',
    ),
  );

  const failed = checks.filter((c) => c.count > 0);

  console.log('=== Verificacion 3FN Integridad ===');
  checks.forEach((c) => {
    console.log(`${c.count === 0 ? 'OK ' : 'ERR'} | ${c.name}: ${c.count}`);
  });
  console.log('-----------------------------------');
  console.log(`Total checks: ${checks.length}`);
  console.log(`Checks con incidencias: ${failed.length}`);

  if (failed.length > 0) {
    process.exitCode = 2;
  }
}

main()
  .catch((err) => {
    console.error('Error ejecutando verificacion:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
