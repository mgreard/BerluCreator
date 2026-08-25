# Pagination

Composant de pagination accessible basé sur les primitives **Reka UI** (`PaginationRoot`, `PaginationList`, `PaginationListItem`, etc.), supportant les ellipses dynamiques, les boutons de bordures (`⏮`, `⏭`), le résumé textuel et le sélecteur d'éléments par page.

---

## Fonctionnalités

- **Primitives Reka UI Robustes :** Gestion intelligente des ellipses de troncature et du calcul automatique du nombre de pages.
- **Sélecteur de Taille de Page Intégré :** Permet à l'utilisateur de modifier `itemsPerPage` en direct.
- **Ergonomie Tactile Fitts's Law :** Cibles d'au moins 44x44px (`min-w-[44px] h-11 touch-manipulation`).
- **Variantes Stylistiques :** `default`, `outline`, `ghost` et `glass`.

---

## Props

| Prop                 | Type                                           | Défaut              | Description                                         |
| :------------------- | :--------------------------------------------- | :------------------ | :-------------------------------------------------- |
| `page`               | `number`                                       | `1`                 | Page actuelle (`v-model:page`)                      |
| `itemsPerPage`       | `number`                                       | `10`                | Nombre d'éléments par page (`v-model:itemsPerPage`) |
| `total`              | `number`                                       | **requis**          | Nombre total d'éléments dans la collection          |
| `siblingCount`       | `number`                                       | `1`                 | Nombre de pages adjacentes visibles                 |
| `showEdges`          | `boolean`                                      | `true`              | Affiche les boutons Première/Dernière page          |
| `showControls`       | `boolean`                                      | `true`              | Affiche les boutons Précédent/Suivant               |
| `showSummary`        | `boolean`                                      | `false`             | Affiche le texte récapitulatif                      |
| `showPageSizeSelect` | `boolean`                                      | `false`             | Active le menu de sélection de taille               |
| `pageSizeOptions`    | `number[]`                                     | `[10, 20, 50, 100]` | Choix du nombre d'éléments                          |
| `disabled`           | `boolean`                                      | `false`             | Désactive la pagination                             |
| `variant`            | `'default' \| 'outline' \| 'ghost' \| 'glass'` | `'default'`         | Variante visuelle des boutons                       |
| `size`               | `'sm' \| 'md' \| 'lg'`                         | `'md'`              | Taille des boutons                                  |
| `class`              | `string`                                       | `undefined`         | Classes CSS complémentaires                         |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Pagination } from '@/components/ui/pagination'

const currentPage = ref(1)
const pageSize = ref(20)
</script>

<template>
  <Pagination
    v-model:page="currentPage"
    v-model:items-per-page="pageSize"
    :total="240"
    show-summary
    show-page-size-select
  />
</template>
```
