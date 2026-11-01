import { test, expect } from '../../fixtures/test-fixtures';
import { createEmployee, createSystemUser } from '../../data/employee-data';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Disabled user', () => {
  test(
    'a Disabled user cannot log in',
    { tag: ['@regression', '@ess'] },
    async ({ createdEmployees, createdUsers, freshLogin }) => {
      // Test data: a new employee whose ESS login is Disabled (password is correct!)
      const employee = createEmployee();
      const user = createSystemUser('ESS', false);

      await test.step('Precondition: create employee + Disabled ESS user (API)', async () => {
        const empNumber = await createdEmployees.createViaApi(employee);
        await createdUsers.createViaApi(empNumber, user);
      });

      const window = await test.step('Try to log in with the correct password', async () => {
        return freshLogin(user);
      });

      await test.step('Expected result: "Account disabled" and still on the login page', async () => {
        // Real message checked live (not "Invalid credentials", because the password is right)
        await expect(new LoginPage(window.page).errorAlert).toHaveText('Account disabled');
        await expect(window.page).toHaveURL(/auth\/login/);
      });
    }
  );
});
