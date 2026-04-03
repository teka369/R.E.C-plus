import { type Page, expect } from '@playwright/test';

/**
 * MessagingPage — Page Object for the feedback/messaging flow.
 * Uses the /docente/feedback page where teachers send feedback messages.
 */
export class MessagingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/docente/feedback');
  }

  /** Select a group */
  async selectGroup(groupLabel: string | RegExp) {
    await this.page.getByRole('combobox').first().selectOption({ label: groupLabel.toString() });
  }

  /** Open the new feedback/message modal */
  async openNewMessage() {
    await this.page.getByRole('button', { name: /crear|nuevo|nueva|agregar|\+/i }).click();
  }

  /** Fill message fields */
  async fillMessage(opts: {
    studentName?: string | RegExp;
    title: string;
    content: string;
  }) {
    if (opts.studentName) {
      // Select student from combobox
      const studentSelect = this.page.locator('select').filter({ hasText: /selecciona/i });
      if (await studentSelect.count()) {
        // Find option that matches
        await studentSelect.selectOption({ label: opts.studentName.toString() });
      }
    }

    const titleInput = this.page.locator('input[type="text"]').first();
    await titleInput.fill(opts.title);

    const contentArea = this.page.locator('textarea').first();
    await contentArea.fill(opts.content);
  }

  /** Submit the message/feedback */
  async send() {
    await this.page.getByRole('button', { name: /guardar|enviar|crear/i }).click();
  }

  /** Assert message appears in the list */
  async expectMessageVisible(text: string | RegExp) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 10_000 });
  }
}
