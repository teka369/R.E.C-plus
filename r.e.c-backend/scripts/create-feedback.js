// Simple script to create a feedback from a professor to a student
// It will ensure minimal required data exists (grade, group, subject,
// users, assignments) and then insert a Feedback record.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const ts = Date.now();

  // 1) Ensure academic structures exist
  const grade = await prisma.grade.upsert({
    where: { nombre: 'Quinto' },
    update: {},
    create: { nombre: 'Quinto' },
  });

  const group = await prisma.group.upsert({
    where: { nombre_gradeId: { nombre: 'A', gradeId: grade.id } },
    update: {},
    create: { nombre: 'A', gradeId: grade.id },
  });

  const subject = await prisma.subject.upsert({
    where: { nombre: 'Matemáticas' },
    update: {},
    create: { nombre: 'Matemáticas' },
  });

  // 2) Create a professor and a student
  const professorPassword = await bcrypt.hash('password123', 10);
  const professor = await prisma.user.create({
    data: {
      nombres: 'Juan',
      apellidos: 'Profesor',
      email: `profesor_${ts}@example.com`,
      documento_identidad: `T${ts}`,
      telefono: '3000000000',
      password: professorPassword,
      role: 'PROFESOR',
    },
  });

  const studentPassword = await bcrypt.hash('password123', 10);
  const student = await prisma.user.create({
    data: {
      nombres: 'Maria',
      apellidos: 'Estudiante',
      email: `estudiante_${ts}@example.com`,
      documento_identidad: `S${ts}`,
      password: studentPassword,
      role: 'ESTUDIANTE',
    },
  });

  // 3) Link student to group, link subject to group, and assign professor
  await prisma.studentGroup.upsert({
    where: { studentId_groupId: { studentId: student.id, groupId: group.id } },
    update: {},
    create: { studentId: student.id, groupId: group.id },
  });

  await prisma.groupSubject.upsert({
    where: { groupId_subjectId: { groupId: group.id, subjectId: subject.id } },
    update: {},
    create: { groupId: group.id, subjectId: subject.id },
  });

  await prisma.teacherAssignment.upsert({
    where: { teacherId_groupId_subjectId: { teacherId: professor.id, groupId: group.id, subjectId: subject.id } },
    update: {},
    create: { teacherId: professor.id, groupId: group.id, subjectId: subject.id },
  });

  // 4) Create Feedback
  const feedback = await prisma.feedback.create({
    data: {
      teacherId: professor.id,
      studentId: student.id,
      groupId: group.id,
      subjectId: subject.id,
      title: 'Desempeño en Matemáticas - Unidad 1',
      content: 'Buen trabajo en atención y esfuerzo. Repasar multiplicación de fracciones.',
      strengths: [{ item: 'Participa activamente en clase' }, { item: 'Entrega tareas a tiempo' }],
      improvements: [{ item: 'Refuerzo en operaciones con fracciones' }, { item: 'Mayor precisión en problemas' }],
    },
  });

  console.log('Feedback creado:\n', {
    feedbackId: feedback.id,
    teacher: `${professor.nombres} ${professor.apellidos}`,
    student: `${student.nombres} ${student.apellidos}`,
    group: group.nombre,
    subject: subject.nombre,
    title: feedback.title,
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