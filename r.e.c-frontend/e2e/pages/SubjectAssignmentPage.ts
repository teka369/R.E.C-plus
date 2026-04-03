import { type Page, expect } from '@playwright/test';

/**
 * SubjectAssignmentPage — /secretaria/docentes
 * Assign subjects to teachers.
 */
export class SubjectAssignmentPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/secretaria/docentes');
  }

  /** Select a group from the dropdown for a teacher row */
  async selectGroup(groupLabel: string | RegExp) {
    await this.page.getByRole('combobox').first().selectOption({ label: groupLabel.toString() });
  }

  /** Select a subject from the dropdown */
  async selectSubject(subjectName: string | RegExp) {
    const selects = this.page.getByRole('combobox');
    await selects.nth(1).selectOption({ label: subjectName.toString() });
  }

  /** Click the assign button */
  async assign() {
    await this.page.getByRole('button', { name: /asignar/i }).first().click();
  }

  /** Expand teacher assignments */
  async expandTeacherAssignments(teacherName: string | RegExp) {
    await this.page.getByText(teacherName).click();
  }

  /** Assert a subject appears in the assignment list */
  async expectAssignmentVisible(text: string | RegExp) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 10_000 });
  }
}
