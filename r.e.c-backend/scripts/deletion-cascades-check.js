// Script to validate onDelete behaviors: Cascade on Group/User, SetNull on Subject in Feedback
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const ts = Date.now();

  // Create minimal structures
  const grade = await prisma.grade.create({ data: { nombre: `TempGrade_${ts}` } });
  const group = await prisma.group.create({ data: { nombre: `TempGroup_${ts}`, gradeId: grade.id } });
  const subject = await prisma.subject.create({ data: { nombre: `TempSubject_${ts}` } });
  const hashedPwd = await bcrypt.hash('pwd', 10);
  const teacher = await prisma.user.create({ data: { nombres: 'Temp Profe', apellidos: 'Del', email: `t_${ts}@ex.com`, documento_identidad: `t_${ts}`, telefono: '300', password: hashedPwd, role: 'PROFESOR' } });
  const student = await prisma.user.create({ data: { nombres: 'Temp Estu', apellidos: 'Del', email: `s_${ts}@ex.com`, documento_identidad: `s_${ts}`, password: hashedPwd, role: 'ESTUDIANTE' } });

  await prisma.groupSubject.create({ data: { groupId: group.id, subjectId: subject.id } });
  await prisma.studentGroup.create({ data: { studentId: student.id, groupId: group.id } });
  await prisma.teacherAssignment.create({ data: { teacherId: teacher.id, groupId: group.id, subjectId: subject.id } });

  // Feedback tied to subject (to test SetNull)
  const fSetNull = await prisma.feedback.create({
    data: {
      teacherId: teacher.id,
      studentId: student.id,
      groupId: group.id,
      subjectId: subject.id,
      title: 'Prueba SetNull',
      content: 'Contenido',
    },
  });

  // Delete subject => feedback should remain with subjectId null
  await prisma.subject.delete({ where: { id: subject.id } });
  const afterSubject = await prisma.feedback.findUnique({ where: { id: fSetNull.id } });

  // Create another feedback to test Cascade on group
  const fCascade = await prisma.feedback.create({
    data: {
      teacherId: teacher.id,
      studentId: student.id,
      groupId: group.id,
      title: 'Prueba Cascade Grupo',
      content: 'Contenido 2',
    },
  });

  // Delete group => feedbacks linked to that group should be removed
  await prisma.group.delete({ where: { id: group.id } });
  const afterGroup1 = await prisma.feedback.findUnique({ where: { id: fSetNull.id } });
  const afterGroup2 = await prisma.feedback.findUnique({ where: { id: fCascade.id } });

  console.log('Deletion behaviors:', {
    setNullFeedbackId: fSetNull.id,
    afterSubject_subjectId: afterSubject?.subjectId ?? null,
    afterGroup_setNullExists: !!afterGroup1,
    afterGroup_cascadeExists: !!afterGroup2,
  });
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });