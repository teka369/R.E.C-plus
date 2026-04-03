import { type Page, expect } from '@playwright/test';

/**
 * GradeEntryPage — Page Object for /docente/gestion-academica
 * Teacher grade entry flow.
 */
export class GradeEntryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/docente/gestion-academica');
  }

  /** Select a student from the student list (click on row containing name) */
  async selectStudent(name: string | RegExp) {
    await this.page.getByText(name).click();
  }

  /** Fill a grade input by its label or index */
  async fillGradeInput(index: number, value: string) {
    const gradeInputs = this.page.locator('[data-testid="grade-input"]');
    // Fallback: find input near "Parcial" labels
    const parcialInputs = this.page.locator('input').filter({ has: this.page.locator(`text=/parcial/i`) });
    // Use the most reliable selector available
    const target = (await gradeInputs.count()) > 0
      ? gradeInputs.nth(index)
      : parcialInputs.nth(index);
    await target.fill(value);
  }

  /** Click the save button */
  async save() {
    await this.page.getByRole('button', { name: /guardar|salvar|save/i }).click();
  }

  /** Assert a success message is visible */
  async expectSaveSuccess() {
    await expect(
      this.page.getByText(/guardad|actualiz|éxito|correctamente/i),
    ).toBeVisible({ timeout: 10_000 });
  }

  /** Assert a grade value is visible on the page */
  async expectGradeVisible(value: string | RegExp) {
    await expect(this.page.getByText(value)).toBeVisible();
  }
}
