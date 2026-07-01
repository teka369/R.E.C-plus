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

type TenantSeed = {
  institution: { id: number; slug: string };
  secretaria: { id: number; email: string; publicId: string };
  profesor: { id: number; email: string; publicId: string };
  estudiante: { id: number; email: string; publicId: string };
  grade: { id: number; nombre: string };
  group: { id: number; nombre: string };
  subject: { id: number; nombre: string };
  period: { id: number };
  material: { id: number; title: string };
  recoveryRequest: { id: number };
  secretariaToken: string;
  profesorToken: string;
  estudianteToken: string;
};

async function seedTenant(app: INestApplication<App>, label: string): Promise<TenantSeed> {
  const institution = await prisma.institution.create({
    data: { nombre: `Colegio ${label}`, slug: `colegio-${label.toLowerCase()}-${Date.now()}` },
  });

  const secretaria = await prisma.user.create({
    data: {
      institutionId: institution.id, nombres: 'Sec', apellidos: label,
      email: `sec.${label.toLowerCase()}.${Date.now()}@test.edu`,
      password: HASHED_PASSWORD, role: 'SECRETARIA',
    },
  });

  const profesor = await prisma.user.create({
    data: {
      institutionId: institution.id, nombres: 'Doc', apellidos: label,
      email: `doc.${label.toLowerCase()}.${Date.now()}@test.edu`,
      password: HASHED_PASSWORD, role: 'PROFESOR',
    },
  });

  const estudiante = await prisma.user.create({
    data: {
      institutionId: institution.id, nombres: 'Est', apellidos: label,
      email: `est.${label.toLowerCase()}.${Date.now()}@test.edu`,
      password: HASHED_PASSWORD, role: 'ESTUDIANTE',
    },
  });

  const grade = await prisma.grade.create({
    data: { institutionId: institution.id, nombre: `Grado-${label}` },
  });

  const group = await prisma.group.create({
    data: { institutionId: institution.id, nombre: `Grupo-${label}`, gradeId: grade.id },
  });

  const subject = await prisma.subject.create({
    data: { institutionId: institution.id, nombre: `Mate-${label}` },
  });

  const period = await prisma.academicPeriod.create({
    data: {
      institutionId: institution.id, nombre: `2026-${label}`, codigo: `26-${label}`,
      tipo: 'TERM', estado: 'ACTIVE',
      fechaInicio: new Date('2026-01-01'), fechaFin: new Date('2026-12-31'),
    },
  });

  await prisma.teacherAssignment.create({
    data: { teacherId: profesor.id, groupId: group.id, subjectId: subject.id },
  });

  await prisma.studentGroup.create({
    data: { studentId: estudiante.id, groupId: group.id, academicPeriodId: period.id },
  });

  const offering = await prisma.academicOffering.create({
    data: { groupId: group.id, subjectId: subject.id, academicPeriodId: period.id },
  });

  const material = await prisma.studyMaterial.create({
    data: {
      subjectId: subject.id, groupId: group.id, teacherId: profesor.id,
      title: `Material ${label}`, type: 'PDF',
    },
  });

  const recoveryRequest = await prisma.recoveryRequest.create({
    data: {
      studentId: estudiante.id, teacherId: profesor.id, groupId: group.id,
      subjectId: subject.id, reason: `Refuerzo ${label}`, type: 'RECOVERY',
    },
  });

  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: secretaria.email, password: TEST_PASSWORD });
  const secretariaToken = loginRes.body.access_token;

  const loginProf = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: profesor.email, password: TEST_PASSWORD });
  const profesorToken = loginProf.body.access_token;

  const loginEst = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: estudiante.email, password: TEST_PASSWORD });
  const estudianteToken = loginEst.body.access_token;

  return {
    institution, secretaria, profesor, estudiante,
    grade, group, subject, period, material, recoveryRequest,
    secretariaToken, profesorToken, estudianteToken,
  };
}

// Añadir tokens al tipo
describe('Aislamiento multi-tenant: Tenant A NO accede a datos de Tenant B', () => {
  let app: INestApplication<App>;
  let tenantA: TenantSeed;
  let tenantB: TenantSeed;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(async () => {
    await cleanTestDb(prisma);
    tenantA = await seedTenant(app, 'A');
    tenantB = await seedTenant(app, 'B');
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── USERS ────────────────────────────────────────────────────────
  describe('Users: Secretaria A no ve usuarios de B', () => {
    it('GET /users no devuelve usuarios de B', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);
      expect(res.status).toBe(200);
      const emails = (res.body.data ?? res.body).map((u: any) => u.email);
      expect(emails).not.toContain(tenantB.secretaria.email);
      expect(emails).not.toContain(tenantB.profesor.email);
      expect(emails).not.toContain(tenantB.estudiante.email);
    });

    it('GET /users/:id de usuario B → 400/403', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${tenantB.estudiante.publicId}`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);
      expect([400, 403]).toContain(res.status);
    });
  });

  // ─── ACADEMIC ─────────────────────────────────────────────────────
  describe('Academic: Secretaria A no ve datos académicos de B', () => {
    it('GET /academic/groups no devuelve grupos de B', async () => {
      const res = await request(app.getHttpServer())
        .get('/academic/groups')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);
      expect(res.status).toBe(200);
      const names = (res.body.data ?? res.body).map((g: any) => g.nombre ?? g.name);
      expect(names).not.toContain(tenantB.group.nombre);
    });

    it('GET /academic/grades no devuelve grados de B', async () => {
      const res = await request(app.getHttpServer())
        .get('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);
      expect(res.status).toBe(200);
      const names = (res.body.data ?? res.body).map((g: any) => g.nombre ?? g.name);
      expect(names).not.toContain(tenantB.grade.nombre);
    });

    it('GET /academic/subjects no devuelve materias de B', async () => {
      const res = await request(app.getHttpServer())
        .get('/academic/subjects')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);
      expect(res.status).toBe(200);
      const names = (res.body.data ?? res.body).map((s: any) => s.nombre ?? s.name);
      expect(names).not.toContain(tenantB.subject.nombre);
    });
  });

  // ─── MATERIALS ────────────────────────────────────────────────────
  describe('Materials: Profesor A no ve materiales de B', () => {
    it('GET /materials/study no devuelve materiales de B', async () => {
      const res = await request(app.getHttpServer())
        .get('/materials/study')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);
      expect(res.status).toBe(200);
      const titles = (res.body.data ?? res.body).map((m: any) => m.title);
      expect(titles).not.toContain(tenantB.material.title);
    });
  });

  // ─── SCHEDULE ─────────────────────────────────────────────────────
  describe('Schedule: Profesor A no ve horarios de B', () => {
    it('GET /schedule/groups/:groupId/entries de grupo B → 403/404', async () => {
      const res = await request(app.getHttpServer())
        .get(`/schedule/groups/${tenantB.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);
      expect([403, 404]).toContain(res.status);
    });
  });

  // ─── RECOVERY ─────────────────────────────────────────────────────
  describe('Recovery: Secretaria A no ve solicitudes de B', () => {
    it('GET /recovery/requests de B → 403/404', async () => {
      const res = await request(app.getHttpServer())
        .get(`/recovery/groups/${tenantB.group.id}/requests`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);
      expect([403, 404]).toContain(res.status);
    });

    it('PATCH /recovery/requests/:id/status de B → 403', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/recovery/requests/${tenantB.recoveryRequest.id}/status`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ status: 'APPROVED' });
      expect(res.status).toBe(403);
    });
  });

  // ─── PERFORMANCE ──────────────────────────────────────────────────
  describe('Performance: Profesor A no ve rendimiento de B', () => {
    it('GET /performance/groups/:groupId de grupo B → 403/404', async () => {
      const res = await request(app.getHttpServer())
        .get(`/performance/groups/${tenantB.group.id}`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);
      expect([403, 404]).toContain(res.status);
    });
  });

  // ─── COMMUNICATION ────────────────────────────────────────────────
  describe('Communication: Mensajes entre tenants bloqueados', () => {
    it('POST /communication/messages de A a usuario B → 400/403', async () => {
      const res = await request(app.getHttpServer())
        .post('/communication/messages')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ recipientId: tenantB.estudiante.id, content: 'Hola' });
      expect([400, 403]).toContain(res.status);
    });
  });

  // ─── ESTUDIANTE: auto-limitación ──────────────────────────────────
  describe('Estudiante solo ve sus propios datos', () => {
    it('Estudiante A no ve perfil de estudiante B', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${tenantB.estudiante.publicId}`)
        .set('Authorization', `Bearer ${tenantA.estudianteToken}`);
      expect(res.status).toBe(403);
    });
  });
});
