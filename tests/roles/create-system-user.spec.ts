import { test, expect } from '../../fixtures/test-fixtures';
import { createEmployee, createSystemUser } from '../../data/employee-data';

test.describe('Admin > User Management', () => {
  test(
    'admin can create an ESS system user for a new employee',
    { tag: ['@regression', '@admin'] },
    async ({ page, systemUserFormPage, adminUsersPage, toast, createdEmployees, createdUsers }) => {
      // Test data: a new employee and the ESS login we will give them
      const employee = createEmployee();
      const user = createSystemUser('ESS', true);

      await test.step('Precondition: create the employee (API)', async () => {
        // The employee is not what we test here, so the fast API way is fine
        await createdEmployees.createViaApi(employee);
      });

      await test.step('Fill Add User (role ESS, Enabled) and Save', async () => {
        await systemUserFormPage.gotoAdd();
        await systemUserFormPage.fillNewUser(employee, user);
        // Register the new user for cleanup straight away, before any check can fail
        createdUsers.add(await systemUserFormPage.saveAndGetUserId());
      });

      await test.step('Expected result: success toast and back on the Users list', async () => {
        await expect(toast.message('Successfully Saved')).toBeVisible();
        await expect(page).toHaveURL(/admin\/viewSystemUsers/);
      });

      await test.step('Expected result: filtered list shows our user with role ESS and status Enabled', async () => {
        await adminUsersPage.searchByUsername(user.username);
        // Exactly one row: our unique username
        await expect(adminUsersPage.rowFor(user.username)).toHaveCount(1);
        await expect(adminUsersPage.cellIn(user.username, 'ESS')).toBeVisible();
        await expect(adminUsersPage.cellIn(user.username, 'Enabled')).toBeVisible();
        await expect(adminUsersPage.cellIn(user.username, `${employee.firstName} ${employee.lastName}`)).toBeVisible();
      });
    }
  );
});
