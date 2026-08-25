# GridCascade

Composant de grille modulaire ultra-réactif basé sur **Container Queries** (`@container/grid`) avec protection anti-blowout (`min-w-0`), configurations de colonnes fluides (`auto-fit`, `auto-fill`, `1-2`, `2-1`, `3-1`, etc.) et espacements configurables.

---

## Fonctionnalités

- **Container Queries `@container/grid` :** Adapte le nombre de colonnes en fonction de l'espace alloué au conteneur plutôt que de la fenêtre globale (viewport).
- **Configurations Puissantes :** `1`, `2`, `3`, `4`, `1-2`, `2-1`, `3-1`, `auto-fit`, `auto-fill`.
- **Alignements & Espacements :** Contrôle des gaps (`none`, `xs`, `sm`, `md`, `lg`, `xl`) et alignements verticaux (`start`, `center`, `end`, `stretch`).

---

## Props

| Prop         | Type                                             | Défaut       | Description                       |
| :----------- | :----------------------------------------------- | :----------- | :-------------------------------- |
| `cols`       | `GridCascadeCols`                                | `'auto-fit'` | Répartition et nombre de colonnes |
| `gap`        | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`       | Espacement inter-cellules         |
| `alignItems` | `'start' \| 'center' \| 'end' \| 'stretch'`      | `'stretch'`  | Alignement vertical des cellules  |
| `class`      | `string`                                         | `undefined`  | Classes CSS complémentaires       |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { GridCascade } from '@/components/ui/grid-cascade'
import { Card } from '@/components/ui/card'
</script>

<template>
  <GridCascade cols="auto-fit" gap="md">
    <Card v-for="i in 4" :key="i">Élément {{ i }}</Card>
  </GridCascade>
</template>
```
