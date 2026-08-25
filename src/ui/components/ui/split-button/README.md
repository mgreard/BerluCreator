# SplitButton

Composant de bouton d'action combiné (Action principale + Menu d'actions secondaires déroulant Reka UI `DropdownMenu`), conforme à l'esthétique Glassmorphic Tailwind v4.

---

## Fonctionnalités

- **Bouton double-action :** Action prioritaire directe au clic gauche, avec déclencheur de menu fléché pour les actions contextuelles complémentaires.
- **Menu déroulant animé :** Intégration de `DropdownMenu` de Reka UI avec flèche d'ancrage (`DropdownMenuArrow`) et positionnement adaptatif intelligent.
- **Actions riches :** Support d'icônes, d'actions destructives (`destructive`) et d'éléments désactivés individuellement.
- **États asynchrones :** Spinner de chargement fluide et texte d'état `loadingText`.

---

## Props

| Prop            | Type                                                   | Défaut                      | Description                                     |
| :-------------- | :----------------------------------------------------- | :-------------------------- | :---------------------------------------------- |
| `label`         | `string`                                               | `undefined`                 | Libellé du bouton principal (ou via `<slot />`) |
| `items`         | `SplitButtonItem[]`                                    | `[]`                        | Liste des actions secondaires du menu           |
| `variant`       | `'primary' \| 'secondary' \| 'accent' \| 'ghost' \| 'destructive'` | `'primary'`                 | Variante visuelle globale                       |
| `size`          | `'sm' \| 'md' \| 'lg'`                                 | `'md'`                      | Taille du composant                             |
| `shape`         | `'pill' \| 'rounded'`                                  | `'rounded'`                 | Forme des coins extérieurs                      |
| `disabled`      | `boolean`                                              | `false`                     | Désactive le bouton et le menu                  |
| `loading`       | `boolean`                                              | `false`                     | État de chargement asynchrone                   |
| `loadingText`   | `string`                                               | `undefined`                 | Texte d'état pendant le chargement              |
| `menuAriaLabel` | `string`                                               | `'Options supplémentaires'` | Libellé accessible du déclencheur de menu       |
| `class`         | `string`                                               | `undefined`                 | Classes CSS additionnelles                      |

### Structure `SplitButtonItem`

```typescript
interface SplitButtonItem {
  key: string | number
  label: string
  icon?: string
  disabled?: boolean
  destructive?: boolean
}
```

---

## Emits

| Événement | Type de payload   | Description                                    |
| :-------- | :---------------- | :--------------------------------------------- |
| `click`   | `MouseEvent`      | Émis lors du clic sur l'action principale      |
| `select`  | `SplitButtonItem` | Émis lors de la sélection d'un élément du menu |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { SplitButton, type SplitButtonItem } from '@/components/ui/split-button'

const secondaryActions: SplitButtonItem[] = [
  { key: 'draft', label: 'Enregistrer en brouillon', icon: 'edit' },
  { key: 'schedule', label: 'Programmer', icon: 'schedule' },
  { key: 'delete', label: 'Supprimer', icon: 'delete', destructive: true }
]

function handlePublish() {
  console.log('Publication immédiate')
}

function handleSelectAction(item: SplitButtonItem) {
  console.log('Action sélectionnée:', item.key)
}
</script>

<template>
  <SplitButton
    label="Publier"
    variant="primary"
    :items="secondaryActions"
    @click="handlePublish"
    @select="handleSelectAction"
  />
</template>
```
