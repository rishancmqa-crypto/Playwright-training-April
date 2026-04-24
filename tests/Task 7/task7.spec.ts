import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
});


test('check Password Field visibility', async ({ page }) => {
  await expect(page.locator('[data-test="password"]')).toBeVisible();
});

test('check login button is enabled', async ({ page }) => {
 
  await expect(page.locator('[data-test="login-button"]')).toBeEnabled();
});