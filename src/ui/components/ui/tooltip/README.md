# Tooltip

Composant d'info-bulle contextuelle purement informative basé sur **Reka UI** (`TooltipProvider`, `TooltipRoot`, `TooltipContent`), avec flèche d'ancrage optionnelle et positionnement adaptatif intelligent avec détection des collisions d'écran.

---

## Fonctionnalités

- **Positionnement intelligent :** Support des côtés (`top`, `right`, `bottom`, `left`) et alignements (`start`, `center`, `end`) avec `collision-padding`.
- **Surface lisible par défaut :** Conteneur opaque compact avec bordure et ombre courte.
- **Glassmorphism optionnel :** Disponible via `surface="glass"` pour les usages décoratifs.
- **Flèche intégrée (`arrow`) :** Flèche vectorielle stylisée (`TooltipArrow`) pointant vers le composant cible.
- **Liaison `v-model:open` :** Contrôle manuel ou automatique avec délai d'apparition (`delayDuration`).

---

## Props

| Prop            | Type                                     | Défaut      | Description                                  |
| :-------------- | :--------------------------------------- | :---------- | :------------------------------------------- |
| `content`       | `string`                                 | `undefined` | Texte d'information (ou via slot `#content`) |
| `side`          | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'`     | Côté d'affichage                             |
| `align`         | `'start' \| 'center' \| 'end'`           | `'center'`  | Alignement par rapport à la cible            |
| `sideOffset`    | `number`                                 | `4`         | Décalage en pixels                           |
| `delayDuration` | `number`                                 | `200`       | Délai avant apparition (en ms)               |
| `surface`       | `'solid' \| 'glass'`                     | `'solid'`   | Traitement visuel du tooltip                 |
| `arrow`         | `boolean`                                | `true`      | Affiche la flèche d'ancrage                  |
| `disabled`      | `boolean`                                | `false`     | Désactive l'info-bulle                       |
| `class`         | `string`                                 | `undefined` | Classes CSS complémentaires sur le contenu   |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Tooltip } from '@/components/ui/tooltip'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
</script>

<template>
  <Tooltip content="Paramètres de configuration" side="bottom">
    <IconButton ariaLabel="Paramètres">
      <Icon name="settings" size="sm" />
    </IconButton>
  </Tooltip>
</template>
```
