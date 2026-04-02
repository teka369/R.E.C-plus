// Script to assert uniqueness constraints on StudentGroup, GroupSubject, TeacherAssignment
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const ts = Date.now();
  // Create minimal structures
  const grade = await prisma.grade.upsert({ where: { nombre: 'Único-Grado' }, update: {}, create: { nombre: 'Único-Grado' } });
  const group = await prisma.group.upsert({ where: { nombre_gradeId: { nombre: 'U', gradeId: grade.id } }, update: {}, create: { nombre: 'U', gradeId: grade.id } });
  const subject = await prisma.subject.upsert({ where: { nombre: 'Única-Materia' }, update: {}, create: { nombre: 'Única-Materia' } });

  const hashed = await bcrypt.hash('pwd', 10);
  const student = await prisma.user.create({
    data: { nombres: 'Estu Único', apellidos: 'Prueba', email: `estu_${ts}@example.com`, password: hashed, role: 'ESTUDIANTE' },
  });
  const teacher = await prisma.user.create({
    data: { nombres: 'Profe Único', apellidos: 'Prueba', email: `profe_${ts}@example.com`, password: hashed, role: 'PROFESOR' },
  });

  // Create first records
  const sg1 = await prisma.studentGroup.create({ data: { studentId: student.id, groupId: group.id } });
  const gs1 = await prisma.groupSubject.create({ data: { groupId: group.id, subjectId: subject.id } });
  const ta1 = await prisma.teacherAssignment.create({ data: { teacherId: teacher.id, groupId: group.id, subjectId: subject.id } });

  let sgDupError = null, gsDupError = null, taDupError = null;
  // Try to create exact duplicates and capture errors
  try {
    await prisma.studentGroup.create({ data: { studentId: student.id, groupId: group.id } });
  } catch (e) { sgDupError = e.code || e.message; }
  try {
    await prisma.groupSubject.create({ data: { groupId: group.id, subjectId: subject.id } });
  } catch (e) { gsDupError = e.code || e.message; }
  try {
    await prisma.teacherAssignment.create({ data: { teacherId: teacher.id, groupId: group.id, subjectId: subject.id } });
  } catch (e) { taDupError = e.code || e.message; }

  console.log('Uniqueness checks:', {
    studentGroupId: sg1.id,
    groupSubjectId: gs1.id,
    teacherAssignmentId: ta1.id,
    duplicateStudentGroupError: sgDupError,
    duplicateGroupSubjectError: gsDupError,
    duplicateTeacherAssignmentError: taDupError,
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