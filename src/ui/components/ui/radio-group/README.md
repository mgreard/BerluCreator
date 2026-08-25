# RadioGroup

Composant de groupe de boutons radio accessible basé sur **Reka UI** (`RadioGroupRoot`, `RadioGroupItem`), offrant plusieurs styles de présentation (`pills`, `segmented`, `list`), avec support des icônes, descriptions et couleurs contextuelles.

---

## Fonctionnalités

- **Variantes Stylistiques :**
  - `pills` : Boutons étiquettes modernes en verre dépoli avec bordure réactive.
  - `segmented` : Contrôle segmenté compact pour des sélections mutuellement exclusives.
  - `list` : Disposition verticale en cartes complètes avec titre et description.
- **Accessibilité WAI-ARIA :** Gestion native des rôles `radiogroup` et `radio`, navigation circulaire au clavier (flèches haut/bas, gauche/droite).
- **Liaison `v-model` Souple :** Supporte les valeurs `string`, `number`, `boolean` ou `null`.

---

## Props

| Prop         | Type                                  | Défaut      | Description                      |
| :----------- | :------------------------------------ | :---------- | :------------------------------- |
| `modelValue` | `string \| number \| boolean \| null` | `undefined` | Valeur active (`v-model`)        |
| `options`    | `RadioOption[]`                       | `[]`        | Liste des options du groupe      |
| `variant`    | `'pills' \| 'segmented' \| 'list'`    | `'pills'`   | Style d'affichage visuel         |
| `size`       | `'sm' \| 'md' \| 'lg'`                | `'md'`      | Taille des items                 |
| `disabled`   | `boolean`                             | `false`     | Désactive tout le groupe         |
| `name`       | `string`                              | `undefined` | Nom HTML du groupe de formulaire |
| `class`      | `string`                              | `undefined` | Classes CSS complémentaires      |

---

## Emits

| Événement           | Type de payload                       | Description                               |
| :------------------ | :------------------------------------ | :---------------------------------------- |
| `change`            | `string \| number \| boolean \| null` | Émis à la sélection d'une nouvelle option |
| `update:modelValue` | `string \| number \| boolean \| null` | Émis pour la mise à jour du v-model       |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RadioGroup, type RadioOption } from '@/components/ui/radio-group'

const selectedMode = ref('compact')

const options: RadioOption[] = [
  { value: 'compact', label: 'Vue compacte' },
  { value: 'comfortable', label: 'Vue confortable' }
]
</script>

<template>
  <RadioGroup v-model="selectedMode" :options="options" variant="segmented" />
</template>
```
