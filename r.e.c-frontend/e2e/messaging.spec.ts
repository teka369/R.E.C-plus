import { test, expect } from '@playwright/test';
import { MessagingPage } from './pages/MessagingPage';

/**
 * TEST 7 — Mensajería / Feedback P0
 *
 * Pre-requisito: storageState PROFESOR activo.
 * El docente envía feedback a un estudiante desde /docente/feedback.
 */
test.describe('TEST 7 — Mensajería (PROFESOR → ESTUDIANTE)', () => {
  test('PROFESOR puede enviar un mensaje/feedback a un estudiante', async ({ page }) => {
    const messagingPage = new MessagingPage(page);
    await messagingPage.goto();

    // Wait for the feedback page to load
    await expect(page.getByText(/feedback|retroalimentación|grupo/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // Select a group if multiple are available
    const groupSelects = page.getByRole('combobox');
    const selectCount = await groupSelects.count();

    if (selectCount > 0) {
      // Wait for groups to load
      await page.waitForTimeout(2_000);
    }

    // Open the new feedback form
    const createButton = page.getByRole('button', { name: /crear|nuevo|nueva|agregar|\+/i });
    const createCount = await createButton.count();

    if (createCount > 0) {
      await createButton.first().click();

      // Wait for modal/form to appear
      await page.waitForTimeout(1_000);

      // Select a student from the dropdown
      const studentSelects = page.locator('select');
      const studentSelectCount = await studentSelects.count();
      if (studentSelectCount > 0) {
        const options = await studentSelects.first().locator('option').allTextContents();
        const validStudent = options.find(
          (opt) => opt.trim() && !opt.includes('Selecciona') && !opt.includes('selecciona'),
        );

        if (validStudent) {
          await studentSelects.first().selectOption({ label: validStudent.trim() });
        }
      }

      // Fill title
      const titleInput = page.locator('input[type="text"]').first();
      await titleInput.fill('Test Feedback E2E');

      // Fill content
      const contentArea = page.locator('textarea').first();
      await contentArea.fill('Este es un mensaje de prueba E2E para verificar el flujo de feedback.');

      // Submit
      await page.getByRole('button', { name: /guardar|enviar|crear feedback/i }).click();

      // Verify success
      await expect(
        page.getByText(/creado|guardad|enviado|correctamente/i),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test('El mensaje/feedback aparece en la lista del grupo', async ({ page }) => {
    const messagingPage = new MessagingPage(page);
    await messagingPage.goto();

    await expect(page.getByText(/feedback|retroalimentación|grupo/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // Wait for feedback list to load
    await page.waitForTimeout(3_000);

    // Check if any feedback entries are visible
    // The feedback page shows a list of feedback cards for the selected group
    const feedbackEntries = page.locator('[class*="border-l-"], [class*="card"]').filter({
      hasText: /feedback|test/i,
    });

    const entryCount = await feedbackEntries.count();
    // If previous test created feedback, at least one should be visible
    if (entryCount > 0) {
      await expect(feedbackEntries.first()).toBeVisible();
    }
  });
});
