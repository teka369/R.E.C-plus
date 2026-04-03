import { test, expect } from '@playwright/test';
import { PasswordRecoveryPage } from './pages/PasswordRecoveryPage';

/**
 * TEST 6 — Recuperación de contraseña P0
 *
 * No requiere sesión activa.
 * Usa route mocking para simular respuestas del backend.
 */
test.describe('TEST 6 — Recuperación de contraseña', () => {
  test('Recuperación por email: muestra confirmación de envío', async ({ page }) => {
    const recoveryPage = new PasswordRecoveryPage(page);

    // Mock the backend POST /auth/forgot-password
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email sent' }),
      });
    });

    await recoveryPage.goto();

    // Submit email
    await recoveryPage.submitEmail('student@test.edu');

    // Should show confirmation message
    await recoveryPage.expectEmailSentConfirmation();
  });

  test('Recuperación por código institucional: redirige a nueva contraseña', async ({ page }) => {
    const recoveryPage = new PasswordRecoveryPage(page);
    const fakeResetToken = 'fake-reset-token-for-testing';

    // Mock the backend POST /auth/recover-by-code
    await page.route('**/auth/recover-by-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: fakeResetToken }),
      });
    });

    await recoveryPage.goto();

    // Switch to code recovery mode
    // First submit by email to get the sent confirmation, then switch to code mode
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email sent' }),
      });
    });

    await recoveryPage.submitEmail('student@test.edu');
    await recoveryPage.expectEmailSentConfirmation();

    // Click "use your code" button
    await recoveryPage.switchToCodeMode();

    // Enter institutional code
    await recoveryPage.submitCode('EST-12345');

    // Should redirect to /reset-password?token=...
    await expect(page).toHaveURL(new RegExp(`reset-password.*token=${fakeResetToken}`), {
      timeout: 10_000,
    });
  });

  test('Reset de contraseña: formulario completo con token válido', async ({ page }) => {
    const recoveryPage = new PasswordRecoveryPage(page);
    const fakeToken = 'valid-reset-token';

    // Mock the backend POST /auth/reset-password
    await page.route('**/auth/reset-password', async (route) => {
      const body = route.request().postDataJSON() as { token?: string; password?: string };
      if (body.token === fakeToken && body.password) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Password reset successful' }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid token' }),
        });
      }
    });

    await recoveryPage.gotoResetPage(fakeToken);

    // Fill new password
    await recoveryPage.fillNewPassword('NewSecurePass123!', 'NewSecurePass123!');

    await recoveryPage.submitReset();

    // Should show success message
    await recoveryPage.expectResetSuccess();
  });

  test('Reset de contraseña: token inválido muestra error', async ({ page }) => {
    // Navigate without token
    await page.goto('/reset-password');

    // Should show "invalid link" message
    await expect(page.getByText(/enlace inválido|token/i)).toBeVisible({ timeout: 10_000 });
  });
});
