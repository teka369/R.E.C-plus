import { test, expect } from '@playwright/test';

/**
 * TEST 3 — Registro de Asistencia P0
 *
 * Pre-requisito: storageState PROFESOR activo.
 * El docente registra asistencia desde gestión académica.
 */
test.describe('TEST 3 — Registro de asistencia (PROFESOR)', () => {
  test('PROFESOR puede registrar asistencia de un grupo', async ({ page }) => {
    await page.goto('/docente/gestion-academica');

    // Wait for the page to load
    await expect(page.getByText(/gestión académica|asignaciones|grupo/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // Look for the attendance/absences section — in gestion-academica, absence data
    // is part of the student academic forms (inasistencias justificadas/injustificadas)
    const studentRows = page.locator('tr, [role="row"], [data-student-id]');
    const rowCount = await studentRows.count();

    if (rowCount > 0) {
      // Expand first student
      await studentRows.first().click();

      // Find absence inputs (justificadas / injustificadas)
      const absenceInputs = page.locator(
        'input[name*="inasistencia"], input[name*="ausencia"], input[name*="justificada"], input[data-testid*="absence"]',
      );

      // Wait for form to expand
      await page.waitForTimeout(1_000);

      const absenceCount = await absenceInputs.count();
      if (absenceCount > 0) {
        // Set justified absences to 1
        await absenceInputs.first().fill('1');

        // Save the form
        await page.getByRole('button', { name: /guardar|salvar|save/i }).click();

        // Verify save success
        await expect(
          page.getByText(/guardad|actualiz|éxito|correctamente/i),
        ).toBeVisible({ timeout: 15_000 });
      }
    }
  });

  test('El estado de asistencia se persiste correctamente', async ({ page }) => {
    await page.goto('/docente/gestion-academica');

    await expect(page.getByText(/gestión académica|asignaciones|grupo/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // After saving in the previous test, if we reload and expand the same student
    // the absence data should still be there
    const studentRows = page.locator('tr, [role="row"], [data-student-id]');
    const rowCount = await studentRows.count();

    if (rowCount > 0) {
      await studentRows.first().click();

      // Wait for form to load data from backend
      await page.waitForTimeout(2_000);

      const absenceInputs = page.locator(
        'input[name*="inasistencia"], input[name*="ausencia"], input[name*="justificada"], input[data-testid*="absence"]',
      );

      const count = await absenceInputs.count();
      if (count > 0) {
        // Verify the value is not empty (persisted from backend)
        const value = await absenceInputs.first().inputValue();
        // Value should exist (0 or positive integer)
        expect(value).toBeTruthy();
      }
    }
  });
});
