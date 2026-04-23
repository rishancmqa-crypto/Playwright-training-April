import { test, expect } from '../../fixtures/login'; // Adjust the path as necessary


test.describe('Login Page TC005 Test', () => {

    test('test', async ({ loginPage }) => {


        await test.step("Open the login page", async () => {
            await loginPage.openLoginPage();

        });

        await test.step("Enter username ", async () => {

            await loginPage.usernameLocator.fill('standard_user');

        });

        await test.step("Click on login button", async () => {

             await loginPage.loginButtonLocator.click();

        });

        await test.step("Check whether error popup is visible with proper error message", async () => {

              await expect(loginPage.page.locator('div').filter({ hasText: /^Epic sadface: Password is required$/ })).toBeVisible();

        });
  
 
 
});


});

