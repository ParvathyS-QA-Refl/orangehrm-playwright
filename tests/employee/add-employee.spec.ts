import { test, expect } from '../../fixtures/test-fixtures';
import { createEmployee } from '../../data/employee-data';

test.describe('Add employee', () => {
  test(
    'admin can create an employee with required fields only',
    { tag: ['@smoke', '@regression', '@admin'] },
    async ({ page, addEmployeePage, personalDetailsPage, toast, createdEmployees }) => {
      // Test data: a brand-new unique employee
      const employee = createEmployee();

      await test.step('Open Add Employee and fill only First and Last Name', async () => {
        await addEmployeePage.goto();
        await addEmployeePage.fillRequiredFields(employee);
      });

      await test.step('Save and register the employee for cleanup', async () => {
        const empNumber = await addEmployeePage.saveAndGetEmpNumber();
        // Register right away, so cleanup happens even if a check below fails
        createdEmployees.add(empNumber);
      });

      await test.step('Expected result: success toast and Personal Details shows the name', async () => {
        await expect(toast.message('Successfully Saved')).toBeVisible();
        await expect(page).toHaveURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+/);
        await personalDetailsPage.waitForLoaded();
        await expect(personalDetailsPage.firstNameInput).toHaveValue(employee.firstName);
        await expect(personalDetailsPage.lastNameInput).toHaveValue(employee.lastName);
      });
    }
  );
});
