import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

// ⚠️ THIS TEST FAILS ON PURPOSE. It is NOT a bug.
// Goal: show what Playwright saves when a test fails (screenshot, video, trace),
// so a reviewer can open the HTML report and see the debug evidence.
// It never runs in normal or CI runs: playwright.config.ts ignores tests/demo/
// unless DEMO_FAILURE=1 is set, which only `npm run demo:failure` does.

// Start logged out so the login page is shown
test.use({ storageState: { cookies: [], origins: [] } });

test('DEMO: intentional failure to show screenshot, video and trace', { tag: '@demo-failure' }, async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Step 1: Open the real login page (this part works)
  await loginPage.goto();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

  // Step 2: Expect a heading that does NOT exist -> the test fails here on purpose.
  // Short timeout so the demo fails fast instead of waiting the full 10 seconds.
  await expect(
    page.getByRole('heading', { name: 'This heading does not exist (intentional failure)' }),
    'Intentional failure: this heading is not on the login page'
  ).toBeVisible({ timeout: 3_000 });
});
