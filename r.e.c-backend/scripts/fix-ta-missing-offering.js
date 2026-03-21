/**
 * Fix script: crea GroupSubject + AcademicOffering faltantes para los 4 TeacherAssignment
 * sin academicOfferingId (teacherId=17, grupos 6,7, materias 4,5) y los vincula
 * en TeacherOfferingAssignment.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const ACADEMIC_PERIOD_ID = 1; // "Periodo lectivo legado" (ACTIVE)
const PAIRS = [
  { groupId: 6, subjectId: 4 },
  { groupId: 6, subjectId: 5 },
  { groupId: 7, subjectId: 4 },
  { groupId: 7, subjectId: 5 },
];
const TEACHER_ID = 17;

async function main() {
  for (const { groupId, subjectId } of PAIRS) {
    // 1. Upsert GroupSubject
    const gs = await p.groupSubject.upsert({
      where: { groupId_subjectId: { groupId, subjectId } },
      create: { groupId, subjectId, academicPeriodId: ACADEMIC_PERIOD_ID, isActive: true },
      update: { academicPeriodId: ACADEMIC_PERIOD_ID },
    });
    console.log(`GroupSubject (${groupId},${subjectId}) -> id=${gs.id}`);

    // 2. Upsert AcademicOffering
    const ao = await p.academicOffering.upsert({
      where: {
        groupId_subjectId_academicPeriodId: {
          groupId,
          subjectId,
          academicPeriodId: ACADEMIC_PERIOD_ID,
        },
      },
      create: {
        groupId,
        subjectId,
        academicPeriodId: ACADEMIC_PERIOD_ID,
        groupSubjectId: gs.id,
        isActive: true,
      },
      update: { groupSubjectId: gs.id },
    });
    console.log(`AcademicOffering (${groupId},${subjectId},${ACADEMIC_PERIOD_ID}) -> id=${ao.id}`);

    // 3. Link TeacherAssignment
    const ta = await p.teacherAssignment.updateMany({
      where: { teacherId: TEACHER_ID, groupId, subjectId, academicOfferingId: null },
      data: { academicOfferingId: ao.id },
    });
    console.log(`  TeacherAssignment actualizados: ${ta.count}`);

    // 4. Upsert TeacherOfferingAssignment (tabla 4FN canónica)
    await p.teacherOfferingAssignment.upsert({
      where: { teacherId_academicOfferingId: { teacherId: TEACHER_ID, academicOfferingId: ao.id } },
      create: { teacherId: TEACHER_ID, academicOfferingId: ao.id },
      update: {},
    });
    console.log(`  TeacherOfferingAssignment upsert OK`);
  }

  console.log('\n=== Fix completado ===');
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
