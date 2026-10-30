import { test, expect } from '@playwright/test';

// Smoke check: proves the env setup works and the login page loads
test('login page shows the login form @smoke', async ({ page }) => {
  // Step 1: Open the login page (baseURL from the env file is added in front automatically)
  await page.goto('/web/index.php/auth/login');

  // Step 2: Check the Login heading is shown
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

  // Step 3: Check the Username and Password boxes are shown
  await expect(page.getByPlaceholder('Username')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();

  // Step 4: Check the Login button is shown
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
