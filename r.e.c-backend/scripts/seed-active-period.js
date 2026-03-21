/**
 * seed-active-period.js
 * Crea (o actualiza) el primer AcademicPeriod como ACTIVE.
 * Uso: node scripts/seed-active-period.js
 *
 * Comportamiento:
 *   - Si ya existe un período ACTIVE, lo muestra y no crea otro.
 *   - Si existe uno con código PERIODO-2026-1, lo actualiza a ACTIVE.
 *   - Si no existe ninguno, lo crea completo.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CODIGO = 'PERIODO-2026-1';

async function main() {
  // Verificar si ya hay un período ACTIVE
  const existing = await prisma.academicPeriod.findFirst({
    where: { estado: 'ACTIVE' },
  });

  if (existing) {
    console.log('✅ Ya existe un período ACTIVE:');
    console.log(`   ID: ${existing.id} | Código: ${existing.codigo} | Nombre: ${existing.nombre}`);
    return;
  }

  // Upsert por código
  const period = await prisma.academicPeriod.upsert({
    where: { codigo: CODIGO },
    update: {
      estado: 'ACTIVE',
    },
    create: {
      nombre: 'Período Académico 2026 – I',
      codigo: CODIGO,
      tipo: 'TERM',
      estado: 'ACTIVE',
      fechaInicio: new Date('2026-01-15T00:00:00.000Z'),
      fechaFin: new Date('2026-06-30T23:59:59.999Z'),
    },
  });

  console.log('✅ AcademicPeriod ACTIVE creado/actualizado:');
  console.log(`   ID: ${period.id} | Código: ${period.codigo} | Estado: ${period.estado}`);

  // Backfill: vincular StudentGroup sin período al período recién creado
  const sgUpdated = await prisma.studentGroup.updateMany({
    where: { academicPeriodId: null },
    data: { academicPeriodId: period.id },
  });
  console.log(`   StudentGroup vinculados: ${sgUpdated.count}`);

  // Backfill: vincular GroupSubject sin período
  const gsUpdated = await prisma.groupSubject.updateMany({
    where: { academicPeriodId: null },
    data: { academicPeriodId: period.id },
  });
  console.log(`   GroupSubject vinculados: ${gsUpdated.count}`);

  // Crear AcademicOffering para todos los GroupSubject del período
  const groupSubjects = await prisma.groupSubject.findMany({
    where: { academicPeriodId: period.id },
    select: { id: true, groupId: true, subjectId: true },
  });

  let offeringsCreated = 0;
  for (const gs of groupSubjects) {
    await prisma.academicOffering.upsert({
      where: {
        groupId_subjectId_academicPeriodId: {
          groupId: gs.groupId,
          subjectId: gs.subjectId,
          academicPeriodId: period.id,
        },
      },
      update: { groupSubjectId: gs.id },
      create: {
        groupId: gs.groupId,
        subjectId: gs.subjectId,
        academicPeriodId: period.id,
        groupSubjectId: gs.id,
      },
    });
    offeringsCreated++;
  }
  console.log(`   AcademicOffering sincronizados: ${offeringsCreated}`);

  // Vincular RecoveryConfig al período si existe
  try {
    await prisma.recoveryConfig.updateMany({
      where: { academicPeriodId: null },
      data: { academicPeriodId: period.id },
    });
    console.log(`   RecoveryConfig vinculados al período`);
  } catch {
    // singleton puede no existir aún
  }

  // Vincular RecoverySchedule al período si existe
  try {
    await prisma.recoverySchedule.updateMany({
      where: { academicPeriodId: null },
      data: { academicPeriodId: period.id },
    });
    console.log(`   RecoverySchedule vinculados al período`);
  } catch {
    // singleton puede no existir aún
  }

  // Vincular GradePerformance al período si existe
  try {
    await prisma.gradePerformance.updateMany({
      where: { academicPeriodId: null },
      data: { academicPeriodId: period.id },
    });
    console.log(`   GradePerformance vinculados al período`);
  } catch {
    // best-effort
  }

  // Vincular StudentAcademicRecord al AcademicOffering correspondiente
  const offerings = await prisma.academicOffering.findMany({
    where: { academicPeriodId: period.id },
    select: { id: true, groupId: true, subjectId: true },
  });

  let sarLinked = 0;
  for (const offering of offerings) {
    const result = await prisma.studentAcademicRecord.updateMany({
      where: {
        groupId: offering.groupId,
        subjectId: offering.subjectId,
        academicOfferingId: null,
      },
      data: { academicOfferingId: offering.id },
    });
    sarLinked += result.count;
  }
  console.log(`   StudentAcademicRecord vinculados al offering: ${sarLinked}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
