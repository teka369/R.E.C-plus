// Script para crear materias y asignarlas al grupo
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSubjectsAndAssign() {
  try {
    // Crear materias comunes
    const subjectNames = [
      { nombre: 'Matemáticas', codigo: 'MAT-001' },
      { nombre: 'Español', codigo: 'ESP-001' },
      { nombre: 'Inglés', codigo: 'ENG-001' },
      { nombre: 'Ciencias Naturales', codigo: 'CNT-001' },
      { nombre: 'Ciencias Sociales', codigo: 'CSO-001' },
    ];

    console.log('📚 Creando materias...\n');

    const subjects = [];
    for (const subjectData of subjectNames) {
      const existing = await prisma.subject.findUnique({
        where: { nombre: subjectData.nombre },
      });

      if (existing) {
        console.log(`✅ Materia ya existe: ${existing.nombre}`);
        subjects.push(existing);
      } else {
        const subject = await prisma.subject.create({
          data: subjectData,
        });
        console.log(`✨ Materia creada: ${subject.nombre} (${subject.codigo})`);
        subjects.push(subject);
      }
    }

    // Obtener el grupo
    const group = await prisma.group.findFirst({
      include: { grade: true },
    });

    if (!group) {
      console.log('\n❌ No hay grupos');
      return;
    }

    console.log(`\n👥 Asignando materias al grupo: ${group.nombre} (Grado ${group.grade.nombre})\n`);

    // Asignar materias al grupo
    for (const subject of subjects) {
      const existing = await prisma.groupSubject.findUnique({
        where: { groupId_subjectId: { groupId: group.id, subjectId: subject.id } },
      });

      if (existing) {
        console.log(`✅ Materia ya asignada: ${subject.nombre}`);
      } else {
        await prisma.groupSubject.create({
          data: {
            groupId: group.id,
            subjectId: subject.id,
          },
        });
        console.log(`✨ Materia asignada: ${subject.nombre}`);
      }
    }

    // Verificar resultado
    console.log('\n📋 Verificación final:');
    const finalSubjects = await prisma.groupSubject.findMany({
      where: { groupId: group.id },
      include: { subject: true },
    });

    console.log(`\nGrupo "${group.nombre}" ahora tiene ${finalSubjects.length} materias:`);
    finalSubjects.forEach((gs) => {
      console.log(`   ✓ ${gs.subject.nombre} (${gs.subject.codigo})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSubjectsAndAssign();
