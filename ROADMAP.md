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
