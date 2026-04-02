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

  const secretariaToken = await loginUser(app, secretaria.email);
  const profesorToken = await loginUser(app, profesor.email);

  return {
    institution,
    secretaria,
    profesor,
    secretariaToken,
    profesorToken,
  };
}

describe('Academic integration', () => {
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

  // ─── Grades ──────────────────────────────────────────────────────────────

  describe('Grades (grados)', () => {
    it('SECRETARIA puede crear un grado → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Primero' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe('Primero');
      expect(res.body.institutionId).toBe(tenantA.institution.id);
    });

    it('SECRETARIA de otra institución no puede crear grado en institución ajena (aislamiento por tenant) → crea en su propia institución', async () => {
      // El guard TenantBoundary bloquea si se pasa institutionId cruzado,
      // pero createGrade usa el institutionId del JWT, no del body.
      // Verificamos que el grado queda en la institución del actor.
      const res = await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantB.secretariaToken}`)
        .send({ nombre: 'Grado de B' });

      expect(res.status).toBe(201);
      expect(res.body.institutionId).toBe(tenantB.institution.id);
      // Nunca en institución A
      expect(res.body.institutionId).not.toBe(tenantA.institution.id);
    });

    it('Campos inválidos (body vacío) → error (400 o 500)', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({});

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('Listar grados de la institución → 200', async () => {
      await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Primero' });

      await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Segundo' });

      const res = await request(app.getHttpServer())
        .get('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBe(2);
    });

    it('PROFESOR no puede crear grados → 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ nombre: 'Grado prohibido' });

      expect(res.status).toBe(403);
    });
  });

  // ─── Groups ──────────────────────────────────────────────────────────────

  describe('Groups (grupos)', () => {
    it('SECRETARIA puede crear un grupo → 201', async () => {
      const gradeRes = await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Primero' });

      const res = await request(app.getHttpServer())
        .post('/academic/groups')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Grupo A', gradeId: gradeRes.body.id });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe('Grupo A');
      expect(res.body.gradeId).toBe(gradeRes.body.id);
      expect(res.body.institutionId).toBe(tenantA.institution.id);
    });

    it('Listar grupos → 200', async () => {
      const gradeRes = await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Primero' });

      await request(app.getHttpServer())
        .post('/academic/groups')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Grupo A', gradeId: gradeRes.body.id });

      const res = await request(app.getHttpServer())
        .get('/academic/groups')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].nombre).toBe('Grupo A');
    });

    it('PROFESOR no puede crear grupos → 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/groups')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ nombre: 'Grupo prohibido', gradeId: 1 });

      expect(res.status).toBe(403);
    });

    it('Crear grupo con gradeId inexistente → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/groups')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Grupo fantasma', gradeId: 99999 });

      expect(res.status).toBe(400);
    });

    it('Crear grupo con gradeId de otra institución → 400', async () => {
      // Crear grado en institución B
      const gradeB = await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantB.secretariaToken}`)
        .send({ nombre: 'Grado B' });

      // Secretaria A intenta crear grupo con grado de B
      const res = await request(app.getHttpServer())
        .post('/academic/groups')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Grupo cruzado', gradeId: gradeB.body.id });

      expect(res.status).toBe(400);
    });
  });

  // ─── Subjects ────────────────────────────────────────────────────────────

  describe('Subjects (materias)', () => {
    it('SECRETARIA puede crear una materia → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/subjects')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Matemáticas', codigo: 'MAT-01' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe('Matemáticas');
      expect(res.body.codigo).toBe('MAT-01');
      expect(res.body.institutionId).toBe(tenantA.institution.id);
    });

    it('Listar materias → 200', async () => {
      await request(app.getHttpServer())
        .post('/academic/subjects')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Matemáticas' });

      await request(app.getHttpServer())
        .post('/academic/subjects')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({ nombre: 'Español' });

      const res = await request(app.getHttpServer())
        .get('/academic/subjects')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBe(2);
    });

    it('PROFESOR no puede crear materias → 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/subjects')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({ nombre: 'Materia prohibida' });

      expect(res.status).toBe(403);
    });
  });

  // ─── Academic Periods ────────────────────────────────────────────────────

  describe('AcademicPeriods (periodos)', () => {
    it('SECRETARIA puede crear un periodo → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/periods')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({
          nombre: 'Primer Semestre 2026',
          codigo: 'S1-2026',
          fechaInicio: '2026-01-15',
          fechaFin: '2026-06-30',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe('Primer Semestre 2026');
      expect(res.body.codigo).toBe('S1-2026');
      expect(res.body.estado).toBe('DRAFT');
      expect(res.body.institutionId).toBe(tenantA.institution.id);
    });

    it('Activar un periodo y luego activar otro cierra el primero automáticamente', async () => {
      // Crear dos periodos
      const p1 = await request(app.getHttpServer())
        .post('/academic/periods')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({
          nombre: 'Periodo 1',
          codigo: 'P1',
          fechaInicio: '2026-01-01',
          fechaFin: '2026-06-30',
        });

      const p2 = await request(app.getHttpServer())
        .post('/academic/periods')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({
          nombre: 'Periodo 2',
          codigo: 'P2',
          fechaInicio: '2026-07-01',
          fechaFin: '2026-12-31',
        });

      // Activar el primero
      const act1 = await request(app.getHttpServer())
        .put(`/academic/periods/${p1.body.id}/activate`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(act1.status).toBe(200);
      expect(act1.body.estado).toBe('ACTIVE');

      // Activar el segundo → el primero debe quedar CLOSED
      const act2 = await request(app.getHttpServer())
        .put(`/academic/periods/${p2.body.id}/activate`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(act2.status).toBe(200);
      expect(act2.body.estado).toBe('ACTIVE');

      // Verificar que periodo 1 fue cerrado
      const check = await request(app.getHttpServer())
        .get(`/academic/periods/${p1.body.id}`)
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(check.status).toBe(200);
      expect(check.body.estado).toBe('CLOSED');
    });

    it('Listar periodos → 200', async () => {
      await request(app.getHttpServer())
        .post('/academic/periods')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({
          nombre: 'Periodo único',
          codigo: 'PU',
          fechaInicio: '2026-01-01',
          fechaFin: '2026-12-31',
        });

      const res = await request(app.getHttpServer())
        .get('/academic/periods')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBe(1);
    });

    it('Código de periodo duplicado en misma institución → 500 (unique constraint)', async () => {
      await request(app.getHttpServer())
        .post('/academic/periods')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({
          nombre: 'Periodo X',
          codigo: 'DUP',
          fechaInicio: '2026-01-01',
          fechaFin: '2026-06-30',
        });

      const res = await request(app.getHttpServer())
        .post('/academic/periods')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`)
        .send({
          nombre: 'Periodo Y',
          codigo: 'DUP',
          fechaInicio: '2026-07-01',
          fechaFin: '2026-12-31',
        });

      // Prisma unique constraint violation
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('PROFESOR no puede crear periodos → 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic/periods')
        .set('Authorization', `Bearer ${tenantA.profesorToken}`)
        .send({
          nombre: 'Periodo prohibido',
          codigo: 'PP',
          fechaInicio: '2026-01-01',
          fechaFin: '2026-12-31',
        });

      expect(res.status).toBe(403);
    });
  });

  // ─── Tenant isolation ───────────────────────────────────────────────────

  describe('Tenant isolation', () => {
    it('SECRETARIA de institución A no ve grados de institución B', async () => {
      // Crear grado en B
      await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantB.secretariaToken}`)
        .send({ nombre: 'Grado exclusivo B' });

      // Listar desde A
      const res = await request(app.getHttpServer())
        .get('/academic/grades')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      const nombres = (res.body.data as { nombre: string }[]).map(
        (g) => g.nombre,
      );
      expect(nombres).not.toContain('Grado exclusivo B');
    });

    it('SECRETARIA de institución A no ve materias de institución B', async () => {
      await request(app.getHttpServer())
        .post('/academic/subjects')
        .set('Authorization', `Bearer ${tenantB.secretariaToken}`)
        .send({ nombre: 'Biología B' });

      const res = await request(app.getHttpServer())
        .get('/academic/subjects')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      const nombres = (res.body.data as { nombre: string }[]).map(
        (s) => s.nombre,
      );
      expect(nombres).not.toContain('Biología B');
    });

    it('SECRETARIA de institución A no ve periodos de institución B', async () => {
      await request(app.getHttpServer())
        .post('/academic/periods')
        .set('Authorization', `Bearer ${tenantB.secretariaToken}`)
        .send({
          nombre: 'Periodo B',
          codigo: 'PB',
          fechaInicio: '2026-01-01',
          fechaFin: '2026-12-31',
        });

      const res = await request(app.getHttpServer())
        .get('/academic/periods')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      const nombres = (res.body.data as { nombre: string }[]).map(
        (p) => p.nombre,
      );
      expect(nombres).not.toContain('Periodo B');
    });

    it('SECRETARIA de institución A no ve grupos de institución B', async () => {
      const gradeB = await request(app.getHttpServer())
        .post('/academic/grades')
        .set('Authorization', `Bearer ${tenantB.secretariaToken}`)
        .send({ nombre: 'Grado B' });

      await request(app.getHttpServer())
        .post('/academic/groups')
        .set('Authorization', `Bearer ${tenantB.secretariaToken}`)
        .send({ nombre: 'Grupo secreto B', gradeId: gradeB.body.id });

      const res = await request(app.getHttpServer())
        .get('/academic/groups')
        .set('Authorization', `Bearer ${tenantA.secretariaToken}`);

      expect(res.status).toBe(200);
      const nombres = (res.body.data as { nombre: string }[]).map(
        (g) => g.nombre,
      );
      expect(nombres).not.toContain('Grupo secreto B');
    });
  });
});
