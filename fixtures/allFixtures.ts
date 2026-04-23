import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TablePage } from '../pages/table.page';

type MyFixtures = {
    loginPage: LoginPage;
    tablePage: TablePage;
};

export const test = base.extend<MyFixtures>({
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },
    tablePage: async ({ page }, use) => {
        const tablePage = new TablePage(page);
        await use(tablePage);
    }
});

export { expect } from '@playwright/test';