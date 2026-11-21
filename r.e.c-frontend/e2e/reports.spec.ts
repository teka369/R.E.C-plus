import { test, expect } from '@playwright/test';
import { loadE2eFixture } from './fixtures/load-fixture';

test.describe('Reporte académico del estudiante', () => {
  test('muestra la materia, la nota 3.70 y la observación sembrada', async ({
    page,
  }) => {
    const fixture = loadE2eFixture();
    await page.goto('/estudiante/gestion-academica');
    const subject = page.getByRole('button', { name: fixture.subject });
    await expect(subject).toBeVisible({ timeout: 20_000 });
    await subject.click();
    await expect(
      page.getByText(`Nota final registrada: ${fixture.report.notaFinalText}`),
    ).toBeVisible();
    await expect(page.getByText(fixture.report.observaciones)).toBeVisible();
  });
});
