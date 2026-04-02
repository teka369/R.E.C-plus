/**
 * check-active-periods.js
 * Verifica qué períodos académicos activos existen en la base de datos.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Verificando períodos académicos activos ===\n');

  // 1. Verificar períodos activos
  const activePeriods = await prisma.academicPeriod.findMany({
    where: { estado: 'ACTIVE' },
    select: {
      id: true,
      institutionId: true,
      nombre: true,
      codigo: true,
      estado: true,
    },
  });

  console.log('Períodos académicos con estado ACTIVE:');
  if (activePeriods.length === 0) {
    console.log('  ❌ NO HAY PERÍODOS ACTIVOS');
  } else {
    activePeriods.forEach(p => {
      console.log(`  ✅ ID: ${p.id} | Institución: ${p.institutionId} | Nombre: ${p.nombre} | Código: ${p.codigo}`);
    });
  }

  // 2. Verificar todas las instituciones
  console.log('\n=== Instituciones existentes ===\n');
  const institutions = await prisma.institution.findMany({
    select: { id: true, nombre: true },
  });

  if (institutions.length === 0) {
    console.log('  ❌ NO HAY INSTITUCIONES');
  } else {
    institutions.forEach(i => {
      console.log(`  ID: ${i.id} | Nombre: ${i.nombre}`);
    });
  }

  // 3. Verificar usuarios y sus instituciones
  console.log('\n=== Usuarios y sus instituciones ===\n');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      institutionId: true,
    },
    take: 10, // Solo los primeros 10
  });

  if (users.length === 0) {
    console.log('  ❌ NO HAY USUARIOS');
  } else {
    users.forEach(u => {
      console.log(`  ID: ${u.id} | Email: ${u.email} | Rol: ${u.role} | Institución: ${u.institutionId}`);
    });
  }

  // 4. Verificar StudentGroup sin período
  console.log('\n=== StudentGroup sin período académico ===\n');
  const sgWithoutPeriod = await prisma.$queryRaw`
    SELECT sg.id, sg."studentId", sg."groupId", sg."academicPeriodId"
    FROM "StudentGroup" sg
    WHERE sg."academicPeriodId" IS NULL
    LIMIT 10
  `;

  if (sgWithoutPeriod.length === 0) {
    console.log('  ✅ No hay StudentGroup sin período');
  } else {
    console.log(`  ⚠️  Hay ${sgWithoutPeriod.length} StudentGroup sin período:`);
    sgWithoutPeriod.forEach(sg => {
      console.log(`    ID: ${sg.id} | StudentId: ${sg.studentId} | GroupId: ${sg.groupId} | AcademicPeriodId: ${sg.academicPeriodId}`);
    });
  }
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
