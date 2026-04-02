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
  user: { id: number; email: string };
  accessToken: string;
}

async function createTenantWithProfesor(
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

  const user = await prisma.user.create({
    data: {
      institutionId: institution.id,
      nombres: `Docente`,
      apellidos: label,
      email: `docente.${label.toLowerCase()}.${runId}@test.edu`,
      password: HASHED_PASSWORD,
      role: 'PROFESOR',
    },
  });

  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password: TEST_PASSWORD });

  expect(loginRes.status).toBe(201);

  return {
    institution,
    user,
    accessToken: loginRes.body.access_token,
  };
}

describe('TenantBoundaryGuard integration', () => {
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
    tenantA = await createTenantWithProfesor(app, 'A', runId);
    tenantB = await createTenantWithProfesor(app, 'B', runId);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Acceso a datos propios ──────────────────────────────────────────────

  describe('Acceso a datos propios (misma institución)', () => {
    it('Profesor A accede a GET /users/me → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tenantA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tenantA.user.id);
      expect(res.body.institutionId).toBe(tenantA.institution.id);
    });

    it('Profesor B accede a GET /users/me → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tenantB.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tenantB.user.id);
      expect(res.body.institutionId).toBe(tenantB.institution.id);
    });

    it('Profesor A con x-institution-id propio → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tenantA.accessToken}`)
        .set('x-institution-id', String(tenantA.institution.id));

      expect(res.status).toBe(200);
    });

    it('Profesor B con x-institution-id propio → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tenantB.accessToken}`)
        .set('x-institution-id', String(tenantB.institution.id));

      expect(res.status).toBe(200);
    });

    it('Profesor A con institutionId propio en query → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .query({ institutionId: tenantA.institution.id })
        .set('Authorization', `Bearer ${tenantA.accessToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ─── Acceso cross-tenant bloqueado ───────────────────────────────────────

  describe('Acceso cross-tenant bloqueado (otra institución → 403)', () => {
    it('Profesor A con x-institution-id de B → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tenantA.accessToken}`)
        .set('x-institution-id', String(tenantB.institution.id));

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/cross-institution/i);
    });

    it('Profesor B con x-institution-id de A → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tenantB.accessToken}`)
        .set('x-institution-id', String(tenantA.institution.id));

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/cross-institution/i);
    });

    it('Profesor A con institutionId de B en query → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .query({ institutionId: tenantB.institution.id })
        .set('Authorization', `Bearer ${tenantA.accessToken}`);

      expect(res.status).toBe(403);
    });

    it('Profesor B con institutionId de A en query → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .query({ institutionId: tenantA.institution.id })
        .set('Authorization', `Bearer ${tenantB.accessToken}`);

      expect(res.status).toBe(403);
    });

    it('Profesor A con institutionId de B en x-institution-id hacia /academic/groups → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/academic/groups')
        .set('Authorization', `Bearer ${tenantA.accessToken}`)
        .set('x-institution-id', String(tenantB.institution.id));

      expect(res.status).toBe(403);
    });
  });

  // ─── Sin token → 401 ────────────────────────────────────────────────────

  describe('Sin token en ruta protegida → 401', () => {
    it('GET /users/me sin token → 401', async () => {
      const res = await request(app.getHttpServer()).get('/users/me');

      expect(res.status).toBe(401);
    });

    it('GET /academic/grades sin token → 401', async () => {
      const res = await request(app.getHttpServer()).get('/academic/grades');

      expect(res.status).toBe(401);
    });
  });
});
