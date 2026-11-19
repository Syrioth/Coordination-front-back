import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function calculateBuildingCost(baseCost, owned, multiplier = 1.1) {
  return Math.ceil(baseCost * Math.pow(multiplier, owned));
}

function calculateCps(inventory, catalog, productionMultiplier = 1) {
  return (
    catalog.reduce((sum, item) => sum + (inventory[item.id] || 0) * item.cps, 0) *
    productionMultiplier
  );
}

describe('Client Unit Tests — Economy & DOM Contract', () => {
  it('computes exponential building cost accurately', () => {
    assert.equal(calculateBuildingCost(15, 0), 15);
    assert.equal(calculateBuildingCost(15, 1), 17);
    assert.equal(calculateBuildingCost(100, 0), 100);
    assert.ok(calculateBuildingCost(100, 2) > calculateBuildingCost(100, 1));
  });

  it('computes total CPS across buildings and multipliers', () => {
    const catalog = [
      { id: 'cursor', cps: 1 },
      { id: 'grandma', cps: 5 }
    ];
    assert.equal(calculateCps({ cursor: 3, grandma: 2 }, catalog, 1), 13);
    assert.equal(calculateCps({ cursor: 3, grandma: 2 }, catalog, 1.5), 19.5);
  });

  it('index.html exposes required persona & error handling elements', () => {
    assert.ok(indexHtml.includes('id="click-btn"'), 'Big cookie button present');
    assert.ok(indexHtml.includes('id="toggle-crt"'), '800x600 CRT mode toggle present');
    assert.ok(indexHtml.includes('id="stats-title"'), 'Stats panel present');
    assert.ok(indexHtml.includes('id="error-banner"'), 'Error banner present');
    assert.ok(indexHtml.includes('id="not-found-view"'), '404 Not Found view present');
  });
});
