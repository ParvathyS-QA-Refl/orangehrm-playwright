import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { TopBar } from '../../pages/TopBar';
import { env } from '../../utils/env';

// These tests check the login screen itself, so they must start LOGGED OUT.
// This empty session overrides the saved admin session for this file only.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  let loginPage: LoginPage;

  // Runs before each test: open a fresh login page
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('admin can log in with valid credentials', { tag: ['@smoke', '@regression', '@admin'] }, async ({ page }) => {
    // Step 1: Log in with the real admin credentials
    await loginPage.login(env.adminUsername, env.adminPassword);

    // Step 2: Expected result - the Dashboard opens
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('login fails with a wrong password', { tag: '@regression' }, async ({ page }) => {
    // Step 1: Correct username, made-up wrong password (not a secret)
    await loginPage.login(env.adminUsername, 'wrong_password_123');

    // Step 2: Expected result - error message shown and we stay on the login page
    await expect(loginPage.errorAlert).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('login shows "Required" when both fields are empty', { tag: '@regression' }, async ({ page }) => {
    // Step 1: Click Login without typing anything
    await loginPage.loginButton.click();

    // Step 2: Expected result - "Required" under each field and we stay on the login page
    await expect(loginPage.usernameRequiredError).toBeVisible();
    await expect(loginPage.passwordRequiredError).toBeVisible();
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('admin can log out from the user dropdown', { tag: '@regression' }, async ({ page }) => {
    const topBar = new TopBar(page);

    // Step 1: Log in and confirm the Dashboard is open (precondition for logging out)
    await loginPage.login(env.adminUsername, env.adminPassword);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Step 2: Open the user dropdown and click Logout
    await topBar.logout();

    // Step 3: Expected result - back on the login page with the login form shown
    await expect(page).toHaveURL(/auth\/login/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });
});
