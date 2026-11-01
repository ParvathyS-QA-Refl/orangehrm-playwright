import { expect, type Locator, type Page } from '@playwright/test';
import { type Employee, type SystemUser, type UserRole } from '../data/employee-data';

// Page object for Admin > Add User AND Edit User.
// Both pages use the same form, so one class covers both (Edit just has no password boxes
// unless "Change Password ?" is ticked).
export class SystemUserFormPage {
  readonly userRoleDropdown: Locator;
  readonly employeeNameInput: Locator;
  readonly statusDropdown: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly saveButton: Locator;
  private readonly loader: Locator;

  constructor(private readonly page: Page) {
    // OrangeHRM dropdowns are not a real <select>: we click the visible box (CSS class,
    // documented exception) and then pick from the list that opens (role "option")
    this.userRoleDropdown = this.field('User Role').locator('.oxd-select-text');
    this.statusDropdown = this.field('Status').locator('.oxd-select-text');
    this.employeeNameInput = this.field('Employee Name').getByPlaceholder('Type for hints...');
    this.usernameInput = this.field('Username').getByRole('textbox');
    this.passwordInput = this.field('Password').getByRole('textbox');
    this.confirmPasswordInput = this.field('Confirm Password').getByRole('textbox');
    this.saveButton = page.getByRole('button', { name: 'Save' });
    // Spinner shown while the Edit form loads its data (no role, so CSS class - documented exception)
    this.loader = page.locator('.oxd-form-loader');
  }

  // Labels are not linked to inputs, so scope to the input group whose label is EXACTLY this text.
  // exact: true matters: "Password" must not also match "Confirm Password".
  private field(label: string): Locator {
    return this.page.locator('.oxd-input-group').filter({ has: this.page.getByText(label, { exact: true }) });
  }

  // Open the empty Add User form
  async gotoAdd() {
    await this.page.goto('/web/index.php/admin/saveSystemUser');
  }

  // The Edit form fills itself AFTER the page opens. Changing values too early gets
  // overwritten, so wait until the spinner is gone and the Username box has a value.
  async waitForLoaded() {
    await expect(this.loader).toBeHidden();
    await expect(this.usernameInput).not.toHaveValue('');
  }

  // Open a dropdown, then click the option with exactly this name
  private async choose(dropdown: Locator, option: string) {
    await dropdown.click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
  }

  async selectRole(role: UserRole) {
    await this.choose(this.userRoleDropdown, role);
  }

  async selectStatus(enabled: boolean) {
    await this.choose(this.statusDropdown, enabled ? 'Enabled' : 'Disabled');
  }

  // Autocomplete: type the unique first name, wait for OUR suggestion, then click it.
  // (While searching, the list briefly shows "Searching...", which our filter ignores.)
  async selectEmployee(employee: Employee) {
    await this.employeeNameInput.fill(employee.firstName);
    await this.page.getByRole('option').filter({ hasText: employee.firstName }).click();
  }

  // Fill the whole Add User form for this employee
  async fillNewUser(employee: Employee, user: SystemUser) {
    await this.selectRole(user.role);
    await this.selectEmployee(employee);
    await this.selectStatus(user.enabled);
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(user.password);
  }

  // Click Save on the Add form and return the new user's id from the server's answer.
  // We read it from the network response so cleanup knows the user even if a later UI step fails.
  async saveAndGetUserId(): Promise<number> {
    // Start listening BEFORE clicking, so we can't miss a fast response
    const responsePromise = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && response.url().endsWith('/api/v2/admin/users')
    );
    await this.saveButton.click();
    const response = await responsePromise;
    const body = await response.json();
    // Fail with a clear message if the server did not create the user
    if (!response.ok() || typeof body?.data?.id !== 'number') {
      throw new Error(`Create system user failed: HTTP ${response.status()} ${JSON.stringify(body)}`);
    }
    return body.data.id;
  }
}
