# Textarea

Composant de champ de saisie multi-lignes stylisé avec **Tailwind CSS v4** (`glass`, `border-border-default`, `focus-within:border-primary`), liaison bidirectionnelle Vue 3.5 `defineModel`, support monospace, redimensionnement vertical natif et gestion des erreurs.

---

## Fonctionnalités

- **Liaison bidirectionnelle `defineModel` :** Modèle texte réactif à la saisie.
- **Support Monospace :** Option `monospace` appliquant `font-mono` pour le code ou données structurées (JSON, YAML).
- **Identifiant Unique :** Macro native `useId()` pour lier les attributs d'accessibilité ARIA.
- **Attributs HTML natifs :** Transmet `maxlength`, `spellcheck`, `autocomplete`, `aria-*`, `data-*` et les événements natifs directement à l'élément `<textarea>` plutôt qu'au conteneur visuel.
- **Variantes de Tailles :** `sm`, `md` et `lg`.

---

## Props

| Prop          | Type                   | Défaut      | Description                    |
| :------------ | :--------------------- | :---------- | :----------------------------- |
| `modelValue`  | `string`               | `''`        | Texte de la zone (`v-model`)   |
| `placeholder` | `string`               | `''`        | Texte d'indication             |
| `rows`        | `number`               | `4`         | Nombre de lignes visibles      |
| `size`        | `'sm' \| 'md' \| 'lg'` | `'md'`      | Taille du champ                |
| `disabled`    | `boolean`              | `false`     | Désactive le champ             |
| `readonly`    | `boolean`              | `false`     | Reste en lecture seule         |
| `monospace`   | `boolean`              | `false`     | Police à chasse fixe monospace |
| `id`          | `string`               | `useId()`   | Identifiant HTML               |
| `name`        | `string`               | `undefined` | Nom du champ                   |
| `error`       | `boolean \| string`    | `false`     | État ou message d'erreur       |
| `class`       | `string`               | `undefined` | Classes CSS complémentaires    |

---

## Emits

| Événement           | Type de payload | Description                      |
| :------------------ | :-------------- | :------------------------------- |
| `update:modelValue` | `string`        | Émis à la saisie                 |
| `change`            | `Event`         | Émis lors du changement confirmé |
| `focus`             | `FocusEvent`    | Émis lors du focus               |
| `blur`              | `FocusEvent`    | Émis lors de la perte de focus   |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Textarea } from '@/components/ui/textarea'

const bio = ref('')
</script>

<template>
  <Textarea v-model="bio" placeholder="Présentez-vous brièvement..." :rows="5" />
</template>
```
