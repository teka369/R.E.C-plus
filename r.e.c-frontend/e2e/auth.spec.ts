import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { TEST_USERS, type TestRole } from './fixtures/users';

test.describe('TEST 1 — Autenticación P0', () => {
  /* ─────────────────────────────────────────────────────────────────────────
   * 1a. Login exitoso por rol → redirección al dashboard correcto
   * ───────────────────────────────────────────────────────────────────────── */
  const loginCases: Array<{ role: TestRole; description: string }> = [
    { role: 'SECRETARIA', description: 'SECRETARIA inicia sesión y llega a /secretaria' },
    { role: 'PROFESOR', description: 'PROFESOR inicia sesión y llega a /docente' },
    { role: 'ESTUDIANTE', description: 'ESTUDIANTE inicia sesión y llega a /estudiante' },
  ];

  for (const { role, description } of loginCases) {
    test(description, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const user = TEST_USERS[role];

      if (role === 'SECRETARIA') {
        await loginPage.loginAsSecretaria(user.email, user.password);
      } else {
        await loginPage.loginAsStudentOrTeacher(user.email, user.password);
      }

      // Wait for the redirect to the correct dashboard
      await expect(page).toHaveURL(new RegExp(user.dashboardPath), { timeout: 30_000 });
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 1b. Login fallido — credenciales incorrectas
   * ───────────────────────────────────────────────────────────────────────── */
  test('Login fallido muestra mensaje de error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsStudentOrTeacher('wrong@test.edu', 'BadPassword999!');

    await loginPage.expectErrorVisible();
  });

  test('Login secretaría fallido muestra mensaje de error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsSecretaria('wrong@test.edu', 'BadPassword999!');

    await loginPage.expectErrorVisible();
  });

  /* ─────────────────────────────────────────────────────────────────────────
   * 1c. Logout — limpia cookies y redirige
   * ───────────────────────────────────────────────────────────────────────── */
  test('Logout limpia sesión y redirige a página de login', async ({ page }) => {
    const user = TEST_USERS.PROFESOR;
    const loginPage = new LoginPage(page);

    // Login first
    await loginPage.loginAsStudentOrTeacher(user.email, user.password);
    await expect(page).toHaveURL(/\/docente/, { timeout: 30_000 });

    // Navigate to logout
    await page.goto('/logout');

    // Should redirect to /login after clearing session
    await expect(page).toHaveURL(/\/(login|acceso-secretaria)/, { timeout: 15_000 });

    // Verify cookies are cleared — rec_token should not exist
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === 'rec_token');
    expect(tokenCookie?.value ?? '').toBeFalsy();
  });

  /* ─────────────────────────────────────────────────────────────────────────
   * 1d. Acceso directo a ruta protegida sin sesión → redirige a login
   * ───────────────────────────────────────────────────────────────────────── */
  const protectedRoutes = [
    { path: '/docente', expectedRedirect: /\/login/ },
    { path: '/estudiante', expectedRedirect: /\/login/ },
    { path: '/secretaria', expectedRedirect: /\/acceso-secretaria/ },
  ];

  for (const { path, expectedRedirect } of protectedRoutes) {
    test(`Acceso sin sesión a ${path} redirige a login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(expectedRedirect, { timeout: 15_000 });
    });
  }
});
