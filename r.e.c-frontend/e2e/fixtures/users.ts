import { loadE2eFixture } from './load-fixture';

/**
 * Credenciales del seed E2E. No hay valores de ejemplo: si no existe el fixture, falla.
 */

export type TestRole = 'PROFESOR' | 'ESTUDIANTE' | 'SECRETARIA';

export interface TestUser {
  role: TestRole;
  email: string;
  password: string;
  dashboardPath: string;
  loginPage: string;
  emailField: string;
  passwordField: string;
}

export function testUser(role: TestRole): TestUser {
  const fixture = loadE2eFixture();
  const person =
    role === 'PROFESOR'
      ? fixture.users.profesor
      : role === 'SECRETARIA'
        ? fixture.users.secretaria
        : fixture.users.estudiante;
  if (role === 'SECRETARIA') {
    return {
      role,
      email: person.email,
      password: fixture.password,
      dashboardPath: '/secretaria',
      loginPage: '/acceso-secretaria',
      emailField: '#secretaria-email',
      passwordField: '#secretaria-password',
    };
  }
  return {
    role,
    email: person.email,
    password: fixture.password,
    dashboardPath: role === 'PROFESOR' ? '/docente' : '/estudiante',
    loginPage: '/login',
    emailField: '#login-email',
    passwordField: '#login-password',
  };
}

export function storageStatePath(role: TestRole): string {
  return `e2e/.auth/${role.toLowerCase()}-storage.json`;
}
