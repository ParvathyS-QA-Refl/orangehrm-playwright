import { type Locator, type Page } from '@playwright/test';

// Page object for the OrangeHRM login page.
// It holds the locators and actions; the checks (assertions) stay in the tests.
export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;
  readonly usernameRequiredError: Locator;
  readonly passwordRequiredError: Locator;

  constructor(private readonly page: Page) {
    // The login boxes have placeholders, so getByPlaceholder is the simplest user-facing locator
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });

    // The red "Invalid credentials" box has role="alert"
    this.errorAlert = page.getByRole('alert');

    // "Required" appears under each empty field. The label is not linked to the input,
    // so we scope to the field group that contains the label text (documented CSS exception).
    this.usernameRequiredError = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Username' })
      .getByText('Required');
    this.passwordRequiredError = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Password' })
      .getByText('Required');
  }

  // Open the login page (baseURL from the env file is added in front automatically)
  async goto() {
    await this.page.goto('/web/index.php/auth/login');
  }

  // Type the username and password, then click Login
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
