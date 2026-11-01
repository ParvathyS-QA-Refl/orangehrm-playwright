import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { env } from '../utils/env';
// Where the logged-in session (cookies) is saved - shared with playwright.config.ts
import { ADMIN_AUTH_FILE } from '../utils/constants';

// Runs ONCE before the real tests: logs in as admin and saves the session,
// so every other test starts already logged in (like a test case precondition).
setup('authenticate as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Step 1: Log in with the admin credentials from the env file / CI secrets
  await loginPage.goto();
  await loginPage.login(env.adminUsername, env.adminPassword);

  // Step 2: Confirm login really worked before saving anything
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Step 3: Save cookies + local storage to a file that the chromium project reuses
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
