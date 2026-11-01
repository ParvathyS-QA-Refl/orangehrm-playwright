import { test, expect } from '../../fixtures/test-fixtures';
import { createEmployee } from '../../data/employee-data';

test.describe('Delete employee', () => {
  test(
    'admin can delete an employee and it is no longer found',
    { tag: ['@regression', '@admin'] },
    async ({ employeeListPage, confirmDialog, toast, createdEmployees }) => {
      // Test data: our own new employee
      const employee = createEmployee();
      let empNumber = 0;

      await test.step('Precondition: create an employee (API) and find it in the Employee List', async () => {
        empNumber = await createdEmployees.createViaApi(employee);
        await employeeListPage.goto();
        await employeeListPage.searchById(employee.employeeId);
        await expect(employeeListPage.rowFor(employee), 'New employee should be in the results').toBeVisible();
      });

      await test.step('Click the trash icon and confirm with "Yes, Delete"', async () => {
        await employeeListPage.clickDelete(employee);
        await expect(confirmDialog.dialog).toContainText('Are you Sure?');
        await confirmDialog.confirm();
      });

      await test.step('Expected result: success toast', async () => {
        await expect(toast.message('Successfully Deleted')).toBeVisible();
        // Deleted by the test itself, so cleanup must not try again
        createdEmployees.markDeleted(empNumber);
      });

      await test.step('Expected result: searching again finds nothing', async () => {
        await employeeListPage.searchById(employee.employeeId);
        await expect(toast.message('No Records Found')).toBeVisible();
        await expect(employeeListPage.noRecordsFound).toBeVisible();
        await expect(employeeListPage.rowFor(employee)).toHaveCount(0);
      });
    }
  );
});
