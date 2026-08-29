# Plan d’implémentation — sélection atomique des éléments de plateau

## Objectif

Garantir qu’un clic dans le viewport sélectionne toujours une seule instance de calque pour
les éléments de plateau. Les personnages restent la seule exception : leur sprite complet ou
toute pièce de leur rig sélectionne et transforme le groupe personnage indivisible.

## Diagnostic

- `shouldTargetWholeGroup()` cible actuellement un groupe si le calque appartient à un
  personnage, mais aussi si le précédent `editScope` vaut `group` ou si `Shift` est pressé.
- Après un clic sur un personnage, `editScope` reste donc à `group`. Le clic suivant sur un
  `props_set` sélectionne son groupe de plateau complet au lieu du calque touché.
- Le double-clic avec `Shift` appelle également `selectGroupForEditing()` sur un groupe de
  plateau.
- `selectGroupForEditing()` n’impose aucune restriction de type de groupe ; un appelant peut
  donc encore créer une sélection globale de groupe de plateau.

## Invariants cibles

1. Un groupe `character` est toujours sélectionné comme une unité, hors mode de calibration.
2. Un groupe `stage` n’est jamais une cible de manipulation directe dans le viewport.
3. `Shift`, le double-clic et l’état de la sélection précédente ne changent jamais l’invariant 2.
4. La sélection d’un calque de plateau conserve son `groupId` comme contexte d’organisation,
   mais son `editScope` reste `layer` et seul son `selectedLayerId` pilote la transformation.
5. Le mode de calibration reste capable de sélectionner une pièce individuelle du rig.

## Modifications prévues

1. [x] Simplifier le moteur de ciblage pour que la sélection de groupe dépende uniquement du type
   `character` du groupe touché.
2. [x] Résoudre explicitement le type du groupe dans `StageCanvas` lors du clic et supprimer les
   raccourcis de sélection globale des groupes de plateau (`editScope` hérité et `Shift`).
3. [x] Protéger le store afin que `selectGroupForEditing()` refuse les groupes `stage` ; adapter la
   création d’un groupe de plateau pour ne pas laisser une ancienne sélection active.
4. [x] Conserver sans changement le parcours spécial `selectRigLayerForCalibration()`.
5. [x] Mettre à jour les tests du moteur et du store avec la régression exacte : personnage puis
   prop, `Shift+clic` sur prop, et tentative directe de sélection d’un groupe de plateau.
6. [x] Mettre à jour la documentation fonctionnelle et technique de la sélection.

## Validation prévue

- [x] TypeScript explicite sur `tsconfig.app.json`.
- [x] ESLint des fichiers touchés.
- [x] Tests ciblés du moteur de sélection et du store.
- [x] Build applicatif si les contrôles ciblés sont au vert.

## Hors périmètre

- La structure organisationnelle des groupes et catégories dans le document.
- La calibration individuelle des pièces d’un rig.
- Le z-index, la profondeur optique et le rendu Canvas.
