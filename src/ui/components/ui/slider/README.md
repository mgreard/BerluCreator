# Slider

Composant de curseur glissant accessible basé sur les primitives **Reka UI** (`SliderRoot`, `SliderTrack`, `SliderRange`, `SliderThumb`), supportant le mode simple ou double curseur (plage / range), les graduations avec ticks personnalisés, l'infobulle flottante (tooltip), les orientations horizontale et verticale, et les variantes de couleur.

---

## Fonctionnalités

- **Mode Simple ou Double Curseur (Range) :** Accepte un nombre simple (`number`) ou un tableau de deux nombres (`[min, max]`).
- **Graduations Intelligentes (Ticks) :** Rendu automatique de points de repère équidistants ou personnalisés.
- **Infobulle Flottante Réactive (Tooltip) :** Affiche la valeur instantanée lors du survol ou du glissement avec placement dynamique.
- **Ergonomie & Accessibilité :** Zone tactile de 44px conforme à la loi de Fitts, navigation au clavier (Flèches, Début, Fin, Page Précédente / Suivante).

---

## Props

| Prop          | Type                                                                        | Défaut         | Description                            |
| :------------ | :-------------------------------------------------------------------------- | :------------- | :------------------------------------- |
| `modelValue`  | `number \| number[]`                                                        | `0`            | Valeur ou plage de valeurs (`v-model`) |
| `min`         | `number`                                                                    | `0`            | Valeur minimale                        |
| `max`         | `number`                                                                    | `100`          | Valeur maximale                        |
| `step`        | `number`                                                                    | `1`            | Pas d'incrémentation                   |
| `disabled`    | `boolean`                                                                   | `false`        | Désactive l'interaction                |
| `orientation` | `'horizontal' \| 'vertical'`                                                | `'horizontal'` | Orientation du curseur                 |
| `variant`     | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'accent' \| 'gradient'` | `'primary'`    | Couleur de la plage                    |
| `size`        | `'sm' \| 'md' \| 'lg'`                                                      | `'md'`         | Épaisseur et dimension                 |
| `tooltip`     | `'always' \| 'hover' \| 'never'`                                            | `'hover'`      | Affichage de l'infobulle               |
| `showTicks`   | `boolean`                                                                   | `false`        | Affiche les repères de graduation      |
| `ticks`       | `(number \| SliderTick)[]`                                                  | `[]`           | Liste de graduations personnalisées    |
| `label`       | `string`                                                                    | `undefined`    | Libellé d'en-tête                      |
| `showValue`   | `boolean`                                                                   | `false`        | Affiche la valeur textuelle en en-tête |
| `formatter`   | `(val: number) => string`                                                   | `undefined`    | Formateur personnalisé de valeur       |
| `class`       | `string`                                                                    | `undefined`    | Classes CSS complémentaires            |

---

## Emits

| Événement           | Type de payload      | Description                         |
| :------------------ | :------------------- | :---------------------------------- |
| `update:modelValue` | `number \| number[]` | Émis à chaque glissement de curseur |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Slider } from '@/components/ui/slider'

const volume = ref(50)
const priceRange = ref([20, 80])
</script>

<template>
  <Slider v-model="volume" label="Volume" show-value :formatter="(v) => `${v}%`" show-ticks />

  <Slider
    v-model="priceRange"
    label="Prix"
    show-value
    :formatter="(v) => `${v} €`"
    variant="gradient"
  />
</template>
```
