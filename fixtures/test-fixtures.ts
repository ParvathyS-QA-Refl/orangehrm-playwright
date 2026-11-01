import { test as base, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import { PersonalDetailsPage } from '../pages/PersonalDetailsPage';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { Toast } from '../pages/components/Toast';
import { ConfirmDialog } from '../pages/components/ConfirmDialog';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { SystemUserFormPage } from '../pages/SystemUserFormPage';
import { MainMenu } from '../pages/MainMenu';
import { LoginPage } from '../pages/LoginPage';
import { type Employee, type LoginDetails, type SystemUser, type UserRole } from '../data/employee-data';
import { env } from '../utils/env';

// OrangeHRM's internal ids for the two roles (checked live via the /api/v2/admin/users answer)
const USER_ROLE_IDS: Record<UserRole, number> = { Admin: 1, ESS: 2 };

// Remembers which employees a test created, so they can be deleted afterwards
export class CreatedEmployees {
  readonly empNumbers: number[] = [];

  constructor(private readonly request: APIRequestContext) {}

  add(empNumber: number) {
    this.empNumbers.push(empNumber);
  }

  // Call this when the TEST itself deleted the employee, so cleanup doesn't try again
  markDeleted(empNumber: number) {
    const index = this.empNumbers.indexOf(empNumber);
    if (index !== -1) this.empNumbers.splice(index, 1);
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

// Remembers which system users (logins) a test created, so they can be deleted afterwards
export class CreatedUsers {
  readonly ids: number[] = [];

  constructor(private readonly request: APIRequestContext) {}

  add(id: number) {
    this.ids.push(id);
  }

  // Fast precondition: create a system user for an existing employee through the API
  // (the UI way is tested in create-system-user.spec.ts). It is registered for cleanup.
  async createViaApi(empNumber: number, user: SystemUser): Promise<number> {
    const response = await this.request.post('/web/index.php/api/v2/admin/users', {
      data: {
        username: user.username,
        password: user.password,
        status: user.enabled,
        userRoleId: USER_ROLE_IDS[user.role],
        empNumber,
      },
    });
    const body = await response.json();
    if (!response.ok() || typeof body?.data?.id !== 'number') {
      throw new Error(`Create system user via API failed: HTTP ${response.status()} ${JSON.stringify(body)}`);
    }
    this.add(body.data.id);
    return body.data.id;
  }
}

// What freshLogin gives back: the new window's page plus its side menu
export type LoggedInWindow = { page: Page; mainMenu: MainMenu };

// Logs in as ANY user in a brand-new, logged-out browser window.
// It only clicks Login; the test checks what happens (Dashboard, error, ...).
export type FreshLogin = (login: LoginDetails) => Promise<LoggedInWindow>;

type Fixtures = {
  addEmployeePage: AddEmployeePage;
  personalDetailsPage: PersonalDetailsPage;
  employeeListPage: EmployeeListPage;
  toast: Toast;
  confirmDialog: ConfirmDialog;
  createdEmployees: CreatedEmployees;
  adminUsersPage: AdminUsersPage;
  systemUserFormPage: SystemUserFormPage;
  createdUsers: CreatedUsers;
  freshLogin: FreshLogin;
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
  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },
  toast: async ({ page }, use) => {
    await use(new Toast(page));
  },
  confirmDialog: async ({ page }, use) => {
    await use(new ConfirmDialog(page));
  },

  adminUsersPage: async ({ page }, use) => {
    await use(new AdminUsersPage(page));
  },
  systemUserFormPage: async ({ page }, use) => {
    await use(new SystemUserFormPage(page));
  },

  // Cleanup fixture for system users. It depends on createdEmployees, so Playwright tears it
  // down FIRST: users are deleted before their employees. (Deleting an employee also removes
  // their user - checked live - but deleting explicitly means we don't rely on that.)
  createdUsers: async ({ page, createdEmployees }, use, testInfo) => {
    // createdEmployees is only listed to fix the teardown order; it is not used here
    void createdEmployees;
    const created = new CreatedUsers(page.request);

    await use(created);

    if (created.ids.length === 0) return;

    // Same rule as employees: a cleanup problem becomes a warning in the report, not a failure
    try {
      const response = await page.request.delete('/web/index.php/api/v2/admin/users', {
        data: { ids: created.ids },
      });
      if (!response.ok()) {
        testInfo.annotations.push({
          type: 'warning',
          description: `Cleanup failed for user id(s) ${created.ids.join(', ')}: HTTP ${response.status()}`,
        });
      }
    } catch (error) {
      testInfo.annotations.push({
        type: 'warning',
        description: `Cleanup failed for user id(s) ${created.ids.join(', ')}: ${String(error)}`,
      });
    }
  },

  // A second "browser window" for logging in as another user (ESS, Disabled, ...),
  // while the normal `page` stays logged in as admin. All windows are closed after the test.
  freshLogin: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    await use(async (login) => {
      // Empty storageState = no saved admin cookies, so this window starts logged out
      const context = await browser.newContext({
        baseURL: env.baseUrl,
        storageState: { cookies: [], origins: [] },
      });
      contexts.push(context);
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(login.username, login.password);
      return { page, mainMenu: new MainMenu(page) };
    });

    for (const context of contexts) await context.close();
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
