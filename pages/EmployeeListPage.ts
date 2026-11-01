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

  // The results-table row whose Id CELL is exactly our unique Employee Id.
  // The header row has no cells (only column headers), so it can never match.
  rowFor(employee: Employee): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: employee.employeeId, exact: true }) });
  }

  // The trash button INSIDE our employee's row (so we can't delete someone else).
  // The icon button has no accessible name, so we target the trash icon (documented exception).
  deleteButtonFor(employee: Employee): Locator {
    return this.rowFor(employee).locator('button:has(.bi-trash)');
  }
}
