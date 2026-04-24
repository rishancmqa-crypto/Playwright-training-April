import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

    await page.goto('https://www.saucedemo.com/');
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    const TwitterPromise = page.waitForEvent('popup');
    await page.locator('[data-test="social-twitter"]').click();
    const TwitterPage = await TwitterPromise;

    await TwitterPage.waitForLoadState();

    await expect(TwitterPage).toHaveURL('https://x.com/saucelabs');

    const pageCount = page.context().pages().length;
    console.log(pageCount);

    await page.bringToFront();


});