import { type Locator, type Page } from '@playwright/test';
import { type Employee, type LoginDetails } from '../data/employee-data';

// Page object for PIM > Add Employee.
export class AddEmployeePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly employeeIdInput: Locator;
  readonly createLoginToggle: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly enabledStatus: Locator;
  readonly saveButton: Locator;
  readonly firstNameError: Locator;
  readonly lastNameError: Locator;

  constructor(private readonly page: Page) {
    // Name boxes have placeholders, so getByPlaceholder is the simplest user-facing locator
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.employeeIdInput = this.field('Employee Id').getByRole('textbox');

    // The "Create Login Details" switch: the real checkbox is invisible (check() times out),
    // so we click the visible switch by its CSS class (documented exception)
    this.createLoginToggle = page.locator('.oxd-switch-input');
    this.usernameInput = this.field('Username').getByRole('textbox');
    this.passwordInput = this.field('Password').getByRole('textbox');
    this.confirmPasswordInput = this.field('Confirm Password').getByRole('textbox');
    // The radio input is invisible too, so we click its visible label text
    this.enabledStatus = page.getByText('Enabled', { exact: true });

    this.saveButton = page.getByRole('button', { name: 'Save' });

    // First and Last Name share one label ("Employee Full Name"), so each error is found
    // in the small input group that holds that box only (has First Name, not Last Name)
    this.firstNameError = page
      .locator('.oxd-input-group', { has: this.firstNameInput, hasNot: this.lastNameInput })
      .getByText('Required');
    this.lastNameError = page
      .locator('.oxd-input-group', { has: this.lastNameInput, hasNot: this.firstNameInput })
      .getByText('Required');
  }

  // OrangeHRM labels are not linked to their inputs, so getByLabel fails.
  // We scope to the input group whose label text is EXACTLY this text (CSS class = documented exception).
  // exact: true matters: "Password" must not also match "Confirm Password".
  private field(label: string): Locator {
    return this.page.locator('.oxd-input-group').filter({ has: this.page.getByText(label, { exact: true }) });
  }

  // The red error text under a labelled field, e.g. fieldError('Confirm Password')
  fieldError(label: string): Locator {
    return this.field(label).locator('.oxd-input-field-error-message');
  }

  // Open the Add Employee page directly (faster and more stable than clicking through the menu)
  async goto() {
    await this.page.goto('/web/index.php/pim/addEmployee');
  }

  // Fill only the required fields: First Name and Last Name
  async fillRequiredFields(employee: Employee) {
    await this.firstNameInput.fill(employee.firstName);
    await this.lastNameInput.fill(employee.lastName);
  }

  // Replace the auto-filled Employee Id with our unique one (so we can search for it later)
  async fillEmployeeId(employee: Employee) {
    await this.employeeIdInput.fill(employee.employeeId);
  }

  // Switch on "Create Login Details" and fill username, password and status Enabled
  async fillLoginDetails(login: LoginDetails, confirmPassword = login.password) {
    await this.createLoginToggle.click();
    await this.usernameInput.fill(login.username);
    await this.passwordInput.fill(login.password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.enabledStatus.click();
  }

  // Click Save and return the new employee's number (empNumber) from the server's answer.
  // We read it from the network response, not the URL, so cleanup still knows the employee
  // even if a later UI step fails.
  async saveAndGetEmpNumber(): Promise<number> {
    // Start listening BEFORE clicking, so we can't miss a fast response
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().endsWith('/api/v2/pim/employees')
    );
    await this.saveButton.click();
    const response = await responsePromise;
    const body = await response.json();
    // Fail with a clear message if the server did not create the employee
    if (!response.ok() || typeof body?.data?.empNumber !== 'number') {
      throw new Error(`Create employee failed: HTTP ${response.status()} ${JSON.stringify(body)}`);
    }
    return body.data.empNumber;
  }
}
