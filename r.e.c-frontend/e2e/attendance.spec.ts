import { test, expect } from '@playwright/test';
import { dismissWelcomeIfPresent } from './fixtures/dismiss-welcome';
import { displayName, loadE2eFixture } from './fixtures/load-fixture';

test.describe('Registro de asistencia (PROFESOR)', () => {
  test('guarda 3 justificadas del período 1 y persisten al recargar', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const fixture = loadE2eFixture();
    const student = displayName(fixture.users.asistencia);

    await page.goto('/docente/gestion-academica');
    await dismissWelcomeIfPresent(page);
    await expect(page.getByLabel('Grupo activo')).toContainText(
      fixture.teacherGroupLabel,
      { timeout: 20_000 },
    );
    await page.getByLabel('Período (filtro)').selectOption('1');
    await page.getByRole('button', { name: student }).click();
    await page.getByRole('button', { name: fixture.subject }).click();

    const justified = page
      .locator('div')
      .filter({ has: page.getByText('Justificadas', { exact: true }) })
      .locator('input[type="number"]')
      .first();
    await expect(justified).toBeEnabled();
    await justified.fill('3');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(
      page.getByText('Gestión académica actualizada correctamente'),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Grupo activo')).toContainText(
      fixture.teacherGroupLabel,
      { timeout: 20_000 },
    );
    await page.getByLabel('Período (filtro)').selectOption('1');
    await page.getByRole('button', { name: student }).click();
    await page.getByRole('button', { name: fixture.subject }).click();
    await expect(justified).toHaveValue('3');
  });
});
