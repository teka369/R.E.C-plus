import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { cleanTestDb } from '../helpers/db-cleanup';
import { prismaTestClient as prisma } from '../helpers/prisma-test-client';
import * as bcrypt from 'bcryptjs';

const TEST_PASSWORD = 'Test1234!';
const HASHED_PASSWORD = bcrypt.hashSync(TEST_PASSWORD, 10);

interface TenantFixture {
  institution: { id: number };
  profesor: { id: number; email: string };
  estudiante: { id: number; email: string };
  grade: { id: number };
  group: { id: number };
  subject: { id: number };
  period: { id: number };
  profesorToken: string;
  estudianteToken: string;
}

async function loginUser(
  app: INestApplication<App>,
  email: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: TEST_PASSWORD });
  expect(res.status).toBe(201);
  return res.body.access_token;
}

async function buildTenant(
  app: INestApplication<App>,
  label: string,
  runId: number,
): Promise<TenantFixture> {
  const institution = await prisma.institution.create({
    data: {
      nombre: `Colegio ${label} ${runId}`,
      slug: `colegio-${label.toLowerCase()}-${runId}`,
    },
  });

  const profesor = await prisma.user.create({
    data: {
      institutionId: institution.id,
      nombres: 'Docente',
      apellidos: label,
      email: `docente.${label.toLowerCase()}.${runId}@test.edu`,
      password: HASHED_PASSWORD,
      role: 'PROFESOR',
    },
  });

  const estudiante = await prisma.user.create({
    data: {
      institutionId: institution.id,
      nombres: 'Alumno',
      apellidos: label,
      email: `alumno.${label.toLowerCase()}.${runId}@test.edu`,
      password: HASHED_PASSWORD,
      role: 'ESTUDIANTE',
    },
  });

  const grade = await prisma.grade.create({
    data: {
      institutionId: institution.id,
      nombre: `Grado ${label}`,
    },
  });

  const group = await prisma.group.create({
    data: {
      institutionId: institution.id,
      nombre: `Grupo ${label}`,
      gradeId: grade.id,
    },
  });

  const subject = await prisma.subject.create({
    data: {
      institutionId: institution.id,
      nombre: `Materia ${label}`,
    },
  });

  const period = await prisma.academicPeriod.create({
    data: {
      institutionId: institution.id,
      nombre: `Periodo ${label}`,
      codigo: `P-${label}-${runId}`,
      estado: 'ACTIVE',
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2026-12-31'),
    },
  });

  await prisma.teacherAssignment.create({
    data: {
      teacherId: profesor.id,
      groupId: group.id,
      subjectId: subject.id,
    },
  });

  await prisma.studentGroup.create({
    data: {
      studentId: estudiante.id,
      groupId: group.id,
      academicPeriodId: period.id,
    },
  });

  const profesorToken = await loginUser(app, profesor.email);
  const estudianteToken = await loginUser(app, estudiante.email);

  return {
    institution,
    profesor,
    estudiante,
    grade,
    group,
    subject,
    period,
    profesorToken,
    estudianteToken,
  };
}

describe('Materials integration', () => {
  let app: INestApplication<App>;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(async () => {
    await cleanTestDb(prisma);

    const runId = Date.now();
    tenantA = await buildTenant(app, 'A', runId);
    tenantB = await buildTenant(app, 'B', runId);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Syllabus ────────────────────────────────────────────────────────────

  describe('Syllabus', () => {
    it('PROFESOR puede crear un syllabus para su grupo → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Temario de Matemáticas',
          duration: '16 semanas',
          status: 'BORRADOR',
          content: 'Unidad 1: Álgebra',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Temario de Matemáticas');
      expect(res.body.subjectId).toBe(tenantA.subject.id);
      expect(res.body.groupId).toBe(tenantA.group.id);
      expect(res.body.teacherId).toBe(tenantA.profesor.id);
    });

    it('PROFESOR de otra institución no puede crear syllabus → 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantB.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Intruso',
        });

      expect(res.status).toBe(403);
    });

    it('Crear syllabus con campos inválidos → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('Crear syllabus con title vacío → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: '',
        });

      expect(res.status).toBe(400);
    });

    it('Listar syllabi del grupo → 200', async () => {
      // Crear un syllabus primero
      await request(app.getHttpServer())
        .post('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Temario 1',
        });

      const res = await request(app.getHttpServer())
        .get('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].title).toBe('Temario 1');
    });

    it('ESTUDIANTE puede listar syllabi de su grupo → 200', async () => {
      await request(app.getHttpServer())
        .post('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Temario visible al alumno',
        });

      const res = await request(app.getHttpServer())
        .get('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantA.estudianteToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('ESTUDIANTE de otra institución no ve syllabi ajenos → 200 con lista vacía', async () => {
      await request(app.getHttpServer())
        .post('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Temario exclusivo A',
        });

      const res = await request(app.getHttpServer())
        .get('/materials/syllabi')
        .set('Authorization', `Bearer ${tenantB.estudianteToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Estudiante B solo ve syllabi de sus propios grupos
      const titlesFromA = (res.body as { title: string }[]).filter(
        (s) => s.title === 'Temario exclusivo A',
      );
      expect(titlesFromA).toHaveLength(0);
    });
  });

  // ─── Study Materials ─────────────────────────────────────────────────────

  describe('Study Materials', () => {
    it('PROFESOR puede crear un material de estudio → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/materials/study')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Guía de ejercicios',
          description: 'Ejercicios para practicar',
          type: 'LINK',
          resourceUrl: 'https://example.com/guia',
          visibility: 'GROUP',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Guía de ejercicios');
      expect(res.body.teacherId).toBe(tenantA.profesor.id);
      expect(res.body.groupId).toBe(tenantA.group.id);
      expect(res.body.subjectId).toBe(tenantA.subject.id);
    });

    it('PROFESOR de otra institución no puede crear material → 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/materials/study')
        .set('Authorization', `Bearer ${tenantB.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Material intruso',
          type: 'LINK',
          visibility: 'GROUP',
        });

      expect(res.status).toBe(403);
    });

    it('Crear material con campos inválidos → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/materials/study')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('ESTUDIANTE puede listar materiales de su grupo → 200', async () => {
      // Crear material primero
      await request(app.getHttpServer())
        .post('/materials/study')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Material para alumnos',
          type: 'LINK',
          resourceUrl: 'https://example.com/material',
          visibility: 'GROUP',
        });

      const res = await request(app.getHttpServer())
        .get('/materials/study')
        .set('Authorization', `Bearer ${tenantA.estudianteToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe('Material para alumnos');
    });

    it('ESTUDIANTE de otra institución no ve materiales ajenos → 200 con data vacía', async () => {
      await request(app.getHttpServer())
        .post('/materials/study')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Material exclusivo A',
          type: 'LINK',
          resourceUrl: 'https://example.com/exclusivo',
          visibility: 'GROUP',
        });

      const res = await request(app.getHttpServer())
        .get('/materials/study')
        .set('Authorization', `Bearer ${tenantB.estudianteToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      // Estudiante B solo ve materiales de sus propios grupos
      const titlesFromA = (res.body.data as { title: string }[]).filter(
        (m) => m.title === 'Material exclusivo A',
      );
      expect(titlesFromA).toHaveLength(0);
    });

    it('ESTUDIANTE de otra institución no puede ver material individual → 403', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/materials/study')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          subjectId: tenantA.subject.id,
          groupId: tenantA.group.id,
          title: 'Material privado',
          type: 'LINK',
          resourceUrl: 'https://example.com/privado',
          visibility: 'GROUP',
        });

      const materialId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .get(`/materials/study/${materialId}`)
        .set('Authorization', `Bearer ${tenantB.estudianteToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── Sin token → 401 ────────────────────────────────────────────────────

  describe('Sin token en rutas protegidas → 401', () => {
    it('POST /materials/syllabi sin token → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/materials/syllabi')
        .send({
          subjectId: 1,
          groupId: 1,
          title: 'Intruso',
        });

      expect(res.status).toBe(401);
    });

    it('GET /materials/study sin token → 401', async () => {
      const res = await request(app.getHttpServer()).get('/materials/study');

      expect(res.status).toBe(401);
    });
  });
});
