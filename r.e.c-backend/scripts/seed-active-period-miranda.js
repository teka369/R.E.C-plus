/**
 * seed-active-period-miranda.js
 * Crea o actualiza el periodo academico ACTIVE para la institución Miranda (ID: 2).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INSTITUTION_ID = 2; // Institución Miranda
const CODIGO = 'PERIODO-2026-1';
const NOMBRE = 'Periodo Academico 2026 - I';

async function main() {
  console.log(`Creando período académico activo para Institución ${INSTITUTION_ID}...\n`);

  // Cerrar periodos activos previos de la institucion para mantener solo uno.
  await prisma.academicPeriod.updateMany({
    where: { institutionId: INSTITUTION_ID, estado: 'ACTIVE' },
    data: { estado: 'CLOSED' },
  });

  const period = await prisma.academicPeriod.upsert({
    where: {
      institutionId_codigo: {
        institutionId: INSTITUTION_ID,
        codigo: CODIGO,
      },
    },
    update: {
      nombre: NOMBRE,
      estado: 'ACTIVE',
      fechaInicio: new Date('2026-01-15T00:00:00.000Z'),
      fechaFin: new Date('2026-06-30T23:59:59.999Z'),
    },
    create: {
      institutionId: INSTITUTION_ID,
      nombre: NOMBRE,
      codigo: CODIGO,
      tipo: 'TERM',
      estado: 'ACTIVE',
      fechaInicio: new Date('2026-01-15T00:00:00.000Z'),
      fechaFin: new Date('2026-06-30T23:59:59.999Z'),
    },
  });

  console.log('✅ AcademicPeriod ACTIVE creado/actualizado:');
  console.log(`  Institución: ${INSTITUTION_ID} | ID: ${period.id} | Código: ${period.codigo} | Estado: ${period.estado}`);

  // Backfill: StudentGroup de la institución sin periodo.
  const sgWithoutPeriod = await prisma.$queryRaw`
    SELECT sg.id
    FROM "StudentGroup" sg
    INNER JOIN "Group" g ON g.id = sg."groupId"
    WHERE sg."academicPeriodId" IS NULL
      AND g."institutionId" = ${INSTITUTION_ID}
  `;
  const sgUpdated = sgWithoutPeriod.length > 0
    ? await prisma.studentGroup.updateMany({
        where: { id: { in: sgWithoutPeriod.map(sg => sg.id) } },
        data: { academicPeriodId: period.id },
      })
    : { count: 0 };
  console.log(`  StudentGroup vinculados: ${sgUpdated.count}`);

  // Backfill: GroupSubject de la institución sin periodo.
  const gsWithoutPeriod = await prisma.$queryRaw`
    SELECT gs.id
    FROM "GroupSubject" gs
    INNER JOIN "Group" g ON g.id = gs."groupId"
    WHERE gs."academicPeriodId" IS NULL
      AND g."institutionId" = ${INSTITUTION_ID}
  `;
  const gsUpdated = gsWithoutPeriod.length > 0
    ? await prisma.groupSubject.updateMany({
        where: { id: { in: gsWithoutPeriod.map(gs => gs.id) } },
        data: { academicPeriodId: period.id },
      })
    : { count: 0 };
  console.log(`  GroupSubject vinculados: ${gsUpdated.count}`);

  // Sincronizar AcademicOffering para la institución.
  const groupSubjects = await prisma.groupSubject.findMany({
    where: {
      academicPeriodId: period.id,
      group: { institutionId: INSTITUTION_ID },
    },
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
  console.log(`  AcademicOffering sincronizados: ${offeringsCreated}`);

  // Backfill por institución en entidades con academicPeriodId opcional.
  const rcWithoutPeriod = await prisma.$queryRaw`
    SELECT id
    FROM "RecoveryConfig"
    WHERE "academicPeriodId" IS NULL
  `.catch(() => []);
  if (rcWithoutPeriod.length > 0) {
    await prisma.recoveryConfig.updateMany({
      where: { id: { in: rcWithoutPeriod.map(rc => rc.id) } },
      data: { academicPeriodId: period.id },
    }).catch(() => {});
  }

  const rsWithoutPeriod = await prisma.$queryRaw`
    SELECT id
    FROM "RecoverySchedule"
    WHERE "academicPeriodId" IS NULL
  `.catch(() => []);
  if (rsWithoutPeriod.length > 0) {
    await prisma.recoverySchedule.updateMany({
      where: { id: { in: rsWithoutPeriod.map(rs => rs.id) } },
      data: { academicPeriodId: period.id },
    }).catch(() => {});
  }

  const gpWithoutPeriod = await prisma.$queryRaw`
    SELECT gp.id
    FROM "GradePerformance" gp
    INNER JOIN "Group" g ON g.id = gp."groupId"
    WHERE gp."academicPeriodId" IS NULL
      AND g."institutionId" = ${INSTITUTION_ID}
  `.catch(() => []);
  if (gpWithoutPeriod.length > 0) {
    await prisma.gradePerformance.updateMany({
      where: { id: { in: gpWithoutPeriod.map(gp => gp.id) } },
      data: { academicPeriodId: period.id },
    }).catch(() => {});
  }

  // Vincular StudentAcademicRecord al offering correspondiente.
  const offerings = await prisma.academicOffering.findMany({
    where: { academicPeriodId: period.id, group: { institutionId: INSTITUTION_ID } },
    select: { id: true, groupId: true, subjectId: true },
  });

  let sarLinked = 0;
  for (const offering of offerings) {
    const result = await prisma.studentAcademicRecord.updateMany({
      where: {
        groupId: offering.groupId,
        subjectId: offering.subjectId,
        academicOfferingId: null,
        group: { institutionId: INSTITUTION_ID },
      },
      data: { academicOfferingId: offering.id },
    });
    sarLinked += result.count;
  }
  console.log(`  StudentAcademicRecord vinculados al offering: ${sarLinked}`);

  console.log('\n✅ Proceso completado exitosamente');
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
