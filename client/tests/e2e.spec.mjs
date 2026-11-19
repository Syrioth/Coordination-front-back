import { test, expect } from '@playwright/test';

test.describe('Cookie Clicker E2E — Gameplay, Personas & Error Handling', () => {
  test('clicking cookie updates counter, stats and allows buying a Cursor', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#cookie-count')).toHaveText('0');

    const cookieBtn = page.locator('#click-btn');
    for (let i = 0; i < 15; i += 1) {
      await cookieBtn.click();
    }

    await expect(page.locator('#cookie-count')).toHaveText('15');
    await expect(page.locator('#stat-clicks')).toHaveText('15');
    await expect(page.locator('#achievement-count')).toContainText('1 / 12');

    // Buy 1 Cursor (cost: 15)
    const buyCursor = page.locator('[data-building="cursor"]');
    await expect(buyCursor).toBeEnabled();
    await buyCursor.click();

    await expect(page.locator('#cps-rate')).toHaveText('1');
    await expect(page.locator('#stat-buildings')).toHaveText('1');
  });

  test('Persona Bernard (CRT 800x600): no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/');

    const crtToggle = page.locator('#toggle-crt');
    await crtToggle.click();
    await expect(crtToggle).toHaveAttribute('aria-pressed', 'true');

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('Error Handling Front: unknown hash route displays 404 view and returns home', async ({ page }) => {
    await page.goto('/#/page-inexistante');
    await expect(page.locator('#not-found-view')).toBeVisible();
    await expect(page.locator('#not-found-title')).toContainText('404');

    await page.locator('#back-home').click();
    await expect(page.locator('#not-found-view')).toBeHidden();
    await expect(page.locator('#game-view')).toBeVisible();
  });
});
