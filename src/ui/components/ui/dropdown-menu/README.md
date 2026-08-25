# DropdownMenu

Composant de menu contextuel déroulant et sous-menus en cascade basé sur **Reka UI** (`DropdownMenuRoot`, `DropdownMenuTrigger`, `DropdownMenuPortal`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSub`, `DropdownMenuCheckboxItem`, `DropdownMenuSeparator`, `DropdownMenuLabel`).

---

## Fonctionnalités

- **Définition Déclarative :** Rendu via tableau d'objets `items` ou personnalisation complète par slots.
- **Support des Sous-Menus en Cascade :** Propriété `children` imbriquée avec ouverture latérale intelligente.
- **Éléments Polyvalents :** Actions simples (`item`), cases à cocher (`checkbox`), labels de section (`label`), séparateurs (`separator`), actions destructives (`destructive`) et raccourcis clavier (`shortcut`).
- **Positionnement Adaptatif :** Alignement (`start`, `center`, `end`), côté (`bottom`, `top`, `left`, `right`) et largeurs configurables (`sm`, `md`, `lg`, `trigger`, `auto`).
- **Surface explicite :** Fond opaque `solid` par défaut ; glassmorphism conservé via `surface="glass"`.

---

## Props

| Prop         | Type                                                    | Défaut      | Description                                  |
| :----------- | :------------------------------------------------------ | :---------- | :------------------------------------------- |
| `open`       | `boolean`                                               | `false`     | État d'ouverture (`v-model:open`)            |
| `items`      | `DropdownMenuItemDef[]`                                 | `[]`        | Liste déclarative des options                |
| `align`      | `'start' \| 'center' \| 'end'`                          | `'start'`   | Alignement par rapport au déclencheur        |
| `side`       | `'top' \| 'right' \| 'bottom' \| 'left'`                | `'bottom'`  | Côté d'affichage                             |
| `width`      | `'auto' \| 'sm' \| 'md' \| 'lg' \| 'trigger' \| string` | `'md'`      | Largeur du menu                              |
| `surface`    | `'solid' \| 'glass'`                                    | `'solid'`   | Traitement visuel du menu                    |
| `sideOffset` | `number`                                                | `6`         | Décalage en pixels                           |
| `modal`      | `boolean`                                               | `true`      | Bloque les clics en dehors du menu           |
| `portal`     | `boolean`                                               | `true`      | Téléporte dans `document.body`               |
| `arrow`      | `boolean`                                               | `false`     | Affiche la flèche d'ancrage                  |
| `disabled`   | `boolean`                                               | `false`     | Désactive le menu                            |
| `class`      | `string`                                                | `undefined` | Classes CSS complémentaires sur le conteneur |

---

## Emits

| Événement     | Type de payload       | Description                            |
| :------------ | :-------------------- | :------------------------------------- |
| `select`      | `DropdownMenuItemDef` | Émis lors de la sélection d'une action |
| `update:open` | `boolean`             | Émis lors de l'ouverture/fermeture     |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DropdownMenu, type DropdownMenuItemDef } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const isMenuOpen = ref(false)

const items: DropdownMenuItemDef[] = [
  { id: 'edit', label: 'Modifier', icon: 'edit', shortcut: '⌘E' },
  { id: 'duplicate', label: 'Dupliquer', icon: 'content_copy', shortcut: '⌘D' },
  { type: 'separator' },
  { id: 'delete', label: 'Supprimer', icon: 'delete', destructive: true }
]

function handleSelect(item: DropdownMenuItemDef) {
  console.log('Action sélectionnée :', item.id)
}
</script>

<template>
  <DropdownMenu v-model:open="isMenuOpen" :items="items" @select="handleSelect">
    <template #trigger>
      <Button variant="secondary">Actions</Button>
    </template>
  </DropdownMenu>
</template>
```
