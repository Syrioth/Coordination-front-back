const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Simulation de base de données en mémoire pour le POC
let mockPlayerState = {
  playerId: 'player-default',
  cookies: 0,
  cookiesPerSecond: 0,
  lastSyncTimestamp: Date.now(),
  inventory: {
    cursor: 0,
    grandma: 0
  }
};

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Récupération de l'état du joueur
app.get('/api/game/state', (req, res) => {
  res.json(mockPlayerState);
});

// Synchronisation avec vérification de cohérence (Anti-cheat basique)
app.post('/api/game/sync', (req, res) => {
  const { cookiesClaimed, clientTimestamp } = req.body;
  const now = Date.now();
  const timeDeltaSec = Math.max(0, (now - mockPlayerState.lastSyncTimestamp) / 1000);

  // Marge d'erreur / tolérance de clics manuels max (ex: 20 clics/sec)
  const maxPossibleGain = (mockPlayerState.cookiesPerSecond * timeDeltaSec) + (20 * timeDeltaSec);

  if (cookiesClaimed - mockPlayerState.cookies > maxPossibleGain && mockPlayerState.cookies > 0) {
    return res.status(400).json({
      error: 'Suspicious balance increment detected (Anti-cheat flag)',
      serverCookies: mockPlayerState.cookies
    });
  }

  mockPlayerState.cookies = Number(cookiesClaimed) || 0;
  mockPlayerState.lastSyncTimestamp = now;

  return res.json({
    status: 'synced',
    cookies: mockPlayerState.cookies,
    serverTimestamp: now
  });
});

app.listen(PORT, () => {
  console.log(`[CookieClicker API] Server running on http://localhost:${PORT}`);
});
