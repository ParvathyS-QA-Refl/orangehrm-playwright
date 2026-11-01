import { type Locator, type Page } from '@playwright/test';

// Page object for Admin > User Management > Users (search filters + results table).
export class AdminUsersPage {
  readonly usernameFilter: Locator;
  readonly searchButton: Locator;
  // Shown instead of the page when the logged-in user has no rights (checked live: "Credential Required")
  readonly accessDeniedAlert: Locator;

  constructor(private readonly page: Page) {
    // Labels are not linked to inputs, so scope to the input group with this exact label (CSS = documented exception)
    this.usernameFilter = page
      .locator('.oxd-input-group')
      .filter({ has: page.getByText('Username', { exact: true }) })
      .getByRole('textbox');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.accessDeniedAlert = page.getByRole('alert');
  }

  // Open the Users list directly (this is also the URL an ESS user must NOT be able to open)
  async goto() {
    await this.page.goto('/web/index.php/admin/viewSystemUsers');
  }

  // Filter the list by our unique username
  async searchByUsername(username: string) {
    await this.usernameFilter.fill(username);
    await this.searchButton.click();
  }

  // The results-table row whose Username CELL is exactly our unique username.
  // The header row has no cells (only column headers), so it can never match.
  rowFor(username: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: username, exact: true }) });
  }

  // A cell with exactly this text inside our user's row, e.g. cellIn(username, 'ESS')
  cellIn(username: string, text: string): Locator {
    return this.rowFor(username).getByRole('cell', { name: text, exact: true });
  }

  // The pencil (edit) button INSIDE our user's row.
  // The icon button has no accessible name, so we target the pencil icon (documented exception).
  editButtonFor(username: string): Locator {
    return this.rowFor(username).locator('button:has(.bi-pencil-fill)');
  }
}
