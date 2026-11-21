import { test as setup } from '@playwright/test';
import { storageStatePath, testUser, type TestRole } from './fixtures/users';

const rolesToSetup: TestRole[] = ['PROFESOR', 'SECRETARIA', 'ESTUDIANTE'];

for (const role of rolesToSetup) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const user = testUser(role);

    await page.goto(user.loginPage);
    await page.fill(user.emailField, user.email);
    await page.fill(user.passwordField, user.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.waitForURL(new RegExp(user.dashboardPath), { timeout: 30_000 });
    await page.context().storageState({ path: storageStatePath(role) });
  });
}
