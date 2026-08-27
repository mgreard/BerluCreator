# Walkthrough — Refonte Globale du Studio vers l'Éditeur Unique (Single-Scene Document Editor)

La refonte complète de simplification du studio a été exécutée avec succès conformément aux directives de [ROADMAP_REFACTO_SIMPLIFICATION.md](file:///d:/Workspace/BerluCreator/ROADMAP_REFACTO_SIMPLIFICATION.md). L'application fonctionne désormais sur un modèle documentaire sans timeline, pistes ou keyframes.

---

## 1. Changements Majeurs Réalisés

### Phase 1 — Domaine d'Éditeur Unique & Persistance Dexie v4
- **Types & Constantes du Domaine :**
  - [src/core/types/editor.types.ts](file:///d:/Workspace/BerluCreator/src/core/types/editor.types.ts) : `EditorDocument`, `EditorGroup`, `EditorLayer`, `ViewportSnapshot`, `Transform2D`, `CameraFrame`, `EditorGroupColor`.
  - [src/core/constants/editor.ts](file:///d:/Workspace/BerluCreator/src/core/constants/editor.ts) : Résolution par défaut (1792×1024) et groupes d'édition initiaux.
  - [src/core/types/asset.types.ts](file:///d:/Workspace/BerluCreator/src/core/types/asset.types.ts) & [src/core/constants/categories.ts](file:///d:/Workspace/BerluCreator/src/core/constants/categories.ts) : `layerCardinality: 'singleton' | 'multi'`.
- **Persistance & Repositories :**
  - [src/infrastructure/db/repositories/editor-document.repository.ts](file:///d:/Workspace/BerluCreator/src/infrastructure/db/repositories/editor-document.repository.ts)
  - [src/infrastructure/db/repositories/viewport-snapshot.repository.ts](file:///d:/Workspace/BerluCreator/src/infrastructure/db/repositories/viewport-snapshot.repository.ts)
  - [src/infrastructure/db/legacy-migration.ts](file:///d:/Workspace/BerluCreator/src/infrastructure/db/legacy-migration.ts) : migration transactionnelle sans perte de `Sequence` et `SavedKeyframePreset` vers `EditorDocument` et `ViewportSnapshot`.
  - [src/infrastructure/db/dexie.ts](file:///d:/Workspace/BerluCreator/src/infrastructure/db/dexie.ts) : montée de schéma Dexie `version(4)`.
  - [src/features/project/services/workspace-snapshot.service.ts](file:///d:/Workspace/BerluCreator/src/features/project/services/workspace-snapshot.service.ts) : support du schéma v3 et rétrocompatibilité v1/v2.

---

### Phase 2 — Store Unique `useEditorStore`
- [src/features/editor/stores/useEditorStore.ts](file:///d:/Workspace/BerluCreator/src/features/editor/stores/useEditorStore.ts) :
  - Gestion directe et réactive de `currentDocument` (`layers`, `groups`, `camera`).
  - Routage selon cardinalité de calque (`singleton` remplace l'élément de même catégorie, `multi` empile).
  - Gestion des groupes (création, suppression, déplacement parent, visibilité, verrouillage, couleur).
  - Gestuelle transactionnelle (`beginTransformGesture`, `endTransformGesture`, sessions avec `commitTransformSession` / `cancelTransformSession`).
  - Undo/Redo granulaire et application atomique de `ViewportSnapshot`.
  - Couverture complète dans [src/features/editor/stores/useEditorStore.spec.ts](file:///d:/Workspace/BerluCreator/src/features/editor/stores/useEditorStore.spec.ts).

---

### Phase 3 — Canvas, Résolution Directe, Hiérarchie & Shell
- [src/features/studio/composables/useHierarchyResolver.ts](file:///d:/Workspace/BerluCreator/src/features/studio/composables/useHierarchyResolver.ts) : résolution directe depuis `editorStore.currentDocument.layers` avec mapping `layerId`.
- [src/features/studio/components/StageCanvas.vue](file:///d:/Workspace/BerluCreator/src/features/studio/components/StageCanvas.vue) : intégration directe avec `useEditorStore`, sélection de calque/groupe, cadrage caméra, boîtes englobantes et poignées de redimensionnement.
- [src/features/studio/components/HierarchyInspector.vue](file:///d:/Workspace/BerluCreator/src/features/studio/components/HierarchyInspector.vue) & [src/features/studio/components/LayerSettingsModal.vue](file:///d:/Workspace/BerluCreator/src/features/studio/components/LayerSettingsModal.vue) : inspection, renommage, suppression et z-index des calques et groupes.
- [src/features/editor/components/CreateGroupModal.vue](file:///d:/Workspace/BerluCreator/src/features/editor/components/CreateGroupModal.vue) & [src/features/editor/components/DeleteGroupDialog.vue](file:///d:/Workspace/BerluCreator/src/features/editor/components/DeleteGroupDialog.vue).
- [src/features/asset-manager/components/AssetLibraryPanel.vue](file:///d:/Workspace/BerluCreator/src/features/asset-manager/components/AssetLibraryPanel.vue) : détection des calques actifs et ajout direct.
- [src/App.vue](file:///d:/Workspace/BerluCreator/src/App.vue) : suppression de la timeline inférieure, redistribution de tout l'espace vertical au viewport central.

---

### Phase 4 — Vues Sauvegardées du Viewport (`ViewportSnapshot`)
- [src/features/editor/stores/useViewportSnapshotStore.ts](file:///d:/Workspace/BerluCreator/src/features/editor/stores/useViewportSnapshotStore.ts) & [src/features/editor/stores/useViewportSnapshotStore.spec.ts](file:///d:/Workspace/BerluCreator/src/features/editor/stores/useViewportSnapshotStore.spec.ts).
- [src/features/editor/components/ViewportSnapshotsModal.vue](file:///d:/Workspace/BerluCreator/src/features/editor/components/ViewportSnapshotsModal.vue) : capture de miniature, enregistrement, chargement atomique et suppression de compositions nommées.

---

### Phase 5 — Export Simplifié
- [src/features/project/components/ExportModal.vue](file:///d:/Workspace/BerluCreator/src/features/project/components/ExportModal.vue) :
  - Capture PNG haute définition du viewport actif (résolution native de cadrage caméra ou option 1080p).
  - Export structure de scène JSON (`EditorDocument` + métadonnées d'assets).
  - Suppression de l'archive ZIP différentielle et retrait de `fflate`.

---

### Phase 6 & 7 — Import Pass-Through Strict & Nettoyage Définitif
- [src/features/asset-manager/stores/useAssetStore.ts](file:///d:/Workspace/BerluCreator/src/features/asset-manager/stores/useAssetStore.ts) : import pass-through pur (1 fichier = 1 asset avec dimensions et pixels d'origine conservés).
- [src/features/asset-manager/components/AssetUploadModal.vue](file:///d:/Workspace/BerluCreator/src/features/asset-manager/components/AssetUploadModal.vue) : interface épurée de téléversement direct sans découpage ni suppression de fond.
- [src/features/asset-manager/services/demo-asset-seeder.ts](file:///d:/Workspace/BerluCreator/src/features/asset-manager/services/demo-asset-seeder.ts) : chargement des sprites de base avec dimensions naturelles.
- **Suppression intégrale des artefacts obsolètes :**
  - Dossier `src/features/timeline/` intégralement supprimé.
  - Outils de suppression de fond, spritesheet slicer et trimmer d'images transparentes supprimés.
  - [ROADMAP.md](file:///d:/Workspace/BerluCreator/ROADMAP.md) et [ROADMAP_REFACTO_SIMPLIFICATION.md](file:///d:/Workspace/BerluCreator/ROADMAP_REFACTO_SIMPLIFICATION.md) mis à jour.

---

## 2. Résultats des Portes de Qualité (Gates)

| Contrôle | Commande | Résultat |
| :--- | :--- | :--- |
| **Typage strict** | `pnpm typecheck` | **0 erreur** (TypeScript strict validé) |
| **Tests unitaires** | `pnpm test:unit` | **83 fichiers passés (344 tests à 100%)** |
| **Build de production** | `pnpm build` | **Succès Vite (0 erreur de compilation)** |
