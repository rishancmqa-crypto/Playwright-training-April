import { test, expect } from '@playwright/test';





test('check Password Field visibility @slow', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');

    const pageTitle = await page.evaluate(()=> {
         return window.document.title;
    });

    console.log(pageTitle);
   
    await expect(page.locator('[data-test="password"]')).toBeVisible();
});
