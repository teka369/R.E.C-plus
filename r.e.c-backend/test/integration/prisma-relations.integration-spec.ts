import { cleanTestDb } from '../helpers/db-cleanup';
import { prismaTestClient as prisma } from '../helpers/prisma-test-client';

describe('Prisma Integration - relations, constraints, cascades, transactions', () => {
  beforeEach(async () => {
    await cleanTestDb(prisma);
  });

  async function seedAcademicContext() {
    const institution = await prisma.institution.create({
      data: {
        nombre: 'Colegio Test',
        slug: `colegio-test-${Date.now()}`,
        codigo: `CT-${Date.now()}`,
      },
    });

    const period = await prisma.academicPeriod.create({
      data: {
        institutionId: institution.id,
        nombre: '2026-1',
        codigo: '2026-1',
        tipo: 'TERM',
        estado: 'ACTIVE',
        fechaInicio: new Date('2026-01-10T00:00:00.000Z'),
        fechaFin: new Date('2026-06-30T23:59:59.000Z'),
      },
    });

    const grade = await prisma.grade.create({
      data: { institutionId: institution.id, nombre: '10' },
    });

    const group = await prisma.group.create({
      data: {
        institutionId: institution.id,
        nombre: '10-A',
        gradeId: grade.id,
      },
    });

    const subject = await prisma.subject.create({
      data: {
        institutionId: institution.id,
        nombre: 'Matematicas',
        codigo: 'MAT-10',
      },
    });

    const student = await prisma.user.create({
      data: {
        institutionId: institution.id,
        nombres: 'Laura',
        apellidos: 'Mora',
        email: `laura.${Date.now()}@test.edu`,
        password: '$2a$10$abcdefghijklmnopqrstuv',
        role: 'ESTUDIANTE',
      },
    });

    return { institution, period, grade, group, subject, student };
  }

  it('enforce unique constraint en StudentAcademicRecord', async () => {
    const ctx = await seedAcademicContext();

    await prisma.studentAcademicRecord.create({
      data: {
        studentId: ctx.student.id,
        groupId: ctx.group.id,
        subjectId: ctx.subject.id,
        notaFinal: 4.2,
      },
    });

    await expect(
      prisma.studentAcademicRecord.create({
        data: {
          studentId: ctx.student.id,
          groupId: ctx.group.id,
          subjectId: ctx.subject.id,
          notaFinal: 4.7,
        },
      }),
    ).rejects.toHaveProperty('code', 'P2002');
  });

  it('aplica cascada al eliminar Group sobre StudentGroup', async () => {
    const ctx = await seedAcademicContext();

    await prisma.studentGroup.create({
      data: {
        studentId: ctx.student.id,
        groupId: ctx.group.id,
        academicPeriodId: ctx.period.id,
      },
    });

    const before = await prisma.studentGroup.count({
      where: { groupId: ctx.group.id },
    });
    expect(before).toBe(1);

    await prisma.group.delete({ where: { id: ctx.group.id } });

    const after = await prisma.studentGroup.count({
      where: { groupId: ctx.group.id },
    });
    expect(after).toBe(0);
  });

  it('hace rollback completo en transaccion fallida', async () => {
    const institution = await prisma.institution.create({
      data: {
        nombre: 'Colegio Rollback',
        slug: `rollback-${Date.now()}`,
      },
    });

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.grade.create({
          data: { institutionId: institution.id, nombre: '11' },
        });
        await tx.grade.create({
          data: { institutionId: institution.id, nombre: '11' },
        });
      }),
    ).rejects.toBeDefined();

    const grades = await prisma.grade.count({
      where: { institutionId: institution.id, nombre: '11' },
    });

    expect(grades).toBe(0);
  });
});
