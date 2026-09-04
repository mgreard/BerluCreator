# ViewportQuickExportButton

Bouton d'action flottant (Floating Action Button) pour le viewport du Studio permettant d'exporter immédiatement la scène en image PNG haute qualité.

## Spécificités d'export

- **Résolution forcée en 1080p :** Calcul dynamique selon le ratio du cadrage caméra actif (1920x1080 si paysage, ratio proportionnel si portrait/carré).
- **Cadrage caméra appliqué :** Respecte le cadre de caméra (`editorStore.currentDocument.camera`) si actif.
- **Rendu net :** Sans gizmos, poignées ou cadres de sélection.
- **Indicateur de succès intégré :**
  - `idle` : Icône d'image (`image`).
  - `exporting` : Icône animée de progression (`progress_activity` rotative).
  - `success` : Icône de validation (`check`), halo émeraude éclatant et onde de pulsation pendant 2 secondes.
  - `error` : Indicateur d'erreur (`close`), halo rouge rosé.
- **Téléchargement direct :** Nommage automatique horodaté `berlu_creator_<nom>_<horodatage>_1080p.png`.

## Props

| Nom | Type | Défaut | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Désactive l'interaction avec le bouton. |

## Emits

| Événement | Charge utile | Description |
|---|---|---|
| `exported` | `string` (dataUrl) | Émis dès que le fichier PNG a été capturé et déclenché en téléchargement. |

## Méthodes exposées

| Méthode | Retour | Description |
|---|---|---|
| `triggerExport()` | `Promise<string \| null>` | Déclenche manuellement l'export PNG rapide. |
| `status` | `Ref<QuickExportStatus>` | État réactif courant (`idle`, `exporting`, `success`, `error`). |
