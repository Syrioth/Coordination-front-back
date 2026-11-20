const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./swagger.json');
const { getDb, formatPlayerRow } = require('./db');
const { requestLogger } = require('./logger');
const { AppError, notFoundHandler, errorHandler } = require('./errors');

const MAX_PURCHASE_QUANTITY = 1000;

function formatShopItem(row) {
  return {
    id: row.id,
    name: row.name,
    baseCost: row.base_cost,
    baseCps: row.base_cps,
    costMultiplier: row.cost_multiplier
  };
}

function getShopItems(db) {
  return db.prepare('SELECT * FROM shop_items ORDER BY sort_order').all().map(formatShopItem);
}

// Prix de chaque unité arrondi à l'entier supérieur, comme côté Front :
// prix(n) = ceil(baseCost × costMultiplier^n), n = quantité déjà possédée
function computePurchaseCost(item, owned, quantity) {
  let total = 0;
  for (let index = 0; index < quantity; index += 1) {
    total += Math.ceil(item.baseCost * Math.pow(item.costMultiplier, owned + index));
  }
  return total;
}

function isValidInventory(inventory) {
  if (!inventory || typeof inventory !== 'object' || Array.isArray(inventory)) return false;
  return Object.values(inventory).every(count => Number.isSafeInteger(count) && count >= 0);
}

function toSaveState(player) {
  return {
    cookies: player.cookies,
    cookiesPerSecond: player.cookiesPerSecond,
    totalProduced: player.totalProduced,
    clicks: player.clicks,
    inventory: player.inventory,
    achievements: player.achievements,
    lastSyncTimestamp: player.lastSyncTimestamp
  };
}

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  // Documentation interactive OpenAPI / Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Route de santé
  app.get('/api/health', (req, res, next) => {
    try {
      const db = getDb();
      db.prepare('SELECT 1 AS ok').get();
      res.json({
        status: 'ok',
        env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        db: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  });

  // Catalogue des bâtiments (table shop_items)
  app.get('/api/shop/items', (req, res, next) => {
    try {
      res.json(getShopItems(getDb()));
    } catch (err) {
      next(err);
    }
  });

  // Achat d'un bâtiment validé côté serveur (solde, prix actualisé, historique)
  app.post('/api/shop/buy', (req, res, next) => {
    try {
      const { playerId = 'player-default', itemId, quantity = 1 } = req.body || {};

      if (typeof itemId !== 'string' || !itemId.trim()) {
        return next(
          new AppError('Le champ itemId est obligatoire.', 422, 'VALIDATION_ERROR', { field: 'itemId' })
        );
      }
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_PURCHASE_QUANTITY) {
        return next(
          new AppError(
            `Le champ quantity doit être un entier entre 1 et ${MAX_PURCHASE_QUANTITY}.`,
            422,
            'VALIDATION_ERROR',
            { field: 'quantity', received: quantity }
          )
        );
      }

      const db = getDb();
      const itemRow = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId);
      if (!itemRow) {
        return next(new AppError(`Bâtiment '${itemId}' introuvable.`, 404, 'NOT_FOUND'));
      }
      const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
      if (!player) {
        return next(new AppError(`Joueur '${playerId}' introuvable.`, 404, 'NOT_FOUND'));
      }

      const item = formatShopItem(itemRow);
      const inventory = JSON.parse(player.inventory_json || '{}');
      const owned = Number.isSafeInteger(inventory[item.id]) && inventory[item.id] > 0 ? inventory[item.id] : 0;
      const totalCost = computePurchaseCost(item, owned, quantity);

      if (player.cookies < totalCost) {
        return next(
          new AppError('Solde de cookies insuffisant pour cet achat.', 400, 'INSUFFICIENT_BALANCE', {
            serverCookies: player.cookies,
            required: totalCost
          })
        );
      }

      const nextInventory = { ...inventory, [item.id]: owned + quantity };
      const nextCookies = player.cookies - totalCost;
      const nextCps = player.cookies_per_second + item.baseCps * quantity;
      const nowIso = new Date().toISOString();

      db.exec('BEGIN');
      try {
        db.prepare(
          `UPDATE players
           SET cookies = ?, cookies_per_second = ?, inventory_json = ?, updated_at = ?
           WHERE id = ?`
        ).run(nextCookies, nextCps, JSON.stringify(nextInventory), nowIso, playerId);
        db.prepare(
          `INSERT INTO purchases (player_id, item_id, quantity, total_cost, purchased_at)
           VALUES (?, ?, ?, ?, ?)`
        ).run(playerId, item.id, quantity, totalCost, nowIso);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }

      return res.json({
        status: 'purchased',
        playerId,
        itemId: item.id,
        quantity,
        totalCost,
        cookies: nextCookies,
        cookiesPerSecond: nextCps,
        inventory: nextInventory,
        nextCost: computePurchaseCost(item, owned + quantity, 1)
      });
    } catch (err) {
      return next(err);
    }
  });

  // État du joueur courant (par défaut player-default)
  app.get('/api/game/state', (req, res, next) => {
    try {
      const playerId = req.query.playerId || 'player-default';
      const db = getDb();
      const row = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
      if (!row) {
        return next(new AppError(`Joueur '${playerId}' introuvable.`, 404, 'NOT_FOUND'));
      }
      return res.json(formatPlayerRow(row));
    } catch (err) {
      return next(err);
    }
  });

  // Synchronisation avec validation & contrôle anti-triche
  app.post('/api/game/sync', (req, res, next) => {
    try {
      const {
        playerId = 'player-default',
        cookiesClaimed,
        cookiesPerSecond = 0,
        totalProduced,
        clicks,
        inventory,
        achievements
      } = req.body || {};

      if (typeof cookiesClaimed !== 'number' || !Number.isFinite(cookiesClaimed) || cookiesClaimed < 0) {
        return next(
          new AppError(
            'Le champ cookiesClaimed doit être un nombre positif.',
            422,
            'VALIDATION_ERROR',
            { field: 'cookiesClaimed', received: cookiesClaimed }
          )
        );
      }

      if (typeof cookiesPerSecond !== 'number' || !Number.isFinite(cookiesPerSecond) || cookiesPerSecond < 0) {
        return next(
          new AppError(
            'Le champ cookiesPerSecond doit être un nombre positif.',
            422,
            'VALIDATION_ERROR',
            { field: 'cookiesPerSecond', received: cookiesPerSecond }
          )
        );
      }

      if (inventory !== undefined && !isValidInventory(inventory)) {
        return next(
          new AppError(
            "L'inventaire doit être un objet { bâtiment: quantité entière positive }.",
            422,
            'VALIDATION_ERROR',
            { field: 'inventory' }
          )
        );
      }

      if (
        achievements !== undefined &&
        (!Array.isArray(achievements) || achievements.some(item => typeof item !== 'string'))
      ) {
        return next(
          new AppError('Le champ achievements doit être une liste de chaînes.', 422, 'VALIDATION_ERROR', {
            field: 'achievements'
          })
        );
      }

      const db = getDb();
      const row = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
      if (!row) {
        return next(new AppError(`Joueur '${playerId}' introuvable.`, 404, 'NOT_FOUND'));
      }

      const now = Date.now();
      const timeDeltaSec = Math.max(1, (now - row.last_sync_timestamp) / 1000);
      const effectiveCps = Math.max(row.cookies_per_second, cookiesPerSecond);
      const maxPossibleGain = effectiveCps * timeDeltaSec * 2 + 25 * timeDeltaSec + 50;

      if (cookiesClaimed - row.cookies > maxPossibleGain && row.cookies > 0) {
        return next(
          new AppError(
            'Incrément de cookies anormal détecté (contrôle anti-triche).',
            400,
            'ANTI_CHEAT_FLAG',
            {
              serverCookies: row.cookies,
              cookiesClaimed,
              maxAllowedGain: Math.round(maxPossibleGain),
              // Dernier état sain connu : le client s'y réaligne
              serverState: toSaveState(formatPlayerRow(row))
            }
          )
        );
      }

      const nextTotalProduced =
        typeof totalProduced === 'number' && Number.isFinite(totalProduced) && totalProduced >= 0
          ? totalProduced
          : Math.max(row.total_produced, cookiesClaimed);
      const nextClicks =
        Number.isSafeInteger(clicks) && clicks >= 0 ? clicks : row.clicks;
      const nextInventoryJson =
        inventory && typeof inventory === 'object' ? JSON.stringify(inventory) : row.inventory_json;
      const nextAchievementsJson = Array.isArray(achievements)
        ? JSON.stringify(achievements)
        : row.achievements_json;

      db.prepare(
        `UPDATE players
         SET cookies = ?, cookies_per_second = ?, total_produced = ?, clicks = ?,
             inventory_json = ?, achievements_json = ?, last_sync_timestamp = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        cookiesClaimed,
        cookiesPerSecond,
        nextTotalProduced,
        nextClicks,
        nextInventoryJson,
        nextAchievementsJson,
        now,
        new Date(now).toISOString(),
        playerId
      );

      return res.json({
        status: 'synced',
        playerId,
        cookies: cookiesClaimed,
        cookiesPerSecond,
        totalProduced: nextTotalProduced,
        clicks: nextClicks,
        serverTimestamp: now
      });
    } catch (err) {
      return next(err);
    }
  });

  // --- CRUD Joueurs (/api/players) ---

  // READ (liste + classement stats)
  app.get('/api/players', (req, res, next) => {
    try {
      const db = getDb();
      const rows = db.prepare('SELECT * FROM players ORDER BY total_produced DESC, cookies DESC').all();
      return res.json(rows.map(formatPlayerRow));
    } catch (err) {
      return next(err);
    }
  });

  // READ (un joueur)
  app.get('/api/players/:id', (req, res, next) => {
    try {
      const db = getDb();
      const row = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
      if (!row) {
        return next(new AppError(`Joueur '${req.params.id}' introuvable.`, 404, 'NOT_FOUND'));
      }
      return res.json(formatPlayerRow(row));
    } catch (err) {
      return next(err);
    }
  });

  // CREATE
  app.post('/api/players', (req, res, next) => {
    try {
      const { id, username, cookies = 0, cookiesPerSecond = 0 } = req.body || {};

      if (typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 40) {
        return next(
          new AppError(
            'Le pseudo (username) doit contenir entre 2 et 40 caractères.',
            422,
            'VALIDATION_ERROR',
            { field: 'username' }
          )
        );
      }

      if (typeof cookies !== 'number' || cookies < 0 || typeof cookiesPerSecond !== 'number' || cookiesPerSecond < 0) {
        return next(
          new AppError(
            'cookies et cookiesPerSecond doivent être des nombres positifs.',
            422,
            'VALIDATION_ERROR'
          )
        );
      }

      const playerId = (typeof id === 'string' && id.trim()) || `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = Date.now();
      const nowIso = new Date(now).toISOString();
      const db = getDb();

      db.prepare(
        `INSERT INTO players (
          id, username, cookies, cookies_per_second, total_produced, clicks,
          inventory_json, achievements_json, last_sync_timestamp, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        playerId,
        username.trim(),
        cookies,
        cookiesPerSecond,
        cookies,
        0,
        JSON.stringify({ cursor: 0, grandma: 0 }),
        JSON.stringify([]),
        now,
        nowIso,
        nowIso
      );

      const created = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
      return res.status(201).json(formatPlayerRow(created));
    } catch (err) {
      return next(err);
    }
  });

  // UPDATE
  app.put('/api/players/:id', (req, res, next) => {
    try {
      const db = getDb();
      const existing = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
      if (!existing) {
        return next(new AppError(`Joueur '${req.params.id}' introuvable.`, 404, 'NOT_FOUND'));
      }

      const { username, cookies, cookiesPerSecond, totalProduced, clicks, inventory, achievements } = req.body || {};

      if (username !== undefined && (typeof username !== 'string' || username.trim().length < 2)) {
        return next(new AppError('Le pseudo doit contenir au moins 2 caractères.', 422, 'VALIDATION_ERROR', { field: 'username' }));
      }
      if (cookies !== undefined && (typeof cookies !== 'number' || !Number.isFinite(cookies) || cookies < 0)) {
        return next(new AppError('cookies doit être un nombre positif.', 422, 'VALIDATION_ERROR', { field: 'cookies' }));
      }

      const nextUsername = username !== undefined ? username.trim() : existing.username;
      const nextCookies = cookies !== undefined ? cookies : existing.cookies;
      const nextCps = cookiesPerSecond !== undefined ? cookiesPerSecond : existing.cookies_per_second;
      const nextTotal = totalProduced !== undefined ? totalProduced : existing.total_produced;
      const nextClicks = clicks !== undefined ? clicks : existing.clicks;
      const nextInv = inventory !== undefined ? JSON.stringify(inventory) : existing.inventory_json;
      const nextAch = achievements !== undefined ? JSON.stringify(achievements) : existing.achievements_json;

      db.prepare(
        `UPDATE players
         SET username = ?, cookies = ?, cookies_per_second = ?, total_produced = ?,
             clicks = ?, inventory_json = ?, achievements_json = ?, updated_at = ?
         WHERE id = ?`
      ).run(nextUsername, nextCookies, nextCps, nextTotal, nextClicks, nextInv, nextAch, new Date().toISOString(), req.params.id);

      const updated = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
      return res.json(formatPlayerRow(updated));
    } catch (err) {
      return next(err);
    }
  });

  // DELETE
  app.delete('/api/players/:id', (req, res, next) => {
    try {
      if (req.params.id === 'player-default') {
        return next(new AppError('Le profil par défaut ne peut pas être supprimé.', 400, 'BAD_REQUEST'));
      }
      const db = getDb();
      const result = db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
      if (result.changes === 0) {
        return next(new AppError(`Joueur '${req.params.id}' introuvable.`, 404, 'NOT_FOUND'));
      }
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  });

  // Routes de démonstration Error Handling (crash code & erreur SQL)
  app.get('/api/debug/crash', () => {
    throw new Error('Crash serveur simulé pour démonstration Error Handling (DEV vs PROD)');
  });

  app.get('/api/debug/db-error', (req, res, next) => {
    try {
      const db = getDb();
      db.prepare('SELECT * FROM non_existent_table_for_demo').all();
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Middlewares finaux : 404 puis gestionnaire global d'erreurs
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp, computePurchaseCost };
