import type {Page, Locator} from '@playwright/test';

export class GeneralComponentPage {

    page: Page;
    backToPracticeButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.backToPracticeButton = page.getByText('back to practice', { exact: true });
    }

    async openGeneralComponentPage() {
        await this.page.goto("https://commitquality.com/practice-general-components");
    }
}