/**
 * Script de verificacion de integridad academica.
 *
 * Detecta registros que aun no tienen enlace a la oferta academica formal
 * tras las migraciones puente de normalizacion (Fases 1-3).
 *
 * Uso:
 *   node scripts/verify-offering-integrity.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Verificacion de integridad academica ===\n');

  // 1. TeacherAssignment sin AcademicOffering vinculada
  const orphanedAssignments = await prisma.teacherAssignment.findMany({
    where: { academicOfferingId: null },
    include: {
      teacher: { select: { id: true, nombres: true, apellidos: true } },
      group: { select: { id: true, nombre: true } },
      subject: { select: { id: true, nombre: true } },
    },
    orderBy: { id: 'asc' },
  });

  console.log(`TeacherAssignment sin oferta: ${orphanedAssignments.length}`);
  if (orphanedAssignments.length) {
    orphanedAssignments.forEach((a) => {
      console.log(
        `  - ID ${a.id}: ${a.teacher.nombres} ${a.teacher.apellidos} ` +
          `→ Grupo "${a.group.nombre}" / Materia "${a.subject.nombre}"`,
      );
    });
  }

  // 2. GroupSubject sin periodo academico
  const orphanedGroupSubjects = await prisma.groupSubject.findMany({
    where: { academicPeriodId: null },
    include: {
      group: { select: { id: true, nombre: true } },
      subject: { select: { id: true, nombre: true } },
    },
    orderBy: { id: 'asc' },
  });

  console.log(
    `\nGroupSubject sin periodo academico: ${orphanedGroupSubjects.length}`,
  );
  if (orphanedGroupSubjects.length) {
    orphanedGroupSubjects.forEach((gs) => {
      console.log(
        `  - ID ${gs.id}: Grupo "${gs.group.nombre}" / Materia "${gs.subject.nombre}"`,
      );
    });
  }

  // 3. StudyMaterial sin AcademicOffering vinculada
  const orphanedMaterials = await prisma.studyMaterial.findMany({
    where: { academicOfferingId: null },
    select: { id: true, title: true, groupId: true, subjectId: true },
    orderBy: { id: 'asc' },
  });

  console.log(`\nStudyMaterial sin oferta: ${orphanedMaterials.length}`);
  if (orphanedMaterials.length) {
    orphanedMaterials.slice(0, 20).forEach((m) => {
      console.log(
        `  - ID ${m.id}: "${m.title}" (grupo ${m.groupId} / materia ${m.subjectId})`,
      );
    });
    if (orphanedMaterials.length > 20) {
      console.log(`  ... y ${orphanedMaterials.length - 20} mas`);
    }
  }

  // 4. Syllabus sin AcademicOffering vinculada
  const orphanedSyllabi = await prisma.syllabus.findMany({
    where: { academicOfferingId: null },
    select: { id: true, title: true, groupId: true, subjectId: true },
    orderBy: { id: 'asc' },
  });

  console.log(`\nSyllabus sin oferta: ${orphanedSyllabi.length}`);
  if (orphanedSyllabi.length) {
    orphanedSyllabi.slice(0, 20).forEach((s) => {
      console.log(
        `  - ID ${s.id}: "${s.title}" (grupo ${s.groupId} / materia ${s.subjectId})`,
      );
    });
    if (orphanedSyllabi.length > 20) {
      console.log(`  ... y ${orphanedSyllabi.length - 20} mas`);
    }
  }

  // 5. AcademicPeriod disponibles (util para saber que periodos existen)
  const periods = await prisma.academicPeriod.findMany({
    orderBy: { fechaInicio: 'asc' },
    select: { id: true, nombre: true, codigo: true, estado: true },
  });

  console.log(`\nPeriodos academicos registrados: ${periods.length}`);
  periods.forEach((p) => {
    console.log(`  - ID ${p.id}: [${p.estado}] ${p.nombre} (${p.codigo})`);
  });

  const total =
    orphanedAssignments.length +
    orphanedGroupSubjects.length +
    orphanedMaterials.length +
    orphanedSyllabi.length;

  console.log(
    `\n=== Total de registros sin enlazar: ${total} ===`,
    total === 0 ? '✓ Sin problemas de integridad' : '⚠ Revisar registros arriba',
  );
}

main()
  .catch((err) => {
    console.error('Error durante la verificacion:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
