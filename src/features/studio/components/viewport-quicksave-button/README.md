# ViewportQuicksaveButton

Bouton d'action flottant (Floating Action Button) pour le viewport du Studio, permettant d'effectuer une sauvegarde rapide (*quicksave*) de la composition / keyframe actuelle.

## Fonctionnalités

- **Sauvegarde rapide 1-clic :** Capture instantanée du canevas propre (sans repères ni gizmos) et enregistrement du document dans le store des compositions (`useViewportSnapshotStore`).
- **Indicateur de succès intégré :**
  - `idle` : Icône de disquette (`save`), état normal verre sombre réactif.
  - `saving` : Spinner de progression animé (`progress_activity`), bouton temporairement désactivé (`aria-busy="true"`).
  - `success` : Icône de validation (`check`), bordure et halo émeraude éclatants, anneau pulsant. Retour automatique à l'état `idle` après 2 secondes.
  - `error` : Indicateur de fermeture / erreur (`close`), halo rouge rosé.
- **Raccourci clavier (Ctrl+S / Cmd+S) :** Peut être invoqué programmatiquement via la méthode exposée `triggerSave()`.
- **Accessibilité & Ergonomie tactile :** Zone tactile de 44x44px minimum (`touch-manipulation`), infobulles dynamiques selon l'état et retour vocal accessible via ARIA.

## Props

| Nom | Type | Défaut | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Désactive l'interaction avec le bouton. |

## Emits

| Événement | Charge utile | Description |
|---|---|---|
| `saved` | `ViewportSnapshot` | Émis dès que la composition a été capturée et enregistrée avec succès. |

## Méthodes exposées

| Méthode | Retour | Description |
|---|---|---|
| `triggerSave()` | `Promise<ViewportSnapshot \| null>` | Déclenche manuellement la sauvegarde rapide (utilisé pour les raccourcis clavier). |
| `status` | `Ref<QuicksaveStatus>` | État réactif courant (`idle`, `saving`, `success`, `error`). |
