import { type Locator, type Page } from '@playwright/test';

// Page object for the top bar shown on every page after login (user menu, logout).
export class TopBar {
  readonly userDropdown: Locator;
  readonly logoutMenuItem: Locator;

  constructor(private readonly page: Page) {
    // The user name + arrow in the top-right has no role or accessible name,
    // so we use its CSS class (documented exception).
    this.userDropdown = page.locator('.oxd-userdropdown-tab');
    // Items in the opened dropdown have role="menuitem"
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
  }

  // Open the user dropdown and click Logout
  async logout() {
    await this.userDropdown.click();
    await this.logoutMenuItem.click();
  }
}
