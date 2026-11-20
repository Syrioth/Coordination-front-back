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

  test('Shop: purchase confirmed by the server updates CPS and sync badge', async ({ page }) => {
    let buyPayload = null;
    await page.route('**/api/game/sync', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'synced' }) })
    );
    await page.route('**/api/shop/buy', route => {
      buyPayload = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'purchased', itemId: 'cursor', quantity: 1, totalCost: 15, inventory: { cursor: 1 } })
      });
    });

    await page.goto('/');
    for (let i = 0; i < 15; i += 1) {
      await page.locator('#click-btn').click();
    }
    await page.locator('[data-building="cursor"]').click();

    await expect(page.locator('#cps-rate')).toHaveText('1');
    await expect(page.locator('#cookie-count')).toHaveText('0');
    await expect(page.locator('#sync-status')).toContainText('Achat validé par le serveur');
    expect(buyPayload).toEqual({ itemId: 'cursor', quantity: 1 });
  });

  test('Shop: purchase refused by the server is not applied and shows the error banner', async ({ page }) => {
    await page.route('**/api/game/sync', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'synced' }) })
    );
    await page.route('**/api/shop/buy', route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'INSUFFICIENT_BALANCE', message: 'Solde de cookies insuffisant pour cet achat.', status: 400 }
        })
      })
    );

    await page.goto('/');
    for (let i = 0; i < 15; i += 1) {
      await page.locator('#click-btn').click();
    }
    await page.locator('[data-building="cursor"]').click();

    await expect(page.locator('#error-banner')).toBeVisible();
    await expect(page.locator('#error-banner-text')).toContainText('Solde de cookies insuffisant');
    await expect(page.locator('#cps-rate')).toHaveText('0');
    await expect(page.locator('#stat-buildings')).toHaveText('0');
  });

  test('Cookie click shows a floating +N feedback, skipped in compact 800x600 mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('#click-btn').click();
    const float = page.locator('.cookie-wrap .click-float').first();
    await expect(float).toHaveText('+1');
    await expect(page.locator('.cookie-wrap .click-float')).toHaveCount(0, { timeout: 3000 });

    await page.locator('#toggle-crt').click();
    await page.locator('#click-btn').click();
    await expect(page.locator('#cookie-count')).toHaveText('2');
    await expect(page.locator('.cookie-wrap .click-float')).toHaveCount(0);
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
