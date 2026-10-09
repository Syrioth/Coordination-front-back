# Vision Produit & Personas (Bonus TD)

Ce document formalise la vision produit et les personas cibles pour orienter la conception fonctionnelle et les priorités d'arbitrage Front/Back.

---

## 🎯 1. Énoncé de la Vision Produit

> **Pour** les joueurs occasionnels et adeptes de jeux d'optimisation mathématique,  
> **Qui** cherchent un divertissement immédiatement accessible sur navigateur sans temps de chargement,  
> **Le projet Cookie Clicker Web** est une plateforme de jeu incrémental multijoueur/connectée,  
> **Qui offre** une boucle de progression addictive, une synchronisation multi-terminaux sécurisée et des classements entre pairs,  
> **À la différence** des jeux incrémentaux purement locaux stockés uniquement dans le navigateur,  
> **Notre solution** garantit la persistance des données sur le cloud et intègre un système d'anti-triche robuste tout en préservant une fluidité à 60 images par seconde.

---

## 👥 2. Personas Utilisateurs

### Persona 1 : Lucas — "Le Joueur Passif / Multi-tâche"
* **Âge** : 21 ans, étudiant en informatique.
* **Comportement de jeu** :
  - Ouvre le jeu dans un onglet en arrière-plan pendant ses cours ou séances de révision.
  - Revient toutes les 10 à 30 minutes pour dépenser son stock de cookies dans de nouveaux générateurs automatiques.
  - Ne clique presque jamais manuellement une fois les 5 premières minutes passées.
* **Besoins clés** :
  - Un calcul précis et équitable de la production hors-ligne / en arrière-plan.
  - Une interface claire avec notifications visuelles subtiles lorsqu'un seuil d'achat est atteint.
* **Frustrations** :
  - Perdre sa progression s'il ferme son navigateur ou change d'ordinateur à la fac.

---

### Persona 2 : Sarah — "La Stratège de l'Optimisation (Min-Maxer)"
* **Âge** : 27 ans, data analyste.
* **Comportement de jeu** :
  - Analyse méticuleusement le ratio **Coût / Rentrée par seconde (ROI)** de chaque bâtiment.
  - Cherche à maximiser l'efficacité de ses achats à la décimale près.
  - S'intéresse au classement compétitif et aux succès (achievements).
* **Besoins clés** :
  - Données et statistiques transparentes affichées sur les cartes de la boutique (gain exact de CPS, coût actualisé).
  - Un système économique rigoureux et équilibré sans failles de duplication ou de triche.
* **Frustrations** :
  - Les jeux où les scores sont falsifiables facilement via la console JavaScript (`cookies = 999999999`).
  - Les ralentissements graphiques lors de l'accumulation de générateurs.
