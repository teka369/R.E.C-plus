import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type E2ePerson = {
  email: string;
  nombres: string;
  apellidos: string;
};

export type E2eFixture = {
  password: string;
  grade: string;
  group: string;
  groupOptionLabel: string;
  teacherGroupLabel: string;
  subject: string;
  spareSubject: string;
  report: {
    notaFinal: number;
    notaFinalText: string;
    observaciones: string;
  };
  users: {
    secretaria: E2ePerson;
    profesor: E2ePerson;
    profesorLibre: E2ePerson;
    estudiante: E2ePerson;
    nota: E2ePerson;
    asistencia: E2ePerson;
  };
};

export function loadE2eFixture(): E2eFixture {
  const path =
    process.env.E2E_FIXTURE ??
    resolve(
      process.cwd(),
      '../r.e.c-backend/test/e2e/.generated/fixture.json',
    );
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as E2eFixture;
  } catch {
    throw new Error(
      `No hay fixture E2E en ${path}. Ejecuta npm run seed:e2e en r.e.c-backend contra recedu_e2e.`,
    );
  }
}

export function displayName(person: E2ePerson): string {
  return `${person.apellidos}, ${person.nombres}`;
}
