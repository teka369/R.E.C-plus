import { test, expect } from '@playwright/test';
import { dismissWelcomeIfPresent } from './fixtures/dismiss-welcome';
import { loadE2eFixture } from './fixtures/load-fixture';

test.describe('Feedback (PROFESOR → ESTUDIANTE)', () => {
  test('crea un feedback y sigue en el listado tras recargar', async ({
    page,
  }) => {
    const fixture = loadE2eFixture();
    const title = `E2E feedback ${Date.now()}`;
    const content = 'Observación E2E persistida en el listado del grupo.';

    await page.goto('/docente/feedback');
    await dismissWelcomeIfPresent(page);
    await expect(page.getByRole('button', { name: 'Nuevo feedback' })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole('button', { name: 'Nuevo feedback' }).click();
    await expect(page.getByRole('heading', { name: 'Nuevo feedback' })).toBeVisible();

    const form = page.locator('#feedback-form');
    const studentOption = `${fixture.users.nota.nombres} ${fixture.users.nota.apellidos}`;
    await expect(
      form.locator('select').first().locator('option', { hasText: studentOption }),
    ).toHaveCount(1);
    await form.locator('select').first().selectOption({ label: studentOption });
    await form.getByPlaceholder('Ej. Buen desempeño en matemáticas').fill(title);
    await form
      .getByPlaceholder('Describe la observación o retroalimentación…')
      .fill(content);
    await page.getByRole('button', { name: 'Crear feedback' }).click();

    await expect(page.getByText('Feedback creado correctamente')).toBeVisible();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: title })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(content)).toBeVisible();
  });
});
