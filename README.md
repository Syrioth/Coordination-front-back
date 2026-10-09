# Cookie Clicker Web

Un jeu incrémental web multijoueur/connecté où les joueurs cliquent pour produire des cookies, achètent des améliorations et synchronisent leur progression en temps réel avec une sauvegarde persistante.

---

## 📌 Liens Utiles

- **Gestion de Projet (Board)** : [Lien vers votre Board GitHub Projects / Jira](https://vanomme.atlassian.net/jira/software/projects/SCRUM/boards/1?filter=&groupBy=none)
- **Guide de contribution & Workflow** : [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- **Vision Produit & Personas** : [`PRODUCT_VISION.md`](./PRODUCT_VISION.md)

---

## 📖 Contexte & Fonctionnalité Principale

### Contexte
Dans le cadre du module **Coordination Front/Back (Master M1)**, ce projet sert de preuve de concept (**POC**) et de socle pour les développements futurs. Il met en pratique la collaboration continue entre équipes Front-End et Back-End, la synchronisation d'état distribué, la sécurité des transactions côté serveur et la gestion agile en sprints.

### Fonctionnalité Principale (Core Gameplay Loop)
1. **Production manuelle** : Clic sur le cookie central générant des unités de cookie.
2. **Production passive** : Achat de bâtiments et d'améliorations générant des cookies par seconde (CPS).
3. **Synchronisation sécurisée** : Le serveur valide la cohérence temporelle et mathématique du score (anti-triche) et persiste la progression du joueur.
4. **Authentification** : Gestion des sessions utilisateurs pour reprendre sa partie sur n'importe quel poste.

---

## 🚀 Mise en Place du Projet (Installation & Démarrage)

### Prérequis
- **Node.js** : v20.x ou supérieure ([Télécharger Node.js](https://nodejs.org/))
- **npm** (inclus avec Node) ou **pnpm**
- **Git**

### Structure du Dépôt (Monorepo simplifié)
```text
.
├── client/          # Application Front-End (Vite + React / HTML/TS)
├── server/          # Serveur Back-End (Node.js + Express / Fastify)
├── CONTRIBUTING.md  # Gitflow, SemVer et gestion des tickets
├── PRODUCT_VISION.md# Personas et vision produit (Bonus)
└── README.md        # Documentation principale (ce fichier)
```

### 1. Cloner le Dépôt
```bash
git clone <URL_DU_REPO_GITHUB>
cd "Coordination front back"
```

### 2. Démarrage du Back-End
```bash
cd server
npm install
npm run dev
```
*Le serveur démarrera par défaut sur `http://localhost:3001` (endpoint de santé : `http://localhost:3001/api/health`).*

### 3. Démarrage du Front-End (dans un second terminal)
```bash
cd client
npm install
npm run dev
```
*L'application client sera accessible sur `http://localhost:5173`.*

---

## 📋 Architecture & Endpoints du POC

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Vérification de la disponibilité du serveur |
| `POST` | `/api/auth/register` | Inscription d'un joueur |
| `POST` | `/api/auth/login` | Connexion et émission d'un token JWT |
| `GET` | `/api/game/state` | Récupération de l'état de sauvegarde du joueur |
| `POST` | `/api/game/sync` | Synchronisation et validation du solde de cookies |
| `POST` | `/api/shop/buy` | Achat d'un bâtiment / upgrade validé côté serveur |

---

## 🛠️ Normes & Qualité de Code

- **Linter / Formatter** : ESLint & Prettier
- **Tests** :
  - Front : `npm test` dans `client/`
  - Back : `npm test` dans `server/`
- Avant toute Pull Request, s'assurer que le projet compile sans avertissement bloquant.
