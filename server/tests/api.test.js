const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase, closeDatabase, getDb } = require('../db');
const { createApp, computePurchaseCost } = require('../app');
const { redact } = require('../logger');

let server;
let baseUrl;

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, headers: res.headers, body };
}

describe('Cookie Clicker API — CRUD, Sync & Error Management', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DISABLE_FILE_LOGS = 'true';
    initDatabase(':memory:');
    const app = createApp();
    await new Promise(resolve => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise(resolve => server.close(resolve));
    closeDatabase();
  });

  it('GET /api/health returns ok and connected db', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.db, 'connected');
    assert.ok(res.headers.get('x-request-id'));
  });

  it('GET /api/shop/items returns 12 buildings', async () => {
    const res = await request('/api/shop/items');
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 12);
    assert.equal(res.body[0].id, 'cursor');
  });

  it('POST /api/game/sync persists valid cookies and rejects anti-cheat spikes', async () => {
    const okSync = await request('/api/game/sync', {
      method: 'POST',
      body: JSON.stringify({
        cookiesClaimed: 25,
        cookiesPerSecond: 1,
        totalProduced: 25,
        clicks: 25
      })
    });
    assert.equal(okSync.status, 200);
    assert.equal(okSync.body.status, 'synced');
    assert.equal(okSync.body.cookies, 25);

    const cheatSync = await request('/api/game/sync', {
      method: 'POST',
      body: JSON.stringify({
        cookiesClaimed: 999999999,
        cookiesPerSecond: 1
      })
    });
    assert.equal(cheatSync.status, 400);
    assert.equal(cheatSync.body.success, false);
    assert.equal(cheatSync.body.error.code, 'ANTI_CHEAT_FLAG');
  });

  it('POST /api/shop/buy deducts the up-to-date cost and records the purchase', async () => {
    const created = await request('/api/players', {
      method: 'POST',
      body: JSON.stringify({ username: 'LucasShopper', cookies: 100 })
    });
    const playerId = created.body.playerId;

    // 2 curseurs : 15 + ceil(15 × 1.1) = 15 + 17 = 32
    const bought = await request('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ playerId, itemId: 'cursor', quantity: 2 })
    });
    assert.equal(bought.status, 200);
    assert.equal(bought.body.status, 'purchased');
    assert.equal(bought.body.totalCost, 32);
    assert.equal(bought.body.cookies, 68);
    assert.equal(bought.body.cookiesPerSecond, 2);
    assert.equal(bought.body.inventory.cursor, 2);
    assert.equal(bought.body.nextCost, computePurchaseCost({ baseCost: 15, costMultiplier: 1.1 }, 2, 1));

    const state = await request(`/api/players/${playerId}`);
    assert.equal(state.body.cookies, 68);
    assert.equal(state.body.inventory.cursor, 2);

    const purchases = getDb()
      .prepare('SELECT item_id, quantity, total_cost FROM purchases WHERE player_id = ?')
      .all(playerId);
    assert.equal(purchases.length, 1);
    assert.equal(purchases[0].item_id, 'cursor');
    assert.equal(purchases[0].quantity, 2);
    assert.equal(purchases[0].total_cost, 32);
  });

  it('POST /api/shop/buy rejects insufficient balance, unknown item and invalid quantity', async () => {
    const created = await request('/api/players', {
      method: 'POST',
      body: JSON.stringify({ username: 'PoorBaker', cookies: 10 })
    });
    const playerId = created.body.playerId;

    const tooPoor = await request('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ playerId, itemId: 'cursor' })
    });
    assert.equal(tooPoor.status, 400);
    assert.equal(tooPoor.body.error.code, 'INSUFFICIENT_BALANCE');
    assert.equal(tooPoor.body.error.details.serverCookies, 10);
    assert.equal(tooPoor.body.error.details.required, 15);

    const unchanged = await request(`/api/players/${playerId}`);
    assert.equal(unchanged.body.cookies, 10);

    const unknownItem = await request('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ playerId, itemId: 'licorne' })
    });
    assert.equal(unknownItem.status, 404);
    assert.equal(unknownItem.body.error.code, 'NOT_FOUND');

    const badQuantity = await request('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ playerId, itemId: 'cursor', quantity: 0 })
    });
    assert.equal(badQuantity.status, 422);
    assert.equal(badQuantity.body.error.details.field, 'quantity');

    const missingItem = await request('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ playerId })
    });
    assert.equal(missingItem.status, 422);
    assert.equal(missingItem.body.error.details.field, 'itemId');
  });

  it('POST /api/game/sync saves the balance and returns the saved stats', async () => {
    const created = await request('/api/players', {
      method: 'POST',
      body: JSON.stringify({ username: 'SyncSaver' })
    });
    const playerId = created.body.playerId;

    const synced = await request('/api/game/sync', {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        cookiesClaimed: 42,
        cookiesPerSecond: 0,
        totalProduced: 57,
        clicks: 57,
        inventory: { cursor: 1, grandma: 0 },
        achievements: ['first-click']
      })
    });
    assert.equal(synced.status, 200);
    assert.equal(synced.body.cookies, 42);
    assert.equal(synced.body.totalProduced, 57);
    assert.equal(synced.body.clicks, 57);

    const state = await request(`/api/game/state?playerId=${playerId}`);
    assert.equal(state.status, 200);
    assert.equal(state.body.cookies, 42);
    assert.deepEqual(state.body.inventory, { cursor: 1, grandma: 0 });
    assert.deepEqual(state.body.achievements, ['first-click']);
  });

  it('POST /api/game/sync anti-cheat rejection returns the last sane server state', async () => {
    const created = await request('/api/players', {
      method: 'POST',
      body: JSON.stringify({ username: 'SneakyBaker', cookies: 30 })
    });
    const playerId = created.body.playerId;

    const cheat = await request('/api/game/sync', {
      method: 'POST',
      body: JSON.stringify({ playerId, cookiesClaimed: 5e9, cookiesPerSecond: 0 })
    });
    assert.equal(cheat.status, 400);
    assert.equal(cheat.body.error.code, 'ANTI_CHEAT_FLAG');
    const { serverState } = cheat.body.error.details;
    assert.equal(serverState.cookies, 30);
    assert.equal(typeof serverState.inventory, 'object');
    assert.ok(Array.isArray(serverState.achievements));

    const unchanged = await request(`/api/players/${playerId}`);
    assert.equal(unchanged.body.cookies, 30);
  });

  it('POST /api/game/sync rejects malformed inventory and achievements with 422', async () => {
    const badInventory = await request('/api/game/sync', {
      method: 'POST',
      body: JSON.stringify({ cookiesClaimed: 0, inventory: { cursor: -3 } })
    });
    assert.equal(badInventory.status, 422);
    assert.equal(badInventory.body.error.details.field, 'inventory');

    const arrayInventory = await request('/api/game/sync', {
      method: 'POST',
      body: JSON.stringify({ cookiesClaimed: 0, inventory: [1, 2] })
    });
    assert.equal(arrayInventory.status, 422);

    const badAchievements = await request('/api/game/sync', {
      method: 'POST',
      body: JSON.stringify({ cookiesClaimed: 0, achievements: 'first-click' })
    });
    assert.equal(badAchievements.status, 422);
    assert.equal(badAchievements.body.error.details.field, 'achievements');
  });

  it('POST /api/game/sync returns 422 on invalid payload', async () => {
    const res = await request('/api/game/sync', {
      method: 'POST',
      body: JSON.stringify({ cookiesClaimed: -10, cookiesPerSecond: 0 })
    });
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('CRUD /api/players supports create, conflict 409, read, update and delete', async () => {
    const created = await request('/api/players', {
      method: 'POST',
      body: JSON.stringify({ username: 'SarahAnalyst', cookies: 120, cookiesPerSecond: 5 })
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.username, 'SarahAnalyst');
    const id = created.body.playerId;

    // Duplicate username -> 409 Conflict
    const duplicate = await request('/api/players', {
      method: 'POST',
      body: JSON.stringify({ username: 'SarahAnalyst' })
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, 'CONFLICT');

    // Read
    const fetched = await request(`/api/players/${id}`);
    assert.equal(fetched.status, 200);
    assert.equal(fetched.body.cookies, 120);

    // Update
    const updated = await request(`/api/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ cookies: 500, clicks: 42 })
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.cookies, 500);
    assert.equal(updated.body.clicks, 42);

    // Delete
    const deleted = await request(`/api/players/${id}`, { method: 'DELETE' });
    assert.equal(deleted.status, 204);

    // 404 after delete
    const missing = await request(`/api/players/${id}`);
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.code, 'NOT_FOUND');
  });

  it('returns 404 JSON on unknown routes', async () => {
    const res = await request('/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('exposes stack/details in DEV and obfuscates 500/DB errors in PROD', async () => {
    process.env.NODE_ENV = 'development';
    const devCrash = await request('/api/debug/crash');
    assert.equal(devCrash.status, 500);
    assert.ok(devCrash.body.error.stack);

    const devDb = await request('/api/debug/db-error');
    assert.equal(devDb.status, 500);
    assert.equal(devDb.body.error.code, 'DB_ERROR');
    assert.ok(devDb.body.error.details.dbMessage);

    process.env.NODE_ENV = 'production';
    const prodCrash = await request('/api/debug/crash');
    assert.equal(prodCrash.status, 500);
    assert.equal(prodCrash.body.error.stack, undefined);
    assert.equal(prodCrash.body.error.details, undefined);

    const prodDb = await request('/api/debug/db-error');
    assert.equal(prodDb.status, 500);
    assert.equal(prodDb.body.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(prodDb.body.error.details, undefined);
    assert.equal(prodDb.body.error.stack, undefined);

    process.env.NODE_ENV = 'test';
  });

  it('logger redact masks sensitive fields', () => {
    const clean = redact({ username: 'lucas', password: 'secret', nested: { token: 'abc' } });
    assert.equal(clean.username, 'lucas');
    assert.equal(clean.password, '[REDACTED]');
    assert.equal(clean.nested.token, '[REDACTED]');
  });
});
