# Alert

Composant de notification contextuelle d'état (Info, Succès, Avertissement, Erreur) conforme aux critères d'accessibilité WAI-ARIA (`role="alert"`, `aria-live="polite"`), supportant les transitions animées de fermeture et l'intégration de boutons d'action.

---

## Fonctionnalités

- **Variantes d'état sémantiques :** `info`, `success`, `warning`, `danger`.
- **Fermeture fluide (`dismissible`) :** Animation douce d'entrée et de sortie via `<Transition>`.
- **Icônes automatiques :** Association intelligente de glyphes Material Symbols selon la variante choisie ou icône personnalisée via `iconName` ou `#icon`.
- **Slots enrichis :** `#title`, `#icon`, `#actions`, et contenu par défaut.

---

## Props

| Prop          | Type                                           | Défaut      | Description                              |
| :------------ | :--------------------------------------------- | :---------- | :--------------------------------------- |
| `variant`     | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'`    | Variante de statut                       |
| `title`       | `string`                                       | `undefined` | Titre de l'alerte                        |
| `dismissible` | `boolean`                                      | `false`     | Affiche le bouton de fermeture           |
| `showIcon`    | `boolean`                                      | `true`      | Affiche l'icône de statut                |
| `iconName`    | `string`                                       | `undefined` | Surcharge du nom d'icône Material Symbol |
| `class`       | `string`                                       | `undefined` | Classes CSS complémentaires              |

---

## Emits

| Événement | Type de payload | Description                           |
| :-------- | :-------------- | :------------------------------------ |
| `dismiss` | `void`          | Émis lors de la fermeture de l'alerte |

---

## Slots

| Slot      | Description                        |
| :-------- | :--------------------------------- |
| `default` | Contenu textuel / corps du message |
| `title`   | Titre personnalisé                 |
| `icon`    | Icône personnalisée                |
| `actions` | Boutons d'action contextuels       |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
</script>

<template>
  <!-- Alerte d'information avec fermeture -->
  <Alert variant="info" title="Nouvelle version" :dismissible="true" @dismiss="handleDismiss">
    La version 2.0 est désormais disponible.
  </Alert>

  <!-- Alerte avec boutons d'actions -->
  <Alert variant="danger" title="Erreur de synchronisation">
    Impossible de joindre le serveur distant.
    <template #actions>
      <Button size="sm" variant="destructive">Réessayer</Button>
    </template>
  </Alert>
</template>
```
