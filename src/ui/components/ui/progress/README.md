# Progress

Composant de jauge de progression hautement accessible basé sur **Reka UI** (`ProgressRoot`, `ProgressIndicator`), supportant les modes linéaire et circulaire, les états déterminés/indéterminés et les variantes de couleur sémantiques.

---

## Fonctionnalités

- **Modes Linéaire & Circulaire :** Barres de progression horizontales ou jauges circulaires vectorielles (SVG).
- **Mode Indéterminé (`indeterminate`) :** Animation continue de sweep linéaire ou rotation circulaire pour les chargements non quantifiables.
- **Variantes & Formes :** Couleurs (`primary`, `success`, `warning`, `danger`, `accent`, `gradient`), formes (`pill`, `rounded`, `square`) et épaisseurs (`xs`, `sm`, `md`, `lg`).
- **Accessibilité :** Attributs ARIA `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.

---

## Props

| Prop            | Type                                                                        | Défaut      | Description                              |
| :-------------- | :-------------------------------------------------------------------------- | :---------- | :--------------------------------------- |
| `modelValue`    | `number`                                                                    | `0`         | Valeur actuelle de progression (0 à max) |
| `max`           | `number`                                                                    | `100`       | Valeur maximale                          |
| `variant`       | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'accent' \| 'gradient'` | `'primary'` | Variante de couleur                      |
| `size`          | `'xs' \| 'sm' \| 'md' \| 'lg'`                                              | `'md'`      | Épaisseur / Diamètre                     |
| `shape`         | `'pill' \| 'rounded' \| 'square'`                                           | `'pill'`    | Forme des arrondis                       |
| `type`          | `'linear' \| 'circular'`                                                    | `'linear'`  | Mode de rendu                            |
| `showValue`     | `boolean`                                                                   | `false`     | Affiche la valeur textuelle formatée     |
| `label`         | `string`                                                                    | `undefined` | Libellé textuel de progression           |
| `indeterminate` | `boolean`                                                                   | `false`     | Active le mode d'attente indéterminé     |
| `formatter`     | `(value: number, max: number) => string`                                    | `undefined` | Formatage personnalisé de la valeur      |
| `class`         | `string`                                                                    | `undefined` | Classes CSS complémentaires              |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Progress } from '@/components/ui/progress'
</script>

<template>
  <!-- Barre linéaire avec pourcentage -->
  <Progress :model-value="65" label="Téléchargement du fichier" showValue />

  <!-- Jauge circulaire de succès -->
  <Progress type="circular" :model-value="100" variant="success" size="md" showValue />

  <!-- Mode indéterminé -->
  <Progress :indeterminate="true" label="Synchronisation..." />
</template>
```
