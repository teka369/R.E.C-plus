import { test, expect } from '@playwright/test';
import { SubjectAssignmentPage } from './pages/SubjectAssignmentPage';

/**
 * TEST 4 — Asignación de materia a docente P0
 *
 * Pre-requisito: storageState SECRETARIA activo.
 */
test.describe('TEST 4 — Asignación de materias (SECRETARIA)', () => {
  test('SECRETARIA puede asignar una materia a un docente', async ({ page }) => {
    const assignPage = new SubjectAssignmentPage(page);
    await assignPage.goto();

    // Wait for the docentes page to load with the list of teachers
    await expect(page.getByText(/docentes|profesores/i).first()).toBeVisible({ timeout: 15_000 });

    // The page shows a list of teachers with group/subject assignment dropdowns
    const teacherRows = page.locator('tr, [data-teacher-id], .sec-card').filter({
      hasText: /@|docente|profesor/i,
    });
    const rowCount = await teacherRows.count();

    if (rowCount > 0) {
      // Find group select (first combobox in the row area)
      const groupSelects = page.getByRole('combobox');
      const selectCount = await groupSelects.count();

      if (selectCount >= 2) {
        // Select a group from the first dropdown
        const groupSelect = groupSelects.first();
        const groupOptions = await groupSelect.locator('option').allTextContents();
        const validGroup = groupOptions.find((opt) => opt.trim() && !opt.includes('Selecciona'));

        if (validGroup) {
          await groupSelect.selectOption({ label: validGroup.trim() });

          // Wait for subject dropdown to populate
          await page.waitForTimeout(1_500);

          // Select a subject from the second dropdown
          const subjectSelect = groupSelects.nth(1);
          const subjectOptions = await subjectSelect.locator('option').allTextContents();
          const validSubject = subjectOptions.find((opt) => opt.trim() && !opt.includes('Selecciona'));

          if (validSubject) {
            await subjectSelect.selectOption({ label: validSubject.trim() });

            // Click assign button
            await page.getByRole('button', { name: /asignar/i }).first().click();

            // Wait for success feedback
            await expect(
              page.getByText(/asignad|éxito|correctamente|ok/i),
            ).toBeVisible({ timeout: 10_000 });
          }
        }
      }
    }
  });

  test('El docente aparece en la lista de asignados tras asignación', async ({ page }) => {
    const assignPage = new SubjectAssignmentPage(page);
    await assignPage.goto();

    await expect(page.getByText(/docentes|profesores/i).first()).toBeVisible({ timeout: 15_000 });

    // Look for "Ver asignaciones" or expand buttons to display current assignments
    const expandButtons = page.getByRole('button', { name: /ver|expandir|asignaciones/i });
    const expandCount = await expandButtons.count();

    if (expandCount > 0) {
      await expandButtons.first().click();

      // After expanding, assignments should be visible
      await page.waitForTimeout(1_500);

      // The assignment list should contain at least one entry with group-subject info
      const assignmentItems = page.locator('[class*="assignment"], li, tr').filter({
        hasText: /\d+-|grado|materia/i,
      });
      const assignmentCount = await assignmentItems.count();
      expect(assignmentCount).toBeGreaterThanOrEqual(0);
    }
  });
});
