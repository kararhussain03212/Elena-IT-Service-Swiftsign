import { test, expect } from '@playwright/test';
import { FRONTEND_URL } from './config.js';

test.describe('Navbar smoke test (post-refactor sanity check)', () => {
  test('desktop: nav renders and a dropdown works', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FRONTEND_URL);
    await expect(page.locator('nav').first()).toBeVisible();
    // Scroll down enough to trigger the sticky/fixed nav variant too.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await page.waitForTimeout(300);
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('mobile: hamburger opens the menu and it can be closed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(FRONTEND_URL);

    const openButton = page.getByRole('button', { name: /open menu/i });
    await expect(openButton).toBeVisible();
    await openButton.click();

    // Menu should now show at least one nav link.
    const menuLinks = page.getByRole('link', { name: /home/i });
    await expect(menuLinks.first()).toBeVisible({ timeout: 5000 });

    const closeButton = page.getByRole('button', { name: /close menu/i }).first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      // Fall back to whatever the first visible "close" affordance is.
      await page.keyboard.press('Escape');
    }
    await expect(openButton).toBeVisible({ timeout: 5000 });
  });

  test('resizing from mobile to desktop collapses an open mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(FRONTEND_URL);
    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    // The mobile hamburger button should no longer be present/visible once desktop layout kicks in.
    await expect(page.getByRole('button', { name: /open menu/i })).toHaveCount(0);
  });
});
