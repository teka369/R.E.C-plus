/**
 * E2E Test user credentials — read from environment variables.
 * Never hardcode real credentials here.
 *
 * Set these in .env.local or CI secrets:
 *   E2E_TEACHER_EMAIL, E2E_TEACHER_PASSWORD
 *   E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD
 *   E2E_SECRETARIA_EMAIL, E2E_SECRETARIA_PASSWORD
 */

export type TestRole = 'PROFESOR' | 'ESTUDIANTE' | 'SECRETARIA';

export interface TestUser {
  role: TestRole;
  email: string;
  password: string;
  /** Expected dashboard path after login */
  dashboardPath: string;
  /** Login page for this role */
  loginPage: string;
  /** Field IDs for the login form */
  emailField: string;
  passwordField: string;
}

export const TEST_USERS: Record<TestRole, TestUser> = {
  PROFESOR: {
    role: 'PROFESOR',
    email: process.env.E2E_TEACHER_EMAIL ?? 'teacher@test.edu',
    password: process.env.E2E_TEACHER_PASSWORD ?? 'Password123!',
    dashboardPath: '/docente',
    loginPage: '/login',
    emailField: '#login-email',
    passwordField: '#login-password',
  },
  ESTUDIANTE: {
    role: 'ESTUDIANTE',
    email: process.env.E2E_STUDENT_EMAIL ?? 'student@test.edu',
    password: process.env.E2E_STUDENT_PASSWORD ?? 'Password123!',
    dashboardPath: '/estudiante',
    loginPage: '/login',
    emailField: '#login-email',
    passwordField: '#login-password',
  },
  SECRETARIA: {
    role: 'SECRETARIA',
    email: process.env.E2E_SECRETARIA_EMAIL ?? 'secretaria@test.edu',
    password: process.env.E2E_SECRETARIA_PASSWORD ?? 'Password123!',
    dashboardPath: '/secretaria',
    loginPage: '/acceso-secretaria',
    emailField: '#secretaria-email',
    passwordField: '#secretaria-password',
  },
};

/** Storage state file paths per role (created by global-setup) */
export function storageStatePath(role: TestRole): string {
  return `e2e/.auth/${role.toLowerCase()}-storage.json`;
}
