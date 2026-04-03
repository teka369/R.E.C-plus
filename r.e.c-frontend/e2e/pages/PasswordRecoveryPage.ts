import { type Page, expect } from '@playwright/test';

/**
 * PasswordRecoveryPage — /forgot-password and /reset-password
 */
export class PasswordRecoveryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/forgot-password');
  }

  /* ── Email recovery flow ── */

  async submitEmail(email: string) {
    await this.page.fill('#forgot-email', email);
    await this.page.getByRole('button', { name: /enviar|recuperar|solicitar/i }).click();
  }

  async expectEmailSentConfirmation() {
    await expect(this.page.getByText(/revisa tu correo/i)).toBeVisible({ timeout: 10_000 });
  }

  /* ── Code recovery flow ── */

  async switchToCodeMode() {
    await this.page.getByText(/usa tu código|código/i).click();
  }

  async submitCode(code: string) {
    await this.page.fill('#forgot-codigo', code);
    await this.page.getByRole('button', { name: /verificar/i }).click();
  }

  /* ── Reset password form ── */

  async gotoResetPage(token: string) {
    await this.page.goto(`/reset-password?token=${token}`);
  }

  async fillNewPassword(password: string, confirm: string) {
    const inputs = this.page.locator('input[type="password"]');
    await inputs.nth(0).fill(password);
    await inputs.nth(1).fill(confirm);
  }

  async submitReset() {
    await this.page.getByRole('button', { name: /restablecer|cambiar|actualizar/i }).click();
  }

  async expectResetSuccess() {
    await expect(this.page.getByText(/contraseña actualizada/i)).toBeVisible({ timeout: 10_000 });
  }
}
