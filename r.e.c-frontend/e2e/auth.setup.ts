import { test as setup } from '@playwright/test';
import { TEST_USERS, storageStatePath, type TestRole } from './fixtures/users';

/**
 * Auth setup — Logs in once per role and saves storageState to disk.
 * Subsequent tests reuse these files so they skip login.
 */

const rolesToSetup: TestRole[] = ['PROFESOR', 'SECRETARIA'];

for (const role of rolesToSetup) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const user = TEST_USERS[role];

    await page.goto(user.loginPage);
    await page.fill(user.emailField, user.email);
    await page.fill(user.passwordField, user.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    // Wait for redirect to dashboard
    await page.waitForURL(new RegExp(user.dashboardPath), { timeout: 30_000 });

    // Save signed-in state
    await page.context().storageState({ path: storageStatePath(role) });
  });
}
