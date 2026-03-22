import { expect, test } from '@playwright/test';

type AppRole = 'SUPER_ADMIN' | 'SECRETARIA' | 'PROFESOR' | 'ESTUDIANTE';

const unauthenticatedCases = [
  { path: '/secretaria', expected: /\/acceso-secretaria/ },
  { path: '/super-admin', expected: /\/acceso-secretaria/ },
  { path: '/docente', expected: /\/login/ },
  { path: '/estudiante', expected: /\/login/ },
];

const loginRedirectCases: Array<{ role: AppRole; expectedPath: string }> = [
  { role: 'SUPER_ADMIN', expectedPath: '/super-admin' },
  { role: 'SECRETARIA', expectedPath: '/secretaria' },
  { role: 'PROFESOR', expectedPath: '/docente' },
  { role: 'ESTUDIANTE', expectedPath: '/estudiante' },
];

test.describe('P0 - Auth routing matrix', () => {
  test.describe('middleware guards for anonymous users', () => {
    test.describe.configure({ mode: 'parallel' });

    for (const entry of unauthenticatedCases) {
      test(`anonymous ${entry.path} -> redirect`, async ({ page }) => {
        await page.goto(entry.path);
        await expect(page).toHaveURL(entry.expected);
      });
    }
  });

  test.describe('middleware redirects when authenticated', () => {
    test.describe.configure({ mode: 'parallel' });

    for (const entry of loginRedirectCases) {
      test(`role ${entry.role} visiting /login redirects to ${entry.expectedPath}`, async ({
        context,
        page,
        baseURL,
      }) => {
        await context.addCookies([
          { name: 'rec_token', value: 'fake-token', url: baseURL! },
          { name: 'rec_role', value: entry.role, url: baseURL! },
        ]);

        await page.goto('/login');
        await expect(page).toHaveURL(new RegExp(`${entry.expectedPath.replace('/', '\\/')}$`));
      });
    }
  });

  test('student login flow redirects to /estudiante', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'student-token',
          user: {
            id: 101,
            nombres: 'Est',
            apellidos: 'Demo',
            email: 'student@test.edu',
            role: 'ESTUDIANTE',
          },
        }),
      });
    });

    await page.goto('/login');
    const sessionRequestPromise = page.waitForRequest(
      (request) =>
        request.url().includes('/api/auth/session') &&
        request.method() === 'POST',
    );
    await page.fill('#login-email', 'student@test.edu');
    await page.fill('#login-password', 'Password123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    const sessionRequest = await sessionRequestPromise;
    const sessionBody = sessionRequest.postDataJSON() as {
      role: AppRole;
      userId: number;
      token: string;
    };
    expect(sessionBody.role).toBe('ESTUDIANTE');
    expect(sessionBody.userId).toBe(101);
    expect(sessionBody.token).toBe('student-token');
    await expect(
      page.getByText(/Este acceso es para estudiantes y docentes/i),
    ).toHaveCount(0);
  });

  test('teacher login flow redirects to /docente', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'teacher-token',
          user: {
            id: 202,
            nombres: 'Prof',
            apellidos: 'Demo',
            email: 'teacher@test.edu',
            role: 'PROFESOR',
          },
        }),
      });
    });

    await page.goto('/login');
    const sessionRequestPromise = page.waitForRequest(
      (request) =>
        request.url().includes('/api/auth/session') &&
        request.method() === 'POST',
    );
    await page.fill('#login-email', 'teacher@test.edu');
    await page.fill('#login-password', 'Password123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    const sessionRequest = await sessionRequestPromise;
    const sessionBody = sessionRequest.postDataJSON() as {
      role: AppRole;
      userId: number;
      token: string;
    };
    expect(sessionBody.role).toBe('PROFESOR');
    expect(sessionBody.userId).toBe(202);
    expect(sessionBody.token).toBe('teacher-token');
    await expect(
      page.getByText(/Este acceso es para estudiantes y docentes/i),
    ).toHaveCount(0);
  });

  test('secretaria access flow accepts SECRETARIA and redirects to /secretaria', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'secretaria-token',
          user: {
            id: 303,
            nombres: 'Sec',
            apellidos: 'Demo',
            email: 'secretaria@test.edu',
            role: 'SECRETARIA',
          },
        }),
      });
    });

    await page.goto('/acceso-secretaria');
    const sessionRequestPromise = page.waitForRequest(
      (request) =>
        request.url().includes('/api/auth/session') &&
        request.method() === 'POST',
    );
    await page.fill('#secretaria-email', 'secretaria@test.edu');
    await page.fill('#secretaria-password', 'Password123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    const sessionRequest = await sessionRequestPromise;
    const sessionBody = sessionRequest.postDataJSON() as {
      role: AppRole;
      userId: number;
      token: string;
    };
    expect(sessionBody.role).toBe('SECRETARIA');
    expect(sessionBody.userId).toBe(303);
    expect(sessionBody.token).toBe('secretaria-token');
    await expect(
      page.getByText(/Acceso exclusivo para Secretaría y Super Admin/i),
    ).toHaveCount(0);
  });
});
