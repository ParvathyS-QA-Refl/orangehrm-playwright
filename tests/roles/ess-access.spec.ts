import { test, expect } from '../../fixtures/test-fixtures';
import { createEmployee, createSystemUser } from '../../data/employee-data';
import { AdminUsersPage } from '../../pages/AdminUsersPage';

test.describe('ESS user access', () => {
  test(
    'ESS user sees My Info but not Admin or PIM in the main menu',
    { tag: ['@smoke', '@regression', '@ess'] },
    async ({ createdEmployees, createdUsers, freshLogin }) => {
      // Test data: a new employee with an Enabled ESS login
      const employee = createEmployee();
      const user = createSystemUser('ESS', true);

      await test.step('Precondition: create employee + ESS user (API)', async () => {
        const empNumber = await createdEmployees.createViaApi(employee);
        await createdUsers.createViaApi(empNumber, user);
      });

      // freshLogin opens a NEW logged-out window, so the admin session is not reused
      const ess = await test.step('Log in as the ESS user', async () => {
        const window = await freshLogin(user);
        await expect(window.page).toHaveURL(/dashboard/);
        return window;
      });

      await test.step('Expected result: My Info is shown, Admin and PIM are not', async () => {
        // Check the item that SHOULD be there first: it proves the menu has finished loading,
        // so the "not visible" checks below can't pass just because the menu was still empty
        await expect(ess.mainMenu.link('My Info')).toBeVisible();
        await expect(ess.mainMenu.link('Admin')).toBeHidden();
        await expect(ess.mainMenu.link('PIM')).toBeHidden();
      });
    }
  );

  test(
    'ESS user is blocked when opening an Admin page URL directly',
    { tag: ['@regression', '@ess'] },
    async ({ createdEmployees, createdUsers, freshLogin }) => {
      const employee = createEmployee();
      const user = createSystemUser('ESS', true);

      await test.step('Precondition: create employee + ESS user (API)', async () => {
        const empNumber = await createdEmployees.createViaApi(employee);
        await createdUsers.createViaApi(empNumber, user);
      });

      const ess = await test.step('Log in as the ESS user', async () => {
        const window = await freshLogin(user);
        await expect(window.page).toHaveURL(/dashboard/);
        return window;
      });

      // Page object for the Admin Users list, but used in the ESS user's window
      const adminUsersAsEss = new AdminUsersPage(ess.page);

      await test.step('Open Admin > User Management by typing its URL', async () => {
        const response = await adminUsersAsEss.goto();
        // The server itself refuses the page (403 Forbidden), not just the menu hiding it
        expect(response?.status()).toBe(403);
      });

      await test.step('Expected result: "Credential Required" and no user list', async () => {
        // Real behaviour (checked live): the server answers 403 and shows this alert
        await expect(adminUsersAsEss.accessDeniedAlert).toHaveText('Credential Required');
        await expect(adminUsersAsEss.searchButton).toBeHidden();
        await expect(ess.page.getByRole('table')).toBeHidden();
      });
    }
  );
});
