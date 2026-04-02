/**
 * seed-active-period.js
 * Crea o actualiza el periodo academico ACTIVE para una institucion.
 * Uso:
 *   set INSTITUTION_ID=1
 *   node scripts/seed-active-period.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CODIGO = process.env.PERIOD_CODE || 'PERIODO-2026-1';
const NOMBRE = process.env.PERIOD_NAME || 'Periodo Academico 2026 - I';

async function resolveInstitutionId() {
  if (process.env.INSTITUTION_ID) {
    const parsed = Number(process.env.INSTITUTION_ID);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error('INSTITUTION_ID invalido');
    }
    return parsed;
  }

  const firstInstitution = await prisma.institution.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  if (!firstInstitution) {
    throw new Error('No existen instituciones. Cree una institucion primero.');
  }

  return firstInstitution.id;
}

async function main() {
  const institutionId = await resolveInstitutionId();

  // Cerrar periodos activos previos de la institucion para mantener solo uno.
  await prisma.academicPeriod.updateMany({
    where: { institutionId, estado: 'ACTIVE' },
    data: { estado: 'CLOSED' },
  });

  const period = await prisma.academicPeriod.upsert({
    where: {
      institutionId_codigo: {
        institutionId,
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
      institutionId,
      nombre: NOMBRE,
      codigo: CODIGO,
      tipo: 'TERM',
      estado: 'ACTIVE',
      fechaInicio: new Date('2026-01-15T00:00:00.000Z'),
      fechaFin: new Date('2026-06-30T23:59:59.999Z'),
    },
  });

  console.log('AcademicPeriod ACTIVE creado/actualizado:');
  console.log(
    `  Institucion: ${institutionId} | ID: ${period.id} | Codigo: ${period.codigo} | Estado: ${period.estado}`,
  );

  // Backfill: StudentGroup y GroupSubject de la institucion sin periodo.
  const sgWithoutPeriod = await prisma.studentGroup.findMany({
    where: {
      academicPeriodId: null,
      group: { institutionId },
    },
    select: { id: true },
  });
  const sgUpdated = sgWithoutPeriod.length > 0
    ? await prisma.studentGroup.updateMany({
        where: { id: { in: sgWithoutPeriod.map(sg => sg.id) } },
        data: { academicPeriodId: period.id },
      })
    : { count: 0 };
  console.log(`  StudentGroup vinculados: ${sgUpdated.count}`);

  const gsWithoutPeriod = await prisma.groupSubject.findMany({
    where: {
      academicPeriodId: null,
      group: { institutionId },
    },
    select: { id: true },
  });
  const gsUpdated = gsWithoutPeriod.length > 0
    ? await prisma.groupSubject.updateMany({
        where: { id: { in: gsWithoutPeriod.map(gs => gs.id) } },
        data: { academicPeriodId: period.id },
      })
    : { count: 0 };
  console.log(`  GroupSubject vinculados: ${gsUpdated.count}`);

  // Sincronizar AcademicOffering para la institucion.
  const groupSubjects = await prisma.groupSubject.findMany({
    where: {
      academicPeriodId: period.id,
      group: { institutionId },
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

  // Backfill por institucion en entidades con academicPeriodId opcional.
  const rcWithoutPeriod = await prisma.recoveryConfig.findMany({
    where: { academicPeriodId: null },
    select: { id: true },
  }).catch(() => []);
  if (rcWithoutPeriod.length > 0) {
    await prisma.recoveryConfig.updateMany({
      where: { id: { in: rcWithoutPeriod.map(rc => rc.id) } },
      data: { academicPeriodId: period.id },
    }).catch(() => {});
  }

  const rsWithoutPeriod = await prisma.recoverySchedule.findMany({
    where: { academicPeriodId: null },
    select: { id: true },
  }).catch(() => []);
  if (rsWithoutPeriod.length > 0) {
    await prisma.recoverySchedule.updateMany({
      where: { id: { in: rsWithoutPeriod.map(rs => rs.id) } },
      data: { academicPeriodId: period.id },
    }).catch(() => {});
  }

  const gpWithoutPeriod = await prisma.gradePerformance.findMany({
    where: {
      academicPeriodId: null,
      group: { institutionId },
    },
    select: { id: true },
  }).catch(() => []);
  if (gpWithoutPeriod.length > 0) {
    await prisma.gradePerformance.updateMany({
      where: { id: { in: gpWithoutPeriod.map(gp => gp.id) } },
      data: { academicPeriodId: period.id },
    }).catch(() => {});
  }

  // Vincular StudentAcademicRecord al offering correspondiente.
  const offerings = await prisma.academicOffering.findMany({
    where: { academicPeriodId: period.id, group: { institutionId } },
    select: { id: true, groupId: true, subjectId: true },
  });

  let sarLinked = 0;
  for (const offering of offerings) {
    const result = await prisma.studentAcademicRecord.updateMany({
      where: {
        groupId: offering.groupId,
        subjectId: offering.subjectId,
        academicOfferingId: null,
        group: { institutionId },
      },
      data: { academicOfferingId: offering.id },
    });
    sarLinked += result.count;
  }
  console.log(`  StudentAcademicRecord vinculados al offering: ${sarLinked}`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
