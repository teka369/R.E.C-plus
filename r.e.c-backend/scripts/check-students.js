// Script para verificar estudiantes con grupo asignado
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarEstudiantes() {
  try {
    // Obtener todos los estudiantes
    const estudiantes = await prisma.user.findMany({
      where: { role: 'ESTUDIANTE' },
      include: {
        studentGroups: {
          include: {
            group: {
              include: { grade: true }
            }
          }
        }
      }
    });

    console.log('=== ESTUDIANTES EN LA BD ===\n');
    
    if (estudiantes.length === 0) {
      console.log('❌ No hay estudiantes en la base de datos');
    } else {
      estudiantes.forEach((est, idx) => {
        console.log(`${idx + 1}. ${est.nombres} ${est.apellidos}`);
        console.log(`   Email: ${est.email}`);
        console.log(`   ID: ${est.id}`);
        
        if (est.studentGroups.length > 0) {
          est.studentGroups.forEach(sg => {
            console.log(`   ✅ Grupo: ${sg.group.nombre} (Grado: ${sg.group.grade.nombre})`);
          });
        } else {
          console.log(`   ❌ Sin grupo asignado`);
        }
        console.log('');
      });
    }

    // Obtener grupos con estudiantes
    console.log('=== GRUPOS Y ESTUDIANTES ===\n');
    const grupos = await prisma.group.findMany({
      include: {
        grade: true,
        students: {
          include: { student: true }
        }
      }
    });

    grupos.forEach((grupo) => {
      console.log(`Grupo: ${grupo.nombre} (${grupo.grade.nombre})`);
      if (grupo.students.length > 0) {
        grupo.students.forEach(sg => {
          console.log(`  ✅ ${sg.student.nombres} ${sg.student.apellidos}`);
        });
      } else {
        console.log(`  (Sin estudiantes)`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarEstudiantes();
