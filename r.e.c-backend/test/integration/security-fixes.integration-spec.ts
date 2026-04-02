/**
 * Tests de integración para los security fixes de FASE 1, 2 y 4.
 *
 * FASE 1 – Communication: createFeedback cross-tenant
 * FASE 2 – Academic: assignStudentToGroup, assignTeacher, assignGroupDirector cross-tenant
 * FASE 4 – Users: bulkCreate con ≤200 items, rate limiting headers en auth
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { cleanTestDb } from '../helpers/db-cleanup';
import { prismaTestClient as prisma } from '../helpers/prisma-test-client';
import * as bcrypt from 'bcryptjs';

const TEST_PASSWORD = 'Test1234!';
const HASHED = bcrypt.hashSync(TEST_PASSWORD, 10);

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface Tenant {
  institutionId: number;
  secretariaId: number;
  profesorId: number;
  estudianteId: number;
  gradeId: number;
  groupId: number;
  subjectId: number;
  secretariaToken: string;
  profesorToken: string;
  estudianteToken: string;
}

async function login(app: INestApplication<App>, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: TEST_PASSWORD });
  if (res.status !== 201) throw new Error(`Login failed for ${email}: ${res.status}`);
  return res.body.access_token as string;
}

async function buildTenant(app: INestApplication<App>, label: string, runId: number): Promise<Tenant> {
  const inst = await prisma.institution.create({
    data: { nombre: `Colegio ${label} ${runId}`, slug: `colegio-${label.toLowerCase()}-${runId}` },
  });

  const [secretaria, profesor, estudiante] = await Promise.all([
    prisma.user.create({
      data: {
        institutionId: inst.id,
        nombres: 'Sec',
        apellidos: label,
        email: `sec.${label.toLowerCase()}.${runId}@test.edu`,
        password: HASHED,
        role: 'SECRETARIA',
      },
    }),
    prisma.user.create({
      data: {
        institutionId: inst.id,
        nombres: 'Prof',
        apellidos: label,
        email: `prof.${label.toLowerCase()}.${runId}@test.edu`,
        password: HASHED,
        role: 'PROFESOR',
      },
    }),
    prisma.user.create({
      data: {
        institutionId: inst.id,
        nombres: 'Est',
        apellidos: label,
        email: `est.${label.toLowerCase()}.${runId}@test.edu`,
        password: HASHED,
        role: 'ESTUDIANTE',
      },
    }),
  ]);

  const grade = await prisma.grade.create({ data: { institutionId: inst.id, nombre: `Grado ${label}` } });
  const group = await prisma.group.create({ data: { institutionId: inst.id, nombre: `Grupo ${label}`, gradeId: grade.id } });
  const subject = await prisma.subject.create({
    data: { institutionId: inst.id, nombre: `Materia ${label}`, codigo: `MAT-${label}-${runId}` },
  });

  const [secretariaToken, profesorToken, estudianteToken] = await Promise.all([
    login(app, secretaria.email),
    login(app, profesor.email),
    login(app, estudiante.email),
  ]);

  return {
    institutionId: inst.id,
    secretariaId: secretaria.id,
    profesorId: profesor.id,
    estudianteId: estudiante.id,
    gradeId: grade.id,
    groupId: group.id,
    subjectId: subject.id,
    secretariaToken,
    profesorToken,
    estudianteToken,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('Security Fixes Integration', () => {
  let app: INestApplication<App>;
  let tA: Tenant;
  let tB: Tenant;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  beforeEach(async () => {
    await cleanTestDb(prisma);
    const runId = Date.now();
    [tA, tB] = await Promise.all([
      buildTenant(app, 'A', runId),
      buildTenant(app, 'B', runId + 1),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── FASE 1: createFeedback cross-tenant ─────────────────────────────────

  describe('FASE 1 – createFeedback cross-tenant', () => {
    it('PROFESOR de A no puede crear feedback para estudiante de B en grupo de B → 403', async () => {
      // Asignar profesor B a grupo B con materia B (setup mínimo para que exista la asignación en B)
      await prisma.teacherAssignment.create({
        data: { teacherId: tB.profesorId, groupId: tB.groupId, subjectId: tB.subjectId },
      });
      // Asignar estudiante B al grupo B requiere periodo activo — sólo verificamos el error tenant
      const res = await request(app.getHttpServer())
        .post('/communication/feedback')
        .set('Authorization', `Bearer ${tA.profesorToken}`)
        .send({
          studentId: tB.estudianteId,
          groupId: tB.groupId,
          title: 'Cross-tenant feedback',
          content: 'Debería ser rechazado',
        });

      // TenantBoundaryGuard bloquea: ambos recursos son de institución B, actor es de A
      expect(res.status).toBe(403);
    });

    it('PROFESOR de A puede crear feedback para estudiante de A en grupo de A → 201', async () => {
      // Setup: asignación profesor, periodo activo, matrícula estudiante
      await prisma.teacherAssignment.create({
        data: { teacherId: tA.profesorId, groupId: tA.groupId, subjectId: tA.subjectId },
      });
      const period = await prisma.academicPeriod.create({
        data: {
          institutionId: tA.institutionId,
          nombre: 'Periodo Test',
          codigo: `PT-${Date.now()}`,
          tipo: 'TERM',
          estado: 'ACTIVE',
          fechaInicio: new Date(Date.now() - 86_400_000),
          fechaFin: new Date(Date.now() + 30 * 86_400_000),
        },
      });
      await prisma.studentGroup.create({
        data: { studentId: tA.estudianteId, groupId: tA.groupId, academicPeriodId: period.id },
      });

      const res = await request(app.getHttpServer())
        .post('/communication/feedback')
        .set('Authorization', `Bearer ${tA.profesorToken}`)
        .send({
          studentId: tA.estudianteId,
          groupId: tA.groupId,
          title: 'Feedback válido',
          content: 'Excelente desempeño',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });

  // ─── FASE 2: assignStudentToGroup cross-tenant ───────────────────────────

  describe('FASE 2 – assignStudentToGroup cross-tenant', () => {
    it('SECRETARIA de A no puede asignar estudiante de B a grupo de A → 403', async () => {
      const period = await prisma.academicPeriod.create({
        data: {
          institutionId: tA.institutionId,
          nombre: 'Periodo A',
          codigo: `PA-${Date.now()}`,
          tipo: 'TERM',
          estado: 'ACTIVE',
          fechaInicio: new Date(Date.now() - 86_400_000),
          fechaFin: new Date(Date.now() + 30 * 86_400_000),
        },
      });
      void period; // usado implícitamente por el servicio

      const res = await request(app.getHttpServer())
        .post('/academic/students/assign-group')
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send({ studentId: tB.estudianteId, groupId: tA.groupId });

      // Estudiante de B no está en institución A → 403
      expect(res.status).toBe(403);
    });

    it('SECRETARIA de A no puede asignar estudiante de A a grupo de B → 403', async () => {
      // Desde el punto de vista del tenant guard, el grupo de B es fuera de alcance de A
      const res = await request(app.getHttpServer())
        .post('/academic/students/assign-group')
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send({ studentId: tA.estudianteId, groupId: tB.groupId });

      expect(res.status).toBe(403);
    });

    it('SECRETARIA de A puede asignar estudiante de A a grupo de A → 201', async () => {
      await prisma.academicPeriod.create({
        data: {
          institutionId: tA.institutionId,
          nombre: 'Periodo A',
          codigo: `PA2-${Date.now()}`,
          tipo: 'TERM',
          estado: 'ACTIVE',
          fechaInicio: new Date(Date.now() - 86_400_000),
          fechaFin: new Date(Date.now() + 30 * 86_400_000),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/academic/students/assign-group')
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send({ studentId: tA.estudianteId, groupId: tA.groupId });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.groupId).toBe(tA.groupId);
      expect(res.body.studentId).toBe(tA.estudianteId);
    });
  });

  // ─── FASE 2: assignTeacher cross-tenant ─────────────────────────────────

  describe('FASE 2 – assignTeacher cross-tenant', () => {
    it('SECRETARIA de A no puede asignar profesor de B a grupo de A → 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/teachers/assign')
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send({ teacherId: tB.profesorId, groupId: tA.groupId, subjectId: tA.subjectId });

      // Profesor de B no está en institución A
      expect(res.status).toBe(403);
    });

    it('SECRETARIA de A puede asignar profesor de A a grupo de A con materia de A → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/teachers/assign')
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send({ teacherId: tA.profesorId, groupId: tA.groupId, subjectId: tA.subjectId });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.teacherId).toBe(tA.profesorId);
      expect(res.body.groupId).toBe(tA.groupId);
    });
  });

  // ─── FASE 2: assignGroupDirector cross-tenant ────────────────────────────

  describe('FASE 2 – assignGroupDirector cross-tenant', () => {
    it('SECRETARIA de A no puede asignar profesor de B como director de grupo de A → 403', async () => {
      const res = await request(app.getHttpServer())
        .put(`/academic/groups/${tA.groupId}/director`)
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send({ directorId: tB.profesorId });

      expect(res.status).toBe(403);
    });

    it('SECRETARIA de A puede asignar profesor de A como director de grupo de A → 200', async () => {
      const res = await request(app.getHttpServer())
        .put(`/academic/groups/${tA.groupId}/director`)
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send({ directorId: tA.profesorId });

      expect(res.status).toBe(200);
      expect(res.body.directorId).toBe(tA.profesorId);
    });
  });

  // ─── FASE 4: bulkCreate DoS limit ────────────────────────────────────────

  describe('FASE 4 – bulkCreate límite 200', () => {
    it('bulkCreate con 201 usuarios → 400', async () => {
      const payload = Array.from({ length: 201 }, (_, i) => ({
        nombres: 'Test',
        apellidos: `Bulk${i}`,
        email: `bulk${i}.${Date.now()}@test.edu`,
        password: TEST_PASSWORD,
        role: 'ESTUDIANTE',
      }));

      const res = await request(app.getHttpServer())
        .post('/users/bulk')
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/200/);
    });

    it('bulkCreate con array vacío → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/bulk')
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send([]);

      expect(res.status).toBe(400);
    });

    it('bulkCreate con 5 usuarios → 201', async () => {
      const payload = Array.from({ length: 5 }, (_, i) => ({
        nombres: 'Test',
        apellidos: `Small${i}`,
        email: `small${i}.${Date.now() + i}@test.edu`,
        password: TEST_PASSWORD,
        role: 'ESTUDIANTE',
      }));

      const res = await request(app.getHttpServer())
        .post('/users/bulk')
        .set('Authorization', `Bearer ${tA.secretariaToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('created');
      expect(res.body.created).toBeLessThanOrEqual(5);
    });
  });

  // ─── FASE 4: Rate limiting headers en auth ───────────────────────────────

  describe('FASE 4 – Rate limiting headers', () => {
    it('POST /auth/login incluye headers X-RateLimit-Limit', async () => {
      const { user } = await (async () => {
        const inst = await prisma.institution.create({
          data: { nombre: `RL Inst ${Date.now()}`, slug: `rl-inst-${Date.now()}` },
        });
        const u = await prisma.user.create({
          data: {
            institutionId: inst.id,
            nombres: 'RL',
            apellidos: 'Test',
            email: `rl.${Date.now()}@test.edu`,
            password: HASHED,
            role: 'PROFESOR',
          },
        });
        return { user: u };
      })();

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: TEST_PASSWORD });

      expect(res.status).toBe(201);
      // Throttler v6 emite X-RateLimit-Limit-default
      const limitHeader =
        res.headers['x-ratelimit-limit-default'] ??
        res.headers['x-ratelimit-limit'];
      expect(limitHeader).toBeDefined();
      // El límite para login es 5
      expect(Number(limitHeader)).toBe(5);
    });

    it('POST /auth/login bloquea tras superar el límite', async () => {
      const inst = await prisma.institution.create({
        data: { nombre: `BF Inst ${Date.now()}`, slug: `bf-inst-${Date.now()}` },
      });
      const u = await prisma.user.create({
        data: {
          institutionId: inst.id,
          nombres: 'BF',
          apellidos: 'Test',
          email: `bf.${Date.now()}@test.edu`,
          password: HASHED,
          role: 'PROFESOR',
        },
      });

      // 5 intentos fallidos (contraseña incorrecta)
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: u.email, password: 'wrongpassword' });
      }

      // El 6to intento (incluso con credenciales correctas) debe ser bloqueado por throttler
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: u.email, password: TEST_PASSWORD });

      expect(res.status).toBe(429);
    });
  });
});
