import { type Page, expect } from '@playwright/test';

/**
 * DashboardPage — shared assertions for any dashboard landing.
 */
export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectUrl(path: string | RegExp) {
    await expect(this.page).toHaveURL(path);
  }

  async expectHeading(text: string | RegExp) {
    await expect(this.page.getByRole('heading', { name: text })).toBeVisible();
  }
}
