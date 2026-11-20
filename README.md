# 🍪 Cookie Clicker Web — La petite boulangerie

Un jeu incrémental web connecté (Front Vite + Back Express / SQLite) où les joueurs produisent des cookies, débloquent des bâtiments, des recettes secrètes et des succès, tout en synchronisant leur progression avec une API sécurisée anti-triche.

---

## 👋 Nouveau sur le projet ? (Intégration Stagiaire / Développeur)

Si vous rejoignez le projet pour développer et merger une **feature fullstack**, suivez ce parcours rapide (guide détaillé dans [`ONBOARDING.md`](./ONBOARDING.md)) :

1. **Prenez connaissance du contexte** :
   - **Board Jira** : [Accéder au Board SCRUM](https://vanomme.atlassian.net/jira/software/projects/SCRUM/boards/1?filter=&groupBy=none)
   - **Personas & contraintes UI** : [`PERSONAS.md`](./PERSONAS.md) *(notamment l'écran CRT **800×600** et **Stats/Gamification**)*
   - **Design System & Composants Front** : [`FRONTEND_COMPONENTS_LADLE.md`](./FRONTEND_COMPONENTS_LADLE.md) (`npm run ladle` dans `client/`)
   - **Gestion des erreurs & Logs** : [`ERROR_MANAGEMENT.md`](./ERROR_MANAGEMENT.md) *(mode `DEV` vs `PROD`, `AppError`, bannière UX)*
   - **API Back-End (Swagger)** : [`http://localhost:3001/api-docs`](http://localhost:3001/api-docs) *(fichiers [`server/swagger.json`](./server/swagger.json) & [`server/postman_collection.json`](./server/postman_collection.json))*
   - **Workflow Git & PR** : [`CONTRIBUTING.md`](./CONTRIBUTING.md)

2. **Lancez le projet en local** (voir [Installation & Démarrage](#-installation--démarrage-local) ci-dessous).

3. **Créez votre branche depuis `master`** :
   ```bash
   git checkout master
   git pull origin master
   git checkout -b feature/<ID-TICKET>-<description-courte>
   ```

4. **Développez votre feature Fullstack aux bons endroits** :
   - **Back-End (`server/`)** :
     - Ajoutez vos routes dans [`server/app.js`](./server/app.js) (utilisez `AppError` de [`server/errors.js`](./server/errors.js) pour toute erreur métier).
     - Si la BDD évolue, ajoutez une migration SQL numérotée dans `server/migrations/` (ex. `002_ma_migration.sql`).
     - Mettez à jour [`server/swagger.json`](./server/swagger.json) et ajoutez vos tests dans `server/tests/`.
   - **Front-End (`client/`)** :
     - Intégrez votre UI dans [`client/index.html`](./client/index.html) en respectant la palette du design system (`--panel`, `--accent`, `--line`), la compatibilité **800×600** et la bannière d'erreur (`showErrorBanner`).
     - Documentez vos nouveaux composants/états dans [`client/src/components.stories.jsx`](./client/src/components.stories.jsx) (Ladle).
     - Ajoutez vos tests unitaires (`client/tests/unit.test.mjs`) et/ou E2E (`client/tests/e2e.spec.mjs`).

5. **Validez localement avant d'ouvrir votre Pull Request** :
   ```bash
   # Back-End
   cd server && npm run lint && npm test

   # Front-End
   cd ../client && npm run lint && npm test && npm run build
   # Optionnel en local (exécuté automatiquement en CI) :
   npm run test:e2e
   ```

6. **Ouvrez votre Pull Request vers `master`** :
   - Titre préfixé du ticket : `[CK-XXX] Description claire de la feature`.
   - Commits au format **Conventional Commits** (`feat(scope): ...`, `fix(scope): ...`).
   - Vérifiez que tous les checks GitHub Actions (`.github/workflows/ci.yml`) sont **au vert** et demandez une **Code Review** (au moins 1 approbation requise).
   - *Note : le dossier `.github/` est protégé par [`CODEOWNERS`](./.github/CODEOWNERS).*

---

## 📚 Index de la Documentation

| Document | Rôle |
| :--- | :--- |
| [`ONBOARDING.md`](./ONBOARDING.md) | Guide pas à pas « Day 1 » (accès, outils, premier ticket, contacts) |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Stratégie de branches, SemVer, Conventional Commits et règles de PR |
| [`PERSONAS.md`](./PERSONAS.md) | Vision produit et 3 personas (CRT 800×600, Stats/Gamification, Custom) |
| [`STORYMAP.md`](./STORYMAP.md) | Parcours utilisateur et découpage par releases (MVP, V1, V2) |
| [`FEATURES_DOCUMENTATION.md`](./FEATURES_DOCUMENTATION.md) | Spécifications fonctionnelles, formules CPS et anti-triche |
| [`ERROR_MANAGEMENT.md`](./ERROR_MANAGEMENT.md) | Stratégie d'erreurs UX/Dev, codes HTTP, mode `DEV`/`PROD` et logs |
| [`FRONTEND_COMPONENTS_LADLE.md`](./FRONTEND_COMPONENTS_LADLE.md) | Catalogue des composants UI isolés sous Ladle |

---

## 🚀 Installation & Démarrage Local

### Prérequis
- **Node.js** : **v22.5+** (recommandé : **v22 LTS** ou **v24**) — requis pour `node:sqlite` et `node --test`
- **npm** (inclus avec Node.js)
- **Git** (≥ 2.30)
- **Docker** *(optionnel, pour lancer toute la stack via Docker Compose)*

### 1. Cloner le dépôt
```bash
git clone https://github.com/Syrioth/Coordination-front-back.git
cd Coordination-front-back
```

### 2. Démarrer le Back-End (Terminal 1)
```bash
cd server
npm install
npm run dev
```
- API : `http://localhost:3001`
- Santé : `http://localhost:3001/api/health`
- Swagger UI : `http://localhost:3001/api-docs`
- Base SQLite créée automatiquement dans `server/data/cookie-clicker.sqlite` (migrations appliquées au démarrage).

### 3. Démarrer le Front-End (Terminal 2)
```bash
cd client
npm install
npm run dev
```
- Application : `http://localhost:5173`
- Catalogue Ladle (composants UI) : `npm run ladle` → `http://localhost:61000`

### Variables d'environnement utiles (`server/`)
| Variable | Défaut | Description |
| :--- | :--- | :--- |
| `PORT` | `3001` | Port d'écoute du serveur Express |
| `NODE_ENV` | `development` | `development` (erreurs détaillées + stack) ou `production` (erreurs 500 offusquées) |
| `DB_PATH` | `server/data/cookie-clicker.sqlite` | Chemin de la base SQLite (`:memory:` en test) |

---

## 🗂️ Structure du Dépôt

```text
.
├── .github/
│   ├── CODEOWNERS               # Protection des règles CI/CD
│   └── workflows/ci.yml         # Pipeline CI (docs, lint, tests unitaires, build, E2E)
├── client/                      # Front-End (Vite + Ladle + Playwright)
│   ├── index.html               # Application Cookie Clicker (design system, 800x600, stats, 404)
│   ├── src/components.stories.jsx # Stories Ladle des composants UI
│   ├── tests/                   # Tests unitaires (unit.test.mjs) & E2E (e2e.spec.mjs)
│   ├── Dockerfile & nginx.conf  # Conteneurisation production Front
│   └── package.json
├── server/                      # Back-End (Node.js + Express + SQLite natif)
│   ├── server.js                # Point d'entrée HTTP & graceful shutdown
│   ├── app.js                   # Routes REST, CRUD joueurs, sync anti-triche
│   ├── db.js                    # Connexion SQLite & runner de migrations
│   ├── migrations/001_init.sql  # Schéma initial de la base de données
│   ├── errors.js                # AppError, mapping SQL, 404 & middleware global DEV/PROD
│   ├── logger.js                # Logs JSON structurés (console + fichiers) avec redaction
│   ├── swagger.json             # Spécification OpenAPI 3.0
│   ├── postman_collection.json  # Collection Postman prête à l'emploi
│   ├── tests/api.test.js        # Tests unitaires & API (node:test)
│   ├── Dockerfile               # Conteneurisation production Back
│   └── package.json
├── docker-compose.yml           # Orchestration complète (depends_on, healthchecks, limites CPU/RAM)
└── *.md                         # Documentation projet (README, ONBOARDING, PERSONAS, etc.)
```

---

## 📋 Endpoints de l'API

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Vérification de la disponibilité du serveur et de la BDD SQLite |
| `GET` | `/api/game/state` | Récupération de l'état de sauvegarde du joueur (`?playerId=...`) |
| `POST` | `/api/game/sync` | Synchronisation et validation anti-triche du solde et des stats |
| `GET` | `/api/shop/items` | Catalogue des 12 générateurs de la boutique (table `shop_items`) |
| `POST` | `/api/shop/buy` | Achat d'un générateur validé côté serveur (solde, prix actualisé, historique `purchases`) |
| `GET` / `POST` | `/api/players` | Liste (classement) et création de profils joueurs (CRUD) |
| `GET` / `PUT` / `DELETE` | `/api/players/:id` | Consultation, mise à jour et suppression d'un profil joueur (CRUD) |
| `GET` | `/api/debug/crash` | Simulation d'un crash applicatif (`500`, mode `DEV` vs `PROD`) |
| `GET` | `/api/debug/db-error` | Simulation d'une erreur SQLite (`500`, mode `DEV` vs `PROD`) |

---

## 🐳 Orchestration (Docker Compose)

Pour lancer toute la stack (`server` + `client` Nginx) avec `healthcheck`, `depends_on` (`condition: service_healthy`) et limites CPU/RAM :
```bash
docker compose up --build
```
- **Client** : `http://localhost:8080`
- **API & Swagger** : `http://localhost:3001/api-docs`

---

## ✅ Tests & CI/CD

| Couche | Commande | Couverture |
| :--- | :--- | :--- |
| **Back-End** | `cd server && npm run lint && npm test` | Health, shop, sync anti-triche, CRUD `/api/players`, 404/409/422, crash & DB error `DEV` vs `PROD`, masquage des logs |
| **Front-End (Unit)** | `cd client && npm run lint && npm test` | Formules de prix/CPS et contrat DOM (personas & error handling) |
| **Front-End (Build)** | `cd client && npm run build` | Build de production Vite (`dist/`) |
| **Front-End (E2E)** | `cd client && npm run test:e2e` | Clic, achat, stats, viewport CRT **800×600** sans scroll horizontal, vue **404** |

La pipeline [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) exécute l'ensemble de ces vérifications automatiquement à chaque `push` et `pull_request`.
