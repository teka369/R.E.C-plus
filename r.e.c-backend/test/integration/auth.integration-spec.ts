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

async function createAuthTestData() {
  const runId = Date.now();

  const institution = await prisma.institution.create({
    data: {
      nombre: `Colegio Auth ${runId}`,
      slug: `colegio-auth-${runId}`,
    },
  });

  const user = await prisma.user.create({
    data: {
      institutionId: institution.id,
      nombres: 'Docente',
      apellidos: 'Auth',
      email: `docente.auth.${runId}@test.edu`,
      password: HASHED_PASSWORD,
      role: 'PROFESOR',
    },
  });

  return { institution, user };
}

describe('Auth integration', () => {
  let app: INestApplication<App>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /auth/login ────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('login exitoso con credenciales válidas → 201, recibe access_token y refresh_token', async () => {
      const { user } = await createAuthTestData();

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: TEST_PASSWORD });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.role).toBe('PROFESOR');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('login con email inexistente → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'noexiste@test.edu', password: TEST_PASSWORD });

      expect(res.status).toBe(401);
    });

    it('login con contraseña incorrecta → 401', async () => {
      const { user } = await createAuthTestData();

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'WrongPass1!' });

      expect(res.status).toBe(401);
    });

    it('login con campos vacíos → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/refresh ──────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('refresh exitoso con token válido → 201, nuevo access_token', async () => {
      const { user } = await createAuthTestData();

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: TEST_PASSWORD });

      expect(loginRes.status).toBe(201);
      const { refresh_token } = loginRes.body;

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token });

      expect(refreshRes.status).toBe(201);
      expect(refreshRes.body).toHaveProperty('access_token');
      expect(refreshRes.body).toHaveProperty('refresh_token');
      expect(refreshRes.body.access_token).not.toBe(loginRes.body.access_token);
    });

    it('refresh sin token → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/logout ───────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('logout exitoso → 201, sesión revocada y refresh token ya no funciona', async () => {
      const { user } = await createAuthTestData();

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: TEST_PASSWORD });

      const { refresh_token } = loginRes.body;

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refresh_token });

      expect(logoutRes.status).toBe(201);
      expect(logoutRes.body).toEqual({ success: true });

      // Intentar refresh con el token revocado debe fallar
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token });

      expect(refreshRes.status).toBe(401);
    });
  });

  // ─── Tenant isolation ────────────────────────────────────────────────────

  describe('Tenant isolation en auth', () => {
    it('refresh token de usuario A no puede ser usado por usuario B de otra institución', async () => {
      const runId = Date.now();

      const institutionA = await prisma.institution.create({
        data: { nombre: 'Colegio A', slug: `colegio-a-${runId}` },
      });
      const institutionB = await prisma.institution.create({
        data: { nombre: 'Colegio B', slug: `colegio-b-${runId}` },
      });

      const userA = await prisma.user.create({
        data: {
          institutionId: institutionA.id,
          nombres: 'Docente',
          apellidos: 'A',
          email: `docente.a.${runId}@test.edu`,
          password: HASHED_PASSWORD,
          role: 'PROFESOR',
        },
      });
      const userB = await prisma.user.create({
        data: {
          institutionId: institutionB.id,
          nombres: 'Docente',
          apellidos: 'B',
          email: `docente.b.${runId}@test.edu`,
          password: HASHED_PASSWORD,
          role: 'PROFESOR',
        },
      });

      // Login con usuario A
      const loginA = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: userA.email, password: TEST_PASSWORD });
      expect(loginA.status).toBe(201);
      expect(loginA.body.user.institutionId).toBe(institutionA.id);

      // Login con usuario B
      const loginB = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: userB.email, password: TEST_PASSWORD });
      expect(loginB.status).toBe(201);
      expect(loginB.body.user.institutionId).toBe(institutionB.id);

      // Tokens pertenecen a usuarios distintos
      expect(loginA.body.access_token).not.toBe(loginB.body.access_token);
      expect(loginA.body.refresh_token).not.toBe(loginB.body.refresh_token);

      // Refresh con token de A devuelve datos de A, no de B
      const refreshA = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: loginA.body.refresh_token });
      expect(refreshA.status).toBe(201);
      expect(refreshA.body.user.id).toBe(userA.id);
      expect(refreshA.body.user.institutionId).toBe(institutionA.id);

      // Refresh con token de B devuelve datos de B, no de A
      const refreshB = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: loginB.body.refresh_token });
      expect(refreshB.status).toBe(201);
      expect(refreshB.body.user.id).toBe(userB.id);
      expect(refreshB.body.user.institutionId).toBe(institutionB.id);
    });
  });
});
