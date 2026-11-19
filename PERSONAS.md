# 👥 Personas Utilisateurs & Vision Produit

Ce document formalise la vision produit et les **3 personas cibles** du projet **Cookie Clicker Web (La petite boulangerie)** : **2 personas imposés** par les contraintes du TD et **1 persona personnalisé**. Chaque persona se traduit directement en exigences Front-End, Back-End et en tâches sur le [Board Jira](https://vanomme.atlassian.net/jira/software/projects/SCRUM/boards/1).

---

## 🎯 Vision Produit

> **Pour** les joueurs occasionnels, complétionnistes et adeptes d'optimisation,  
> **Qui** cherchent un jeu incrémental immédiatement accessible sur tout type d'écran (y compris d'anciens postes 800×600),  
> **Cookie Clicker Web** est une plateforme de jeu incrémental connectée,  
> **Qui offre** une boucle de progression riche (bâtiments, recettes, succès, statistiques), une synchronisation sécurisée anti-triche et une gestion d'erreurs transparente.

---

## 🖥️ Persona 1 (Imposé) : Bernard — « L'Utilisateur sur Écran Cathodique 800×600 »

| Attribut | Détails |
| :--- | :--- |
| **Âge & Profil** | 58 ans, technicien de maintenance industrielle & passionné de rétro-informatique. |
| **Équipement** | Poste fixe équipé d'un **moniteur CRT 4:3 en résolution 800×600**, navigation à la souris et au clavier, sans carte graphique moderne. |
| **Comportement** | Joue pendant ses pauses sur son poste d'atelier ; apprécie les interfaces directes, contrastées et sans fioritures. |

### Besoins clés
- **Affichage sans débordement horizontal** en `800×600` : le cookie central, le compteur et la boutique doivent rester accessibles immédiatement sans scroll horizontal ni superposition d'éléments.
- **Contraste élevé et typographie lisible** sur un écran cathodique à faible définition.
- **Mode compact / performances légères** : possibilité de réduire les effets visuels/animations (`prefers-reduced-motion` ou bouton dédié « Mode 800×600 / Compact ») pour éviter toute saccade.

### Frustrations
- Les interfaces modernes pensées uniquement pour le 1080p/4K qui coupent les boutons d'achat ou cachent le compteur hors écran.
- Les polices trop fines ou trop petites qui bavent sur un écran CRT.

### Traduction en fonctionnalités & tâches (Jira)
- **Front-End** : Media query dédiée `@media (max-width: 820px)` + mode compact 800×600 (grille 2 colonnes serrées, tailles de police adaptées, hauteur de panneaux bornée pour tenir dans `600px` de hauteur).
- **Accessibilité / UI** : Focus clavier visible (`:focus-visible`), boutons d'au moins `32px` de haut, respect de `prefers-reduced-motion`.
- **QA / Tests** : Test E2E exécuté avec un viewport `800×600` vérifiant l'absence de scroll horizontal (`scrollWidth <= clientWidth`).

---

## 📊 Persona 2 (Imposé) : Sarah — « La Stratège Stats & Gamification »

| Attribut | Détails |
| :--- | :--- |
| **Âge & Profil** | 27 ans, data analyste & joueuse complétionniste (*min-maxer*). |
| **Équipement** | Laptop 14" + double écran au bureau. |
| **Comportement** | Optimise chaque achat en analysant le rendement (CPS, coût/rentabilité) et vise le **100 % des succès (achievements)** et des paliers d'objectifs. |

### Besoins clés
- **Statistiques détaillées en temps réel** : cookies produits au total, clics totaux, valeur par clic, CPS brut vs boosté, nombre total de bâtiments, temps de jeu, progression vers le prochain objectif.
- **Mécaniques de gamification** : badges/succès déblocables avec compteur (`X / 12`), barre de progression vers les paliers, cookies dorés bonus, multiplicateurs et niveaux d'amélioration.
- **Économie fiable** : validation serveur empêchant les scores falsifiés afin de rendre la progression et les stats crédibles.

### Frustrations
- Manquer de visibilité sur ses statistiques de session ou ne pas comprendre comment débloquer le prochain succès.
- Des scores facilement falsifiables qui dévalorisent l'aspect gamification.

### Traduction en fonctionnalités & tâches (Jira)
- **Front-End** : Panneau **Statistiques & Gamification** (compteurs détaillés, taux de complétion des succès, barre d'objectifs, panneau « Petites victoires »).
- **Back-End** : Persistance des statistiques joueur (clics, production totale, succès débloqués, inventaire) via l'API CRUD `/api/players` et synchronisation `/api/game/sync`.

---

## 🎓 Persona 3 (Personnalisé) : Lucas — « L'Étudiant Multi-tâche & Joueur Passif »

| Attribut | Détails |
| :--- | :--- |
| **Âge & Profil** | 21 ans, étudiant en Master informatique. |
| **Équipement** | PC portable à l'école + PC fixe chez lui, connexion Wi-Fi parfois instable. |
| **Comportement** | Laisse le jeu tourner en arrière-plan entre deux cours et revient toutes les 15 à 30 minutes acheter de nouveaux générateurs. |

### Besoins clés
- **Production hors-ligne équitable** : continuer à générer des cookies lorsqu'il ferme l'onglet (plafonné et améliorable via *Four autonome*).
- **Sauvegarde résiliente (Local + Serveur)** : ne jamais perdre sa partie en cas de coupure réseau ou de changement de machine.
- **Messages d'erreur clairs** : savoir immédiatement s'il est en mode hors-ligne, si une synchronisation a échoué ou si un achat n'a pas pu être validé.

### Frustrations
- Perdre 3 heures de progression à cause d'un crash silencieux ou d'une erreur serveur incompréhensible.
- Ne pas savoir si ses données sont bien sauvegardées sur le serveur ou uniquement en local.

### Traduction en fonctionnalités & tâches (Jira)
- **Front-End** : Sauvegarde automatique `localStorage` + indicateur d'état de synchronisation + bandeau/toast d'erreur compréhensible (Error Management).
- **Back-End** : API de sauvegarde persistante (CRUD) avec contrôle anti-triche cohérent et gestion propre des erreurs réseau/HTTP.

---

## 🧩 Matrice de Synthèse Personas → Backlog

| Persona | Type | Contrainte Principale | Impact Front-End | Impact Back-End |
| :--- | :--- | :--- | :--- | :--- |
| **Bernard** | Imposé | Écran cathodique `800×600` | Layout compact 800×600, zéro scroll horizontal, contrastes forts | — (payload léger) |
| **Sarah** | Imposé | Stats & Gamification | Panneau stats, barre d'objectifs, succès, cookies dorés | Persistance stats, succès & inventaire en BDD |
| **Lucas** | Personnalisé | Jeu passif & résilience réseau | Production offline, fallback local, toasts d'erreur UX | Sync anti-triche, CRUD sauvegardes, codes HTTP propres |
