# Roadmap — Studio opaque et layout classique

Statut : **lots A à C implémentés — lot D implémenté côté source, validation interactive restante**

Périmètre : coquille du Studio, bibliothèque d’assets, viewport, toolbars, compositions
sauvegardées, calibrage des rigs, surfaces transitoires et primitives UI directement
visibles dans le Studio.

## 0. Journal d’exécution — 31 août 2026

- [x] **Lot A — Structure** : coquille CSS Grid colocalisée, bibliothèque gauche et
  inspecteur droit intégrés au flux normal.
- [x] **Lot B — Commandes** : barres globale et contextuelle rendues dans les régions
  solides du header et du footer, sans recouvrir le canvas.
- [x] **Lot C — Surfaces** : suppression des consommations glass structurelles,
  conservation explicite de la barre contextuelle flottante et durcissement des
  variantes opaques par défaut de la librairie UI.
- [x] **Lot D — Source** : mode compact Bibliothèque / Studio / Inspecteur, landmarks,
  labels accessibles, nettoyage des overlays et tests de structure.
- [x] Gates locaux : TypeScript, ESLint, Vitest (110 fichiers / 507 tests), build Vite,
  build Histoire (68 stories / 178 variantes) et `git diff --check`.
- [ ] Validation visuelle interactive aux largeurs 1920×1080, 1440×900 et 1024×768.
- [ ] Scénarios E2E Studio dans un navigateur disponible.
- [ ] Extraction complète de la logique de la toolbar globale hors de `StageCanvas` :
  son `Teleport` technique cible encore le header sémantique.

Le bundle applicatif reste au-dessus du seuil Vite de 500 kB ; cet avertissement de
code-splitting existant n’empêche pas le build.

### Correctif visuel — retour du 31 août 2026

- [x] Ancrer `html`, `body`, `#app` et la coquille applicative sur le viewport avec
  `height: 100%` puis `fixed inset-0`, sans dépendre d’une hauteur héritée.
- [x] Différer le `Teleport` de la toolbar globale afin que le header existe au montage.
- [x] Restaurer la toolbar contextuelle glass dans un overlay dédié au viewport.
- [x] Capturer l’asset bureau à l’ouverture pour maintenir la modale de slice montée.
- [x] Ajouter les contrats ciblés hauteur, overlay glass et ouverture du slice.
- [ ] Revalider visuellement dans un navigateur connecté.

## 1. Objectif

Remplacer l’interface flottante en glassmorphism par un espace de travail classique,
opaque et structuré :

- les zones persistantes participent au layout et ne recouvrent jamais le canvas ;
- les composants utilisent leurs variantes solides par défaut ;
- seuls les repères intrinsèquement spatiaux restent superposés au viewport ;
- les ouvertures, raccourcis, interactions canvas et parcours guidés restent fonctionnels ;
- le Studio reste utilisable sur les largeurs desktop et compactes.

## 2. Layout cible

```text
┌──────────────────────────────────────────────────────────┐
│ Header solide : Projet · Undo/Redo · Effets · Export     │
├─────────────────┬──────────────────────┬─────────────────┤
│ Bibliothèque    │                      │ Inspecteur      │
│ dockée          │  Canvas / viewport   │ docké           │
│ catégories      │                      │ Vues ou Rigs    │
│ et assets       │                      │                 │
├─────────────────┴──────────────────────┴─────────────────┤
│ Barre contextuelle solide du calque sélectionné          │
└──────────────────────────────────────────────────────────┘
```

Structure CSS recommandée :

- racine : `grid-template-rows: auto minmax(0, 1fr) auto` ;
- corps : `grid-template-columns: auto minmax(0, 1fr) auto` ;
- panneaux latéraux redimensionnables et repliables dans le flux normal ;
- viewport central protégé par `min-width: 0` et `min-height: 0` ;
- aucune position `absolute` pour une région persistante de l’application.

## 3. Décisions structurantes

- [x] Conserver les variantes glass dans la librairie générique comme options explicites.
- [x] Interdire leur consommation structurelle dans le Studio, avec une exception
  explicite pour la barre d’actions contextuelle liée à la sélection.
- [x] Réserver les overlays aux éléments liés aux coordonnées du canvas.
- [x] Réutiliser les variantes `solid`, `default`, `secondary` et `flat` existantes.
- [x] Conserver l’exclusivité actuelle entre Compositions et Calibration.
- [x] Faire basculer les espaces de travail en mode compact au lieu de les superposer.
- [x] Documenter ces invariants dans le README du layout Studio.

Les noms `shadow-glass-*` ne doivent pas être remplacés mécaniquement : certains sont
des alias de shadows classiques. Les critères réels sont l’opacité de la surface et
l’absence de `backdrop-filter`.

## 4. Inventaire de départ

### 4.1 Régions persistantes flottantes

- [x] Bibliothèque positionnée en absolu depuis `src/App.vue`.
- [x] `AssetCategoryNav` en `viewport-glass`.
- [x] `AssetCategoryDrawer` en `viewport-glass`.
- [x] `ViewportSnapshotsPanel` absolu et vitré.
- [x] `StudioGlobalToolbar` absolu dans le viewport.
- [x] `StudioSelectionToolbar` téléporté dans un overlay.
- [x] `RigCalibrationPanel` en surface vitrée.

### 4.2 Surfaces transitoires explicitement vitrées

- [x] Popovers Effets, Flou et Profondeur optique.
- [x] Menus Projet, Sauvegarde et Visites guidées.
- [x] Modales de groupe, découpe de bureau et duplication de rig.
- [x] Zones d’import utilisant une variante `glass`.

### 4.3 Overlays spatiaux légitimes

- [x] Cadre caméra et ses poignées.
- [x] Ligne de limite de netteté.
- [x] Boîte de transformation de la sélection.
- [x] Guides et origine du calibrage des rigs.
- [ ] Déplacer les commandes non spatiales de ces overlays vers un header ou footer docké.
- [ ] Passer leurs libellés restants sur une surface opaque.

## 5. Jalon 1 — Créer la coquille classique

Priorité : **P0**

Objectif : fournir les régions structurelles avant de migrer leur contenu.

### Todo

- [ ] Créer un composant colocalisé `studio-workspace-layout`.
- [ ] Ajouter ses fichiers `types.ts`, SFC, spec, story, README et `index.ts`.
- [ ] Exposer les zones `header`, `left`, `main`, `right` et `footer`.
- [ ] Implémenter la grille avec protections anti-débordement.
- [ ] Donner aux régions des landmarks et labels accessibles.
- [ ] Prévoir l’absence optionnelle des colonnes secondaire gauche et droite.
- [ ] Prévoir des largeurs pilotables par `ResizableSidebar`.
- [ ] Intégrer la coquille dans `App.vue` sans déplacer encore la logique métier.
- [ ] Ajouter un test vérifiant l’ordre des régions dans le DOM.
- [ ] Ajouter un test garantissant que `main` reste `min-w-0 min-h-0`.
- [ ] Ajouter une story avec panneaux ouverts, fermés et contenus longs.

### Condition de sortie

- [ ] Le canvas occupe exclusivement la cellule centrale.
- [ ] L’ouverture d’une colonne réduit l’espace disponible sans recouvrir le viewport.
- [ ] Aucun comportement métier n’a changé.

## 6. Jalon 2 — Docker la bibliothèque d’assets

Priorité : **P0**

Objectif : transformer la navigation et le tiroir d’assets en panneau gauche classique.

### Todo

- [ ] Faire de `AssetLibraryPanel` le conteneur unique de la bibliothèque.
- [ ] Placer `AssetCategoryNav` dans la première zone du panneau.
- [ ] Placer `AssetCategoryDrawer` dans une colonne adjacente du flux normal.
- [ ] Retirer `absolute`, translations, scale et z-index liés au flottement.
- [ ] Retirer `viewport-glass`, bordures blanches et couleurs `text-white/*`.
- [ ] Utiliser les tokens `bg-bg-surface`, `bg-bg-elevated` et `border-border-default`.
- [ ] Utiliser les variantes par défaut des boutons, inputs, badges et empty states.
- [ ] Conserver Projet, Importer et Rigs au sommet de la zone.
- [ ] Conserver le rail vertical Reka et la navigation par catégories.
- [ ] Conserver la recherche, l’ajout, la duplication, la suppression et la découpe.
- [ ] Conserver la fermeture du navigateur d’assets.
- [ ] Rendre la largeur du panneau persistante et redimensionnable.
- [ ] Mettre à jour les tests de largeur et de structure.
- [ ] Ajouter un test de navigation clavier entre rail et contenu.

### Condition de sortie

- [ ] La bibliothèque ne recouvre jamais le canvas.
- [ ] Aucun consommateur applicatif de `viewport-glass` ne subsiste dans l’asset manager.
- [ ] Les actions et sélections d’assets produisent les mêmes mutations métier.

## 7. Jalon 3 — Docker l’inspecteur droit

Priorité : **P0**

Objectif : réunir les panneaux secondaires dans une colonne droite cohérente.

### Todo

- [ ] Créer une région d’inspection droite facultative.
- [ ] Y rendre `ViewportSnapshotsPanel` dans le flux normal.
- [ ] Y rendre `RigCalibrationWorkspace` lorsque le calibrage est actif.
- [ ] Conserver leur exclusivité via les watchers existants.
- [ ] Mutualiser redimensionnement, repli et persistance de largeur.
- [ ] Retirer la position absolue du panneau Compositions.
- [ ] Retirer les styles `viewport-glass` de Compositions et Calibration.
- [ ] Harmoniser headers, séparateurs, footers et zones scrollables.
- [ ] Passer les cartes de snapshots sur les variantes de surface par défaut.
- [ ] Conserver création, chargement et suppression des snapshots.
- [ ] Conserver sélection, modification et sauvegarde des rigs.
- [ ] Mettre à jour les tests des deux panneaux et de `ResizableSidebar`.

### Condition de sortie

- [ ] L’inspecteur pousse le viewport au lieu de le recouvrir.
- [ ] Une seule fonction secondaire est visible à droite.
- [ ] Le redimensionnement clavier et souris reste accessible.

## 8. Jalon 4 — Sortir les toolbars du canvas

Priorité : **P0**

Objectif : réserver `StageCanvas` au rendu et aux interactions spatiales.

### Todo

- [ ] Déplacer `StudioGlobalToolbar` dans le header de la coquille.
- [ ] Remplacer sa surface vitrée par une surface solide sans coins flottants.
- [ ] Conserver Undo, Redo, Flou, Effets, Cadrage, Vues, Export et Aide.
- [ ] Déplacer `StudioSelectionToolbar` dans le footer contextuel.
- [x] Cibler un hôte d’overlay dédié dans le viewport pour la barre contextuelle.
- [ ] Supprimer `#studio-overlay-host` s’il n’a plus de consommateur.
- [ ] Conserver son apparition conditionnelle selon la sélection.
- [ ] Conserver placement scène, profondeur, découpe, miroir et suppression.
- [ ] Préserver le raccourci Échap pour vider la sélection.
- [ ] Sortir de `StageCanvas` les modèles ou callbacks nécessaires au rendu des toolbars.
- [ ] Éviter une nouvelle dépendance circulaire entre App, viewport et stores.
- [ ] Mettre à jour les tests des toolbars et du viewport.

### Condition de sortie

- [x] Seule la toolbar contextuelle de sélection flotte au-dessus du viewport.
- [ ] Le canvas ne contient plus que les interactions et repères spatiaux.
- [ ] Tous les raccourcis et gestes undo/redo restent opérationnels.

## 9. Jalon 5 — Revenir aux variantes solides par défaut

Priorité : **P1**

Objectif : supprimer les opt-ins glass structurels, hors barre contextuelle de sélection.

### Todo

- [x] Retirer `surface="glass"` des popovers Effets et Flou.
- [x] Retirer `surface="glass"` du popover de profondeur optique.
- [x] Retirer `surface="glass"` de `StudioTourMenu`.
- [x] Retirer `surface="glass"` de `WorkspaceBackupMenu`.
- [x] Retirer `surface="glass"` des modales du Studio.
- [x] Remplacer les dropzones `variant="glass"` par leur variante par défaut.
- [x] Retirer les classes applicatives qui réinjectent `viewport-glass`.
- [x] Remplacer les couleurs blanches codées en dur des panneaux par les tokens sémantiques.
- [x] Vérifier les flèches, headers et footers des popovers solides côté source/tests.
- [ ] Vérifier le contraste en thèmes sombre et clair.
- [ ] Mettre à jour stories et tests visuels concernés.

### Condition de sortie

- [x] La recherche suivante ne retourne que l’exception contextuelle documentée :

  ```powershell
  rg -n 'viewport-glass|surface="glass"|variant="glass"|glass-premium' src/App.vue src/features
  ```

- [x] Les variantes glass génériques restent testées dans la librairie UI.

## 10. Jalon 6 — Durcir les variantes par défaut

Priorité : **P1**

Objectif : garantir que les composants annoncés comme solides ne produisent pas
implicitement un effet vitré.

### Todo

- [x] Auditer `Button secondary` et `IconButton secondary/fav`.
- [x] Auditer Input, Combobox, Select et MentionInput.
- [x] Auditer Tabs `capsule`, `segmented` et `rail`.
- [x] Auditer Accordion `card`, EmptyState et LoadingState.
- [x] Auditer les surfaces desktop de `Shell` si elles sont réutilisées.
- [x] Retirer les `backdrop-blur-*` inutiles sur fond opaque.
- [x] Rendre opaques les backgrounds semi-transparents des variantes par défaut.
- [x] Conserver les traitements glass uniquement dans les variantes nommées `glass`.
- [ ] Ajouter un test de contrat par primitive modifiée.
- [x] Vérifier les impacts par le build des 68 stories de la librairie.

### Condition de sortie

- [x] Une variante par défaut ou `solid` n’applique aucun `backdrop-filter`.
- [x] Les changements de primitives n’introduisent aucune régression dans la suite locale.

## 11. Jalon 7 — Responsive et accessibilité

Priorité : **P1**

### Todo desktop

- [ ] Valider le layout avec bibliothèque et inspecteur ouverts simultanément.
- [ ] Définir des largeurs minimales et maximales raisonnables pour les sidebars.
- [ ] Empêcher le canvas de disparaître sous la largeur minimale utile.
- [ ] Conserver les largeurs choisies après rechargement.

### Todo compact

- [x] Ajouter une navigation Bibliothèque / Studio / Inspecteur.
- [x] Afficher un seul espace principal à la fois sous le breakpoint compact.
- [x] Ne pas convertir les sidebars en panneaux transparents superposés.
- [x] Rendre les commandes primaires du header toujours accessibles dans le flux.
- [x] Garantir des cibles tactiles d’au moins 44 px dans la navigation compacte.

### Todo accessibilité

- [x] Vérifier les landmarks `header`, `nav`, `main`, `aside` et `footer` côté source/tests.
- [x] Donner un nom accessible à chaque toolbar et région.
- [ ] Vérifier l’ordre de tabulation après chaque déplacement.
- [ ] Vérifier focus visible, Échap et restauration du focus des popovers.
- [ ] Vérifier les séparateurs de redimensionnement au clavier.
- [ ] Vérifier `prefers-reduced-motion`.
- [ ] Mettre à jour les sélecteurs et placements des visites guidées.

### Condition de sortie

- [ ] Le Studio est utilisable à 1920×1080, 1440×900 et 1024×768.
- [ ] Aucun contenu essentiel n’est inaccessible au clavier.
- [ ] Aucun panneau persistant ne recouvre la zone utile du canvas.

## 12. Jalon 8 — Nettoyage et validation finale

Priorité : **P0 avant livraison**

### Todo nettoyage

- [x] Supprimer les commentaires mentionnant un layout flottant devenu obsolète.
- [x] Supprimer les transitions de translation/scale réservées aux panneaux flottants.
- [ ] Réduire les z-index devenus inutiles.
- [x] Supprimer l’ancien hôte de teleport overlay sans consommateur.
- [ ] Vérifier les imports et exports publics devenus inutiles.
- [ ] Mettre à jour les README des composants migrés.
- [ ] Mettre à jour la documentation produit et les visites guidées.

### Todo tests

- [x] Ajouter un test d’intégration structurel de la coquille complète.
- [ ] Vérifier ouverture et fermeture de la bibliothèque.
- [ ] Vérifier ouverture et fermeture des compositions.
- [ ] Vérifier l’exclusivité Compositions / Calibration.
- [ ] Vérifier les popovers Effets, Flou et Profondeur.
- [ ] Vérifier la barre contextuelle avec et sans sélection.
- [ ] Vérifier que les bounding boxes des régions persistantes ne croisent pas le canvas.
- [ ] Ajouter des contrôles visuels aux largeurs de référence.

### Quality gates

- [x] `pnpm exec vue-tsc --noEmit`
- [x] ESLint source sans correction automatique non relue.
- [x] Vitest ciblé après chaque jalon.
- [x] Suite Vitest complète.
- [x] Build Vite de production.
- [x] Build Histoire et contrôle des stories modifiées.
- [ ] Scénarios E2E du Studio.
- [x] `git diff --check`

## 13. Découpage recommandé des livraisons

### Lot A — Structure

- [x] Jalon 1 : coquille classique.
- [x] Jalon 2 : bibliothèque dockée.
- [x] Jalon 3 : inspecteur docké.

### Lot B — Commandes

- [x] Jalon 4 : toolbars visuellement hors canvas, dockées dans la coquille.
- [x] Vérification fonctionnelle des stores et raccourcis par la suite Vitest.

### Lot C — Surfaces

- [x] Jalon 5 : suppression des opt-ins glass structurels, hors toolbar contextuelle.
- [x] Jalon 6 : durcissement des variantes par défaut.

### Lot D — Finition

- [x] Jalon 7 : responsive compact et structure accessible côté source/tests.
- [ ] Jalon 8 : nettoyage, documentation et validation finale.

Chaque lot doit rester compilable, testable et réversible indépendamment.

## 14. Définition de terminé

La migration est terminée uniquement lorsque :

- [ ] toutes les régions persistantes participent au layout ;
- [ ] le canvas n’est recouvert par aucun panneau ou toolbar applicative ;
- [x] aucun opt-in glass structurel ne subsiste hors toolbar contextuelle de sélection ;
- [ ] les overlays restants sont exclusivement spatiaux et opaques ;
- [ ] les comportements métier sont inchangés ;
- [ ] desktop, mode compact, thèmes et clavier sont validés ;
- [ ] tous les quality gates sont au vert ;
- [ ] la roadmap et le journal local reflètent l’état réellement livré.
