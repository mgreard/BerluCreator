# CommandPalette

Palette de commandes modale ultra-fluide et accessible (`⌘K` / `Ctrl+K`), basée sur les primitives **Reka UI** (`DialogRoot`, `DialogPortal`, `DialogOverlay`, `DialogContent`), avec filtrage en temps réel, navigation clavier intégrale et affichage des raccourcis.

---

## Fonctionnalités

- **Raccourci Global ⌘K / Ctrl+K :** Ouverture instantanée n'importe où dans l'application avec écouteur optimisé.
- **Filtrage Instantané :** Recherche multicritère (libellé, description, catégorie) avec mise en avant du résultat actif.
- **Navigation Clavier Complète :** Navigation fluide (`Flèche Haut`, `Flèche Bas`, `Entrée`, `Échap`) avec gestion du focus automatique.
- **Glassmorphism Sombre / Lumineux :** Arrière-plan flou dépoli (`backdrop-blur-2xl`) et bordures translucides.

---

## Props

| Prop             | Type                   | Défaut                         | Description                                |
| :--------------- | :--------------------- | :----------------------------- | :----------------------------------------- |
| `open`           | `boolean`              | `false`                        | État d'ouverture (`v-model:open`)          |
| `groups`         | `CommandGroup[]`       | `[]`                           | Groupes de commandes et d'actions          |
| `items`          | `CommandItem[]`        | `[]`                           | Liste plate d'actions si sans groupes      |
| `placeholder`    | `string`               | `'Rechercher une commande...'` | Texte indicatif dans la recherche          |
| `enableShortcut` | `boolean`              | `true`                         | Active l'écoute globale de `⌘K` / `Ctrl+K` |
| `size`           | `'sm' \| 'md' \| 'lg'` | `'md'`                         | Largeur maximale de la palette             |
| `class`          | `string`               | `undefined`                    | Classes CSS complémentaires                |

---

## Emits

| Événement     | Type de payload | Description                                |
| :------------ | :-------------- | :----------------------------------------- |
| `select`      | `CommandItem`   | Émis lors de l'exécution d'une commande    |
| `update:open` | `boolean`       | Émis lors du changement d'état d'ouverture |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { CommandPalette, type CommandGroup } from '@/components/ui/command-palette'

const isOpen = ref(false)

const groups: CommandGroup[] = [
  {
    name: 'Actions',
    items: [
      { id: 'create', label: 'Créer un document', icon: 'add', shortcut: '⌘ N' },
      { id: 'search', label: 'Recherche globale', icon: 'search' }
    ]
  }
]
</script>

<template>
  <CommandPalette v-model:open="isOpen" :groups="groups" />
</template>
```
