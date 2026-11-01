import { test as base, type APIRequestContext } from '@playwright/test';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import { PersonalDetailsPage } from '../pages/PersonalDetailsPage';
import { Toast } from '../pages/components/Toast';
import { type Employee } from '../data/employee-data';

// Remembers which employees a test created, so they can be deleted afterwards
export class CreatedEmployees {
  readonly empNumbers: number[] = [];

  constructor(private readonly request: APIRequestContext) {}

  add(empNumber: number) {
    this.empNumbers.push(empNumber);
  }

  // Fast precondition for edit/delete tests: create the employee through OrangeHRM's API
  // (the UI way is already tested in add-employee.spec.ts). It is registered for cleanup.
  async createViaApi(employee: Employee): Promise<number> {
    const response = await this.request.post('/web/index.php/api/v2/pim/employees', {
      data: {
        firstName: employee.firstName,
        middleName: '',
        lastName: employee.lastName,
        employeeId: employee.employeeId,
      },
    });
    const body = await response.json();
    if (!response.ok() || typeof body?.data?.empNumber !== 'number') {
      throw new Error(`Create employee via API failed: HTTP ${response.status()} ${JSON.stringify(body)}`);
    }
    this.add(body.data.empNumber);
    return body.data.empNumber;
  }
}

type Fixtures = {
  addEmployeePage: AddEmployeePage;
  personalDetailsPage: PersonalDetailsPage;
  toast: Toast;
  createdEmployees: CreatedEmployees;
};

// Our own "test" with ready-made page objects, so tests don't repeat `new SomePage(page)`.
// Tests import { test, expect } from this file instead of '@playwright/test'.
export const test = base.extend<Fixtures>({
  addEmployeePage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },
  personalDetailsPage: async ({ page }, use) => {
    await use(new PersonalDetailsPage(page));
  },
  toast: async ({ page }, use) => {
    await use(new Toast(page));
  },

  // Cleanup fixture: like a "postcondition" step that ALWAYS runs, pass or fail.
  createdEmployees: async ({ page }, use, testInfo) => {
    // page.request shares the logged-in admin cookies, so API calls are authorised
    const created = new CreatedEmployees(page.request);

    // Everything before use() = setup, the test runs inside use(), everything after = teardown
    await use(created);

    if (created.empNumbers.length === 0) return;

    // Delete through OrangeHRM's API (page.request reuses the admin login cookies).
    // Deleting an employee also removes their system user (checked on the live site).
    // A cleanup problem must not fail a test that already passed, so we record a warning
    // in the HTML report instead of throwing.
    try {
      const response = await page.request.delete('/web/index.php/api/v2/pim/employees', {
        data: { ids: created.empNumbers },
      });
      if (!response.ok()) {
        testInfo.annotations.push({
          type: 'warning',
          description: `Cleanup failed for empNumber(s) ${created.empNumbers.join(', ')}: HTTP ${response.status()}`,
        });
      }
    } catch (error) {
      testInfo.annotations.push({
        type: 'warning',
        description: `Cleanup failed for empNumber(s) ${created.empNumbers.join(', ')}: ${String(error)}`,
      });
    }
  },
});

export { expect } from '@playwright/test';
