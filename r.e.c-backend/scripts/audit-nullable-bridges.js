const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function scalar(query) {
  const rows = await p.$queryRawUnsafe(query);
  return Number(rows[0][Object.keys(rows[0])[0]] ?? 0);
}

async function main() {
  const results = [
    ['StudentGroup sin academicPeriodId', await scalar('SELECT COUNT(*) FROM "StudentGroup" WHERE "academicPeriodId" IS NULL')],
    ['StudentAcademicRecord sin academicOfferingId', await scalar('SELECT COUNT(*) FROM "StudentAcademicRecord" WHERE "academicOfferingId" IS NULL')],
    ['GroupSubject sin academicPeriodId', await scalar('SELECT COUNT(*) FROM "GroupSubject" WHERE "academicPeriodId" IS NULL')],
    ['TeacherAssignment sin academicOfferingId', await scalar('SELECT COUNT(*) FROM "TeacherAssignment" WHERE "academicOfferingId" IS NULL')],
    ['Syllabus sin academicOfferingId', await scalar('SELECT COUNT(*) FROM "Syllabus" WHERE "academicOfferingId" IS NULL')],
    ['StudyMaterial sin academicOfferingId', await scalar('SELECT COUNT(*) FROM "StudyMaterial" WHERE "academicOfferingId" IS NULL')],
  ];

  console.log('=== Auditoría de columnas bridge nullable ===');
  results.forEach(([name, count]) => console.log(`  ${name}: ${count}`));
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
