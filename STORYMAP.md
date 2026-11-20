# 🗺️ Story Map Utilisateur — Cookie Clicker Web

La **Story Map** structure la vision produit selon le parcours chronologique du joueur (*User Journey*) et priorise les fonctionnalités par tranches de livraison (**Releases / MVP**).

---

## 📌 Vue d'Ensemble de la Story Map

```
ACTIVITÉS JOUEUR    [ 1. Découverte & Setup ]   [ 2. Core Loop (Clic & Prod) ]   [ 3. Économie & Upgrades ]   [ 4. Sauvegarde & Compte ]   [ 5. Compétition & Endgame ]
                              │                               │                             │                             │                            │
ÉTAPES CLÉS (STEPS) ┌─────────┴──────────┐      ┌─────────────┴────────────┐   ┌────────────┴─────────────┐  ┌────────────┴────────────┐  ┌────────────┴─────────────┐
                    │ Arrivée / Onboarding│     │ Clic Manuel  │ Prod Auto │   │ Découverte │ Achat Bât.  │  │ Sauvegarde │ Compte/Auth│  │ Classement  │ Prestige    │
                    └────────────────────┘      └──────────────┴───────────┘   └────────────┴─────────────┘  └────────────┴────────────┘  └────────────┴─────────────┘
```

---

## 🚀 Tranches de Découpage par Releases

### 🟢 RELEASE 1 : MVP (Strict Minimum Jouable & Persistant)
*Objectif : Valider la boucle de base, la synchronisation serveur et la sauvegarde sans perte.*

| Activité | User Story (MVP) | Front-End | Back-End | Estimation |
| :--- | :--- | :--- | :--- | :--- |
| **1. Découverte** | En tant que nouveau joueur, je vois directement le bouton cookie et mon compteur pour commencer à jouer sans barrière. | Bouton cookie avec rebond CSS, compteur visible. | Endpoint `/api/health` et handshake initial. | 2 SP |
| **2. Core Loop** | En tant que joueur, je clique sur le cookie pour incrémenter mon solde de +1 à chaque clic. | Event listener de clic, feedback `+1` flottant. | Définition des règles de production. | 3 SP |
| **2. Core Loop** | En tant que joueur, ma production automatique tourne en arrière-plan à cadence régulière. | Boucle `setInterval` (100ms) fluide basée sur le CPS. | Modélisation du CPS serveur. | 3 SP |
| **3. Économie** | En tant que joueur, je peux acheter un premier générateur (Curseur) qui augmente mon CPS. | Bouton d'achat désactivé si solde insuffisant, calcul du prix $+15\%$. | Calcul et vérification de la déduction de solde. | 3 SP |
| **4. Sauvegarde** | En tant que joueur, mon solde est synchronisé avec le serveur pour éviter les pertes de données. | Heartbeat toutes les 10s vers `/api/game/sync` + sauvegarde `localStorage`. | Endpoint POST `/api/game/sync` avec contrôle anti-triche basique. | 5 SP |
| **5. Contraintes TD** | En tant que **Bernard (CRT 800×600)**, je joue confortablement sans scroll horizontal ni élément coupé. | Media queries `800×600`, mode compact et respect de `prefers-reduced-motion`. | Payloads API légers. | 3 SP |
| **5. Contraintes TD** | En tant que **Sarah (Stats/Gamification)**, je consulte mes statistiques clés, mes objectifs et mes 12 succès. | Barre d'objectifs, panneau « Petites victoires », panneau statistiques en temps réel. | Persistance des stats, inventaire et succès via CRUD `/api/players`. | 5 SP |
| **6. Error Handling** | En tant que joueur et développeur, les erreurs API, JS, BDD et 404 sont gérées clairement selon le mode `DEV`/`PROD`. | Helper API, toasts UX, fallback crash JS (`window.onerror`), vue `404`. | Middleware global Express, `AppError`, logs JSON structurés (`DEV` vs `PROD`). | 5 SP |

---

### 🟡 RELEASE 2 : V1 (Engagement, Progression & Identité)
*Objectif : Permettre au joueur de retrouver sa partie sur plusieurs postes et enrichir la boutique.*

| Activité | User Story (V1) | Front-End | Back-End | Estimation |
| :--- | :--- | :--- | :--- | :--- |
| **1. Découverte** | En tant que nouveau joueur, je bénéficie d'une infobulle guidée (tour d'onboarding) pour comprendre la boutique. | Modal / Tooltips guidés pour le 1er achat à 15 cookies. | Flag `hasCompletedOnboarding` dans le profil. | 3 SP |
| **3. Économie** | En tant que joueur, j'accède à 5 types de bâtiments différents (Grand-mère, Ferme, Mine, Usine). | Liste d'items défilante avec icônes et multiplicateurs. | Table/catalogue des items en base de données. | 5 SP |
| **4. Compte** | En tant que joueur, je crée un compte et me connecte pour sécuriser ma partie sous mon pseudo. | Formulaire Register / Login réactif avec gestion de token JWT. | Routes POST `/api/auth/register` et `/api/auth/login` (bcrypt + JWT). | 5 SP |
| **4. Compte** | En tant que joueur, je charge automatiquement ma progression dès que je me connecte. | Hook React/JS de chargement d'état au mount de l'app. | Route GET `/api/game/state` sécurisée par middleware JWT. | 3 SP |

---

### 🟣 RELEASE 3 : V2 (Rétention, Compétition & Endgame)
*Objectif : Répondre aux attentes des joueurs complétionnistes et compétiteurs.*

| Activité | User Story (V2) | Front-End | Back-End | Estimation |
| :--- | :--- | :--- | :--- | :--- |
| **5. Compétition** | En tant que joueur, je consulte le classement des 50 meilleurs joueurs pour me situer. | Écran Leaderboard avec filtres (score global, clics). | Endpoint GET `/api/leaderboard` avec pagination et cache Redis. | 5 SP |
| **5. Endgame** | En tant que joueur, je débloque des succès (Achievements) avec des notifications visuelles gratifiantes. | Composant Toast de succès et panneau des badges (débloqués / masqués). | Moteur de règles d'achievements déclenché à la synchronisation. | 5 SP |
| **5. Endgame** | En tant que joueur avancé, je peux faire une "Ascension" (Prestige) pour redémarrer avec un bonus permanent de +10% CPS. | Modal de confirmation d'ascension et affichage du rang de prestige. | Logique de reset avec persistance des jetons de prestige. | 8 SP |

---

## 🎯 Schéma Visuel de la Story Map (Matrice de Priorités)

```mermaid
quadrantChart
    title Priorisation Valeur / Effort
    x-axis Faible Effort --> Fort Effort
    y-axis Faible Valeur --> Forte Valeur
    quadrant-1 Priorité V1 (Quick Wins)
    quadrant-2 Priorité MVP (Essentiel)
    quadrant-3 Nice-to-have / V2
    quadrant-4 Chantiers Complexes V2
    "Clic Manuel + Compteur": [0.2, 0.95]
    "Boucle CPS Front": [0.3, 0.9]
    "Boutique Basique (Curseur)": [0.35, 0.85]
    "Sync Serveur Anti-triche": [0.55, 0.88]
    "Auth JWT + Reprise de partie": [0.65, 0.82]
    "Tour Onboarding": [0.25, 0.6]
    "Catalogue Bâtiments Avancés": [0.45, 0.75]
    "Leaderboard Public": [0.7, 0.65]
    "Système Achievements": [0.6, 0.7]
    "Système Ascension / Prestige": [0.85, 0.55]
```
