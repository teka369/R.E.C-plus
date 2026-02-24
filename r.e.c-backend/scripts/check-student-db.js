// Script para buscar usuario estudiante en la base de datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findStudent() {
  try {
    console.log('🔍 Buscando estudiante juan david guarin romero...\n');

    const student = await prisma.user.findFirst({
      where: {
        role: 'ESTUDIANTE',
      },
      include: {
        studentGroups: {
          include: {
            group: {
              include: {
                grade: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      console.log('❌ No hay estudiantes en la base de datos');
      return;
    }

    console.log('👤 Estudiante encontrado:');
    console.log(`   Nombre: ${student.name}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   ID: ${student.id}`);
    console.log(`   Role: ${student.role}`);

    if (student.studentGroups.length > 0) {
      console.log('\n📚 Grupo(s) asignado(s):');
      student.studentGroups.forEach((sg) => {
        console.log(`   ✓ Grupo: ${sg.group.nombre}`);
        console.log(`   ✓ Grado: ${sg.group.grade.nombre}`);
        console.log(`   ✓ StudentGroup ID: ${sg.id}`);
      });
    } else {
      console.log('\n❌ Sin grupo asignado');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findStudent();
