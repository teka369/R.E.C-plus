const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const rows = await p.$queryRawUnsafe(`
    SELECT ta.id, ta."teacherId", ta."groupId", ta."subjectId",
           u.nombres AS teacher,
           g.nombre AS "groupName",
           s.nombre AS subject
    FROM "TeacherAssignment" ta
    JOIN "User" u ON u.id = ta."teacherId"
    JOIN "Group" g ON g.id = ta."groupId"
    JOIN "Subject" s ON s.id = ta."subjectId"
    WHERE ta."academicOfferingId" IS NULL
  `);
  console.log('TeacherAssignment sin academicOfferingId:');
  rows.forEach(r => console.log(JSON.stringify(r)));
  await p.$disconnect();
}
main().catch(console.error);
