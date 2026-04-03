import { type Page, expect } from '@playwright/test';

/**
 * ReportsPage — Page Object for performance/report views.
 */
export class ReportsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async gotoStudentList() {
    await this.page.goto('/secretaria/estudiantes');
  }

  /** Click on a student to see academic detail */
  async selectStudent(name: string | RegExp) {
    await this.page.getByText(name).click();
  }

  /** Assert report sections are visible */
  async expectReportSections() {
    // The student academic view shows grade/attendance data
    await expect(
      this.page.getByText(/promedio|nota|calificaci|materia/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectAttendanceSection() {
    await expect(
      this.page.getByText(/asistencia|inasistencia|ausencia/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  }
}
