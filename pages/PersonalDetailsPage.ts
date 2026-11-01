import { expect, type Locator, type Page } from '@playwright/test';

// Page object for PIM > employee > Personal Details.
// This page has TWO forms with a Save button each, so every locator is scoped to the
// "Personal Details" form (the one containing "Employee Full Name").
export class PersonalDetailsPage {
  readonly form: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly saveButton: Locator;
  private readonly loader: Locator;

  constructor(private readonly page: Page) {
    this.form = page.locator('form').filter({ hasText: 'Employee Full Name' });
    this.firstNameInput = this.form.getByPlaceholder('First Name');
    this.lastNameInput = this.form.getByPlaceholder('Last Name');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    // Spinner shown while the form loads its data (no role, so CSS class - documented exception)
    this.loader = page.locator('.oxd-form-loader');
  }

  // Open the Personal Details page of one employee
  async goto(empNumber: number) {
    await this.page.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${empNumber}`);
  }

  // The form fills itself AFTER the page opens. Typing too early gets overwritten,
  // so wait until the spinner is gone and the First Name box has a value.
  async waitForLoaded() {
    await expect(this.loader).toBeHidden();
    await expect(this.firstNameInput).not.toHaveValue('');
  }
}
