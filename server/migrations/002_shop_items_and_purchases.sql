-- SCRUM-13 : catalogue de la boutique en base + historique des achats validés côté serveur

CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_cost REAL NOT NULL CHECK (base_cost > 0),
  base_cps REAL NOT NULL CHECK (base_cps >= 0),
  cost_multiplier REAL NOT NULL DEFAULT 1.1 CHECK (cost_multiplier >= 1),
  sort_order INTEGER NOT NULL
);

INSERT OR IGNORE INTO shop_items (id, name, base_cost, base_cps, cost_multiplier, sort_order) VALUES
  ('cursor', 'Curseur', 15, 1, 1.1, 1),
  ('grandma', 'Grand-mère', 100, 5, 1.1, 2),
  ('farm', 'Ferme', 500, 20, 1.1, 3),
  ('factory', 'Usine', 3000, 100, 1.1, 4),
  ('portal', 'Portail pâtissier', 12000, 500, 1.1, 5),
  ('bakery', 'Boulangerie', 75000, 2500, 1.1, 6),
  ('mine', 'Mine de sucre', 500000, 12000, 1.1, 7),
  ('lab', 'Laboratoire', 4000000, 60000, 1.1, 8),
  ('dimension', 'Fissure dimensionnelle', 35000000, 300000, 1.1, 9),
  ('galaxy', 'Galaxie gourmande', 500000000, 2000000, 1.1, 10),
  ('time-oven', 'Four temporel', 7000000000, 15000000, 1.1, 11),
  ('multiverse', 'Multivers pâtissier', 120000000000, 100000000, 1.1, 12);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES shop_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_cost REAL NOT NULL CHECK (total_cost >= 0),
  purchased_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_player ON purchases (player_id);
