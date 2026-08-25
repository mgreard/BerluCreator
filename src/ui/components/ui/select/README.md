# Select

Composant de menu déroulant accessible basé sur les primitives **Reka UI** (`SelectRoot`, `SelectTrigger`, `SelectValue`, `SelectPortal`, `SelectContent`, `SelectViewport`, `SelectItem`, `SelectItemText`, `SelectItemIndicator`), avec menu flottant Popper en verre dépoli (`glass-premium`), liaison bidirectionnelle `defineModel` et validation ARIA.

---

## Fonctionnalités

- **Accessibilité WAI-ARIA Stricte :** Reka UI garantit la navigation au clavier (Flèches, Entrée, Espace, Échap), la gestion du focus et les rôles `combobox` / `listbox` / `option`.
- **Liaison `v-model` Flexible :** Supporte les valeurs de type `string`, `number`, `boolean` ou `null`.
- **Valeurs métier préservées :** Les options `''` et `null` sont encodées avec des identifiants internes non vides, puis restituées telles quelles sans exposer ces identifiants au consommateur.
- **Rendu en Verre Dépoli :** Menu flottant avec backdrop filter, bordures sémantiques et ombre portée d'élévation.
- **Ergonomie Tactile :** Hauteur de 44px (`min-h-[44px] touch-manipulation`) conforme à la loi de Fitts.
- **Attributs natifs :** Les attributs ARIA, `title`, `data-*` et événements non déclarés sont transmis au `SelectTrigger` interactif.
- **Formulaires natifs :** La prop `name` soumet la valeur métier originale, jamais l'identifiant interne utilisé par Reka UI.

---

Le menu portalisé utilise `contentZIndex` pour rester au-dessus des dialogues et autres surfaces modales.

## Props

| Prop            | Type                                  | Défaut              | Description                           |
| :-------------- | :------------------------------------ | :------------------ | :------------------------------------ |
| `modelValue`    | `string \| number \| boolean \| null` | `undefined`         | Valeur sélectionnée (`v-model`)       |
| `options`       | `SelectOption[]`                      | `[]`                | Liste d'options                       |
| `placeholder`   | `string`                              | `'Sélectionner...'` | Texte d'indication                    |
| `size`          | `'sm' \| 'md' \| 'lg'`                | `'md'`              | Taille du sélecteur                   |
| `disabled`      | `boolean`                             | `false`             | Désactive le sélecteur                |
| `id`            | `string`                              | `undefined`         | Identifiant HTML                      |
| `name`          | `string`                              | `undefined`         | Nom du champ de formulaire            |
| `error`         | `boolean \| string`                   | `false`             | État ou message d'erreur              |
| `contentZIndex` | `number`                              | `1300`              | Niveau d'empilement du menu portalisé |
| `class`         | `string`                              | `undefined`         | Classes CSS complémentaires           |

---

`contentZIndex` accepte un nombre et vaut `1300` par défaut.

## Emits

| Événement           | Type de payload                       | Description                         |
| :------------------ | :------------------------------------ | :---------------------------------- |
| `change`            | `string \| number \| boolean \| null` | Émis au changement de valeur        |
| `update:modelValue` | `string \| number \| boolean \| null` | Émis pour la mise à jour du v-model |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Select, type SelectOption } from '@/components/ui/select'

const theme = ref<string>('dark')

const options: SelectOption[] = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'system', label: 'Système' }
]
</script>

<template>
  <Select v-model="theme" :options="options" placeholder="Thème..." />
</template>
```
