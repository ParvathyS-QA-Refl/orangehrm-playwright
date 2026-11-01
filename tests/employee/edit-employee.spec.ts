import { test, expect } from '../../fixtures/test-fixtures';
import { createEmployee } from '../../data/employee-data';
import { type PersonalDetails } from '../../pages/PersonalDetailsPage';

test.describe('Edit employee', () => {
  test(
    'admin can update personal details and they are saved',
    { tag: ['@regression', '@admin'] },
    async ({ page, personalDetailsPage, toast, createdEmployees }) => {
      // Test data: our own new employee, plus the new values we will save
      const employee = createEmployee();
      const newDetails: PersonalDetails = {
        otherId: `OID_${employee.employeeId}`,
        maritalStatus: 'Married',
        gender: 'Female',
      };
      let empNumber = 0;

      await test.step('Precondition: create an employee (API) and open Personal Details', async () => {
        empNumber = await createdEmployees.createViaApi(employee);
        await personalDetailsPage.goto(empNumber);
        await personalDetailsPage.waitForLoaded();
      });

      await test.step('Change Other Id, Marital Status and Gender, then Save', async () => {
        await personalDetailsPage.updateDetails(newDetails);
      });

      await test.step('Expected result: success toast', async () => {
        await expect(toast.message('Successfully Updated')).toBeVisible();
      });

      await test.step('Expected result: new values are still there after reload', async () => {
        // Reload proves the values were stored on the server, not just shown in the form
        await page.reload();
        await personalDetailsPage.waitForLoaded();
        await expect(personalDetailsPage.otherIdInput).toHaveValue(newDetails.otherId);
        await expect(personalDetailsPage.maritalStatusDropdown).toHaveText(newDetails.maritalStatus);
        await expect(personalDetailsPage.genderRadio(newDetails.gender)).toBeChecked();
      });
    }
  );
});
