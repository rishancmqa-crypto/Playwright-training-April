import type { Page, Locator } from '@playwright/test';

export class TablePage {

    page: Page;
    tableRow1Locator: Locator;


    constructor(page: Page) {
        this.page = page;
        this.tableRow1Locator = page.locator('[data-testid="row-1"]');
    }

    async openTablePage() {
        await this.page.goto('https://rishancmqa-crypto.github.io/Playwright-Practice-webpages/table.html');
    }
}