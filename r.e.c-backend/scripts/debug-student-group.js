const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICANDO ESTUDIANTE ID 2:\n');
  
  const student = await prisma.user.findUnique({
    where: { id: 2 },
  });
  
  if (!student) {
    console.log('❌ Estudiante no encontrado');
    return;
  }
  
  console.log(`✅ Estudiante encontrado:`);
  console.log(`   ID: ${student.id}`);
  console.log(`   Nombre: ${student.name}`);
  console.log(`   Email: ${student.email}`);
  console.log(`   Rol: ${student.role}`);
  
  console.log('\n📋 RELACIÓN StudentGroup:\n');
  
  const studentGroup = await prisma.studentGroup.findFirst({
    where: { studentId: 2 },
    include: {
      group: {
        include: {
          grade: true
        }
      }
    }
  });
  
  if (!studentGroup) {
    console.log('❌ NO EXISTE StudentGroup para este estudiante');
    console.log('\n📊 TODOS LOS StudentGroups en la BD:\n');
    const all = await prisma.studentGroup.findMany({
      include: {
        group: {
          include: { grade: true }
        }
      }
    });
    console.log(`Total: ${all.length}`);
    all.forEach(sg => {
      console.log(`  - Estudiante ${sg.studentId} -> Grupo ${sg.groupId} (${sg.group.nombre}), Grado ${sg.group.grade.nombre}`);
    });
  } else {
    console.log('✅ StudentGroup encontrado:');
    console.log(`   Grupo ID: ${studentGroup.groupId}`);
    console.log(`   Grupo Nombre: ${studentGroup.group.nombre}`);
    console.log(`   Grado ID: ${studentGroup.group.gradeId}`);
    console.log(`   Grado Nombre: ${studentGroup.group.grade.nombre}`);
  }
  
  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
