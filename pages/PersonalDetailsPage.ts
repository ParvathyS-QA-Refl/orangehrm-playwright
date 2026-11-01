import { expect, type Locator, type Page } from '@playwright/test';

// The personal details we change in the edit test
export type PersonalDetails = {
  otherId: string;
  maritalStatus: 'Single' | 'Married' | 'Other';
  gender: 'Male' | 'Female';
};

// Page object for PIM > employee > Personal Details.
// This page has TWO forms with a Save button each, so every locator is scoped to the
// "Personal Details" form (the one containing "Employee Full Name").
export class PersonalDetailsPage {
  readonly form: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly otherIdInput: Locator;
  readonly maritalStatusDropdown: Locator;
  readonly saveButton: Locator;
  private readonly loader: Locator;

  constructor(private readonly page: Page) {
    this.form = page.locator('form').filter({ hasText: 'Employee Full Name' });
    this.firstNameInput = this.form.getByPlaceholder('First Name');
    this.lastNameInput = this.form.getByPlaceholder('Last Name');
    this.otherIdInput = this.field('Other Id').getByRole('textbox');
    // OrangeHRM dropdowns are not a real <select>: we click the visible box (CSS class,
    // documented exception) and then pick from the list that opens (role "option")
    this.maritalStatusDropdown = this.field('Marital Status').locator('.oxd-select-text');
    this.saveButton = this.form.getByRole('button', { name: 'Save' });
    // Spinner shown while the form loads its data (no role, so CSS class - documented exception)
    this.loader = page.locator('.oxd-form-loader');
  }

  // Labels are not linked to inputs, so scope to the input group with this exact label text
  private field(label: string): Locator {
    return this.form.locator('.oxd-input-group').filter({ has: this.page.getByText(label, { exact: true }) });
  }

  // The Male/Female radio button, used to CHECK which one is selected
  genderRadio(gender: PersonalDetails['gender']): Locator {
    return this.form.getByRole('radio', { name: gender });
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

  // Change Other Id, Marital Status and Gender, then click this form's Save
  async updateDetails(details: PersonalDetails) {
    await this.otherIdInput.fill(details.otherId);

    // Open the dropdown, then click the option with exactly this name
    await this.maritalStatusDropdown.click();
    await this.page.getByRole('option', { name: details.maritalStatus, exact: true }).click();

    // The radio input itself is invisible, so we click its visible label text
    await this.form.getByText(details.gender, { exact: true }).click();

    await this.saveButton.click();
  }
}
