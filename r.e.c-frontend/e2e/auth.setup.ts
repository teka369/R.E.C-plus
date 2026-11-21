import { test as setup } from '@playwright/test';
import { dismissWelcomeModal } from './fixtures/dismiss-welcome';
import { storageStatePath, testUser, type TestRole } from './fixtures/users';

const rolesToSetup: TestRole[] = ['PROFESOR', 'SECRETARIA', 'ESTUDIANTE'];

for (const role of rolesToSetup) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    setup.setTimeout(60_000);
    const user = testUser(role);

    await page.goto(user.loginPage);
    await page.fill(user.emailField, user.email);
    await page.fill(user.passwordField, user.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.waitForURL(new RegExp(user.dashboardPath), { timeout: 30_000 });
    if (role !== 'SECRETARIA') {
      await dismissWelcomeModal(page);
    }
    await page.context().storageState({ path: storageStatePath(role) });
  });
}
