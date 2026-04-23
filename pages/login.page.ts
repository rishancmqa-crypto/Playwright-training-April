import type {Page,Locator} from '@playwright/test';
export class LoginPage {

    page: Page;
    usernameLocator: Locator;
    loginButtonLocator: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usernameLocator = page.locator('[data-test="username"]');
        this.loginButtonLocator = page.locator('[data-test="login-button"]');


    }

    async openLoginPage() {
      await this.page.goto('https://www.saucedemo.com/'); 
    
    }


    }