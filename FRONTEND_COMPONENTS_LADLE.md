# 🎨 Documentation Front-End & Catalogue de Composants (Ladle / Storybook)

Ce document décrit l'architecture des composants de l'interface utilisateur (UI), leur isolation et la mise en place d'un catalogue interactif de composants avec **Ladle** (alternative ultra-rapide à Storybook basée sur Vite).

---

## ⚡ Pourquoi Ladle ?
- **Performance** : Démarrage instantané et Hot Module Reload (HMR) propulsé nativement par Vite.
- **Zéro configuration complexe** : Compatible immédiatement avec les fichiers `.stories.tsx` ou `.stories.jsx`.
- **Légèreté** : Plus léger et rapide que Storybook pour un POC et des itérations en sprint.

---

## 🚀 Lancement de la Documentation des Composants

Depuis le dossier `client/` :
```bash
cd client
npm run ladle
```
*Le catalogue interactif s'ouvrira sur `http://localhost:61000`.*

---

## 🧱 Catalogue des Composants Clés

### 1. `BigCookie` (`BigCookie.stories.jsx`)
* **Rôle** : Composant central cliquable avec animation de rebond et spawn de texte flottant (`+1`).
* **États documentés** :
  - *Default* : Cookie au repos.
  - *Active / Pressed* : Scale réduit (0.92) au clic.
  - *Disabled* : Désactivé si une synchronisation bloquante est en cours.
* **Props / Paramètres** :
  - `onClick: () => void`
  - `disabled: boolean`
  - `size: 'sm' | 'md' | 'lg'`

### 2. `Counter` (`Counter.stories.jsx`)
* **Rôle** : Affichage haute visibilité du solde de cookies et du taux de CPS.
* **États documentés** :
  - *Zero* : 0 cookies, 0 CPS.
  - *Mid Game* : 14 520 cookies, 32.5 CPS (formatage avec séparateurs de milliers).
  - *End Game* : 1 200 000 000 cookies (formatage compact `1.2M` ou notation scientifique).

### 3. `ShopItemCard` (`ShopItemCard.stories.jsx`)
* **Rôle** : Carte d'un générateur/bâtiment de la boutique.
* **États documentés** :
  - *Affordable* : Solde suffisant, bouton actif et surbrillance colorée.
  - *Locked / Unaffordable* : Solde insuffisant, bouton grisé et opacité réduite.
  - *Maxed / Purchased* : Affichage de la quantité possédée et coût actualisé ($+15\%$).
* **Props / Paramètres** :
  - `name: string`
  - `baseCost: number`
  - `currentCost: number`
  - `cpsBonus: number`
  - `count: number`
  - `canAfford: boolean`
  - `onBuy: () => void`

### 4. `SyncStatusBadge` (`SyncStatusBadge.stories.jsx`)
* **Rôle** : Badge discret informant le joueur de l'état de la connexion serveur.
* **États documentés** :
  - *Synced (Vert)* : `🟢 Synchronisé avec le serveur (14:30:12)`.
  - *Offline (Gris)* : `⚪ Mode hors-ligne (serveur local non détecté)`.
  - *Warning / Anti-cheat (Rouge)* : `⚠️ Alerte de synchronisation serveur (HTTP 400)`.
