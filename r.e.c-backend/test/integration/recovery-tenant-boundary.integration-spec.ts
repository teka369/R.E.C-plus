import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { cleanTestDb } from '../helpers/db-cleanup';
import { prismaTestClient as prisma } from '../helpers/prisma-test-client';

describe('Recovery tenant boundary integration', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
    await cleanTestDb(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rechaza a SECRETARIA de tenant A al actualizar solicitud de tenant B', async () => {
    const institutionA = await prisma.institution.create({
      data: { nombre: 'Colegio A', slug: `colegio-a-${Date.now()}` },
    });
    const institutionB = await prisma.institution.create({
      data: { nombre: 'Colegio B', slug: `colegio-b-${Date.now()}` },
    });

    const secretariaA = await prisma.user.create({
      data: {
        institutionId: institutionA.id,
        nombres: 'Sec',
        apellidos: 'A',
        email: `sec.a.${Date.now()}@test.edu`,
        documento_identidad: `SEC-A-${Date.now()}`,
        password: '$2a$10$abcdefghijklmnopqrstuv',
        role: 'SECRETARIA',
      },
    });

    const periodB = await prisma.academicPeriod.create({
      data: {
        institutionId: institutionB.id,
        nombre: '2026-1',
        codigo: `2026-1-${Date.now()}`,
        tipo: 'TERM',
        estado: 'ACTIVE',
        fechaInicio: new Date('2026-01-01T00:00:00.000Z'),
        fechaFin: new Date('2026-12-31T23:59:59.000Z'),
      },
    });

    const gradeB = await prisma.grade.create({
      data: { institutionId: institutionB.id, nombre: `10-${Date.now()}` },
    });

    const groupB = await prisma.group.create({
      data: {
        institutionId: institutionB.id,
        nombre: `10A-${Date.now()}`,
        gradeId: gradeB.id,
      },
    });

    const subjectB = await prisma.subject.create({
      data: {
        institutionId: institutionB.id,
        nombre: `Mat-${Date.now()}`,
      },
    });

    const teacherB = await prisma.user.create({
      data: {
        institutionId: institutionB.id,
        nombres: 'Doc',
        apellidos: 'B',
        email: `doc.b.${Date.now()}@test.edu`,
        documento_identidad: `DOC-B-${Date.now()}`,
        password: '$2a$10$abcdefghijklmnopqrstuv',
        role: 'PROFESOR',
      },
    });

    const studentB = await prisma.user.create({
      data: {
        institutionId: institutionB.id,
        nombres: 'Est',
        apellidos: 'B',
        email: `est.b.${Date.now()}@test.edu`,
        documento_identidad: `EST-B-${Date.now()}`,
        password: '$2a$10$abcdefghijklmnopqrstuv',
        role: 'ESTUDIANTE',
      },
    });

    await prisma.studentGroup.create({
      data: {
        studentId: studentB.id,
        groupId: groupB.id,
        academicPeriodId: periodB.id,
      },
    });

    const requestB = await prisma.recoveryRequest.create({
      data: {
        studentId: studentB.id,
        teacherId: teacherB.id,
        groupId: groupB.id,
        subjectId: subjectB.id,
        reason: 'Necesita refuerzo',
        type: 'RECOVERY',
      },
    });

    const token = jwtService.sign({
      sub: secretariaA.id,
      role: secretariaA.role,
      email: secretariaA.email,
      institutionId: institutionA.id,
    });

    const response = await request(app.getHttpServer())
      .patch(`/recovery/requests/${requestB.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'APPROVED' });

    expect(response.status).toBe(403);
  });
});
