import { expect, test } from '@playwright/test';

test.describe('Auth + Role protection', () => {
  test('redirige acceso no autenticado a /secretaria hacia acceso-secretaria', async ({ page }) => {
    await page.goto('/secretaria');
    await expect(page).toHaveURL(/\/acceso-secretaria/);
  });

  test('bloquea login por pagina docente/estudiante cuando backend responde SECRETARIA', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-token',
          user: {
            id: 1,
            nombres: 'Sec',
            apellidos: 'Test',
            email: 'secretaria@test.edu',
            role: 'SECRETARIA',
          },
        }),
      });
    });

    await page.goto('/login');
    await page.fill('#login-email', 'secretaria@test.edu');
    await page.fill('#login-password', 'Password123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(
      page.getByText("Este acceso es para estudiantes y docentes. Usa 'Acceso Secretaría'."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirige por role cookie si intenta abrir panel de otro rol', async ({ context, page, baseURL }) => {
    await context.addCookies([
      {
        name: 'rec_token',
        value: 'fake-token',
        url: baseURL!,
      },
      {
        name: 'rec_role',
        value: 'ESTUDIANTE',
        url: baseURL!,
      },
    ]);

    await page.goto('/docente');
    await expect(page).toHaveURL(/\/estudiante/);
  });
});
