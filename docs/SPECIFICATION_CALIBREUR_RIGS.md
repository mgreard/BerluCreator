# Spécification technique — Système de Rigs et Calibreur de BerluCreator

## 1. Objet du document

Ce document décrit l'architecture technique, le modèle de données canonique et le fonctionnement de l'espace de calibrage de rigs de BerluCreator (version actuelle du catalogue : **v7**).

---

## 2. Rôle et Principes d'un Rig

Un **rig** est la configuration d'assemblage d'un personnage (identifié par son `characterKey`) articulé autour d'un **corps racine unique** (`body`).

### Invariants fondamentaux :
1. **Un rig = Un corps racine :** Le corps racine (`body`) détermine l'identité exclusive du rig. Deux corps différents définissent deux rigs distincts.
2. **Série de têtes et profils :** Les têtes et accessoires sont organisés par profils morphologiques (`HeadSeriesProfile`, ex: `standard`, `chibi`, `tall`). Chaque profil définit :
   - Le point de pivot cou (`neckPivot`) ;
   - Le point d'ancrage de la bouche (`mouthAnchor`) ;
   - Les points d'ancrage d'accessoires (`propAnchors` pour chapeaux, lunettes, objets).
3. **Ancrage cou corps-tête :** Le corps racine définit un point d'ancrage cou (`neckAnchor`) et un rayon de débattement (`headMotionRadius`).
4. **Catalogue comme autorité :** Le catalogue v7 persisté dans `localStorage` sous la clé `berlu-creator:rig-catalog:v7` est l'unique source de vérité.

---

## 3. Modèle de Données Canonique (v7)

Défini dans `src/features/studio/rig-calibration/rig-catalog.types.ts` :

```ts
export const RIG_CATALOG_SCHEMA = 'berlu-creator/rig-catalog' as const
export const RIG_CATALOG_VERSION = 7 as const
export const RIG_CATALOG_STORAGE_KEY = 'berlu-creator:rig-catalog:v7' as const

export interface RigPoint {
  x: number
  y: number
}

export interface RigAssetIdentity {
  name: string
  category: 'body'
  width: number
  height: number
}

export interface HeadSeriesProfile {
  id: HeadSeriesId
  label: string
  width: number
  height: number
  neckPivot: NormalizedPoint
  mouthAnchor: NormalizedPoint
  propAnchors: Record<CharacterPropSlot, NormalizedPoint>
  defaultMouthAssetKey?: string
  updatedAt: number
}

export interface RigHeadSeriesConfig {
  seriesId: HeadSeriesId
  enabled: boolean
  defaultScale: number
  defaultRotation: number
  defaultHeadAssetKey?: string
}

export interface RigDefinition {
  id: string
  name: string
  characterKey: string
  characterName: string
  body: RigAssetIdentity
  neckAnchor: RigPoint
  headMotionRadius: number
  headSeries: RigHeadSeriesConfig[]
  calibrated: boolean
  updatedAt: number
}
```

---

## 4. Architecture Logicielle

Le système de rigs s'articule en couches strictement découplées :

```text
src/features/studio/
├── rig-calibration/                      # Modèle, Services & Store Métier
│   ├── rig-catalog.types.ts              # Contrats d'interfaces et constantes v7
│   ├── rig-catalog.store.ts              # Store Pinia (mutations, sélection, drafts)
│   ├── rig-catalog.service.ts            # Import/Export JSON, parsing et validation
│   ├── rig-auto-calibration.ts           # Algorithmes de suggestion géométrique
│   ├── rig-default-configuration.service.ts # Configuration initiale par défaut
│   ├── useRigCalibrationSelection.ts     # Helpers de sélection d'éléments
│   └── useRigRuntime.ts                  # Résolution dynamique pour le rendu Studio
└── components/
    ├── RigCalibrationViewportWorkspace.vue # Orchestrateur du viewport de calibration
    └── rig-calibration-viewport/         # Composants colocalisés du calibreur
        ├── RigCalibrationHeader.vue      # Barre d'actions (outils, zoom, sauvegarde)
        ├── RigCalibrationCanvas.vue      # Zone de dessin 2D interactive
        ├── RigBodySelector.vue           # Sélecteur de corps actif
        ├── useRigViewportNavigation.ts   # Pan & Zoom dans le canvas
        └── RigCalibrationGizmo*.vue      # Gizmos interactifs (Neck, Head, Accessory, Anchors)
```

---

## 5. Workflow de Calibration Interactif

1. **Ouverture :** L'utilisateur clique sur « Calibrer les rigs » ou sélectionne un corps dans le Studio. `rigCatalog.isCalibrationOpen` passe à `true`, montant `RigCalibrationViewportWorkspace.vue` dans `StudioViewport.vue`.
2. **Outils de calibration :**
   - **Outil Cou (`neck`) :** Positionnement du gizmo `RigCalibrationGizmoNeck` sur l'attache du cou du corps racine.
   - **Outil Tête (`head`) :** Positionnement de la tête par rapport au corps, réglage du pivot et du débattement.
   - **Outil Accessoires (`accessory`) :** Alignement des chapeaux, lunettes ou masques sur les ancres morphologiques.
   - **Outil Ancrages (`anchors`) :** Ajustement fin des repères normalisés (`mouthAnchor`, `propAnchors`).
3. **Suggestion Automatique :** Le bouton d'auto-calibration (`rig-auto-calibration.ts`) analyse les dimensions et la morphologie des sprites pour proposer un placement initial cohérent.
4. **Validation et persistance :** Les modifications sont immédiatement enregistrées dans le store (`commitRigCalibration`), persistées sous `berlu-creator:rig-catalog:v7` et synchronisées en direct avec le runtime du Studio.

---

## 6. Persistance, Initialisation et Migrations

- **Clé de stockage :** `berlu-creator:rig-catalog:v7` (LocalStorage).
- **Rétrocompatibilité :** Le service `factory-reset.service.ts` gère la réconciliation et le nettoyage des versions v1 à v6 pour garantir une transition fluide.
- **Export & Sauvegarde :** Les configurations peuvent être exportées/importées au format JSON ou intégrées dans les fichiers de projet `.berlu`.
