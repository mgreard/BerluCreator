# DataTable & DataTableCell

Composant de tableau de données avancé (_Super Datatable_) propulsé par le moteur **TanStack Table v9**, avec navigation au clavier WAI-ARIA (`role="grid"`), tri multi-colonnes, filtrage par colonne, recherche globale, visibilité des colonnes, édition inline sans latence (`DataTableCell`), virtualisation de grille, pagination, groupement de lignes et export CSV/JSON.

---

## Fonctionnalités Clés

- **Performance & Virtualisation :** Rendu fluide de milliers de lignes avec `useVirtualGrid`.
- **Édition Inline Réactive :** `DataTableCell` isole les frappes au clavier (`number`, `text`, `tags`, `relation`, `select`, `boolean`).
- **Moteur TanStack v9 :** Tri, filtres complexes (texte, select, multi-select, number-range, boolean), groupement avec agrégation (`sum`, `avg`, `min`, `max`, `count`), et masquage dynamique de colonnes.
- **Accessibilité WAI-ARIA :** Roving tabindex clavier (`ArrowDown`, `ArrowUp`, `ArrowRight`, `ArrowLeft`, `Home`, `End`).
- **Export Intégré :** Téléchargement direct en CSV ou JSON des lignes filtrées ou sélectionnées.

---

## Props Principales (DataTable)

| Prop                     | Type                                              | Défaut       | Description                                   |
| :----------------------- | :------------------------------------------------ | :----------- | :-------------------------------------------- |
| `columns`                | `DataTableColumn<T>[]`                            | requis       | Définition des colonnes                       |
| `data`                   | `T[]`                                             | `[]`         | Tableau d'objets de données (`v-model:data`)  |
| `keyField`               | `string`                                          | `'id'`       | Clé unique identifiant chaque ligne           |
| `variant`                | `'default' \| 'striped' \| 'bordered' \| 'glass'` | `'default'`  | Variante visuelle du tableau                  |
| `size`                   | `'sm' \| 'md' \| 'lg'`                            | `'md'`       | Densité d'affichage                           |
| `selectable`             | `boolean`                                         | `false`      | Active les cases/radios de sélection          |
| `selectionMode`          | `'multiple' \| 'single'`                          | `'multiple'` | Mode de sélection                             |
| `expandable`             | `boolean`                                         | `false`      | Active les détails de ligne extensibles       |
| `searchable`             | `boolean`                                         | `false`      | Active la recherche globale                   |
| `enableColumnVisibility` | `boolean`                                         | `false`      | Active le menu de visibilité des colonnes     |
| `pagination`             | `boolean`                                         | `false`      | Active la barre de pagination                 |
| `exportable`             | `boolean`                                         | `false`      | Active le menu d'export CSV / JSON            |
| `resizable`              | `boolean`                                         | `false`      | Active le redimensionnement manuel de colonne |
| `enableGrouping`         | `boolean`                                         | `false`      | Active le mode de groupement de lignes        |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'

interface User {
  id: number
  name: string
  role: string
  active: boolean
}

const columns: DataTableColumn<User>[] = [
  { key: 'name', label: 'Nom', sortable: true, filterable: true },
  { key: 'role', label: 'Rôle', sortable: true },
  { key: 'active', label: 'Actif', editable: true, editType: 'boolean' }
]

const users = ref<User[]>([
  { id: 1, name: 'Alice', role: 'Admin', active: true },
  { id: 2, name: 'Bob', role: 'Éditeur', active: false }
])
</script>

<template>
  <DataTable :columns="columns" :data="users" selectable searchable pagination />
</template>
```
