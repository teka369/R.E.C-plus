import { type Page, type Locator, expect } from '@playwright/test';

/**
 * LoginPage — Page Object for both /login (docente/estudiante)
 * and /acceso-secretaria pages.
 */
export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /* ── Navigators ── */

  async gotoStudentTeacher() {
    await this.page.goto('/login');
  }

  async gotoSecretaria() {
    await this.page.goto('/acceso-secretaria');
  }

  /* ── Actions ── */

  async loginAsStudentOrTeacher(email: string, password: string) {
    await this.gotoStudentTeacher();
    await this.page.fill('#login-email', email);
    await this.page.fill('#login-password', password);
    await this.page.getByRole('button', { name: 'Ingresar' }).click();
  }

  async loginAsSecretaria(email: string, password: string) {
    await this.gotoSecretaria();
    await this.page.fill('#secretaria-email', email);
    await this.page.fill('#secretaria-password', password);
    await this.page.getByRole('button', { name: 'Ingresar' }).click();
  }

  /* ── Assertions ── */

  errorMessage(): Locator {
    return this.page.locator('.bg-red-50');
  }

  async expectErrorVisible(text?: string | RegExp) {
    const loc = this.errorMessage();
    await expect(loc).toBeVisible();
    if (text) await expect(loc).toContainText(text);
  }
}
