# Découpage du Backlog : EPICS & Tâches Détaillées

Ce document fournit la spécification exacte à copier/coller dans votre outil de gestion de projet (**GitHub Projects**, **Jira**, ou **Linear**).

---

## 🏷️ Conventions de Tags & Labels
- **Couches** : `front` (bleu), `back` (vert), `fullstack` (violet)
- **Types** : `epic` (violet foncé), `feature` (vert clair), `tech/setup` (gris), `bug` (rouge)
- **Priorités** : `P0-Critical`, `P1-High`, `P2-Medium`, `P3-Low`
- **Estimations** : En Story Points (suite de Fibonacci : 1, 2, 3, 5, 8).

---

## 👑 EPIC 1 — Authentification & Sauvegarde de Progression (Fullstack)
> **Description** : Permettre aux joueurs de créer un compte, se connecter de manière sécurisée et persister leur solde et leurs améliorations entre plusieurs sessions.  
> **Type** : `epic`, `fullstack` | **Priorité** : `P1-High`

### Sous-Tâches Associées :
| ID | Rôle | Titre | Labels | Estimation | Critères d'acceptation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CK-101** | `back` | Implémentation de l'API Register & Login (JWT) | `back`, `auth` | 5 SP | Hash bcrypt des mots de passe, génération d'un JWT valable 24h, code HTTP 401 si identifiants invalides. |
| **CK-102** | `back` | Endpoints de sauvegarde et chargement de session (`/api/game/state`) | `back`, `api` | 3 SP | Route GET sécurisée renvoyant l'état du joueur, route POST de sauvegarde avec horodatage. |
| **CK-103** | `front` | Formulaires d'inscription et de connexion réactifs | `front`, `ui` | 3 SP | Validation des champs (email/mot de passe), feedback d'erreur en cas d'échec de login. |
| **CK-104** | `front` | Gestion du state d'authentification et stockage du token | `front`, `state` | 2 SP | Sauvegarde sécurisée du token (localStorage ou cookie httpOnly), persistance de session au rafraîchissement. |

---

## 👑 EPIC 2 — Moteur de Clic & Production Automatique (Fullstack)
> **Description** : Moteur central du jeu permettant au joueur de cliquer pour accumuler des cookies, d'avoir une production automatique par seconde (CPS), et de synchroniser le solde avec le serveur sans possibilité de triche évidente.  
> **Type** : `epic`, `fullstack` | **Priorité** : `P0-Critical`

### Sous-Tâches Associées :
| ID | Rôle | Titre | Labels | Estimation | Critères d'acceptation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CK-201** | `front` | Composant Big Cookie cliquable & animation de clic | `front`, `ui` | 2 SP | Bouton cookie avec effet de rebond au clic, affichage du nombre flottant (+1) à chaque tap. |
| **CK-202** | `front` | Compteur dynamique et boucle de calcul local (CPS) | `front`, `engine` | 3 SP | Incrémentation fluide (60 FPS via `requestAnimationFrame` ou timer 100ms) du solde basé sur le CPS. |
| **CK-203** | `back` | Moteur serveur de vérification d'anti-triche (`/api/game/sync`) | `back`, `security`| 5 SP | Calcul du delta de temps entre deux synchronisations ; rejet si le solde réclamé dépasse la production théorique maximale autorisée. |
| **CK-204** | `fullstack` | Synchronisation périodique Front-Back (Heartbeat / 15s) | `front`, `back` | 3 SP | Envoi d'un ping toutes les 15s du client vers le serveur avec sauvegarde automatique en base. |

---

## 👑 EPIC 3 — Boutique d'Améliorations (Bâtiments & Multiplicateurs)
> **Description** : Système d'économie en jeu permettant d'acheter des générateurs automatiques (Grand-mère, Ferme, Usine...) dont le prix augmente exponentiellement à chaque achat.  
> **Type** : `epic`, `fullstack` | **Priorité** : `P1-High`

### Sous-Tâches Associées :
| ID | Rôle | Titre | Labels | Estimation | Critères d'acceptation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CK-301** | `back` | Modèle de données & API du catalogue d'items | `back`, `database`| 3 SP | Table ou collection contenant : `id`, `name`, `baseCost`, `baseCps`, `costMultiplier`. Endpoint GET `/api/shop/items`. |
| **CK-302** | `back` | Validation de transaction d'achat côté serveur | `back`, `api` | 3 SP | Vérification que le solde joueur $\ge$ prix d'achat, déduction du solde, incrémentation de la quantité d'items possédés. |
| **CK-303** | `front` | Composant Panneau Boutique (Item Cards) | `front`, `ui` | 3 SP | Affichage de la liste des items, calcul dynamique du prix actuel : $\text{Prix} = \text{baseCost} \times 1.15^N$. |
| **CK-304** | `front` | Gestion visuelle de l'accessibilité à l'achat | `front`, `ui` | 2 SP | Griser le bouton si le joueur n'a pas assez de cookies, tooltip affichant le gain en CPS apporté. |

---

## 👑 EPIC 4 — Infrastructure, CI/CD & Socle Technique
> **Description** : Mise en place de l'environnement de développement pour le client et le serveur, normalisation des outils de linting/formatting et chaîne d'automatisation des tests.  
> **Type** : `epic`, `setup` | **Priorité** : `P0-Critical`

### Sous-Tâches Associées :
| ID | Rôle | Titre | Labels | Estimation | Critères d'acceptation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CK-401** | `front` | Initialisation du projet client (Vite + React / HTML5) | `front`, `setup` | 2 SP | Démarrage réussi avec `npm run dev`, configuration de TailwindCSS ou styles CSS modulaires. |
| **CK-402** | `back` | Initialisation du serveur Node.js (Express / Fastify) | `back`, `setup` | 2 SP | Structure en couches (controllers, services, routes), gestion du CORS et port configurable par variable d'environnement. |
| **CK-403** | `fullstack` | Pipeline CI GitHub Actions (Lint & Build Test) | `ci-cd`, `automation` | 3 SP | Workflow s'exécutant sur chaque Pull Request, vérifiant `npm run lint` et `npm run test` sur le Front et le Back. |
| **CK-404** | `fullstack` | Configuration de la suite de tests unitaires minimale | `testing` | 2 SP | Au moins 1 test unitaire côté client (Jest/Vitest) et 1 test unitaire côté serveur (Supertest/Jest). |
