# Plan d’implémentation — éditeur de rig Corps + Tête

## Objectif

Remplacer le calibreur généraliste actuel par un workflow dédié à l’assemblage d’un corps
statique et d’une tête, centré sur le drag & drop, avec origine de corps explicite, position
commune des têtes et surcharges ponctuelles.

La spécification fournie dans `spec-editeur-rig (1).md` devient la référence produit de cette
refonte. Les anciens rigs restent lisibles et exportables sans perte de données.

## Audit de l’existant

- Le viewport central reste le viewport de composition : décor, bureau et accessoires masquent
  le contexte de calibration et la sélection visuelle peut différer du sprite choisi dans le
  panneau.
- Le catalogue v3 possède un corps, des templates de catégorie et des surcharges par pièce,
  mais aucune origine personnalisable du corps.
- Les coordonnées des pièces sont absolues dans le repère canonique `840 × 908`, alors que la
  cible demande des coordonnées relatives à l’origine du corps.
- Le template de la catégorie `head` fournit déjà la future « position commune » et
  `calibrationOverride` fournit déjà la « position spécifique », mais l’interface ne rend pas
  ce modèle compréhensible.
- Le panneau colocalisé est techniquement propre, mais ses cartes imbriquées, toutes les
  catégories historiques et les actions champ par champ produisent un parcours trop long.
- La copie de rig est complète et destructive ; elle ne sait pas choisir origine, position
  commune, positions spécifiques, compatibilités et tête par défaut.
- La bibliothèque filtre actuellement les éléments incompatibles. En mode Rig elle doit au
  contraire montrer les têtes compatibles en premier, puis les autres têtes disponibles.
- Le catalogue est sauvegardé dans `localStorage` et les exports globaux, mais ses mutations ne
  font pas partie de l’historique du document d’édition.

## Décisions d’architecture

1. Faire évoluer le catalogue vers une version 4 avec `bodyOrigin`, exprimée dans l’espace
   local non redimensionné du sprite du corps. Sa valeur par défaut est le centre du sprite.
2. Stocker les placements de tête relativement à cette origine. Ajouter des fonctions pures
   de conversion relatif ↔ absolu afin que le runtime Canvas puisse continuer à recevoir des
   transforms de calque standards.
3. Migrer le catalogue v3 sans déplacement visuel : calculer l’origine centrale, puis convertir
   chaque template et surcharge de tête absolus en coordonnées relatives.
4. Lors d’un déplacement de l’origine, recalculer les placements relatifs de toutes les têtes
   pour conserver leur position visuelle exacte.
5. Réutiliser `head.template` comme position commune et `calibrationOverride` comme position
   spécifique. Le choix commun/spécifique devient explicite et indépendant de la tête par défaut.
6. Limiter le nouvel éditeur à Corps + Tête. Les catégories v3 historiques restent conservées
   et résolues par le runtime pour compatibilité, mais ne sont plus exposées dans ce parcours.
7. Créer un viewport Rig colocalisé et agnostique, alimenté par des URLs d’images et un modèle
   géométrique. L’orchestrateur métier reste dans `features/studio`.
8. Le viewport de composition est remplacé par le viewport Rig tant que le calibreur est ouvert ;
   aucun décor ou contrôle de composition n’est rendu dans ce mode.
9. Ajouter un snapshot JSON du catalogue au document. Les commits de gestes mettent à jour ce
   snapshot en une mutation d’historique ; un watcher réhydrate le catalogue lors d’un undo/redo.
   `localStorage` reste un cache global et une source de migration, pas l’unique autorité du projet.
10. Ne persister aucun mouvement intermédiaire : prévisualisation locale pendant le drag, commit
    unique à la fin du geste, puis synchronisation document/catalogue.

## Découpage d’implémentation

### 1. Modèle v4 et géométrie

- Ajouter `RigPoint` et `bodyOrigin` au modèle.
- Ajouter les conversions origine/corps/placement de tête.
- Migrer v3 → v4 sans changement visuel et conserver l’import v2.
- Étendre duplication, parsing, export et factory reset au stockage v4.
- Couvrir centre par défaut, migration et invariance visuelle par tests unitaires.

### 2. Mutations métier Corps + Tête

- Ajouter les actions : modifier/réinitialiser l’origine, enregistrer la position commune,
  enregistrer une position spécifique, revenir à la position commune.
- Ajouter « Appliquer aux autres têtes » pour toutes les compatibles ou une sélection.
- Étendre la copie inter-rigs avec options partielles et priorité aux rigs du même personnage.
- Séparer définitivement tête par défaut et source du placement commun.

### 3. Viewport Rig minimal

- Créer `src/ui/components/ui/rig-calibration-viewport/` avec `types.ts`, SFC, story, spec,
  README et barrel.
- Afficher uniquement corps, tête, axes passant par l’origine, poignée d’origine et bounding box.
- Ajouter zoom, ajustement, drag libre sans snapping et coordonnées temporaires au curseur.
- Supporter souris, tactile et nudges clavier accessibles.
- Créer l’orchestrateur feature qui charge/libère les blobs et convertit les gestes en brouillon.
- Remplacer `StudioViewport` par ce viewport lorsque le mode Rig est actif.

### 4. Panneau latéral simplifié

- Refactorer le composant colocalisé existant autour de trois sections compactes : Corps, Tête,
  Position.
- Retirer les grandes cartes imbriquées et les contrôles de catégories historiques.
- Exposer Modifier/Réinitialiser l’origine, position Commune/Spécifique, champs précis,
  réinitialisation et application aux autres têtes.
- Transformer la copie inter-rigs en dialogue à options partielles.
- Conserver import/export comme actions secondaires.
- Mettre à jour `types.ts`, story, specs, README et exports sans casser le barrel public.

### 5. Bibliothèque contextualisée

- Quand le mode Rig s’ouvre, sélectionner automatiquement le personnage et la catégorie Têtes.
- Afficher les têtes compatibles en premier, puis les autres têtes de ce personnage.
- Conserver recherche et import ; masquer la navigation plateau non pertinente pendant ce mode.
- Prévisualiser immédiatement la tête choisie sans sauvegarde intermédiaire destructive.

### 6. Document, historique et portabilité

- Ajouter le snapshot de catalogue au document et à sa normalisation rétrocompatible.
- Inclure ce snapshot dans les états before/after de l’historique.
- Réhydrater le store de rigs après chargement de document, composition et undo/redo.
- Vérifier export de scène, sauvegarde complète et restauration avec le catalogue v4.
- Garantir qu’un drag produit une seule entrée et une seule persistance finale.

### 7. Documentation et validation

- Remplacer la documentation du calibreur généraliste par le workflow Corps + Tête.
- TypeScript explicite, ESLint source, tests ciblés modèle/store/UI/runtime.
- Suite unitaire, build Vite et build Histoire.
- Contrôle visuel du viewport dédié si un navigateur est disponible.

## Compatibilité et non-objectifs

- Aucun bone, joint, IK/FK, animation, timeline, règle, graduation ou snapping.
- Aucun effacement des anciennes catégories ou calibrations pendant la migration.
- Aucun changement du viewport de composition hors bascule explicite en mode Rig.
- Les modifications déjà présentes dans le worktree sur la profondeur et la sélection des props
  seront préservées.

## Critères de validation

- Corps buste, full-body et asymétrique utilisent le même workflow.
- Déplacer/réinitialiser l’origine ne déplace pas visuellement les têtes existantes.
- Une tête sans surcharge suit la position commune ; une tête spécifique peut y revenir.
- Les copies vers plusieurs têtes et depuis un autre rig sont explicites et testées.
- Le viewport n’affiche que le corps et la tête, sans snapping.
- Undo/redo et export/import restaurent exactement le rig v4.

---

# Évolution approuvée — accessoires libres hors rig

## Objectif

Faire de `eyes` et `props_host` des accessoires de scène partageables entre personnages,
multi-instances et transformables individuellement, tout en leur donnant par défaut la même
profondeur optique que le sujet. Stabiliser simultanément les régressions v4 identifiées par
l’audit du 29 août 2026.

## Étapes

1. Passer `eyes` et `props_host` en `free-transform` + `multi`, les retirer des catégories de
   personnage et des slots de rig, puis les router vers un groupe stage Accessoires explicite.
2. Migrer les documents et compositions existants : extraire ces calques des groupes personnage
   en conservant leur géométrie visuelle, leur z-order et une profondeur `subject`.
3. Ajouter un parcours simple dans la bibliothèque : clic pour ajouter/sélectionner une occurrence,
   action explicite pour créer une occurrence supplémentaire du même asset.
4. Fiabiliser le catalogue v4 : lecture des clés v3/v2, nettoyage factory reset, coordonnées
   relatives cohérentes pour toutes les pièces restantes et parsing rétrocompatible.
5. Raccorder panneau, viewport et gestes de calibrage afin qu’un drag n’écrive qu’une seule entrée
   d’historique et une seule persistance finale.
6. Compléter le snapshot de catalogue dans les documents/compositions et corriger les erreurs
   TypeScript/lint ainsi que la transformation des groupes.
7. Ajouter les tests de migration, multi-instance, profondeur et régression ; exécuter typecheck,
   lint ciblé, tests source, build Vite et build Histoire.

## Critères de validation

- Lunettes, chapeaux et accessoires ne figurent plus dans les rigs ni sous un personnage.
- Plusieurs accessoires différents, ou plusieurs occurrences du même asset, peuvent coexister.
- Chaque occurrence possède sa sélection et ses transformations indépendantes.
- Leur profondeur implicite est `subject` / `0.5`, sans couplage au groupe personnage.
- Les scènes et catalogues existants sont migrés sans disparition ni saut visuel évitable.
- Le build, le typecheck et le lint ciblé sont verts ; les tests couvrent les migrations critiques.
