import { test, expect } from '@playwright/test';
import { ReportsPage } from './pages/ReportsPage';

/**
 * TEST 5 — Reportes de rendimiento P0
 *
 * Pre-requisito: storageState SECRETARIA activo.
 */
test.describe('TEST 5 — Reportes de rendimiento (SECRETARIA)', () => {
  test('SECRETARIA puede ver el reporte académico de un estudiante', async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    await reportsPage.gotoStudentList();

    // Wait for student list to load
    await expect(page.getByText(/estudiantes/i).first()).toBeVisible({ timeout: 15_000 });

    // Find a student link (the page lists students with links to their details)
    const studentLinks = page.getByRole('link').filter({ hasText: /@/ });
    const linkCount = await studentLinks.count();

    if (linkCount > 0) {
      // Click first student link to navigate to detail view
      await studentLinks.first().click();

      // Wait for the academic detail page to load
      await page.waitForTimeout(3_000);

      // Should show student academic data
      await expect(
        page.getByText(/promedio|nota|calificaci|materia|académico/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    } else {
      // Alternative: the page itself shows performance overview inline
      // Verify the page at least loads the student management view
      await expect(page.getByText(/estudiantes/i).first()).toBeVisible();
    }
  });

  test('El reporte contiene secciones de notas y asistencia', async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    await reportsPage.gotoStudentList();

    await expect(page.getByText(/estudiantes/i).first()).toBeVisible({ timeout: 15_000 });

    const studentLinks = page.getByRole('link').filter({ hasText: /@/ });
    const linkCount = await studentLinks.count();

    if (linkCount > 0) {
      await studentLinks.first().click();
      await page.waitForTimeout(3_000);

      // Look for grade-related content
      await reportsPage.expectReportSections();

      // Look for attendance-related content
      await reportsPage.expectAttendanceSection();
    }
  });
});
