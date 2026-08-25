# AvatarGroup

Composant de regroupement et de superposition d'avatars avec effet d'empilement (Stacking), injection de configuration globale (`size`, `shape`) et contrôle des espacements (`tight`, `normal`, `loose`).

---

## Fonctionnalités

- **Propagation descendante (Provide/Inject) :** Configure automatiquement la taille et la forme de tous les `Avatar` enfants sans duplication de props.
- **Espacement de chevauchement :** 3 modes de superposition (`tight`, `normal`, `loose`) calculés selon la taille choisie.
- **Accessibilité :** Attribut `role="group"` et `aria-label` descriptif pour les lecteurs d'écran.
- **Interactions de survol :** Mise en avant au focus ou au survol avec élévation de l'index z (`hover:scale-105 hover:z-10`).

---

## Props

| Prop        | Type                                            | Défaut               | Description                          |
| :---------- | :---------------------------------------------- | :------------------- | :----------------------------------- |
| `size`      | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'`               | Taille transmise aux avatars enfants |
| `shape`     | `'circle' \| 'rounded' \| 'square'`             | `'circle'`           | Forme transmise aux avatars enfants  |
| `spacing`   | `'tight' \| 'normal' \| 'loose'`                | `'normal'`           | Densité de chevauchement             |
| `ariaLabel` | `string`                                        | `"Groupe d'avatars"` | Libellé d'accessibilité du groupe    |
| `class`     | `string`                                        | `undefined`          | Classes CSS complémentaires          |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Avatar } from '@/components/ui/avatar'
import { AvatarGroup } from '@/components/ui/avatar-group'
</script>

<template>
  <AvatarGroup size="md" spacing="normal">
    <Avatar name="Marie Curie" status="online" />
    <Avatar name="Albert Einstein" status="busy" />
    <Avatar name="Ada Lovelace" status="online" />
    <Avatar fallback="+4" variant="glass" />
  </AvatarGroup>
</template>
```
