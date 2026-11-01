import { test as base } from '@playwright/test';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import { PersonalDetailsPage } from '../pages/PersonalDetailsPage';
import { Toast } from '../pages/components/Toast';

// Remembers which employees a test created, so they can be deleted afterwards
export class CreatedEmployees {
  readonly empNumbers: number[] = [];

  add(empNumber: number) {
    this.empNumbers.push(empNumber);
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
    const created = new CreatedEmployees();

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
