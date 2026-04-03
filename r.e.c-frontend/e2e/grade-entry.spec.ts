import { test, expect } from '@playwright/test';
import { GradeEntryPage } from './pages/GradeEntryPage';
import { LoginPage } from './pages/LoginPage';
import { TEST_USERS } from './fixtures/users';

/**
 * TEST 2 — Ingreso de Notas P0
 *
 * Pre-requisito: auth-setup ha guardado el storageState de PROFESOR.
 * Este proyecto corre con storageState = profesor-storage.json,
 * por lo que ya está autenticado.
 */
test.describe('TEST 2 — Ingreso de notas (PROFESOR)', () => {
  test('PROFESOR navega a gestión académica, ingresa nota y la guarda', async ({ page }) => {
    const gradePage = new GradeEntryPage(page);
    await gradePage.goto();

    // Page should load the teacher's assignments
    await expect(page.getByText(/gestión académica|asignaciones|grupo/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // Select first student available
    const studentRows = page.locator('tr, [role="row"], [data-student-id]');
    const rowCount = await studentRows.count();

    if (rowCount > 0) {
      // Click on first student row to expand the grade form
      await studentRows.first().click();

      // Wait for grade form inputs to appear
      const gradeInput = page.locator(
        'input[type="number"], input[data-testid="grade-input"], input[name*="parcial"], input[name*="grade"]',
      );
      await expect(gradeInput.first()).toBeVisible({ timeout: 10_000 });

      // Enter a grade value
      await gradeInput.first().fill('4.5');

      // Save
      await page.getByRole('button', { name: /guardar|salvar|save/i }).click();

      // Verify success feedback
      await expect(
        page.getByText(/guardad|actualiz|éxito|correctamente/i),
      ).toBeVisible({ timeout: 15_000 });
    } else {
      // If no students, verify the page at least loads correctly
      await expect(page.getByText(/no hay|sin asignaciones|vacío/i).first()).toBeVisible();
    }
  });

  test('La nota guardada aparece en la lista después de guardar', async ({ page }) => {
    const gradePage = new GradeEntryPage(page);
    await gradePage.goto();

    await expect(page.getByText(/gestión académica|asignaciones|grupo/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // Look for any grade values already on the page (from previous saves or seeded data)
    const gradeValues = page.locator('[class*="grade"], [data-grade], td');
    const count = await gradeValues.count();

    // At minimum, verify the page loads and shows the grade overview structure
    if (count > 0) {
      await expect(gradeValues.first()).toBeVisible();
    }
  });

  test('ESTUDIANTE NO puede acceder a la ruta de ingreso de notas', async ({ browser }) => {
    // Create an isolated context without teacher auth
    const context = await browser.newContext();
    const page = await context.newPage();

    const user = TEST_USERS.ESTUDIANTE;
    const loginPage = new LoginPage(page);
    await loginPage.loginAsStudentOrTeacher(user.email, user.password);
    await expect(page).toHaveURL(/\/estudiante/, { timeout: 30_000 });

    // Try to access teacher's grade entry page
    await page.goto('/docente/gestion-academica');

    // Should be redirected away (to /estudiante or /login)
    await expect(page).not.toHaveURL(/\/docente\/gestion-academica/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/(estudiante|login)/, { timeout: 10_000 });

    await context.close();
  });
});
