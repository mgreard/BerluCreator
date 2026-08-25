# Badge

Composant d'étiquette ou badge d'état compact (`rounded-full`) basé sur des tokens sémantiques Tailwind CSS v4, avec support de point indicateur d'activité (`dot`) et échelles de tailles.

---

## Fonctionnalités

- **Variantes Sémantiques :** `success`, `warning`, `danger`, `info`, `accent`, `neutral`.
- **Point indicateur (`dot`) :** Micro-puce colorée (`w-1.5 h-1.5`) pour matérialiser la disponibilité ou l'état d'un service.
- **Tailles :** `sm` (texte dense pour listes et tableaux) et `md` (standard).

---

## Props

| Prop      | Type                                                                    | Défaut      | Description                 |
| :-------- | :---------------------------------------------------------------------- | :---------- | :-------------------------- |
| `variant` | `'success' \| 'warning' \| 'danger' \| 'info' \| 'accent' \| 'neutral'` | `'neutral'` | Variante de couleur         |
| `size`    | `'sm' \| 'md'`                                                          | `'md'`      | Taille du badge             |
| `dot`     | `boolean`                                                               | `false`     | Affiche le point indicateur |
| `class`   | `string`                                                                | `undefined` | Classes CSS complémentaires |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
</script>

<template>
  <!-- Badge standard avec puce active -->
  <Badge variant="success" :dot="true">En ligne</Badge>

  <!-- Badge d'information compact -->
  <Badge variant="info" size="sm">Nouveau</Badge>
</template>
```
