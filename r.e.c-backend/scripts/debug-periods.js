const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const periods = await p.$queryRawUnsafe('SELECT id, nombre, estado FROM "AcademicPeriod" ORDER BY id');
  console.log('Periodos:', JSON.stringify(periods));

  // Ver si existen GroupSubject para los grupos/materias problemáticos
  const gs = await p.$queryRawUnsafe(`
    SELECT id, "groupId", "subjectId", "academicPeriodId"
    FROM "GroupSubject"
    WHERE ("groupId" = 6 AND "subjectId" IN (4,5))
       OR ("groupId" = 7 AND "subjectId" IN (4,5))
  `);
  console.log('GroupSubject relacionados:', JSON.stringify(gs));
}

main().catch(console.error).finally(() => p.$disconnect());
