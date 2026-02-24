const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS users FROM "User";');
  const feedbacks = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS feedbacks FROM "Feedback";');
  const assignments = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS assignments FROM "TeacherAssignment";');
  const fkFeedbackTeacher = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS ok FROM "Feedback" f JOIN "User" u ON u.id = f."teacherId";');
  const fkFeedbackStudent = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS ok FROM "Feedback" f JOIN "User" u ON u.id = f."studentId";');
  const fkFeedbackGroup = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS ok FROM "Feedback" f JOIN "Group" g ON g.id = f."groupId";');

  console.log('SQL checks:', {
    users: users[0]?.users ?? null,
    feedbacks: feedbacks[0]?.feedbacks ?? null,
    assignments: assignments[0]?.assignments ?? null,
    fkFeedbackTeacher: fkFeedbackTeacher[0]?.ok ?? null,
    fkFeedbackStudent: fkFeedbackStudent[0]?.ok ?? null,
    fkFeedbackGroup: fkFeedbackGroup[0]?.ok ?? null,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });