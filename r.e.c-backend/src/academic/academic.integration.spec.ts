import { prismaTestClient } from '../../test/helpers/prisma-test-client';
import { cleanTestDb } from '../../test/helpers/db-cleanup';

describe('Academic integration - cascade delete integrity', () => {
  beforeAll(async () => {
    await prismaTestClient.$connect();
    await cleanTestDb(prismaTestClient);
  });

  beforeEach(async () => {
    await cleanTestDb(prismaTestClient);
  });

  afterAll(async () => {
    await cleanTestDb(prismaTestClient);
    await prismaTestClient.$disconnect();
  });

  it('deletes group and cascades dependent records without orphans', async () => {
    const runId = Date.now();

    const institution = await prismaTestClient.institution.create({
      data: {
        nombre: `Inst Cascade ${runId}`,
        slug: `inst-cascade-${runId}`,
      },
    });

    const period = await prismaTestClient.academicPeriod.create({
      data: {
        institutionId: institution.id,
        nombre: `Periodo ${runId}`,
        codigo: `PER-${runId}`,
        tipo: 'TERM',
        estado: 'ACTIVE',
        fechaInicio: new Date('2030-01-01T00:00:00.000Z'),
        fechaFin: new Date('2030-12-31T00:00:00.000Z'),
      },
    });

    const grade = await prismaTestClient.grade.create({
      data: {
        institutionId: institution.id,
        nombre: `Grado ${runId}`,
      },
    });

    const group = await prismaTestClient.group.create({
      data: {
        institutionId: institution.id,
        nombre: `Grupo ${runId}`,
        gradeId: grade.id,
      },
    });

    const student = await prismaTestClient.user.create({
      data: {
        institutionId: institution.id,
        nombres: 'Estudiante',
        apellidos: 'Cascade',
        email: `student.${runId}@test.dev`,
        password: 'test',
        role: 'ESTUDIANTE',
      },
    });

    const teacher = await prismaTestClient.user.create({
      data: {
        institutionId: institution.id,
        nombres: 'Docente',
        apellidos: 'Cascade',
        email: `teacher.${runId}@test.dev`,
        password: 'test',
        role: 'PROFESOR',
      },
    });

    const subject = await prismaTestClient.subject.create({
      data: {
        institutionId: institution.id,
        nombre: `Materia ${runId}`,
      },
    });

    const studentGroup = await prismaTestClient.studentGroup.create({
      data: {
        studentId: student.id,
        groupId: group.id,
        academicPeriodId: period.id,
      },
    });

    const groupSubject = await prismaTestClient.groupSubject.create({
      data: {
        groupId: group.id,
        subjectId: subject.id,
        academicPeriodId: period.id,
      },
    });

    const offering = await prismaTestClient.academicOffering.create({
      data: {
        groupId: group.id,
        subjectId: subject.id,
        academicPeriodId: period.id,
        groupSubjectId: groupSubject.id,
        isActive: true,
      },
    });

    const teacherAssignment = await prismaTestClient.teacherAssignment.create({
      data: {
        teacherId: teacher.id,
        groupId: group.id,
        subjectId: subject.id,
        academicOfferingId: offering.id,
      },
    });

    const record = await prismaTestClient.studentAcademicRecord.create({
      data: {
        studentId: student.id,
        groupId: group.id,
        subjectId: subject.id,
        updatedByTeacherId: teacher.id,
        academicOfferingId: offering.id,
        notaFinal: 4.2,
        progresoMateria: 90,
        inasistenciasJustificadas: 1,
        inasistenciasInjustificadas: 0,
      },
    });

    expect(studentGroup.id).toBeGreaterThan(0);
    expect(groupSubject.id).toBeGreaterThan(0);
    expect(offering.id).toBeGreaterThan(0);
    expect(teacherAssignment.id).toBeGreaterThan(0);
    expect(record.id).toBeGreaterThan(0);

    await prismaTestClient.group.delete({ where: { id: group.id } });

    const [
      deletedGroup,
      remainingStudentGroups,
      remainingGroupSubjects,
      remainingOfferings,
      remainingAssignments,
      remainingRecords,
    ] = await Promise.all([
      prismaTestClient.group.findUnique({ where: { id: group.id } }),
      prismaTestClient.studentGroup.count({ where: { groupId: group.id } }),
      prismaTestClient.groupSubject.count({ where: { groupId: group.id } }),
      prismaTestClient.academicOffering.count({ where: { groupId: group.id } }),
      prismaTestClient.teacherAssignment.count({
        where: { groupId: group.id },
      }),
      prismaTestClient.studentAcademicRecord.count({
        where: { groupId: group.id },
      }),
    ]);

    expect(deletedGroup).toBeNull();
    expect(remainingStudentGroups).toBe(0);
    expect(remainingGroupSubjects).toBe(0);
    expect(remainingOfferings).toBe(0);
    expect(remainingAssignments).toBe(0);
    expect(remainingRecords).toBe(0);
  });
});
