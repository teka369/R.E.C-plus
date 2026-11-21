import { test, expect } from '@playwright/test';
import { dismissWelcomeIfPresent } from './fixtures/dismiss-welcome';
import { displayName, loadE2eFixture } from './fixtures/load-fixture';
import { testUser } from './fixtures/users';

test.describe('Ingreso de notas (PROFESOR)', () => {
  test('guarda 4.2 y el valor sigue tras recargar', async ({ page }) => {
    test.setTimeout(60_000);
    const fixture = loadE2eFixture();
    const student = displayName(fixture.users.nota);

    await page.goto('/docente/gestion-academica');
    await dismissWelcomeIfPresent(page);
    await expect(page.getByLabel('Grupo activo')).toContainText(
      fixture.teacherGroupLabel,
      { timeout: 20_000 },
    );
    await expect(
      page.getByText('No tienes grupos asignados'),
    ).toHaveCount(0);

    await page.getByRole('button', { name: student }).click();
    await page.getByRole('button', { name: fixture.subject }).click();
    await page.getByRole('button', { name: 'Nueva evaluación' }).click();
    await page.getByPlaceholder('Título de la evaluación').fill('Quiz E2E');
    await page.getByPlaceholder('Nota').fill('4.2');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(
      page.getByText('Gestión académica actualizada correctamente'),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Grupo activo')).toContainText(
      fixture.teacherGroupLabel,
      { timeout: 20_000 },
    );
    await page.getByRole('button', { name: student }).click();
    await page.getByRole('button', { name: fixture.subject }).click();
    await expect(page.getByPlaceholder('Título de la evaluación')).toHaveValue(
      'Quiz E2E',
    );
    await expect(page.getByPlaceholder('Nota')).toHaveValue('4.2');
  });

  test.describe('sin sesión de docente', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('ESTUDIANTE no entra a gestión docente ni asigna materias', async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const user = testUser('ESTUDIANTE');

      await page.goto('/login');
      await page.fill('#login-email', user.email);
      await page.fill('#login-password', user.password);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await expect(page).toHaveURL(/\/estudiante/, { timeout: 30_000 });
      await dismissWelcomeIfPresent(page);

      await page.goto('/docente/gestion-academica');
      await expect(page).toHaveURL(/\/estudiante/, { timeout: 15_000 });

      const denied = await page.request.post(
        '/api/rec/academic/teachers/assign',
        {
          data: { teacherId: 1, groupId: 1, subjectId: 1 },
        },
      );
      expect(denied.status()).toBe(403);
    });
  });
});
