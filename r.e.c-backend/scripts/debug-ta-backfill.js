const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Ver las 4 TA sin offering
  const noOff = await p.$queryRawUnsafe(`
    SELECT ta.id, ta."teacherId", ta."groupId", ta."subjectId"
    FROM "TeacherAssignment" ta
    WHERE ta."academicOfferingId" IS NULL
  `);
  console.log('TA sin oferta:', JSON.stringify(noOff));

  // Para cada (groupId, subjectId), ver qué offerings existen
  const pairs = [...new Set(noOff.map(r => `${r.groupId}:${r.subjectId}`))];
  for (const pair of pairs) {
    const [gId, sId] = pair.split(':');
    const offerings = await p.$queryRawUnsafe(`
      SELECT ao.id, ao."groupId", ao."subjectId", ao."academicPeriodId", ap.nombre AS period
      FROM "AcademicOffering" ao
      JOIN "AcademicPeriod" ap ON ap.id = ao."academicPeriodId"
      WHERE ao."groupId" = ${gId} AND ao."subjectId" = ${sId}
    `);
    console.log(`Offerings para grupo ${gId} materia ${sId}:`, JSON.stringify(offerings));
  }
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
