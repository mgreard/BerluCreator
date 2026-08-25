# Breadcrumb

Composant de fil d'Ariane sémantique (`<nav>`, `<ol>`, `<li>`), accessible avec `aria-current="page"`, supportant le routage déclaratif (`RouterLink`, `href`, `onClick`), des séparateurs personnalisables et une variante compacte.

---

## Fonctionnalités

- **Accessibilité Sémantique :** Balisage WAI-ARIA complet avec identification de la page active (`aria-current="page"`).
- **Routage Hybride :** S'adapte automatiquement à Vue Router (`to`), aux liens HTML (`href`) ou aux callbacks (`onClick`).
- **Personnalisation :** Séparateurs personnalisables (`/`, `›`, `→`, etc.) et mode `compact`.

---

## Props

| Prop        | Type               | Défaut      | Description                          |
| :---------- | :----------------- | :---------- | :----------------------------------- |
| `items`     | `BreadcrumbItem[]` | `[]`        | Tableau des éléments du fil d'Ariane |
| `separator` | `string`           | `'/'`       | Caractère de séparation              |
| `compact`   | `boolean`          | `false`     | Réduit la taille de typographie      |
| `class`     | `string`           | `undefined` | Classes CSS complémentaires          |

---

## Structure `BreadcrumbItem`

```ts
export interface BreadcrumbItem {
  label: string
  to?: string | object
  href?: string
  icon?: string
  onClick?: () => void
  active?: boolean
}
```

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Breadcrumb } from '@/components/ui/breadcrumb'

const items = [
  { label: 'Accueil', href: '/' },
  { label: 'Projets', href: '/projets' },
  { label: 'Refonte MyCompLib', active: true }
]
</script>

<template>
  <Breadcrumb :items="items" separator="›" />
</template>
```
