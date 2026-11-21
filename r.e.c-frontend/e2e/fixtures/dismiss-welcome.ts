import { expect, type Page } from '@playwright/test';

const welcomeDialog = (page: Page) =>
  page.getByRole('dialog', { name: /conocer la plataforma/i });

/**
 * El modal de bienvenida tapa los clics hasta que se cierra.
 * Cerrar persiste el aviso en localStorage para ese usuario.
 */
export async function dismissWelcomeModal(page: Page, timeout = 15_000) {
  const dialog = welcomeDialog(page);
  await expect(dialog).toBeVisible({ timeout });
  await dialog.locator('button', { hasText: 'Cerrar' }).click();
  await expect(dialog).toBeHidden();
}

export async function dismissWelcomeIfPresent(page: Page, timeout = 1_500) {
  const dialog = welcomeDialog(page);
  const visible = await dialog
    .waitFor({ state: 'visible', timeout })
    .then(() => true)
    .catch(() => false);
  if (!visible) return;
  await dialog.locator('button', { hasText: 'Cerrar' }).click();
  await expect(dialog).toBeHidden();
}
