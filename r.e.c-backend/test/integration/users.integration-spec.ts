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
  secretaria: { id: number; email: string };
  profesor: { id: number; email: string };
  estudiante: { id: number; email: string };
  secretariaToken: string;
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

  const secretaria = await prisma.user.create({
    data: {
      institutionId: institution.id,
      nombres: 'Secretaria',
      apellidos: label,
      email: `secretaria.${label.toLowerCase()}.${runId}@test.edu`,
      password: HASHED_PASSWORD,
      role: 'SECRETARIA',
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

  const secretariaToken = await loginUser(app, secretaria.email);
  const profesorToken = await loginUser(app, profesor.email);
  const estudianteToken = await loginUser(app, estudiante.email);

  return {
    institution,
    secretaria,
    profesor,
    estudiante,
    secretariaToken,
    profesorToken,
    estudianteToken,
  };
}

describe('Users integration', () => {
  let app: INestApplication<App>;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;
  let superAdmin: { id: number; email: string };
  let superAdminToken: string;

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

    superAdmin = await prisma.user.create({
      data: {
        nombres: 'Super',
        apellidos: 'Admin',
        email: `superadmin.${runId}@test.edu`,
        password: HASHED_PASSWORD,
        role: 'SUPER_ADMIN',
        institutionId: null,
      },
    });
    superAdminToken = await loginUser(app, superAdmin.email);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── GET /users/me ───────────────────────────────────────────────────────

  describe('GET /users/me', () => {
    it('PROFESOR obtiene su propio perfil → 200 con sus datos', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tenantA.profesor.id);
      expect(res.body.email).toBe(tenantA.profesor.email);
      expect(res.body.role).toBe('PROFESOR');
      expect(res.body.institutionId).toBe(tenantA.institution.id);
      expect(res.body).not.toHaveProperty('password');
    });

    it('ESTUDIANTE obtiene su propio perfil → 200 con sus datos', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${tenantA.estudianteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tenantA.estudiante.id);
      expect(res.body.email).toBe(tenantA.estudiante.email);
      expect(res.body.role).toBe('ESTUDIANTE');
      expect(res.body.institutionId).toBe(tenantA.institution.id);
      expect(res.body).not.toHaveProperty('password');
    });

    it('Sin token → 401', async () => {
      const res = await request(app.getHttpServer()).get('/users/me');

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /users (listar) ────────────────────────────────────────────────

  describe('GET /users (listar)', () => {
    it('SECRETARIA puede listar usuarios de su institución → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.data.length).toBeGreaterThanOrEqual(3); // secretaria + profesor + estudiante
      // Todos pertenecen a la institución A
      for (const user of res.body.data) {
        expect(user.institutionId).toBe(tenantA.institution.id);
      }
    });

    it('SECRETARIA no ve usuarios de otra institución → solo ve los suyos', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      const emails = (res.body.data as { email: string }[]).map((u) => u.email);
      // No debe contener usuarios de tenant B
      expect(emails).not.toContain(tenantB.profesor.email);
      expect(emails).not.toContain(tenantB.estudiante.email);
      expect(emails).not.toContain(tenantB.secretaria.email);
    });

    it('PROFESOR no puede listar usuarios → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);

      expect(res.status).toBe(403);
    });

    it('Sin token → 401', async () => {
      const res = await request(app.getHttpServer()).get('/users');

      expect(res.status).toBe(401);
    });
  });

  // ─── PATCH /users/:id (actualizar) ──────────────────────────────────────

  describe('PATCH /users/:id (actualizar)', () => {
    it('SECRETARIA puede actualizar usuario de su institución → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${tenantA.profesor.id}`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombres: 'NuevoNombre' });

      expect(res.status).toBe(200);
      expect(res.body.nombres).toBe('NuevoNombre');
      expect(res.body.id).toBe(tenantA.profesor.id);
    });

    it('SECRETARIA no puede actualizar usuario de otra institución → 400', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${tenantB.profesor.id}`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombres: 'Intruso' });

      // assertTenantVisibility lanza BadRequestException
      expect(res.status).toBe(400);
    });

    it('Campos inválidos → 400', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${tenantA.profesor.id}`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ email: 'no-es-un-email' });

      expect(res.status).toBe(400);
    });
  });

  // ─── Roles y permisos ───────────────────────────────────────────────────

  describe('Roles y permisos', () => {
    it('SUPER_ADMIN puede ver usuarios de cualquier institución → 200', async () => {
      // Listar usuarios de institución A
      const resA = await request(app.getHttpServer())
        .get('/users')
        .query({ institutionId: tenantA.institution.id })
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.length).toBeGreaterThanOrEqual(3);
      for (const user of resA.body.data) {
        expect(user.institutionId).toBe(tenantA.institution.id);
      }

      // Listar usuarios de institución B
      const resB = await request(app.getHttpServer())
        .get('/users')
        .query({ institutionId: tenantB.institution.id })
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.length).toBeGreaterThanOrEqual(3);
      for (const user of resB.body.data) {
        expect(user.institutionId).toBe(tenantB.institution.id);
      }
    });

    it('ESTUDIANTE no puede actualizar usuarios via PATCH /users/:id → 403', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${tenantA.estudiante.id}`)
        .set('Authorization', `Bearer ${tenantA.estudianteToken}`)
        .send({ nombres: 'Cambio no permitido' });

      expect(res.status).toBe(403);
    });

    it('ESTUDIANTE no puede listar usuarios → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${tenantA.estudianteToken}`);

      expect(res.status).toBe(403);
    });

    it('SUPER_ADMIN puede actualizar usuario de cualquier institución → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${tenantB.profesor.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ nombres: 'EditadoPorAdmin' });

      expect(res.status).toBe(200);
      expect(res.body.nombres).toBe('EditadoPorAdmin');
    });
  });
});
