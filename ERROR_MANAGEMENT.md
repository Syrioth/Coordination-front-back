# 🛡️ Stratégie de Gestion des Erreurs & Logs (Error Management)

Ce document définit la stratégie complète d'**Error Management** synchronisée entre le Front-End et le Back-End pour le projet **Cookie Clicker Web**. Elle répond à deux objectifs :
1. **Aider l'UX** : ne jamais laisser le joueur face à un écran blanc ou un message technique cryptique.
2. **Aider le Dev / Ops** : diagnostiquer rapidement un incident grâce à des erreurs verbeuses en `DEV`, des informations critiques offusquées en `PROD` et des logs structurés.

---

## ⚙️ 1. Modes d'Exécution : `DEV` vs `PROD`

Le comportement du serveur est piloté par la variable d'environnement `NODE_ENV` (`development` par défaut, `production` en déploiement).

| Aspect | Mode `DEV` (`NODE_ENV=development`) | Mode `PROD` (`NODE_ENV=production`) |
| :--- | :--- | :--- |
| **Message retourné au client** | Message détaillé + cause technique exacte | Message générique orienté utilisateur (ex. *« Une erreur interne est survenue »*) |
| **Stack trace dans la réponse HTTP** | ✅ Incluse (`error.stack`) | ❌ **Jamais exposée** (offusquée) |
| **Détails SQL / BDD / Validation** | ✅ Requête/champ fautif + erreur brute BDD | ❌ Masqués (seul un `requestId` est renvoyé pour le support) |
| **Logs serveur** | Console lisible + fichier de logs complet | JSON structuré (sans secrets, mots de passe ni tokens) |

---

## 📦 2. Format Standardisé des Réponses d'Erreur (Contrat API)

Toutes les erreurs retournées par l'API Express suivent le même schéma JSON afin de simplifier leur traitement côté Front-End :

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le solde de cookies réclamé est invalide.",
    "status": 400,
    "requestId": "req_1763558400_a1b2c3",
    "timestamp": "2026-11-19T14:00:00.000Z",
    "details": {
      "field": "cookiesClaimed",
      "reason": "Must be a non-negative number"
    }
  }
}
```
> En mode `PROD`, les champs sensibles (`stack`, erreurs brutes SQLite/ORM) sont systématiquement retirés de `details`.

---

## 🌐 3. Matrice des Codes HTTP & Effets Attendus

| Code HTTP | Code interne | Cas d'usage | Effet côté Back-End | Effet côté Front-End (UX) |
| :---: | :--- | :--- | :--- | :--- |
| **`400`** | `BAD_REQUEST` / `ANTI_CHEAT_FLAG` | Payload mal formé ou incrément de cookies suspect | Rejette la requête, log `WARN`, renvoie le solde serveur sain | Toast d'avertissement + resynchronisation sur l'état serveur |
| **`400`** | `INSUFFICIENT_BALANCE` | Achat boutique (`POST /api/shop/buy`) dont le coût dépasse le solde serveur | Rejette sans débiter, renvoie `serverCookies` et `required` | Bannière d'erreur, l'achat n'est pas appliqué |
| **`404`** | `NOT_FOUND` | Route API inexistante ou ressource (joueur/bâtiment) introuvable | Middleware 404 dédié, log `INFO`/`WARN` | Affichage d'un message clair « Ressource introuvable » ou écran 404 |
| **`409`** | `CONFLICT` | Doublon (ex. création d'un joueur déjà existant) | Rejette sans écraser la donnée, log `WARN` | Invite l'utilisateur à choisir un autre identifiant |
| **`422`** | `VALIDATION_ERROR` | Champs manquants ou types invalides lors d'un CRUD | Liste les champs invalides (sans crash), log `WARN` | Met en évidence le champ invalide dans le formulaire |
| **`500`** | `INTERNAL_SERVER_ERROR` / `DB_ERROR` | Crash inattendu ou erreur BDD/SQL | Intercepté par le middleware global d'erreurs, log `ERROR` avec stack | Bannière non bloquante + conservation de la partie en `localStorage` |
| **`503`** | `SERVICE_UNAVAILABLE` | Serveur ou BDD indisponible | Réponse santé dégradée | Passage automatique en **Mode hors-ligne** avec sauvegarde locale |

---

## 💻 4. Gestion des Erreurs côté Front-End

Les 3 grandes familles d'erreurs Front sont couvertes :

1. **Erreur sur un appel API (`fetch`)** :
   - Encapsulation dans un helper `apiRequest()` qui gère les timeouts, les coupures réseau (`TypeError: Failed to fetch`) et les statuts HTTP `4xx`/`5xx`.
   - Affichage dans un composant **Notification / Toast d'erreur** (non bloquant) + mise à jour du badge de synchronisation (`🟢 Synchronisé`, `⚪ Hors-ligne`, `🔴 Erreur serveur`).
   - En mode `DEV` (détecté via `localhost` ou `?debug=1`), possibilité d'afficher le détail technique (`code`, `requestId`, `status`) dans le toast / console.
2. **Crash JavaScript global** :
   - Écouteurs globaux `window.addEventListener('error', ...)` et `window.addEventListener('unhandledrejection', ...)`.
   - Sauvegarde d'urgence de la partie dans `localStorage` et affichage d'un bandeau de récupération avec bouton **« Recharger la partie »** pour éviter un écran figé.
3. **Erreur `404 Not Found`** :
   - Si l'utilisateur accède à une route/hash inconnue (ex. `#/page-inexistante`) ou si l'API renvoie `404`, affichage d'une vue/modale `404` dédiée avec un bouton de retour direct vers la boulangerie.

---

## 🔧 5. Gestion des Erreurs & Logs côté Back-End

1. **Classes d'erreurs métier (`AppError`)** :
   - Permet de distinguer les **erreurs opérationnelles** attendues (`400`, `404`, `409`, `422`) des **erreurs de programmation / crashs** (`500`).
2. **Erreurs BDD / SQL / ORM** :
   - Interceptées et mappées proprement (ex. contrainte `UNIQUE` → `409 Conflict`, erreur de requête/connexion → `500 DB_ERROR` avec message masqué en `PROD`).
3. **Middleware global d'erreurs Express (`errorHandler`)** :
   - Placé en dernière position après toutes les routes (et après le middleware `404`).
   - Garantit qu'aucune exception asynchrone ou synchrone ne fait tomber le serveur sans réponse JSON propre.
4. **Solution de Logs structurés** :
   - Logger dédié (`server/logger.js`) écrivant en **JSON structuré** (timestamp ISO, niveau `INFO` / `WARN` / `ERROR`, `requestId`, méthode, route, statut HTTP, durée en ms).
   - **Double sortie** : console (format lisible en `DEV`, JSON en `PROD`) + persistance dans `server/logs/app.log` et `server/logs/error.log`.
   - **Offuscation automatique** : les champs sensibles (`password`, `token`, `authorization`) sont automatiquement remplacés par `[REDACTED]`.

---

## 📋 6. Découpage en Tâches Jira (Affinage Fullstack)

| ID suggéré | Type | Couche | Titre de la tâche | Critères d'acceptation |
| :--- | :--- | :--- | :--- | :--- |
| `CK-ERR-1` | Task | Back | Créer le logger structuré + gestion `NODE_ENV` (`DEV`/`PROD`) | Logs JSON écrits dans `server/logs/`, secrets masqués, stack présente uniquement en `DEV`. |
| `CK-ERR-2` | Task | Back | Ajouter le middleware global d'erreurs + 404 + mapping erreurs BDD | Toute erreur API suit le contrat JSON standard, les routes inconnues renvoient `404`. |
| `CK-ERR-3` | Task | Front | Centraliser les appels API + composant Toast d'erreur UX | Erreurs réseau, `400`, `404`, `500` affichées proprement sans bloquer le jeu. |
| `CK-ERR-4` | Task | Front | Ajouter le filet de sécurité Crash JS (`window.onerror`) & vue `404` | Un crash JS affiche une bannière de récupération ; une route inconnue affiche une vue `404`. |
| `CK-ERR-5` | Task | QA | Écrire les tests unitaires & E2E sur les scénarios d'erreur | Couverture des cas `400`, `404`, `500` (mode DEV vs PROD) et fallback hors-ligne. |
