import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/saucelab/login.page';
import { TablePage } from '../pages/MySite/table.page';
import { GeneralComponentPage } from '../pages/commitQuality/generalComponent.page';

type MyFixtures = {
    loginPage: LoginPage;
    tablePage: TablePage;
    generalComponentPage: GeneralComponentPage;
};

export const test = base.extend<MyFixtures>({
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },

    tablePage: async ({ page }, use) => {
        const tablePage = new TablePage(page);
        await use(tablePage);
    },
    generalComponentPage: async ({ page }, use) => {
        const generalComponentPage = new GeneralComponentPage(page);
        await use(generalComponentPage);
    }


});

export { expect } from '@playwright/test';