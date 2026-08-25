# StarRating

Composant d'évaluation par étoiles avec animations au survol, lueur dorée (`drop-shadow`), support du mode interactif ou lecture seule (`readonly`), liaison bidirectionnelle `defineModel`, et accessibilité `radiogroup` / `radio`.

---

## Fonctionnalités

- **Accessibilité Complète :** Rôles sémantiques `radiogroup` et boutons `radio` avec libellés ARIA clairs (`aria-label="X étoiles sur Y"`).
- **Retour Visuel Réactif :** Prévisualisation de la note au survol avec micro-animation d'agrandissement (`hover:scale-120`).
- **Modes Interactif & Lecture Seule :** Parfait pour recueillir des avis utilisateurs ou afficher des notes statiques.
- **Variantes de Tailles :** `sm`, `md` et `lg`.

---

## Props

| Prop         | Type                   | Défaut      | Description                     |
| :----------- | :--------------------- | :---------- | :------------------------------ |
| `modelValue` | `number \| null`       | `0`         | Note actuelle (`v-model`)       |
| `maxStars`   | `number`               | `5`         | Nombre maximal d'étoiles        |
| `readonly`   | `boolean`              | `false`     | Mode affichage sans interaction |
| `disabled`   | `boolean`              | `false`     | Désactive le composant          |
| `size`       | `'sm' \| 'md' \| 'lg'` | `'md'`      | Taille des étoiles              |
| `showValue`  | `boolean`              | `false`     | Affiche la note textuelle       |
| `class`      | `string`               | `undefined` | Classes CSS complémentaires     |

---

## Emits

| Événement           | Type de payload  | Description                         |
| :------------------ | :--------------- | :---------------------------------- |
| `change`            | `number \| null` | Émis au clic sur une étoile         |
| `update:modelValue` | `number \| null` | Émis pour la mise à jour du v-model |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { StarRating } from '@/components/ui/star-rating'

const rating = ref(4)
</script>

<template>
  <StarRating v-model="rating" show-value />
</template>
```
