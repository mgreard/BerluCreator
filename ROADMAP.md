# Roadmap & architecture du studio

Statut : **studio simplifié avec personnages complets/rigs implémenté**.

## Architecture livrée

- [x] Document de scène unique, sans timeline métier.
- [x] Groupes typés `stage` et `character` avec transforms obligatoires.
- [x] Deux configurations persistantes par personnage : sprite complet et slots de rig.
- [x] Une seule configuration rendue selon `activeMode`, sans cas spécial lié à Berlu.
- [x] Métadonnées explicites des assets personnage et catégorie `character_full`.
- [x] Sidebar droite et réglages de calques supprimés du studio.
- [x] Sidebar gauche structurée par personnage, catégorie de sprite et catégorie de décor.
- [x] Navigation de la bibliothèque composée avec `Card` et `NavigationItem`, sans styles de lignes dupliqués dans le domaine.
- [x] Miniatures recadrées sur le contenu alpha et navigation colorée par catégorie.
- [x] Un clic ajoute, remplace le slot correspondant ou retire l’asset déjà visible.
- [x] Sprite complet et rig manipulés comme des personnages indivisibles dans le viewport.
- [x] Ratio naturel des images garanti par des redimensionnements toujours uniformes.
- [x] HUD limité au nom, aux dimensions et à une suppression toujours disponible.
- [x] Bureaux sélectionnables, déplaçables et redimensionnables, y compris pour les données déjà persistées.
- [x] Double-clic sur le sprite ou le rig actif pour le désélectionner sans le supprimer.
- [x] Historique atomique de 50 actions, gestes coalescés, caméra exclue et persistance séquentielle.
- [x] Vues sauvegardées contenant groupes, deux configurations, calques et caméra.
- [x] Compositions intégrées dans un panneau droit repliable et redimensionnable, avec liste compacte à miniatures.
- [x] Import indépendant par fichier avec validation et retry sans doublon.
- [x] Import ouvert par défaut sur la catégorie « Personnage complet ».
- [x] Suppression transactionnelle bloquée par les vues sauvegardées.
- [x] Migration Dexie v4→v5 et suppression du legacy sans consommateur.
- [x] TypeScript, ESLint, tests, build Vite et build Histoire au vert.

## Dette non bloquante

- [ ] Découper le chunk applicatif principal, actuellement supérieur à 500 kB minifié.
- [ ] Préparer une montée de version d’Histoire afin de supprimer les avertissements CJS de la branche 0.17.
- [ ] Ajouter un scénario navigateur dédié à la migration d’une vraie base IndexedDB v4 volumineuse, en complément des tests unitaires des convertisseurs.

Le détail de l’implémentation et des gates est consigné dans [walkthrough.md](walkthrough.md).

## Profondeur de champ sélective — MVP

Objectif : appliquer à la demande un flou progressif au décor, sans modifier le
personnage, le bureau, ses objets ni le premier plan. L’effet reste désactivé par défaut
afin de ne provoquer aucun traitement supplémentaire pendant la construction de la scène.

### Jalon 1 — Fondations persistées

- [x] Ajouter les paramètres de profondeur de champ au document de scène, avec des
      valeurs par défaut sûres pour les documents existants.
- [x] Inclure ces paramètres dans l’historique, les compositions sauvegardées, la
      sauvegarde locale et le JSON exporté.
- [x] Limiter explicitement le MVP à la catégorie `background`.

### Jalon 2 — Pipeline de rendu commun

- [x] Centraliser le rendu sélectif afin que le viewport, les miniatures de compositions
      et l’export PNG produisent le même résultat.
- [x] Court-circuiter le pipeline avant toute création de buffer lorsque l’effet est
      désactivé ou lorsque son rayon est nul.
- [x] Réutiliser les buffers temporaires lorsque leurs dimensions ne changent pas.

### Jalon 3 — Activation utilisateur

- [x] Ajouter au viewport une commande accessible pour activer ou désactiver l’effet.
- [x] Conserver l’état dans le document et permettre son annulation/rétablissement.
- [x] Garder les réglages initiaux sobres : focus vertical normalisé, transition douce
      et rayon de flou borné.

### Jalon 4 — Réglages et durcissement

- [x] Ajouter une ligne de focus draggable en overlay DOM, distincte du rendu exporté.
- [x] Exposer le rayon et la largeur de transition sans recalcul inutile pendant les
      gestes continus.
- [x] Coalescer les interactions en une mutation d’historique et au plus une mise à jour
      réactive par frame.
- [x] Mettre en cache la passe gaussienne lorsque le fond et le rayon ne changent pas ;
      un déplacement du focus ne reconstruit que son masque de transition.
- [x] Traiter les bords du flou par extension des pixels périphériques avant filtrage.
- [ ] Vérifier la fluidité aux résolutions cibles et valider le comportement sur les
      navigateurs officiellement supportés dès qu’un navigateur contrôlable est disponible.

### Jalon 5 — Plans de mise au point simples

- [x] Conserver les catégories d’assets et porter le rôle optique sur chaque instance de
      calque avec `auto`, `background` ou `subject`.
- [x] Résoudre automatiquement les arrière-plans comme décor et tous les autres éléments
      comme sujets nets.
- [x] Permettre aux accessoires de plateau de rejoindre le décor depuis le HUD contextuel.
- [x] Aligner l’ordre de rendu et le hit-test sur les bandes Décor puis Sujet.
- [x] Séparer l’activation de l’effet et la visibilité de ses aides d’édition.
