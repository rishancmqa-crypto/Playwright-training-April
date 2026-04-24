import { test, expect } from '@playwright/test';



test('Open page @fast', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
});


test('check Password Field visibility @slow', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
    await expect(page.locator('[data-test="password"]')).toBeVisible();
});

test.only('check login button is enabled', async ({ page }) => {
    test.slow();
    await page.goto('https://www.saucedemo.com/');
    await expect(page.locator('[data-test="login-button"]')).toBeEnabled();
});