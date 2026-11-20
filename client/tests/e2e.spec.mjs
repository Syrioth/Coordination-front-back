import { test, expect } from '@playwright/test';

const SAVE_KEY = 'cookie-clicker-save-v2';
const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

test.describe('Cookie Clicker E2E — Gameplay, Personas & Error Handling', () => {
  // API injoignable par défaut (mode hors-ligne) : un back lancé en local ne fausse pas les tests.
  // Les routes déclarées dans un test sont prioritaires sur celle-ci.
  test.beforeEach(async ({ page }) => {
    await page.route('http://localhost:3001/**', route => route.abort('connectionrefused'));
  });

  test('New device: progress is restored from the server before the first sync', async ({ page }) => {
    const syncBodies = [];
    await page.route('**/api/game/state', route =>
      route.fulfill(json(200, {
        playerId: 'player-default',
        cookies: 500,
        cookiesPerSecond: 0,
        totalProduced: 800,
        clicks: 40,
        inventory: { cursor: 0 },
        achievements: ['first-click', 'hundred']
      }))
    );
    await page.route('**/api/game/sync', route => {
      syncBodies.push(route.request().postDataJSON());
      return route.fulfill(json(200, { status: 'synced' }));
    });

    await page.goto('/');

    await expect(page.locator('#cookie-count')).toHaveText('500');
    await expect(page.locator('#stat-clicks')).toHaveText('40');
    await expect(page.locator('#achievement-count')).toContainText('2 / 12');
    await expect(page.locator('#game-hint')).toContainText('récupérée depuis le serveur');
    await expect.poll(() => syncBodies.length).toBeGreaterThan(0);
    expect(syncBodies[0].cookiesClaimed).toBe(500);
  });

  test('Anti-cheat rejection realigns the local balance on the server state', async ({ page }) => {
    await page.addInitScript(key => {
      localStorage.setItem(key, JSON.stringify({ cookies: 999999999, totalProduced: 999999999, clicks: 3, savedAt: Date.now() }));
    }, SAVE_KEY);
    await page.route('**/api/game/sync', route =>
      route.fulfill(json(400, {
        success: false,
        error: {
          code: 'ANTI_CHEAT_FLAG',
          message: 'Incrément de cookies anormal détecté (contrôle anti-triche).',
          status: 400,
          details: {
            serverCookies: 120,
            serverState: { cookies: 120, totalProduced: 300, clicks: 3, inventory: { cursor: 0 }, achievements: [] }
          }
        }
      }))
    );

    await page.goto('/');

    await expect(page.locator('#cookie-count')).toHaveText('120');
    await expect(page.locator('#error-banner')).toBeVisible();
    await expect(page.locator('#error-banner-text')).toContainText('réaligné');
    await expect(page.locator('#sync-status')).toContainText('réaligné');
  });
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
