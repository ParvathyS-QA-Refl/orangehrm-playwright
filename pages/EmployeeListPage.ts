import { type Locator, type Page } from '@playwright/test';
import { type Employee } from '../data/employee-data';

// Page object for PIM > Employee List (search filters + results table).
export class EmployeeListPage {
  readonly employeeIdInput: Locator;
  readonly searchButton: Locator;
  readonly noRecordsFound: Locator;

  constructor(private readonly page: Page) {
    // Labels are not linked to inputs, so scope to the input group with this exact label (CSS = documented exception)
    this.employeeIdInput = page
      .locator('.oxd-input-group')
      .filter({ has: page.getByText('Employee Id', { exact: true }) })
      .getByRole('textbox');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    // "No Records Found" appears twice: in the toast AND above the table.
    // This one is the text above the table (CSS class of that area, documented exception).
    this.noRecordsFound = page.locator('.orangehrm-horizontal-padding').getByText('No Records Found');
  }

  // Open the Employee List directly
  async goto() {
    await this.page.goto('/web/index.php/pim/viewEmployeeList');
  }

  // Search by Employee Id: it is unique, so the result is exactly our employee (or nothing)
  async searchById(employeeId: string) {
    await this.employeeIdInput.fill(employeeId);
    await this.searchButton.click();
  }

  // The results-table row that contains our unique Employee Id
  rowFor(employee: Employee): Locator {
    return this.page.getByRole('row').filter({ hasText: employee.employeeId });
  }

  // Click the trash icon in our employee's row (opens the confirm dialog).
  // The icon button has no accessible name, so we target the trash icon (documented exception).
  async clickDelete(employee: Employee) {
    await this.rowFor(employee).locator('button:has(.bi-trash)').click();
  }
}
