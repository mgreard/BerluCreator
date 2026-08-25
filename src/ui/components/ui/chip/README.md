# Chip

Composant de pastille interactive (filtres, étiquettes, tags amovibles) avec effet de verre dépoli (`backdrop-blur-md`), gestion d'état sélectionné (`aria-pressed`) et bouton de suppression accessible.

---

## Fonctionnalités

- **3 Variantes Fonctionnelles :**
  - `default` : Affichage informatif statique.
  - `selectable` : Bouton à bascule avec état actif (`aria-pressed`) et mise en valeur `bg-primary`.
  - `removable` : Tag interactif doté d'une croix de suppression avec émission d'événement `@remove`.
- **Échelle de Tailles :** `sm` et `md`.
- **Navigation Clavier :** Déclenchement via `Entrée` ou `Espace`.

---

## Props

| Prop       | Type                                       | Défaut      | Description                                  |
| :--------- | :----------------------------------------- | :---------- | :------------------------------------------- |
| `variant`  | `'default' \| 'selectable' \| 'removable'` | `'default'` | Variante fonctionnelle                       |
| `active`   | `boolean`                                  | `false`     | État sélectionné (si `variant="selectable"`) |
| `size`     | `'sm' \| 'md'`                             | `'md'`      | Taille du chip                               |
| `disabled` | `boolean`                                  | `false`     | Désactive le composant                       |
| `class`    | `string`                                   | `undefined` | Classes CSS complémentaires                  |

---

## Emits

| Événement | Type de payload | Description                              |
| :-------- | :-------------- | :--------------------------------------- |
| `click`   | `Event`         | Émis au clic sur un chip sélectionnable  |
| `remove`  | `MouseEvent`    | Émis au clic sur la croix de suppression |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Chip } from '@/components/ui/chip'

const isFilterActive = ref(false)
</script>

<template>
  <!-- Chip sélectionnable -->
  <Chip variant="selectable" :active="isFilterActive" @click="isFilterActive = !isFilterActive">
    Vue 3.5
  </Chip>

  <!-- Tag supprimable -->
  <Chip variant="removable" @remove="console.log('Supprimé')"> Design System </Chip>
</template>
```
