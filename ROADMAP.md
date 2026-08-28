# Roadmap & architecture du studio

Statut : **stabilisation personnages complets/rigs implémentée**.

## Architecture livrée

- [x] Document de scène unique, sans timeline métier.
- [x] Groupes typés `stage` et `character` avec transforms obligatoires.
- [x] Deux configurations persistantes par personnage : sprite complet et slots de rig.
- [x] Une seule configuration rendue selon `activeMode`, sans cas spécial lié à Berlu.
- [x] Métadonnées explicites des assets personnage et catégorie `character_full`.
- [x] Hiérarchie complète incluant configurations inactives, visibilité, verrouillage, ordre et réglages.
- [x] Historique atomique de 50 actions, gestes coalescés, caméra exclue et persistance séquentielle.
- [x] Vues sauvegardées contenant groupes, deux configurations, calques et caméra.
- [x] Import indépendant par fichier avec validation et retry sans doublon.
- [x] Suppression transactionnelle bloquée par les vues sauvegardées.
- [x] Migration Dexie v4→v5 et suppression du legacy sans consommateur.
- [x] TypeScript, ESLint, tests, build Vite et build Histoire au vert.

## Dette non bloquante

- [ ] Découper le chunk applicatif principal, actuellement supérieur à 500 kB minifié.
- [ ] Préparer une montée de version d’Histoire afin de supprimer les avertissements CJS de la branche 0.17.
- [ ] Ajouter un scénario navigateur dédié à la migration d’une vraie base IndexedDB v4 volumineuse, en complément des tests unitaires des convertisseurs.

Le détail de l’implémentation et des gates est consigné dans [walkthrough.md](walkthrough.md).
