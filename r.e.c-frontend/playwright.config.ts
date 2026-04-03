import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `npx next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      ...process.env,
      PORT: String(port),
      JWT_SECRET: process.env.JWT_SECRET ?? 'local-dev-jwt-secret-change-me',
      INTERNAL_API_URL: process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:4001',
    },
  },
  projects: [
    /* ── Auth setup — runs first, creates storageState files ── */
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts$/,
    },

    /* ── Tests that do NOT require auth (login, password recovery) ── */
    {
      name: 'no-auth',
      testMatch: /auth\.spec\.ts|password-recovery\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* ── Teacher tests — reuse PROFESOR storageState ── */
    {
      name: 'teacher',
      testMatch: /grade-entry\.spec\.ts|attendance\.spec\.ts|messaging\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/profesor-storage.json',
      },
    },

    /* ── Secretaria tests — reuse SECRETARIA storageState ── */
    {
      name: 'secretaria',
      testMatch: /subject-assignment\.spec\.ts|reports\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/secretaria-storage.json',
      },
    },

    /* ── Legacy / routing tests (no storageState) ── */
    {
      name: 'chromium',
      testIgnore: /auth\.setup\.ts|auth\.spec\.ts|password-recovery\.spec\.ts|grade-entry\.spec\.ts|attendance\.spec\.ts|messaging\.spec\.ts|subject-assignment\.spec\.ts|reports\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
