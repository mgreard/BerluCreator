# SearchInput

Composant spécialisé de champ de recherche avec icône de loupe intégrée (`Icon`), liaison `v-model` réactive (`defineModel`), bouton d'effacement rapide (`clearable`) et support des variantes de taille.

---

## Fonctionnalités

- **Icône de Recherche Intégrée :** Préfixe visuel élégant avec Material Symbols `search`.
- **Bouton d'Effacement Rapide :** Bouton `×` d'effacement automatique apparaissant dès qu'une valeur est présente.
- **Support des Tailles :** `sm` (32px), `md` (40px) et `lg` (48px).

---

## Props

| Prop          | Type                   | Défaut            | Description                           |
| :------------ | :--------------------- | :---------------- | :------------------------------------ |
| `modelValue`  | `string`               | `''`              | Texte de la recherche (`v-model`)     |
| `placeholder` | `string`               | `'Rechercher...'` | Texte d'indication                    |
| `size`        | `'sm' \| 'md' \| 'lg'` | `'md'`            | Taille du champ                       |
| `disabled`    | `boolean`              | `false`           | Désactive le champ                    |
| `clearable`   | `boolean`              | `true`            | Affiche le bouton d'effacement rapide |
| `class`       | `string`               | `undefined`       | Classes CSS complémentaires           |

---

## Emits

| Événement           | Type de payload | Description                               |
| :------------------ | :-------------- | :---------------------------------------- |
| `clear`             | `void`          | Émis au clic sur le bouton d'effacement   |
| `update:modelValue` | `string`        | Émis lors de la saisie ou de l'effacement |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SearchInput } from '@/components/ui/search-input'

const query = ref('')
</script>

<template>
  <SearchInput v-model="query" placeholder="Filtrer les données..." />
</template>
```
