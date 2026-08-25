# Input

Composant de champ de saisie textuelle et numérique stylisé avec **Tailwind CSS v4** (`glass`, `border-border-default`, `focus-within:border-primary`), liaison bidirectionnelle Vue 3.5 `defineModel`, génération d'identifiant unique avec `useId()`, slots `#prefix` et `#suffix`, et gestion des états d'erreur / désactivation.

---

## Fonctionnalités

- **Liaison bidirectionnelle `defineModel` :** Supporte `string` ou `number` avec conversion automatique en mode `type="number"`.
- **Identifiant Unique :** Intègre la macro `useId()` de Vue 3.5 pour l'association automatique des labels et de l'accessibilité ARIA.
- **Attributs HTML natifs :** Transmet `autocomplete`, `autofocus`, `list`, `min`, `max`, `step`, `aria-*`, `data-*` et les événements natifs directement à l'élément `<input>` plutôt qu'au conteneur visuel.
- **Slots Préfixe & Suffixe :** Permet d'insérer des icônes ou boutons de nettoyage avec préservation de l'alignement et zone tactile.
- **Variantes de Tailles :** `sm` (32px), `md` (40px) et `lg` (48px).

---

## Props

| Prop          | Type                   | Défaut      | Description                 |
| :------------ | :--------------------- | :---------- | :-------------------------- |
| `modelValue`  | `string \| number`     | `''`        | Valeur du champ (`v-model`) |
| `type`        | `string`               | `'text'`    | Type HTML de l'input        |
| `placeholder` | `string`               | `''`        | Texte d'indication          |
| `size`        | `'sm' \| 'md' \| 'lg'` | `'md'`      | Taille du champ             |
| `disabled`    | `boolean`              | `false`     | Désactive le champ          |
| `readonly`    | `boolean`              | `false`     | Reste en lecture seule      |
| `id`          | `string`               | `useId()`   | Identifiant HTML            |
| `name`        | `string`               | `undefined` | Nom du champ de formulaire  |
| `error`       | `boolean \| string`    | `false`     | État ou message d'erreur    |
| `class`       | `string`               | `undefined` | Classes CSS complémentaires |

---

## Emits

| Événement           | Type de payload    | Description                           |
| :------------------ | :----------------- | :------------------------------------ |
| `update:modelValue` | `string \| number` | Émis à chaque saisie                  |
| `change`            | `Event`            | Émis au changement de valeur confirmé |
| `focus`             | `FocusEvent`       | Émis lors du focus                    |
| `blur`              | `FocusEvent`       | Émis lors de la perte de focus        |

---

## Slots

| Slot      | Description                                    |
| :-------- | :--------------------------------------------- |
| `#prefix` | Élément inséré à gauche (icône, texte)         |
| `#suffix` | Élément inséré à droite (icône, badge, bouton) |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'

const search = ref('')
</script>

<template>
  <Input v-model="search" placeholder="Rechercher...">
    <template #prefix>
      <Icon name="search" size="xs" />
    </template>
  </Input>
</template>
```
