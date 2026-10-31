import { defineConfig, devices } from '@playwright/test';
// Loads config/.env.<TEST_ENV> and checks all required variables exist
import { env } from './utils/env';

// File where the setup project saves the logged-in admin session
const ADMIN_AUTH_FILE = 'playwright/.auth/admin.json';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel - safe because each test creates its own data */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only, as a safety net - never to hide flaky tests */
  retries: process.env.CI ? 2 : 0,
  /* Keep workers low: the demo site is public, shared and slow */
  workers: process.env.CI ? 1 : 2,
  /* Whole-test time limit (the demo site can be slow) */
  timeout: 60_000,
  /* How long web-first assertions (expect) keep retrying before failing */
  expect: { timeout: 10_000 },
  /* 'list' prints progress in the terminal; 'html' builds the report (open with: npm run report) */
  reporter: [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL from the env file, so tests can use short paths like `await page.goto('/')`. */
    baseURL: env.baseUrl,

    /* Debug evidence is kept only when a test fails */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* Max time for one click/fill, and for one page load */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    /* 1. Logs in once and saves the session to ADMIN_AUTH_FILE */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* 2. Real tests reuse the saved session, so they skip the login screen */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_AUTH_FILE },
      dependencies: ['setup'],
    },

    /* Cross-browser runs: enable later if the brief asks for them */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], storageState: ADMIN_AUTH_FILE },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], storageState: ADMIN_AUTH_FILE },
    //   dependencies: ['setup'],
    // },
  ],
});
