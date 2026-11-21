import { test, expect } from '@playwright/test';
import { loadE2eFixture } from './fixtures/load-fixture';

test.describe('Asignación de materias (SECRETARIA)', () => {
  test('asigna E2E Libre y la relación queda visible al reabrir', async ({
    page,
  }) => {
    const fixture = loadE2eFixture();
    await page.goto('/secretaria/docentes');
    const row = page.getByRole('row', {
      name: fixture.users.profesorLibre.email,
    });
    await expect(row).toBeVisible({ timeout: 20_000 });

    const already = page.getByRole('cell', { name: fixture.spareSubject });
    if ((await already.count()) === 0) {
      await row.getByRole('combobox').nth(0).selectOption({
        label: fixture.groupOptionLabel,
      });
      const subject = row.getByRole('combobox').nth(1);
      await expect(subject.locator('option', { hasText: fixture.spareSubject })).toHaveCount(1);
      await subject.selectOption({ label: fixture.spareSubject });
      await row.getByRole('button', { name: 'Asignar materia' }).click();
      await expect(row.getByText('Asignado correctamente')).toBeVisible();
    }

    const toggle = row.getByRole('button', {
      name: /Ver asignaciones|Ocultar asignaciones/,
    });
    if ((await toggle.innerText()).includes('Ver asignaciones')) {
      await toggle.click();
    }
    await expect(
      page.getByRole('cell', { name: fixture.spareSubject, exact: true }),
    ).toBeVisible();

    await page.reload();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole('button', { name: 'Ver asignaciones' }).click();
    await expect(
      page.getByRole('cell', { name: fixture.groupOptionLabel, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('cell', { name: fixture.spareSubject, exact: true }),
    ).toBeVisible();
  });
});
