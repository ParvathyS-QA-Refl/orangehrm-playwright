import { test, expect } from '../../fixtures/test-fixtures';
import { createEmployee, createSystemUser } from '../../data/employee-data';

test.describe('Admin role access', () => {
  test(
    'user with the Admin role sees the Admin menu after login',
    { tag: ['@regression', '@admin'] },
    async ({ createdEmployees, createdUsers, freshLogin }) => {
      // Test data: our own new employee with an Admin login (never the shared demo "Admin")
      const employee = createEmployee();
      const user = createSystemUser('Admin', true);

      await test.step('Precondition: create employee + Admin user (API)', async () => {
        const empNumber = await createdEmployees.createViaApi(employee);
        await createdUsers.createViaApi(empNumber, user);
      });

      const admin = await test.step('Log in as the new Admin user', async () => {
        const window = await freshLogin(user);
        await expect(window.page).toHaveURL(/dashboard/);
        return window;
      });

      await test.step('Expected result: Admin and PIM are in the main menu', async () => {
        await expect(admin.mainMenu.link('Admin')).toBeVisible();
        await expect(admin.mainMenu.link('PIM')).toBeVisible();
      });
    }
  );

  test(
    'admin changes a user role from ESS to Admin and the user then sees the Admin menu',
    { tag: ['@regression', '@admin'] },
    async ({ adminUsersPage, systemUserFormPage, toast, createdEmployees, createdUsers, freshLogin }) => {
      const employee = createEmployee();
      const user = createSystemUser('ESS', true);

      await test.step('Precondition: create employee + ESS user (API)', async () => {
        const empNumber = await createdEmployees.createViaApi(employee);
        await createdUsers.createViaApi(empNumber, user);
      });

      await test.step('Before the change: ESS user does not see Admin', async () => {
        const ess = await freshLogin(user);
        await expect(ess.page).toHaveURL(/dashboard/);
        // My Info first, so we know the menu has loaded before checking Admin is missing
        await expect(ess.mainMenu.link('My Info')).toBeVisible();
        await expect(ess.mainMenu.link('Admin')).toBeHidden();
      });

      await test.step('Admin opens the user, changes role to Admin and saves', async () => {
        // `page` (behind these page objects) is still the normal logged-in admin window
        await adminUsersPage.goto();
        await adminUsersPage.searchByUsername(user.username);
        await adminUsersPage.editButtonFor(user.username).click();
        await systemUserFormPage.waitForLoaded();
        await systemUserFormPage.selectRole('Admin');
        await systemUserFormPage.saveButton.click();
        await expect(toast.message('Successfully Updated')).toBeVisible();
      });

      await test.step('Expected result: the list shows the new role', async () => {
        await adminUsersPage.searchByUsername(user.username);
        await expect(adminUsersPage.cellIn(user.username, 'Admin')).toBeVisible();
      });

      await test.step('Expected result: after logging in again the user sees Admin', async () => {
        const again = await freshLogin(user);
        await expect(again.page).toHaveURL(/dashboard/);
        await expect(again.mainMenu.link('Admin')).toBeVisible();
      });
    }
  );
});
