import { type Page, expect } from '@playwright/test';

/**
 * AttendancePage — Page Object for attendance registration flow.
 */
export class AttendancePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/docente/gestion-academica');
  }

  /** Toggle attendance status for a student row */
  async toggleAttendance(studentName: string | RegExp) {
    const row = this.page.getByText(studentName).locator('..');
    await row.getByRole('checkbox').first().check();
  }

  async save() {
    await this.page.getByRole('button', { name: /guardar|registrar|save/i }).click();
  }

  async expectSaveSuccess() {
    await expect(
      this.page.getByText(/guardad|registrad|éxito|correctamente/i),
    ).toBeVisible({ timeout: 10_000 });
  }
}
