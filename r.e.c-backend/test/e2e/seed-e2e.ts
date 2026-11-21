import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { assertE2eDatabase } from './assert-e2e-database';

const SLUG = 'e2e-recedu';
const PASSWORD = 'E2e-Password-1';
const FIXTURE_PATH = resolve(
  __dirname,
  '.generated/fixture.json',
);

export type E2eFixture = {
  password: string;
  grade: string;
  group: string;
  groupOptionLabel: string;
  teacherGroupLabel: string;
  subject: string;
  spareSubject: string;
  report: {
    notaFinal: number;
    notaFinalText: string;
    observaciones: string;
  };
  users: {
    secretaria: { email: string; nombres: string; apellidos: string };
    profesor: { email: string; nombres: string; apellidos: string };
    profesorLibre: { email: string; nombres: string; apellidos: string };
    estudiante: { email: string; nombres: string; apellidos: string };
    nota: { email: string; nombres: string; apellidos: string };
    asistencia: { email: string; nombres: string; apellidos: string };
  };
};

const fixture: E2eFixture = {
  password: PASSWORD,
  grade: 'E2E Grado',
  group: 'E2E Grupo A',
  groupOptionLabel: 'E2E Grado-E2E Grupo A',
  teacherGroupLabel: 'E2E Grado – E2E Grupo A',
  subject: 'E2E Matematicas',
  spareSubject: 'E2E Libre',
  report: {
    notaFinal: 3.7,
    notaFinalText: '3.70',
    observaciones: 'E2E-REPORTE-370',
  },
  users: {
    secretaria: {
      email: 'e2e.secretaria@e2e.test',
      nombres: 'Secre',
      apellidos: 'E2E',
    },
    profesor: {
      email: 'e2e.profesor@e2e.test',
      nombres: 'Profe',
      apellidos: 'E2E',
    },
    profesorLibre: {
      email: 'e2e.profesor2@e2e.test',
      nombres: 'Libre',
      apellidos: 'Docente',
    },
    estudiante: {
      email: 'e2e.estudiante@e2e.test',
      nombres: 'Reporte',
      apellidos: 'Alumno',
    },
    nota: {
      email: 'e2e.nota@e2e.test',
      nombres: 'Nota',
      apellidos: 'Alumno',
    },
    asistencia: {
      email: 'e2e.asistencia@e2e.test',
      nombres: 'Asiste',
      apellidos: 'Alumno',
    },
  },
};

async function main() {
  assertE2eDatabase();
  const prisma = new PrismaClient();
  const password = await bcrypt.hash(PASSWORD, 12);

  try {
    const existing = await prisma.institution.findUnique({
      where: { slug: SLUG },
      select: { id: true },
    });
    if (existing) {
      await prisma.user.deleteMany({ where: { institutionId: existing.id } });
      await prisma.institution.delete({ where: { id: existing.id } });
    }

    const institution = await prisma.institution.create({
      data: { nombre: 'E2E Recedu', slug: SLUG },
    });
    const period = await prisma.academicPeriod.create({
      data: {
        institutionId: institution.id,
        nombre: 'E2E Periodo',
        codigo: 'E2E-P',
        tipo: 'TERM',
        estado: 'ACTIVE',
        fechaInicio: new Date(Date.now() - 86_400_000),
        fechaFin: new Date(Date.now() + 120 * 86_400_000),
      },
    });
    const grade = await prisma.grade.create({
      data: { institutionId: institution.id, nombre: fixture.grade },
    });
    const group = await prisma.group.create({
      data: {
        institutionId: institution.id,
        nombre: fixture.group,
        gradeId: grade.id,
      },
    });
    const subject = await prisma.subject.create({
      data: {
        institutionId: institution.id,
        nombre: fixture.subject,
        codigo: 'E2E-MAT',
      },
    });
    const spare = await prisma.subject.create({
      data: {
        institutionId: institution.id,
        nombre: fixture.spareSubject,
        codigo: 'E2E-LIB',
      },
    });
    await prisma.groupSubject.createMany({
      data: [
        { groupId: group.id, subjectId: subject.id, academicPeriodId: period.id },
        { groupId: group.id, subjectId: spare.id, academicPeriodId: period.id },
      ],
    });
    const offering = await prisma.academicOffering.create({
      data: {
        groupId: group.id,
        subjectId: subject.id,
        academicPeriodId: period.id,
        isActive: true,
      },
    });

    const userData = (
      person: { email: string; nombres: string; apellidos: string },
      role: 'SECRETARIA' | 'PROFESOR' | 'ESTUDIANTE',
    ) => ({
      institutionId: institution.id,
      nombres: person.nombres,
      apellidos: person.apellidos,
      email: person.email,
      password,
      role,
      mustChangePassword: false,
    });

    const secretaria = await prisma.user.create({
      data: userData(fixture.users.secretaria, 'SECRETARIA'),
    });
    const profesor = await prisma.user.create({
      data: userData(fixture.users.profesor, 'PROFESOR'),
    });
    await prisma.user.create({
      data: userData(fixture.users.profesorLibre, 'PROFESOR'),
    });
    const estudiante = await prisma.user.create({
      data: userData(fixture.users.estudiante, 'ESTUDIANTE'),
    });
    const nota = await prisma.user.create({
      data: userData(fixture.users.nota, 'ESTUDIANTE'),
    });
    const asistencia = await prisma.user.create({
      data: userData(fixture.users.asistencia, 'ESTUDIANTE'),
    });

    await prisma.teacherAssignment.create({
      data: {
        teacherId: profesor.id,
        groupId: group.id,
        subjectId: subject.id,
        academicOfferingId: offering.id,
      },
    });
    await prisma.teacherOfferingAssignment.create({
      data: { teacherId: profesor.id, academicOfferingId: offering.id },
    });

    for (const student of [estudiante, nota, asistencia]) {
      await prisma.studentGroup.create({
        data: {
          studentId: student.id,
          groupId: group.id,
          academicPeriodId: period.id,
          status: 'ACTIVE',
        },
      });
    }

    await prisma.studentAcademicRecord.create({
      data: {
        studentId: estudiante.id,
        groupId: group.id,
        subjectId: subject.id,
        academicOfferingId: offering.id,
        updatedByTeacherId: profesor.id,
        notaFinal: fixture.report.notaFinal,
        finalSource: 'COMPUTED',
        observaciones: fixture.report.observaciones,
      },
    });

    void secretaria;
    mkdirSync(dirname(FIXTURE_PATH), { recursive: true });
    writeFileSync(FIXTURE_PATH, JSON.stringify(fixture, null, 2));
    console.log(`E2E fixture written to ${FIXTURE_PATH}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
