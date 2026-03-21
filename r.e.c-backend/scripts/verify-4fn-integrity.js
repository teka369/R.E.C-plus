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
  return { name, count: await scalar(query) };
}

async function main() {
  const checks = [];

  // 4FN principal: Docente<->Oferta no debe duplicarse
  checks.push(
    await check(
      'Duplicados TeacherOfferingAssignment (teacherId, academicOfferingId)',
      'SELECT COUNT(*) FROM (SELECT "teacherId", "academicOfferingId", COUNT(*) c FROM "TeacherOfferingAssignment" GROUP BY 1,2 HAVING COUNT(*) > 1) t',
    ),
  );

  // Huérfanos en la tabla canónica
  checks.push(
    await check(
      'TeacherOfferingAssignment huerfanos por docente',
      'SELECT COUNT(*) FROM "TeacherOfferingAssignment" toa LEFT JOIN "User" u ON u.id = toa."teacherId" WHERE u.id IS NULL',
    ),
  );
  checks.push(
    await check(
      'TeacherOfferingAssignment huerfanos por oferta',
      'SELECT COUNT(*) FROM "TeacherOfferingAssignment" toa LEFT JOIN "AcademicOffering" ao ON ao.id = toa."academicOfferingId" WHERE ao.id IS NULL',
    ),
  );

  // Consistencia legado -> canónico
  checks.push(
    await check(
      'TeacherAssignment con academicOfferingId sin espejo en TeacherOfferingAssignment',
      'SELECT COUNT(*) FROM "TeacherAssignment" ta LEFT JOIN "TeacherOfferingAssignment" toa ON toa."teacherId" = ta."teacherId" AND toa."academicOfferingId" = ta."academicOfferingId" WHERE ta."academicOfferingId" IS NOT NULL AND toa.id IS NULL',
    ),
  );

  // 4FN: TeacherAssignment sin academicOfferingId (no debe quedar ninguno huérfano)
  checks.push(
    await check(
      'TeacherAssignment sin academicOfferingId (debe ser 0)',
      'SELECT COUNT(*) FROM "TeacherAssignment" WHERE "academicOfferingId" IS NULL',
    ),
  );

  // 4FN: StudentGroup sin academicPeriodId (NOT NULL garantizado por schema)
  checks.push(
    await check(
      'StudentGroup sin academicPeriodId (debe ser 0)',
      'SELECT COUNT(*) FROM "StudentGroup" WHERE "academicPeriodId" IS NULL',
    ),
  );

  // 4FN: Duplicados StudentGroup (studentId, groupId, academicPeriodId)
  checks.push(
    await check(
      'Duplicados StudentGroup (studentId, groupId, academicPeriodId)',
      'SELECT COUNT(*) FROM (SELECT "studentId", "groupId", "academicPeriodId", COUNT(*) c FROM "StudentGroup" GROUP BY 1,2,3 HAVING COUNT(*) > 1) t',
    ),
  );

  // 4FN: StudentGroup con academicPeriodId huérfano
  checks.push(
    await check(
      'StudentGroup huerfanos por período',
      'SELECT COUNT(*) FROM "StudentGroup" sg LEFT JOIN "AcademicPeriod" ap ON ap.id = sg."academicPeriodId" WHERE ap.id IS NULL',
    ),
  );

  const failed = checks.filter((c) => c.count > 0);

  console.log('=== Verificacion 4FN Integridad ===');
  checks.forEach((c) => {
    console.log(`${c.count === 0 ? 'OK ' : 'ERR'} | ${c.name}: ${c.count}`);
  });
  console.log('-----------------------------------');
  console.log(`Total checks: ${checks.length}`);
  console.log(`Checks con incidencias: ${failed.length}`);

  if (failed.length > 0) process.exitCode = 2;
}

main()
  .catch((err) => {
    console.error('Error ejecutando verificacion 4FN:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
