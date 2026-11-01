import { test, expect } from '../../fixtures/test-fixtures';
import { createEmployee, createLoginDetails } from '../../data/employee-data';

test.describe('Add employee', () => {
  test(
    'admin can create an employee with required fields only',
    { tag: ['@smoke', '@regression', '@admin'] },
    async ({ page, addEmployeePage, personalDetailsPage, toast, createdEmployees }) => {
      // Test data: a brand-new unique employee
      const employee = createEmployee();

      await test.step('Open Add Employee and fill only the required names (plus our unique Employee Id)', async () => {
        await addEmployeePage.goto();
        await addEmployeePage.fillNameAndId(employee);
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

  test(
    'admin can create an employee with login details',
    { tag: ['@regression', '@admin'] },
    async ({ page, addEmployeePage, personalDetailsPage, toast, createdEmployees }) => {
      // Test data: unique employee + unique username/password
      const employee = createEmployee();
      const login = createLoginDetails();

      await test.step('Fill the name and switch on Create Login Details (status Enabled)', async () => {
        await addEmployeePage.goto();
        await addEmployeePage.fillNameAndId(employee);
        await addEmployeePage.fillLoginDetails(login);
      });

      await test.step('Save and register the employee for cleanup', async () => {
        createdEmployees.add(await addEmployeePage.saveAndGetEmpNumber());
      });

      await test.step('Expected result: success toast and Personal Details page opens', async () => {
        await expect(toast.message('Successfully Saved')).toBeVisible();
        await expect(page).toHaveURL(/\/pim\/viewPersonalDetails\/empNumber\/\d+/);
        await personalDetailsPage.waitForLoaded();
        await expect(personalDetailsPage.firstNameInput).toHaveValue(employee.firstName);
      });
    }
  );

  test(
    'empty First and Last Name show "Required"',
    { tag: ['@regression', '@admin'] },
    async ({ page, addEmployeePage }) => {
      await test.step('Open Add Employee and click Save without typing a name', async () => {
        await addEmployeePage.goto();
        await addEmployeePage.saveButton.click();
      });

      await test.step('Expected result: "Required" under both names and we stay on the form', async () => {
        await expect(addEmployeePage.firstNameError).toBeVisible();
        await expect(addEmployeePage.lastNameError).toBeVisible();
        await expect(page).toHaveURL(/\/pim\/addEmployee/);
      });
    }
  );

  test(
    'different Password and Confirm Password show an error',
    { tag: ['@regression', '@admin'] },
    async ({ page, addEmployeePage }) => {
      const employee = createEmployee();
      const login = createLoginDetails();

      await test.step('Fill the form with a Confirm Password that does not match', async () => {
        await addEmployeePage.goto();
        await addEmployeePage.fillNameAndId(employee);
        await addEmployeePage.fillLoginDetails(login, `${login.password}_different`);
        await addEmployeePage.saveButton.click();
      });

      await test.step('Expected result: mismatch error and nothing is saved', async () => {
        await expect(addEmployeePage.fieldError('Confirm Password')).toHaveText('Passwords do not match');
        await expect(page).toHaveURL(/\/pim\/addEmployee/);
      });
    }
  );

  test(
    'a username that already exists shows an error',
    { tag: ['@regression', '@admin'] },
    async ({ page, addEmployeePage, toast, createdEmployees }) => {
      // Two different employees, but we will try to give both the SAME username
      const firstEmployee = createEmployee();
      const secondEmployee = createEmployee();
      const login = createLoginDetails();

      await test.step('Precondition: create the first employee with this username', async () => {
        await addEmployeePage.goto();
        await addEmployeePage.fillNameAndId(firstEmployee);
        await addEmployeePage.fillLoginDetails(login);
        createdEmployees.add(await addEmployeePage.saveAndGetEmpNumber());
        // Wait until the save fully finished (user account included) before reusing the username
        await expect(toast.message('Successfully Saved')).toBeVisible();
        await expect(page).toHaveURL(/\/pim\/viewPersonalDetails/);
      });

      await test.step('Try to create a second employee with the same username', async () => {
        await addEmployeePage.goto();
        await addEmployeePage.fillNameAndId(secondEmployee);
        await addEmployeePage.fillLoginDetails(login);
      });

      await test.step('Expected result: "Username already exists" and Save is blocked', async () => {
        await expect(addEmployeePage.fieldError('Username')).toHaveText('Username already exists');
        await addEmployeePage.saveButton.click();
        await expect(page).toHaveURL(/\/pim\/addEmployee/);
      });
    }
  );
});
