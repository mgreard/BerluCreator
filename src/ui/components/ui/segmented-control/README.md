# SegmentedControl

Composant de sélection segmentée mutuellement exclusive basé sur **Reka UI** (`ToggleGroup`), avec support des animations physiques, des badges indicatifs, des icônes et d'un conteneur en verre dépoli (Glassmorphism).

---

## Fonctionnalités

- **Liaison bidirectionnelle réactive :** `v-model` dynamique strict (Vue 3.5 `defineModel`).
- **Support des éléments d'enrichissement :** Icônes Material Symbols (`icon`) et pastilles/badges (`badge`).
- **Variantes graphiques :** `glass` (surface translucide élégante) ou `primary` (accent coloré).
- **Accessibilité WAI-ARIA :** Conforme au pattern ARIA `radiogroup` / `toolbar` via Reka UI avec navigation clavier.

---

## Props

| Prop                   | Type                   | Défaut      | Description                        |
| :--------------------- | :--------------------- | :---------- | :--------------------------------- |
| `modelValue / v-model` | `string \| number`     | **requis**  | Valeur sélectionnée                |
| `options`              | `SegmentOption[]`      | `[]`        | Liste des 2 à 5 options            |
| `size`                 | `'sm' \| 'md' \| 'lg'` | `'md'`      | Taille du composant                |
| `variant`              | `'glass' \| 'primary'` | `'glass'`   | Variante graphique                 |
| `disabled`             | `boolean`              | `false`     | Désactivation globale du composant |
| `class`                | `string`               | `undefined` | Classes CSS complémentaires        |

### Structure `SegmentOption`

```typescript
interface SegmentOption {
  value: string | number
  label: string
  icon?: string
  badge?: string | number
  disabled?: boolean
}
```

---

## Emits

| Événement           | Type de payload    | Description                                    |
| :------------------ | :----------------- | :--------------------------------------------- |
| `update:modelValue` | `string \| number` | Émis lors du changement de valeur sélectionnée |
| `change`            | `string \| number` | Émis lors de la sélection d'un nouvel onglet   |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'

const period = ref('week')

const periodOptions: SegmentOption[] = [
  { value: 'day', label: 'Jour', icon: 'calendar_today' },
  { value: 'week', label: 'Semaine', badge: '7j' },
  { value: 'month', label: 'Mois' }
]
</script>

<template>
  <SegmentedControl v-model="period" :options="periodOptions" variant="glass" size="md" />
</template>
```
