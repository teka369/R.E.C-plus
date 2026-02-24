// Script para asignar un estudiante a un grupo y verificar la asignación
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignAndVerify() {
  try {
    // Buscar un estudiante
    const students = await prisma.user.findMany({
      where: { role: 'ESTUDIANTE' },
      take: 1,
    });

    if (students.length === 0) {
      console.log('❌ No hay estudiantes en la BD');
      return;
    }

    const student = students[0];
    console.log(`👤 Estudiante encontrado: ${student.nombres} ${student.apellidos} (ID: ${student.id})`);

    // Buscar un grupo
    const groups = await prisma.group.findMany({
      include: { grade: true },
      take: 1,
    });

    if (groups.length === 0) {
      console.log('❌ No hay grupos en la BD');
      return;
    }

    const group = groups[0];
    console.log(`👥 Grupo encontrado: ${group.nombre} (Grado: ${group.grade.nombre})`);

    // Verificar si ya está asignado
    const existingAssignment = await prisma.studentGroup.findFirst({
      where: { studentId: student.id },
    });

    if (existingAssignment) {
      console.log(`✅ Estudiante ya está asignado al grupo ${existingAssignment.groupId}`);
      
      // Verificar la relación completa
      const fullAssignment = await prisma.studentGroup.findFirst({
        where: { studentId: student.id },
        include: { group: { include: { grade: true } } },
      });
      
      console.log('\n📋 Asignación completa:');
      console.log(`   Estudiante: ${student.nombres} ${student.apellidos} (${student.email})`);
      console.log(`   Grupo: ${fullAssignment.group.nombre}`);
      console.log(`   Grado: ${fullAssignment.group.grade.nombre}`);
    } else {
      // Crear asignación
      const assignment = await prisma.studentGroup.create({
        data: {
          studentId: student.id,
          groupId: group.id,
        },
        include: { group: { include: { grade: true } } },
      });

      console.log('\n✅ Asignación creada exitosamente:');
      console.log(`   Estudiante: ${student.nombres} ${student.apellidos} (${student.email})`);
      console.log(`   Grupo: ${assignment.group.nombre}`);
      console.log(`   Grado: ${assignment.group.grade.nombre}`);
    }

    // Verificar materias del grupo
    const subjects = await prisma.groupSubject.findMany({
      where: { groupId: group.id },
      include: { subject: true },
    });

    console.log(`\n📚 Materias del grupo (${subjects.length}):`);
    if (subjects.length === 0) {
      console.log('   ⚠️ El grupo no tiene materias asignadas');
    } else {
      subjects.forEach((gs) => {
        console.log(`   - ${gs.subject.nombre}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

assignAndVerify();
