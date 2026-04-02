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
  grade: { id: number };
  group: { id: number };
  secretariaToken: string;
  profesorToken: string;
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

  const grade = await prisma.grade.create({
    data: { nombre: `Primero ${label}`, institutionId: institution.id },
  });

  const group = await prisma.group.create({
    data: {
      nombre: `Grupo ${label}`,
      gradeId: grade.id,
      institutionId: institution.id,
      directorId: profesor.id,
    },
  });

  const secretariaToken = await loginUser(app, secretaria.email);
  const profesorToken = await loginUser(app, profesor.email);

  return {
    institution,
    secretaria,
    profesor,
    grade,
    group,
    secretariaToken,
    profesorToken,
  };
}

describe('Schedule integration', () => {
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

  // ─── Weekly entries ──────────────────────────────────────────────────────

  describe('Weekly entries', () => {
    const validEntry = {
      dayOfWeek: 1,
      startMinutes: 480, // 08:00
      endMinutes: 540, // 09:00
      title: 'Matemáticas',
    };

    it('PROFESOR director puede crear una entrada → 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send(validEntry);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.dayOfWeek).toBe(1);
      expect(res.body.startMinutes).toBe(480);
      expect(res.body.endMinutes).toBe(540);
      expect(res.body.groupId).toBe(tenantA.group.id);
    });

    it('Listar entradas del grupo → 200', async () => {
      await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send(validEntry);

      const res = await request(app.getHttpServer())
        .get(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('SECRETARIA puede listar entradas (view access) → 200', async () => {
      await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send(validEntry);

      const res = await request(app.getHttpServer())
        .get(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('Actualizar una entrada → 200', async () => {
      const created = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send(validEntry);

      const res = await request(app.getHttpServer())
        .put(`/schedule/entries/${created.body.id}`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ title: 'Ciencias' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Ciencias');
    });

    it('Eliminar una entrada → 200', async () => {
      const created = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send(validEntry);

      const res = await request(app.getHttpServer())
        .delete(`/schedule/entries/${created.body.id}`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });

    it('SECRETARIA no puede crear entradas → 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send(validEntry);

      expect(res.status).toBe(403);
    });

    it('endMinutes <= startMinutes → 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ dayOfWeek: 1, startMinutes: 540, endMinutes: 480 });

      expect(res.status).toBe(400);
    });

    it('dayOfWeek fuera de rango → 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ dayOfWeek: 9, startMinutes: 480, endMinutes: 540 });

      expect(res.status).toBe(400);
    });

    it('Body vacío → 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── Notes ───────────────────────────────────────────────────────────────

  describe('Notes', () => {
    it('PROFESOR director puede crear una nota → 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ content: 'Cambio de horario mañana' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('Cambio de horario mañana');
      expect(res.body.groupId).toBe(tenantA.group.id);
    });

    it('Listar notas → 200', async () => {
      await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ content: 'Nota 1' });

      await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ content: 'Nota 2' });

      const res = await request(app.getHttpServer())
        .get(`/schedule/groups/${tenantA.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('Actualizar nota → 200', async () => {
      const created = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ content: 'Original' });

      const res = await request(app.getHttpServer())
        .put(`/schedule/notes/${created.body.id}`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ content: 'Actualizado' });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Actualizado');
    });

    it('Eliminar nota → 200', async () => {
      const created = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ content: 'Temporal' });

      const res = await request(app.getHttpServer())
        .delete(`/schedule/notes/${created.body.id}`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });

    it('SECRETARIA no puede crear notas → 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ content: 'Debería fallar' });

      expect(res.status).toBe(403);
    });

    it('Body vacío (sin content) → 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── Events ──────────────────────────────────────────────────────────────

  describe('Events', () => {
    const validEvent = {
      title: 'Examen parcial',
      startAt: '2026-05-10T08:00:00.000Z',
      endAt: '2026-05-10T10:00:00.000Z',
    };

    it('PROFESOR director puede crear un evento → 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send(validEvent);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Examen parcial');
      expect(res.body.groupId).toBe(tenantA.group.id);
    });

    it('Listar eventos del grupo → 200', async () => {
      await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send(validEvent);

      const res = await request(app.getHttpServer())
        .get(`/schedule/groups/${tenantA.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('Actualizar evento → 200', async () => {
      const created = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send(validEvent);

      const res = await request(app.getHttpServer())
        .put(`/schedule/events/${created.body.id}`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ title: 'Examen final' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Examen final');
    });

    it('Eliminar evento → 200', async () => {
      const created = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send(validEvent);

      const res = await request(app.getHttpServer())
        .delete(`/schedule/events/${created.body.id}`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });

    it('SECRETARIA no puede crear eventos → 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send(validEvent);

      expect(res.status).toBe(403);
    });

    it('endAt <= startAt → 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          title: 'Rango inválido',
          startAt: '2026-05-10T10:00:00.000Z',
          endAt: '2026-05-10T08:00:00.000Z',
        });

      expect(res.status).toBe(400);
    });

    it('Body vacío → 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── Sin token → 401 ────────────────────────────────────────────────────

  describe('Sin token → 401', () => {
    it('GET entries sin token → 401', async () => {
      const res = await request(app.getHttpServer()).get(
        `/schedule/groups/${tenantA.group.id}/entries`,
      );
      expect(res.status).toBe(401);
    });

    it('POST entries sin token → 401', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantA.group.id}/entries`)
        .send({ dayOfWeek: 1, startMinutes: 480, endMinutes: 540 });
      expect(res.status).toBe(401);
    });

    it('GET notes sin token → 401', async () => {
      const res = await request(app.getHttpServer()).get(
        `/schedule/groups/${tenantA.group.id}/notes`,
      );
      expect(res.status).toBe(401);
    });

    it('GET events sin token → 401', async () => {
      const res = await request(app.getHttpServer()).get(
        `/schedule/groups/${tenantA.group.id}/events`,
      );
      expect(res.status).toBe(401);
    });
  });

  // ─── Tenant isolation ───────────────────────────────────────────────────

  describe('Tenant isolation', () => {
    it('PROFESOR de inst A no puede crear entry en grupo de inst B → 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantB.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ dayOfWeek: 1, startMinutes: 480, endMinutes: 540 });

      expect(res.status).toBe(403);
    });

    it('PROFESOR de inst A no puede crear nota en grupo de inst B → 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantB.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ content: 'Cruce de tenant' });

      expect(res.status).toBe(403);
    });

    it('PROFESOR de inst A no puede crear evento en grupo de inst B → 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantB.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          title: 'Evento cruzado',
          startAt: '2026-06-01T08:00:00.000Z',
          endAt: '2026-06-01T10:00:00.000Z',
        });

      expect(res.status).toBe(403);
    });

    it('SECRETARIA de inst A no ve entries de grupo de inst B → 403', async () => {
      // Crear entry en B
      await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantB.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantB.profesorToken}`)
        .send({ dayOfWeek: 2, startMinutes: 600, endMinutes: 660 });

      // Secretaria A intenta listar grupo B
      const res = await request(app.getHttpServer())
        .get(`/schedule/groups/${tenantB.group.id}/entries`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(403);
    });

    it('SECRETARIA de inst A no ve notas de grupo de inst B → 403', async () => {
      await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantB.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantB.profesorToken}`)
        .send({ content: 'Nota secreta B' });

      const res = await request(app.getHttpServer())
        .get(`/schedule/groups/${tenantB.group.id}/notes`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(403);
    });

    it('SECRETARIA de inst A no ve eventos de grupo de inst B → 403', async () => {
      await request(app.getHttpServer())
        .post(`/schedule/groups/${tenantB.group.id}/events`)
        .set('Authorization', `Bearer ${tenantB.profesorToken}`)
        .send({
          title: 'Evento B',
          startAt: '2026-06-01T08:00:00.000Z',
          endAt: '2026-06-01T10:00:00.000Z',
        });

      const res = await request(app.getHttpServer())
        .get(`/schedule/groups/${tenantB.group.id}/events`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(403);
    });
  });
});
