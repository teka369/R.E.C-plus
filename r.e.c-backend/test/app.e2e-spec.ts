import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/users/dto/user-role.enum';

type PerformanceResponseBody = {
  groupId: number;
  promedioGeneral: number | null;
  leagueScore: number;
};

type RecoveryConfigResponseBody = {
  startAt: string;
  endAt: string;
};

function asPerformanceResponseBody(value: unknown): PerformanceResponseBody {
  if (
    typeof value === 'object' &&
    value !== null &&
    'groupId' in value &&
    'promedioGeneral' in value &&
    'leagueScore' in value
  ) {
    const candidate = value as {
      groupId: unknown;
      promedioGeneral: unknown;
      leagueScore: unknown;
    };
    if (
      typeof candidate.groupId === 'number' &&
      (typeof candidate.promedioGeneral === 'number' ||
        candidate.promedioGeneral === null) &&
      typeof candidate.leagueScore === 'number'
    ) {
      return {
        groupId: candidate.groupId,
        promedioGeneral: candidate.promedioGeneral,
        leagueScore: candidate.leagueScore,
      };
    }
  }

  throw new Error('Respuesta de performance inválida');
}

function asRecoveryConfigResponseBody(
  value: unknown,
): RecoveryConfigResponseBody {
  if (
    typeof value === 'object' &&
    value !== null &&
    'startAt' in value &&
    'endAt' in value
  ) {
    const candidate = value as {
      startAt: unknown;
      endAt: unknown;
    };
    if (
      typeof candidate.startAt === 'string' &&
      typeof candidate.endAt === 'string'
    ) {
      return {
        startAt: candidate.startAt,
        endAt: candidate.endAt,
      };
    }
  }

  throw new Error('Respuesta de recovery config inválida');
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const runId = Date.now();
  const names = {
    grade: `E2E_GRADE_${runId}`,
    group: `E2E_GROUP_${runId}`,
    subject: `E2E_SUBJECT_${runId}`,
  };

  let secretariaId = 0;
  let profesorId = 0;
  let estudianteId = 0;
  let groupId = 0;
  let academicPeriodId = 0;

  const tokenFor = (userId: number, role: UserRole) =>
    jwtService.sign({
      sub: userId,
      role,
      email: `${role.toLowerCase()}@e2e.test`,
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = new JwtService({ secret: process.env.JWT_SECRET });

    const academicPeriod = await prisma.academicPeriod.create({
      data: {
        nombre: `E2E Period ${runId}`,
        codigo: `E2E-P-${runId}`,
        tipo: 'TERM',
        estado: 'ACTIVE',
        fechaInicio: new Date(Date.now() - 86_400_000),
        fechaFin: new Date(Date.now() + 30 * 86_400_000),
      },
    });
    academicPeriodId = academicPeriod.id;

    const secretaria = await prisma.user.create({
      data: {
        nombres: 'E2E',
        apellidos: 'Secretaria',
        email: `e2e.secretaria.${runId}@test.dev`,
        documento_identidad: `E2E-SEC-${runId}`,
        password: 'e2e',
        role: 'SECRETARIA',
      },
    });
    secretariaId = secretaria.id;

    const profesor = await prisma.user.create({
      data: {
        nombres: 'E2E',
        apellidos: 'Profesor',
        email: `e2e.profesor.${runId}@test.dev`,
        documento_identidad: `E2E-PROF-${runId}`,
        password: 'e2e',
        role: 'PROFESOR',
      },
    });
    profesorId = profesor.id;

    const estudiante = await prisma.user.create({
      data: {
        nombres: 'E2E',
        apellidos: 'Estudiante',
        email: `e2e.estudiante.${runId}@test.dev`,
        documento_identidad: `E2E-EST-${runId}`,
        password: 'e2e',
        role: 'ESTUDIANTE',
      },
    });
    estudianteId = estudiante.id;

    const grade = await prisma.grade.create({
      data: { nombre: names.grade },
    });
    const group = await prisma.group.create({
      data: { nombre: names.group, gradeId: grade.id },
    });
    groupId = group.id;

    const subject = await prisma.subject.create({
      data: { nombre: names.subject, codigo: `E2E-${runId}` },
    });

    await prisma.teacherAssignment.create({
      data: {
        teacherId: profesorId,
        groupId,
        subjectId: subject.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.teacherAssignment.deleteMany({
      where: { teacherId: profesorId, groupId },
    });

    if (academicPeriodId) {
      await prisma.recoveryConfig.deleteMany({
        where: { academicPeriodId },
      });
      await prisma.recoverySchedule.deleteMany({
        where: { academicPeriodId },
      });
    }

    await prisma.group.deleteMany({ where: { id: groupId } });
    await prisma.subject.deleteMany({ where: { nombre: names.subject } });
    await prisma.grade.deleteMany({ where: { nombre: names.grade } });

    await prisma.user.deleteMany({
      where: {
        id: { in: [secretariaId, profesorId, estudianteId] },
      },
    });

    if (academicPeriodId) {
      await prisma.academicPeriod.deleteMany({
        where: { id: academicPeriodId },
      });
    }

    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(
        'R.E.C Backend API is running. Please refer to the documentation for available endpoints.',
      );
  });

  it('POST /recovery/config requires auth', () => {
    return request(app.getHttpServer())
      .post('/recovery/config')
      .send({
        startAt: new Date(Date.now() - 60_000).toISOString(),
        endAt: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .expect(401);
  });

  it('POST /recovery/config rejects ESTUDIANTE and PROFESOR, allows SECRETARIA', async () => {
    const payload = {
      startAt: new Date(Date.now() - 60_000).toISOString(),
      endAt: new Date(Date.now() + 86_400_000).toISOString(),
    };

    await request(app.getHttpServer())
      .post('/recovery/config')
      .set(
        'Authorization',
        `Bearer ${tokenFor(estudianteId, UserRole.ESTUDIANTE)}`,
      )
      .send(payload)
      .expect(403);

    await request(app.getHttpServer())
      .post('/recovery/config')
      .set('Authorization', `Bearer ${tokenFor(profesorId, UserRole.PROFESOR)}`)
      .send(payload)
      .expect(403);

    const res = await request(app.getHttpServer())
      .post('/recovery/config')
      .set(
        'Authorization',
        `Bearer ${tokenFor(secretariaId, UserRole.SECRETARIA)}`,
      )
      .send(payload)
      .expect(201);

    expect(res.body).toMatchObject({ active: true });
    const configBody = asRecoveryConfigResponseBody(res.body);
    expect(typeof configBody.startAt).toBe('string');
    expect(typeof configBody.endAt).toBe('string');
  });

  it('POST /performance/grades/:grade enforces roles correctly', async () => {
    const payload = {
      promedioGeneral: 4.3,
      aprobacion: 89,
      tendenciaGeneral: 'estable',
    };

    await request(app.getHttpServer())
      .post(`/performance/grades/${names.group}`)
      .set(
        'Authorization',
        `Bearer ${tokenFor(estudianteId, UserRole.ESTUDIANTE)}`,
      )
      .send(payload)
      .expect(403);

    const professorRes = await request(app.getHttpServer())
      .post(`/performance/grades/${names.group}`)
      .set('Authorization', `Bearer ${tokenFor(profesorId, UserRole.PROFESOR)}`)
      .send(payload)
      .expect(201);

    const professorBody = asPerformanceResponseBody(professorRes.body);
    expect(professorBody.groupId).toBe(groupId);
    expect(typeof professorBody.leagueScore).toBe('number');

    const secretariaRes = await request(app.getHttpServer())
      .post(`/performance/grades/${names.group}`)
      .set(
        'Authorization',
        `Bearer ${tokenFor(secretariaId, UserRole.SECRETARIA)}`,
      )
      .send({ ...payload, promedioGeneral: 4.5 })
      .expect(201);

    const secretariaBody = asPerformanceResponseBody(secretariaRes.body);
    expect(secretariaBody.groupId).toBe(groupId);
    expect(typeof secretariaBody.leagueScore).toBe('number');
  });
});
