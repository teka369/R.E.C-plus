// Verification script: runs Prisma queries to validate relationships and data integrity
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Counts
  const [users, grades, groups, subjects, assignments, studentGroups, groupSubjects, feedbacks, messages] = await Promise.all([
    prisma.user.count(),
    prisma.grade.count(),
    prisma.group.count(),
    prisma.subject.count(),
    prisma.teacherAssignment.count(),
    prisma.studentGroup.count(),
    prisma.groupSubject.count(),
    prisma.feedback.count(),
    prisma.message.count(),
  ]);

  console.log('Counts:', { users, grades, groups, subjects, assignments, studentGroups, groupSubjects, feedbacks, messages });

  // Pick one feedback with includes
  const feedback = await prisma.feedback.findFirst({
    include: { teacher: true, student: true, group: true, subject: true },
    orderBy: { id: 'desc' },
  });

  if (!feedback) {
    console.log('No feedbacks present.');
    return;
  }

  console.log('Sample Feedback:', {
    id: feedback.id,
    teacher: `${feedback.teacher.nombres} ${feedback.teacher.apellidos}`,
    student: `${feedback.student.nombres} ${feedback.student.apellidos}`,
    group: feedback.group.nombre,
    subject: feedback.subject?.nombre ?? null,
    title: feedback.title,
  });

  // Ensure supporting relations exist
  const ta = await prisma.teacherAssignment.findUnique({
    where: {
      teacherId_groupId_subjectId: {
        teacherId: feedback.teacherId,
        groupId: feedback.groupId,
        subjectId: feedback.subjectId ?? 0,
      },
    },
  });
  const gs = feedback.subjectId
    ? await prisma.groupSubject.findUnique({
        where: { groupId_subjectId: { groupId: feedback.groupId, subjectId: feedback.subjectId } },
      })
    : null;
  const sg = await prisma.studentGroup.findUnique({
    where: { studentId_groupId: { studentId: feedback.studentId, groupId: feedback.groupId } },
  });

  console.log('Relations present:', {
    teacherAssignment: !!ta,
    groupSubject: gs ? true : false,
    studentGroup: !!sg,
  });

  // Aggregate queries
  const feedbackByGroup = await prisma.feedback.groupBy({ by: ['groupId'], _count: { _all: true } });
  const feedbackByTeacher = await prisma.feedback.groupBy({ by: ['teacherId'], _count: { _all: true } });

  console.log('Aggregates:', { feedbackByGroup, feedbackByTeacher });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });