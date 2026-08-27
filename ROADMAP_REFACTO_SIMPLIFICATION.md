# Roadmap — éditeur unique, sans keyframes

Statut : **planifiée, non implémentée**

Périmètre audité : `src/core`, `src/features`, `src/infrastructure`, `src/App.vue`, scripts, dépendances et tests.

Contrainte de cette phase : **documentation uniquement, aucune modification du code applicatif**.

## 1. Résultat cible

Le studio manipule un seul document d’édition courant :

- aucune timeline, étape, séquence ou keyframe métier ;
- la composition visible est l’unique état modifiable et l’unique état exportable ;
- la caméra/cadrage appartient directement au document courant ;
- l’utilisateur peut enregistrer des snapshots nommés du viewport, les recharger et les supprimer ;
- charger un snapshot remplace le contenu du document courant, puis ce document redevient le seul exportable ;
- un fichier image importé produit exactement un asset, sans spritesheet, découpe, pipette, suppression de fond ou recadrage automatique ;
- la sélection multiple de fichiers peut rester : l’invariant est `1 fichier = 1 asset`.

Le mot « keyframe » disparaît du domaine, des types, des stores, de la persistance, des textes UI, des noms de fichiers métier et des tests. Les `@keyframes` CSS d’animation générique ne sont pas concernés : ils ne représentent pas des états du studio.

## 2. Décisions structurantes

### 2.1 Document d’éditeur unique

Remplacer le graphe actuel `Sequence -> steps -> tracks -> keyframes -> sprites` par un modèle plat orienté scène :

```ts
interface EditorDocument {
  id: string
  projectId: string
  name: string
  camera: CameraFrame
  groups: EditorGroup[]
  layers: EditorLayer[]
  createdAt: number
  updatedAt: number
}

interface EditorLayer {
  id: string
  assetId: string
  name: string
  category: AssetCategory
  groupId: string
  zIndex: number
  order: number
  transform?: Partial<Transform2D>
  muted: boolean
  locked: boolean
}
```

Conséquences :

- `Sequence`, `SequenceStep`, `SequenceNavigationState`, `TimelineTrack`, `Keyframe`, `KeyframeSprite` et `StepGroupState` disparaissent ;
- un calque porte directement ses propriétés de rendu ;
- les propriétés de groupe ne sont plus dupliquées par étape ;
- la sélection devient `selectedGroupId` / `selectedLayerId` ;
- les cibles d’historique deviennent `group` / `layer` ;
- les règles de cardinalité deviennent une seule règle de scène (`layerCardinality`) au lieu de `trackCardinality` et `keyframeCardinality`.

### 2.2 Snapshot de viewport

Créer un concept nommé `ViewportSnapshot`, sans vocabulaire temporel :

- identifiant, nom, miniature et dates ;
- copie autonome de la caméra, des groupes et des calques ;
- chargement par remplacement atomique du document courant ;
- exclusion de l’état UI éphémère : sélection, historique undo/redo, modales ouvertes et largeur des sidebars ;
- exclusion des blobs d’assets, référencés par `assetId` ;
- si un asset référencé n’existe plus, ignorer le calque concerné et afficher un bilan, sans bloquer le chargement.

Le snapshot de viewport et la sauvegarde manuelle complète restent deux fonctions différentes :

- **snapshot de viewport** : bibliothèque de compositions rechargeables ;
- **sauvegarde de l’application** : projet, éditeur courant, assets, blobs et snapshots de viewport.

### 2.3 Import pass-through

Le nouveau contrat d’import est volontairement strict :

- accepter uniquement des fichiers image pris en charge par le navigateur ;
- valider type, taille et dimensions avant écriture ;
- conserver les pixels et dimensions d’origine ;
- créer un asset par fichier ;
- conserver le choix de catégorie et de groupe cible ;
- retirer le mode spritesheet, le dessin de zones, les miniatures de slices, la pipette, la tolérance et le flood-fill ;
- retirer aussi le recadrage transparent automatique et `trimFrame`, car il transforme silencieusement le fichier importé et maintient un second système de dimensions.

Les assets déjà recadrés doivent rester visuellement stables pendant la migration : voir section 5.

## 3. Audit de l’existant

### 3.1 Keyframes : couplage profond

Le store `src/features/timeline/stores/useTimelineStore.ts` (environ 1 800 lignes) centralise aujourd’hui :

- le document `currentSequence` ;
- la navigation et l’activation des étapes ;
- la duplication et la suppression des snapshots autonomes ;
- les groupes, pistes, keyframes et sprites ;
- la sélection et la matérialisation d’un sprite dans l’étape active ;
- l’historique de transformations, dont certaines entrées copient toutes les keyframes d’une piste ;
- la caméra par étape ;
- l’application des poses sauvegardées ;
- plusieurs générations de migrations legacy.

La suppression ne peut donc pas se limiter au composant Timeline. Le noyau de données et les opérations d’édition doivent être remplacés avant de retirer les adaptateurs actuels.

### 3.2 UI dépendante de la timeline

Composants entièrement supprimables après bascule :

- `src/features/timeline/components/TimelinePanel.vue` et son test ;
- `src/features/timeline/components/TrackHeaderList.vue` ;
- tout `src/features/timeline/components/sequence-grid/` (SFC, types, story, test, README et index).

Composants à migrer vers le store d’éditeur :

- `src/App.vue` : retirer le panneau inférieur et réécrire la visite guidée ;
- `StageCanvas.vue` : caméra directe, sélection et mutation par `layerId` ;
- `HierarchyInspector.vue` : afficher directement groupes et calques ;
- `LayerSettingsModal.vue` : modifier un calque sans `trackId/keyframeId/spriteId` ;
- `AssetLibraryPanel.vue` : déterminer les assets actifs depuis `layers` ;
- `AssetUploadModal.vue` : garder le routage de groupe sans dépendre d’une séquence ;
- `CreateGroupModal.vue` et `DeleteGroupDialog.vue` : déplacer hors de `features/timeline` ;
- `StudioHeader.vue` : renommer l’action « Keyframes » en « Vues sauvegardées » ou « Compositions ».

### 3.3 Rendu et interactions

`useHierarchyResolver.ts` résout actuellement l’étape active, puis la keyframe active de chaque piste. Dans la cible, il parcourt directement `EditorDocument.layers`.

`RenderableLayer` contient encore `trackId`, `keyframeId` et `spriteId`. Ils deviennent un unique `layerId`. Les calculs d’ancrage personnage, de transformation de groupe, de z-index, de hit-test et le renderer canvas sont réutilisables.

L’historique undo/redo est également réutilisable après simplification :

- remplacement de `keyframe-sprite` par `layer` ;
- remplacement des entrées `track-keyframes` par des entrées d’ajout/suppression/réorganisation de calque ;
- aucune copie d’étapes ou matérialisation différée.

### 3.4 Persistance et sauvegarde

Dexie v3 stocke actuellement :

- `sequences` ;
- `savedKeyframes` ;
- `workspaceSnapshots` dont le schéma embarque `sequences` et `savedKeyframes`.

`Project.activeSequenceId` pointe sur la séquence active. Au chargement, l’étape active n’est pas persistée : le store reprend toujours la première étape. Il est donc impossible de connaître rétrospectivement la dernière étape sélectionnée avant la mise à niveau.

La migration doit introduire :

- `editorDocuments` ;
- `viewportSnapshots` ;
- un nouveau pointeur de projet (`editorDocumentId`) ou un identifiant stable unique ;
- `WorkspaceSnapshot.schemaVersion = 3` avec `editorDocuments` et `viewportSnapshots`.

Les sauvegardes manuelles v1/v2 doivent rester restaurables via un chemin de migration, pas via une restauration brute d’anciens enregistrements.

### 3.5 Snapshots sauvegardés actuels

`SavedKeyframePreset` est déjà proche du besoin futur, mais incomplet :

- il capture les groupes et sprites visibles ;
- il possède un nom et une miniature ;
- il ne capture pas la caméra ;
- il est structuré en pistes et conserve les noms `keyframe`, `step` et `track` ;
- son application écrit dans l’étape active et ne remplace pas nécessairement toute la scène de façon explicite.

Il doit être migré vers `ViewportSnapshot`, enrichi d’une caméra, aplati en calques et chargé par remplacement transactionnel.

### 3.6 Export

`ExportSequenceModal.vue` mélange trois fonctionnalités :

- export JSON complet ;
- export ZIP des étapes modifiées ;
- capture PNG de l’étape active.

`keyframe-export.service.ts` calcule les changements, nomme les keyframes et gère le ZIP. Dans la cible :

- supprimer l’export différentiel et le ZIP ;
- supprimer `getChangedKeyframeStepIds`, `formatKeyframeFilename` et leurs tests ;
- conserver un export PNG du document courant, avec la caméra courante ;
- garder éventuellement un export JSON, mais avec `editorDocument` et non `sequence` ;
- renommer la modale et le service pour ne plus porter « Sequence » ou « keyframe » ;
- supprimer `fflate` si aucun autre usage n’apparaît au moment de l’implémentation.

### 3.7 Import d’assets

Le flux actuel contient quatre couches :

1. import de fichiers individuels ;
2. préparation et édition de suppression du fond ;
3. découpe manuelle de spritesheet ;
4. recadrage automatique des pixels transparents dans `useAssetStore`.

Suppressions candidates :

- `BackgroundRemovalEditor.vue` ;
- `background-removal.ts`, son test et `background-removal.types.ts` ;
- `SpritesheetSlicerCanvas.vue` ;
- `SpritesheetSliceList.vue` ;
- `SliceThumbnail.vue` ;
- `useSpritesheetSlicer.ts` et son test ;
- `SpritesheetSlice` dans les types ;
- `importSlicedAssets` dans le store ;
- `transparent-image-trimmer.ts`, son test et `trimExistingAssets` ;
- le script `assets:trim`, `scripts/trim-transparent-sprites.mjs` et `sharp` s’ils n’ont plus d’autre usage.

`AssetUploadModal.vue` peut alors devenir un petit flux : fichiers -> validation -> métadonnées/cible -> import -> résultat.

### 3.8 Tests affectés

Les tests actuels les plus directement obsolètes couvrent :

- le store timeline et l’autonomie des snapshots ;
- la grille de séquence et le panneau Timeline ;
- l’assignation à une étape/keyframe ;
- l’export des keyframes modifiées ;
- la capture et l’application des saved keyframes ;
- la découpe de spritesheet ;
- la suppression de fond ;
- le trimmer transparent.

Les tests de renderer, matrices, sélection, hit-test, cache de blobs, catégories et composants UI génériques restent pertinents, après adaptation minimale des fixtures de calques.

## 4. Architecture de migration recommandée

### 4.1 Règle de conservation des anciennes séquences

Comme l’étape active n’est pas persistée, adopter une règle déterministe et sans perte :

1. utiliser la première étape ordonnée comme document d’éditeur courant, ce qui correspond au comportement de rechargement actuel ;
2. convertir **chaque** étape legacy en `ViewportSnapshot` nommé, avec son cadrage et sa miniature existante si disponible ;
3. ajouter un suffixe ou l’identifiant de séquence pour éviter les collisions de noms ;
4. ne supprimer les tables legacy qu’après validation de la conversion dans la même transaction.

Ainsi, les anciennes étapes cessent d’être des keyframes mais restent récupérables comme compositions nommées.

### 4.2 Aplatissement d’une étape

Pour chaque piste de l’étape :

- ignorer la piste si elle ou son groupe est muet ;
- créer un `EditorLayer` par sprite visible ;
- copier `assetId`, label, catégorie, groupe, transform et ordre ;
- copier le z-index effectif de la keyframe/piste vers chaque calque ;
- copier les propriétés effectives de chaque groupe depuis `groupStates` ;
- copier la caméra de l’étape.

Les IDs de calques peuvent être régénérés. Les références aux assets et groupes doivent rester stables quand elles sont valides.

### 4.3 Assets déjà recadrés

Avant de supprimer `trimFrame`, préserver leur rendu :

- reconstruire un PNG aux dimensions logiques (`sourceWidth/sourceHeight`) ;
- replacer le bitmap recadré à `offsetX/offsetY` sur un canvas transparent ;
- enregistrer le nouveau blob complet ;
- définir `width/height` aux dimensions reconstruites ;
- supprimer `displayWidth`, `displayHeight` et `trimFrame` seulement après succès ;
- si la reconstruction échoue, conserver l’ancien enregistrement et signaler l’asset au lieu de produire un décalage silencieux.

Cette migration doit traiter les assets importés et les assets de démonstration déjà persistés. Les sources versionnées peuvent ensuite rester telles quelles ou être remplacées par des fichiers complets lors d’une tâche séparée.

### 4.4 Compatibilité des sauvegardes manuelles

Pour les snapshots d’application v1/v2 :

- lire l’ancien payload dans un adaptateur legacy isolé ;
- convertir séquences et poses avant écriture ;
- restaurer vers le schéma courant v3 ;
- ne jamais réintroduire les anciennes tables dans l’état courant ;
- tester une sauvegarde sans `savedKeyframes`, avec plusieurs étapes et avec assets `trimFrame`.

## 5. Plan d’exécution

### Phase 0 — Filet de sécurité et contrat

- [x] Figer des fixtures legacy représentatives : une étape, plusieurs étapes, groupes custom, catégories singleton/multi, caméra active et assets recadrés.
- [x] Écrire les critères de conversion attendus avant de toucher au schéma.
- [x] Capturer des rendus de référence du document initial et de chaque fixture.
- [x] Confirmer le vocabulaire UI final : « Vues sauvegardées » ou « Compositions sauvegardées ».

Sortie : tests de migration rouges et référence visuelle stable.

### Phase 1 — Nouveau domaine et persistance additive

- [x] Introduire `EditorDocument`, `EditorGroup`, `EditorLayer` et `ViewportSnapshot` dans des fichiers sans vocabulaire timeline.
- [x] Ajouter les repositories `editor-document` et `viewport-snapshot`.
- [x] Ajouter une version Dexie additive avec migration transactionnelle des séquences et presets.
- [x] Faire évoluer `Project` et `WorkspaceSnapshot` vers le schéma v3.
- [x] Garder les lecteurs legacy uniquement dans un module de migration clairement borné.
- [x] Vérifier idempotence, absence de doublons et reprise après échec.

Sortie : les données anciennes produisent un document courant et des snapshots, sans perte.

### Phase 2 — Store d’éditeur unique

- [x] Créer `useEditorStore` ou renommer/refondre complètement `useTimelineStore`.
- [x] Porter les opérations groupe/calque : ajouter, remplacer selon cardinalité, supprimer, ordonner, verrouiller, masquer et transformer.
- [x] Simplifier sélection et historique vers des IDs de groupe/calque.
- [x] Porter la caméra au niveau du document courant.
- [x] Supprimer navigation, duplication d’étape, matérialisation, autonomie de snapshots et helpers de keyframes.
- [x] Remplacer `trackCardinality/keyframeCardinality` par une règle de calque unique.

Sortie : toutes les opérations métier fonctionnent sans `stepId`, `trackId` ou `keyframeId`.

### Phase 3 — Canvas, hiérarchie et shell

- [x] Faire résoudre le rendu directement depuis les calques courants.
- [x] Remplacer `RenderableLayer.trackId/keyframeId/spriteId` par `layerId`.
- [x] Adapter StageCanvas, LayerSettingsModal et HierarchyInspector.
- [x] Adapter l’ajout d’asset au groupe courant et supprimer `asset-timeline-assignment`.
- [x] Retirer TimelinePanel, TrackHeaderList et SequenceGrid de `App.vue`, puis supprimer leurs fichiers.
- [x] Redistribuer l’espace vertical libéré au viewport.
- [x] Réécrire la visite guidée, les libellés, aria-labels et empty states.

Sortie : l’application n’expose plus aucune timeline ou étape.

### Phase 4 — Sauvegarde et chargement du viewport

- [x] Renommer store, repository, types et modale des saved keyframes.
- [x] Capturer caméra, groupes et calques dans un snapshot autonome.
- [x] Charger un snapshot par remplacement atomique du document courant.
- [x] Réinitialiser sélection et undo/redo après chargement.
- [x] Afficher le nombre de calques restaurés et les références d’assets manquantes.
- [x] Mettre à jour la sauvegarde complète et son résumé (`viewportSnapshotCount`).

Sortie : une composition peut être nommée, sauvegardée, rechargée et supprimée sans recréer une timeline.

### Phase 5 — Export du seul état courant

- [x] Simplifier la modale à « Exporter le viewport courant ».
- [x] Conserver PNG natif et option 1080p si elle reste utile.
- [x] Appliquer directement la caméra du document.
- [x] Remplacer le payload JSON `sequence` par `editorDocument`.
- [x] Supprimer l’export ZIP, le calcul de changements et le service `keyframe-export`.
- [x] Retirer `fflate` et mettre à jour le lockfile si aucun usage restant.

Sortie : aucun snapshot sauvegardé n’est exportable directement ; il faut d’abord le charger.

### Phase 6 — Import d’assets unitaire

- [x] Réduire AssetUploadModal au flux pass-through.
- [x] Retirer le sélecteur `single/spritesheet` et tout état de slicing/background removal.
- [x] Supprimer composants, composables, services, types et tests devenus morts.
- [x] Remplacer `useAssetStore.importAsset` par un stockage du blob original.
- [x] Migrer les assets `trimFrame`, puis supprimer ce format et son traitement dans le resolver.
- [x] Retirer le script de trim et `sharp` si devenus inutiles.
- [x] Tester import simple, import multiple, rejet type/taille et erreur partielle.

Sortie : un fichier produit un asset identique au fichier source.

### Phase 7 — Nettoyage final et preuve d’absence

- [x] Supprimer `features/timeline` ou déplacer ses rares composants génériques restants vers `features/editor`/`features/studio`.
- [x] Renommer `timeline.types.ts` et `timeline.ts` selon leur contenu restant.
- [x] Supprimer tables, repositories, adaptateurs et tests legacy uniquement après couverture de migration.
- [x] Rechercher `keyframe|stepId|activeStep|orderedSteps|timeline|sequence` et justifier chaque occurrence restante.
- [x] Autoriser seulement les `@keyframes` CSS génériques et les références de migration explicitement documentées.
- [x] Mettre à jour l’ancienne `ROADMAP.md` et les README obsolètes après validation fonctionnelle.

Sortie : aucun concept métier de keyframe/timeline/séquence ne subsiste dans le code courant.

## 6. Matrice des impacts

| Zone | Action principale | Risque |
|---|---|---|
| Types timeline | Remplacer par document/groupes/calques/snapshots | Élevé |
| Store timeline | Réécriture vers store d’éditeur | Élevé |
| Dexie et sauvegardes | Version v4 + conversion v1/v2/v3 | Élevé |
| Canvas/resolver | Retirer la résolution par étape | Moyen |
| Hiérarchie/sélection | Passer à `layerId` | Moyen |
| Snapshots sauvegardés | Renommer, enrichir caméra, remplacement atomique | Élevé |
| Export | Garder seulement le document courant | Faible à moyen |
| Import assets | Supprimer trois pipelines de transformation | Moyen |
| UI timeline | Suppression complète | Faible après bascule du store |
| Dépendances | Retrait possible de `fflate` et `sharp` | Faible |

## 7. Ordre de suppression sûr

Ne pas commencer par effacer les fichiers Timeline. L’ordre recommandé est :

1. types cibles et tests de migration ;
2. nouvelle persistance additive ;
3. store d’éditeur ;
4. canvas et consommateurs ;
5. snapshots de viewport ;
6. export et import simplifiés ;
7. suppression des anciennes UI, APIs, tables et dépendances ;
8. recherche globale et validation finale.

Cet ordre maintient une application lançable et rend les régressions localisables.

## 8. Critères d’acceptation

### Fonctionnel

- [ ] Le studio s’ouvre directement sur un unique éditeur, sans panneau timeline.
- [ ] Ajouter, remplacer, déplacer, redimensionner, masquer, verrouiller, ordonner et supprimer un calque fonctionne.
- [ ] Les règles singleton/multi restent cohérentes par catégorie.
- [ ] La caméra courante est sauvegardée avec le document et utilisée pour l’export.
- [ ] Seul le document chargé est exportable en PNG/JSON.
- [ ] Sauvegarder puis recharger un viewport restitue le même rendu pixel à pixel hors tolérance documentée.
- [ ] Importer N fichiers valides crée N assets inchangés.
- [ ] Aucun contrôle de spritesheet, découpe, pipette ou suppression de fond n’est visible.

### Migration

- [ ] La première étape legacy devient le document courant.
- [ ] Toutes les étapes legacy sont récupérables comme snapshots de viewport.
- [ ] Les saved keyframes existantes deviennent des snapshots de viewport.
- [ ] Les assets `trimFrame` conservent leur rendu et leur position.
- [ ] Une sauvegarde manuelle v1/v2 peut être restaurée puis convertie.
- [ ] La migration est idempotente et transactionnelle.

### Qualité

- [ ] Typecheck, lint, tests unitaires et build passent.
- [ ] Tests renderer/matrices/hit-test restent verts.
- [ ] Tests de migration couvrent données partielles et échecs.
- [ ] Tests d’intégration couvrent sauvegarde/chargement/export/import.
- [ ] Un scénario E2E couvre : import -> ajout -> transformation -> sauvegarde -> modification -> rechargement -> export.
- [ ] La recherche globale ne trouve plus de vocabulaire métier keyframe/timeline/sequence hors adaptateur legacy temporaire.

## 9. Risques et parades

- **Perte du dernier état réellement consulté** : l’étape active n’est pas persistée aujourd’hui. Convertir toutes les étapes en snapshots et choisir la première comme état courant.
- **Décalage visuel des assets recadrés** : reconstruire les blobs complets avant retrait de `trimFrame`, avec comparaison de rendu.
- **Snapshots contenant des assets supprimés** : chargement tolérant avec bilan des calques ignorés.
- **Régression de l’undo/redo** : introduire des opérations de calque explicites et tester ajout/suppression/réordre, pas seulement les transforms.
- **Migration destructive Dexie** : écrire d’abord les nouvelles tables, valider les comptes et références, supprimer ensuite les anciennes données dans la transaction.
- **Confusion entre snapshot de viewport et backup** : libellés, icônes et descriptions distincts dans le header.
- **Refacto trop large en une fois** : garder des commits/PR par phase avec une barrière de tests à chaque sortie.

## 10. Estimation relative

Découpage conseillé :

- migration et nouveau modèle : **XL** ;
- store d’éditeur : **XL** ;
- adaptation canvas/hiérarchie : **L** ;
- snapshots de viewport : **L** ;
- export courant : **M** ;
- import unitaire et migration des assets : **L** ;
- nettoyage/tests/docs : **M**.

Le chemin critique est `migration -> store -> resolver/canvas`. Les travaux export et import peuvent être réalisés séparément une fois le store d’éditeur stabilisé.
